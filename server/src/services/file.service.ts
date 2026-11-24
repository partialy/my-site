import { randomUUID } from 'node:crypto';
import { existsSync, renameSync, unlinkSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import * as qiniu from 'qiniu';
import { ApiError } from '../api/api-error';
import { ApiCode } from '../api/codes';
import { ConfigManager, SysConfigKey } from '../config/config-manager';
import { FileRepository, type FileRecord } from '../repositories/file.repository';
import { mapPageResult, paginationQueryShape } from '../shared/pagination';
import { UploadSettingsService } from './upload-settings.service';

export const maxFileBytes = 10 * 1024 * 1024;
export const fileMimeTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/x-icon', 'image/gif', 'application/pdf'] as const;
export type FileMimeType = typeof fileMimeTypes[number];
const extensions: Record<FileMimeType, string> = {
  'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp',
  'image/x-icon': '.ico', 'image/gif': '.gif', 'application/pdf': '.pdf',
};

export const fileListQuerySchema = z.strictObject({
  ...paginationQueryShape,
  search: z.string().trim().max(200).optional(),
  mimeTypes: z.string().max(300).optional()
    .transform((value) => value ? value.split(',').map((mime) => mime.trim()) : undefined)
    .refine((values) => !values || values.every((mime) => fileMimeTypes.includes(mime as FileMimeType)), '文件类型无效'),
  sortBy: z.enum(['createdAt', 'size']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  status: z.enum(['active', 'archived', 'all']).default('active'),
});
export const fileIdSchema = z.uuid();
export const selectIconFileSchema = z.strictObject({ fileId: fileIdSchema });
export const prepareUploadSchema = z.strictObject({
  name: z.string().trim().min(1).max(255), mimeType: z.enum(fileMimeTypes),
  size: z.number().int().min(1).max(maxFileBytes),
});
export const completeUploadSchema = prepareUploadSchema.extend({ id: fileIdSchema, key: z.string().min(1).max(500) });

export interface FileItem {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
  archivedAt: string | null;
}

function hasValidSignature(bytes: Buffer, mime: FileMimeType): boolean {
  switch (mime) {
    case 'image/png': return bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    case 'image/jpeg': return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    case 'image/webp': return bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
    case 'image/x-icon': return bytes.length >= 6 && bytes[0] === 0 && bytes[1] === 0 && bytes[2] === 1 && bytes[3] === 0;
    case 'image/gif': return bytes.length >= 6 && ['GIF87a', 'GIF89a'].includes(bytes.toString('ascii', 0, 6));
    case 'application/pdf': return bytes.length >= 5 && bytes.toString('ascii', 0, 5) === '%PDF-';
  }
}

function toItem(record: FileRecord, localDomain: string): FileItem {
  const url = record.storage_provider === 'qiniu' && record.storage_domain
    ? `${record.storage_domain.replace(/\/+$/, '')}/${record.storage_name.split('/').map(encodeURIComponent).join('/')}`
    : `${localDomain.replace(/\/+$/, '')}/api/v1/files/${record.id}/content`;
  return {
    id: record.id, name: record.name, mimeType: record.mime_type, size: record.size,
    url, createdAt: record.created_at, archivedAt: record.archived_at
  };
}

export class FileService {
  private readonly directory = path.resolve(__dirname, '../../data/uploads');
  private readonly referenceCheckers: Array<(fileId: string) => string | null> = [];

  constructor(private readonly repository: FileRepository, private readonly configManager: ConfigManager,
    private readonly uploadSettings: UploadSettingsService) { }

  registerReferenceChecker(checker: (fileId: string) => string | null): void {
    this.referenceCheckers.push(checker);
  }

  uploadStrategy() { return { strategy: this.uploadSettings.getStrategy() }; }

  private toItem(record: FileRecord): FileItem { return toItem(record, this.uploadSettings.getLocalDomain()); }

  prepareUpload(input?: z.infer<typeof prepareUploadSchema>) {
    if (this.uploadSettings.getStrategy() === 'local') return { strategy: 'local' as const };
    if (!input) throw new ApiError(400, ApiCode.ValidationError, '缺少七牛云上传文件信息',
      { fieldErrors: { file: ['请提供文件名、类型和大小'] } });
    const settings = this.uploadSettings.getQiniu();
    const id = randomUUID();
    const root = settings.root.replace(/^\/+|\/+$/g, '');
    const day = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const key = [root, day, `${id}${extensions[input.mimeType]}`].filter(Boolean).join('/');
    const mac = new qiniu.auth.digest.Mac(settings.accessKey, settings.secretKey);
    const token = new qiniu.rs.PutPolicy({
      scope: `${settings.bucket}:${key}`, expires: 3600,
      insertOnly: 1, fsizeLimit: maxFileBytes, mimeLimit: input.mimeType
    }).uploadToken(mac);
    return { strategy: 'qiniu' as const, id, key, token, uploadUrl: settings.uploadUrl };
  }

  async completeUpload(input: z.infer<typeof completeUploadSchema>): Promise<FileItem> {
    const settings = this.uploadSettings.getQiniu();
    const expectedSuffix = `/${input.id}${extensions[input.mimeType]}`;
    if (!input.key.endsWith(expectedSuffix) || input.key.includes('..') || input.key.startsWith('/')) {
      throw new ApiError(400, ApiCode.ValidationError, '文件标识无效', { fieldErrors: { key: ['文件标识无效'] } });
    }
    const manager = new qiniu.rs.BucketManager(new qiniu.auth.digest.Mac(settings.accessKey, settings.secretKey),
      new qiniu.conf.Config({ useHttpsDomain: true }));
    let remote: Awaited<ReturnType<typeof manager.stat>>;
    try { remote = await manager.stat(settings.bucket, input.key); }
    catch { throw new ApiError(400, ApiCode.ValidationError, '七牛云文件不存在或无法校验', { fieldErrors: { key: ['上传未完成'] } }); }
    if (remote.data.fsize !== input.size || remote.data.mimeType !== input.mimeType) {
      throw new ApiError(400, ApiCode.ValidationError, '七牛云文件信息与上传请求不一致', { fieldErrors: { file: ['大小或类型不一致'] } });
    }
    const record = {
      id: input.id, name: input.name.replace(/[\\/\x00-\x1f\x7f]/g, '_'),
      mime_type: input.mimeType, size: input.size, storage_name: input.key,
      storage_provider: 'qiniu' as const, storage_bucket: settings.bucket, storage_domain: settings.domain,
      created_at: new Date().toISOString()
    };
    this.repository.create(record);
    return this.toItem({ ...record, archived_at: null });
  }

  list(query: z.infer<typeof fileListQuerySchema>) {
    return mapPageResult(this.repository.list(query), (record) => this.toItem(record));
  }

  find(id: string): FileItem {
    const record = this.repository.find(id);
    if (!record) throw new ApiError(404, ApiCode.NotFound, '文件不存在');
    return this.toItem(record);
  }

  remoteUrl(id: string): string | null {
    const record = this.repository.find(id);
    if (!record) throw new ApiError(404, ApiCode.NotFound, '文件不存在');
    return record.storage_provider === 'qiniu' ? this.toItem(record).url : null;
  }

  findActive(id: string): FileItem {
    const record = this.repository.findActive(id);
    if (!record) throw new ApiError(404, ApiCode.NotFound, '文件不存在或已归档');
    return this.toItem(record);
  }

  async upload(name: string, mime: FileMimeType, bytes: Buffer): Promise<FileItem> {
    if (this.uploadSettings.getStrategy() !== 'local') throw new ApiError(409, ApiCode.Failure, '当前未启用本地上传');
    const safeName = name.trim().replace(/[\\/\x00-\x1f\x7f]/g, '_');
    if (!safeName || safeName.length > 255) {
      throw new ApiError(400, ApiCode.ValidationError, '文件名无效', { fieldErrors: { name: ['文件名长度需为 1 至 255'] } });
    }
    if (bytes.length === 0 || bytes.length > maxFileBytes || !hasValidSignature(bytes, mime)) {
      throw new ApiError(400, ApiCode.ValidationError, '文件内容或格式无效', { fieldErrors: { file: ['文件内容或格式无效'] } });
    }
    const id = randomUUID();
    const storageName = `${id}${extensions[mime]}`;
    const record = {
      id, name: safeName, mime_type: mime, size: bytes.length,
      storage_name: storageName, storage_provider: 'local' as const, storage_bucket: null,
      storage_domain: null, created_at: new Date().toISOString()
    };
    await mkdir(this.directory, { recursive: true });
    const diskPath = path.join(this.directory, storageName);
    await writeFile(diskPath, bytes, { flag: 'wx' });
    try {
      this.repository.create(record);
    } catch (error) {
      await rm(diskPath, { force: true });
      throw error;
    }
    return this.toItem({ ...record, archived_at: null });
  }

  async read(id: string): Promise<{ item: FileItem; bytes: Buffer }> {
    const record = this.repository.find(id);
    if (!record) throw new ApiError(404, ApiCode.NotFound, '文件不存在');
    try {
      return { item: this.toItem(record), bytes: await readFile(path.join(this.directory, record.storage_name)) };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') throw new ApiError(404, ApiCode.NotFound, '文件内容不存在');
      throw error;
    }
  }

  archive(id: string): void {
    if (!this.repository.archive(id)) throw new ApiError(404, ApiCode.NotFound, '文件不存在或已归档');
  }

  restore(id: string): void {
    if (!this.repository.restore(id)) throw new ApiError(404, ApiCode.NotFound, '文件不存在或未归档');
  }

  async deletePermanently(id: string): Promise<void> {
    const record = this.repository.find(id);
    if (!record) throw new ApiError(404, ApiCode.NotFound, '文件不存在');
    const sysConfig = this.configManager.getSysConfig();
    if (sysConfig.get(SysConfigKey.AdminIconFileId) === id || sysConfig.get(SysConfigKey.ClientIconFileId) === id) {
      throw new ApiError(409, ApiCode.FileInUse, '文件正在用作站点图标，请先更换或移除图标');
    }
    const loginAppearance = sysConfig.get(SysConfigKey.AdminLoginAppearance);
    if (typeof loginAppearance === 'object' && loginAppearance !== null &&
      'backgroundFileId' in loginAppearance && loginAppearance.backgroundFileId === id) {
      throw new ApiError(409, ApiCode.FileInUse, '文件正在用作登录背景，请先更换或移除背景图片');
    }
    for (const check of this.referenceCheckers) {
      const reason = check(id);
      if (reason) throw new ApiError(409, ApiCode.FileInUse, reason);
    }

    if (record.storage_provider === 'qiniu') {
      const settings = this.uploadSettings.getQiniu();
      const manager = new qiniu.rs.BucketManager(new qiniu.auth.digest.Mac(settings.accessKey, settings.secretKey),
        new qiniu.conf.Config({ useHttpsDomain: true }));
      try { await manager.delete(record.storage_bucket ?? settings.bucket, record.storage_name); }
      catch { throw new ApiError(502, ApiCode.Failure, '七牛云文件删除失败，记录未删除'); }
      this.repository.delete(id);
      return;
    }
    const original = path.join(this.directory, record.storage_name);
    const temporary = `${original}.${randomUUID()}.deleting`;
    const hasContent = existsSync(original);
    if (hasContent) renameSync(original, temporary);
    let deleted = false;
    try {
      deleted = this.repository.delete(id);
      if (!deleted) throw new ApiError(404, ApiCode.NotFound, '文件不存在');
      if (hasContent) unlinkSync(temporary);
    } catch (error) {
      if (deleted) this.repository.restoreDeleted(record);
      if (hasContent) renameSync(temporary, original);
      throw error;
    }
  }
}
