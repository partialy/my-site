import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { ApiError } from '../api/api-error';
import { ApiCode } from '../api/codes';
import { FileRepository, type FileRecord } from '../repositories/file.repository';

export const maxFileBytes = 10 * 1024 * 1024;
export const fileMimeTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/x-icon', 'image/gif', 'application/pdf'] as const;
export type FileMimeType = typeof fileMimeTypes[number];
const extensions: Record<FileMimeType, string> = {
  'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp',
  'image/x-icon': '.ico', 'image/gif': '.gif', 'application/pdf': '.pdf',
};

export const fileListQuerySchema = z.strictObject({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(200).optional(),
  mimeTypes: z.string().max(300).optional()
    .transform((value) => value ? value.split(',').map((mime) => mime.trim()) : undefined)
    .refine((values) => !values || values.every((mime) => fileMimeTypes.includes(mime as FileMimeType)), '文件类型无效'),
  sortBy: z.enum(['createdAt', 'size']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
export const fileIdSchema = z.uuid();
export const selectIconFileSchema = z.strictObject({ fileId: fileIdSchema });

export interface FileItem {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
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

function toItem(record: FileRecord): FileItem {
  return { id: record.id, name: record.name, mimeType: record.mime_type, size: record.size,
    url: `/api/v1/files/${record.id}/content`, createdAt: record.created_at };
}

export class FileService {
  private readonly directory = path.resolve(__dirname, '../../data/uploads');

  constructor(private readonly repository: FileRepository) {}

  list(query: z.infer<typeof fileListQuerySchema>) {
    const result = this.repository.list(query);
    return { items: result.items.map(toItem), total: result.total, page: query.page, pageSize: query.pageSize };
  }

  find(id: string): FileItem {
    const record = this.repository.find(id);
    if (!record) throw new ApiError(404, ApiCode.NotFound, '文件不存在');
    return toItem(record);
  }

  findActive(id: string): FileItem {
    const record = this.repository.findActive(id);
    if (!record) throw new ApiError(404, ApiCode.NotFound, '文件不存在或已归档');
    return toItem(record);
  }

  async upload(name: string, mime: FileMimeType, bytes: Buffer): Promise<FileItem> {
    const safeName = name.trim().replace(/[\\/\x00-\x1f\x7f]/g, '_');
    if (!safeName || safeName.length > 255) {
      throw new ApiError(400, ApiCode.ValidationError, '文件名无效', { fieldErrors: { name: ['文件名长度需为 1 至 255'] } });
    }
    if (bytes.length === 0 || bytes.length > maxFileBytes || !hasValidSignature(bytes, mime)) {
      throw new ApiError(400, ApiCode.ValidationError, '文件内容或格式无效', { fieldErrors: { file: ['文件内容或格式无效'] } });
    }
    const id = randomUUID();
    const storageName = `${id}${extensions[mime]}`;
    const record = { id, name: safeName, mime_type: mime, size: bytes.length,
      storage_name: storageName, created_at: new Date().toISOString() };
    await mkdir(this.directory, { recursive: true });
    const diskPath = path.join(this.directory, storageName);
    await writeFile(diskPath, bytes, { flag: 'wx' });
    try {
      this.repository.create(record);
    } catch (error) {
      await rm(diskPath, { force: true });
      throw error;
    }
    return toItem({ ...record, archived_at: null });
  }

  async read(id: string): Promise<{ item: FileItem; bytes: Buffer }> {
    const record = this.repository.find(id);
    if (!record) throw new ApiError(404, ApiCode.NotFound, '文件不存在');
    try {
      return { item: toItem(record), bytes: await readFile(path.join(this.directory, record.storage_name)) };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') throw new ApiError(404, ApiCode.NotFound, '文件内容不存在');
      throw error;
    }
  }

  archive(id: string): void {
    if (!this.repository.archive(id)) throw new ApiError(404, ApiCode.NotFound, '文件不存在或已归档');
  }
}
