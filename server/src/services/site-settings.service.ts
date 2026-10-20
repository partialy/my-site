import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { ApiError } from '../api/api-error';
import { ApiCode } from '../api/codes';
import { ConfigManager, SysConfigKey } from '../config/config-manager';
import { FileService } from './file.service';

export const siteTargetSchema = z.enum(['admin', 'client']);
export type SiteTarget = z.infer<typeof siteTargetSchema>;

const siteIdentitySchema = z.strictObject({
  siteTitle: z.string().trim().min(1).max(100),
  systemName: z.string().trim().min(1).max(100),
});

export const siteSettingsInputSchema = z.strictObject({
  projectName: z.string().trim().min(1).max(100).optional(),
  admin: siteIdentitySchema,
  client: siteIdentitySchema,
});

export type SiteSettingsInput = z.infer<typeof siteSettingsInputSchema>;

type SiteIdentity = SiteSettingsInput['admin'] & {
  iconUrl: string | null;
};

export interface SiteSettingsData {
  projectName: string;
  admin: SiteIdentity;
  client: SiteIdentity;
}

export const maxIconBytes = 2 * 1024 * 1024;
export const iconMimeTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/x-icon'] as const;
export type IconMimeType = typeof iconMimeTypes[number];

const keys = {
  admin: {
    title: SysConfigKey.AdminSiteTitle,
    name: SysConfigKey.AdminSystemName,
    mime: SysConfigKey.AdminIconMime,
    version: SysConfigKey.AdminIconVersion,
    fileId: SysConfigKey.AdminIconFileId,
  },
  client: {
    title: SysConfigKey.ClientSiteTitle,
    name: SysConfigKey.ClientSystemName,
    mime: SysConfigKey.ClientIconMime,
    version: SysConfigKey.ClientIconVersion,
    fileId: SysConfigKey.ClientIconFileId,
  },
} as const;

function isValidImage(bytes: Buffer, mime: IconMimeType): boolean {
  switch (mime) {
    case 'image/png':
      return bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    case 'image/jpeg':
      return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    case 'image/webp':
      return bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
    case 'image/x-icon':
      return bytes.length >= 6 && bytes[0] === 0 && bytes[1] === 0 && bytes[2] === 1 && bytes[3] === 0;
  }
}

export class SiteSettingsService {
  private readonly iconDirectory: string;

  constructor(private readonly manager: ConfigManager, private readonly files: FileService) {
    this.iconDirectory = path.resolve(__dirname, '../../data/site-icons');
  }

  get(): SiteSettingsData {
    return {
      projectName: String(this.manager.getSysConfig().get(SysConfigKey.ProjectName)),
      admin: this.getSite('admin'), client: this.getSite('client'),
    };
  }

  update(input: SiteSettingsInput): SiteSettingsData {
    this.manager.setSysConfigs([
      ...(input.projectName === undefined ? [] : [{ key: SysConfigKey.ProjectName, name: '项目名称', value: input.projectName }]),
      { key: SysConfigKey.AdminSiteTitle, name: '管理后台网站标签名称', value: input.admin.siteTitle },
      { key: SysConfigKey.AdminSystemName, name: '管理系统名称', value: input.admin.systemName },
      { key: SysConfigKey.ClientSiteTitle, name: '前台网站标签名称', value: input.client.siteTitle },
      { key: SysConfigKey.ClientSystemName, name: '前台系统名称', value: input.client.systemName },
    ]);
    return this.get();
  }

  async uploadIcon(target: SiteTarget, mime: IconMimeType, bytes: Buffer): Promise<SiteSettingsData> {
    if (bytes.length === 0 || bytes.length > maxIconBytes || !isValidImage(bytes, mime)) {
      throw new ApiError(400, ApiCode.ValidationError, '图标文件内容无效', { fieldErrors: { icon: ['图标文件内容无效'] } });
    }

    await mkdir(this.iconDirectory, { recursive: true });
    const temporary = path.join(this.iconDirectory, `${target}.${randomUUID()}.tmp`);
    try {
      await writeFile(temporary, bytes, { flag: 'wx' });
      await rename(temporary, this.iconPath(target));
    } finally {
      await rm(temporary, { force: true });
    }

    const fields = keys[target];
    this.manager.setSysConfigs([
      { key: fields.mime, name: `${target} 系统图标 MIME`, value: mime },
      { key: fields.version, name: `${target} 系统图标版本`, value: randomUUID() },
      { key: fields.fileId, name: `${target} 系统图标文件 ID`, value: null },
    ]);
    return this.get();
  }

  selectIconFile(target: SiteTarget, fileId: string): SiteSettingsData {
    const file = this.files.findActive(fileId);
    if (!iconMimeTypes.includes(file.mimeType as IconMimeType) || file.size > maxIconBytes) {
      throw new ApiError(400, ApiCode.ValidationError, '请选择不超过 2 MiB 的 PNG、JPEG、WebP 或 ICO 图片',
        { fieldErrors: { fileId: ['文件类型或大小不符合图标要求'] } });
    }
    this.manager.setSysConfig(keys[target].fileId, `${target} 系统图标文件 ID`, fileId);
    return this.get();
  }

  async deleteIcon(target: SiteTarget): Promise<SiteSettingsData> {
    const fields = keys[target];
    this.manager.setSysConfigs([
      { key: fields.mime, name: `${target} 系统图标 MIME`, value: null },
      { key: fields.version, name: `${target} 系统图标版本`, value: null },
      { key: fields.fileId, name: `${target} 系统图标文件 ID`, value: null },
    ]);
    await rm(this.iconPath(target), { force: true });
    return this.get();
  }

  async readIcon(target: SiteTarget): Promise<{ mime: IconMimeType; bytes: Buffer }> {
    const mime = this.manager.getSysConfig().get(keys[target].mime);
    if (!iconMimeTypes.includes(mime as IconMimeType)) {
      throw new ApiError(404, ApiCode.NotFound, '图标不存在');
    }
    try {
      return { mime: mime as IconMimeType, bytes: await readFile(this.iconPath(target)) };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new ApiError(404, ApiCode.NotFound, '图标不存在');
      }
      throw error;
    }
  }

  private getSite(target: SiteTarget): SiteIdentity {
    const config = this.manager.getSysConfig();
    const fields = keys[target];
    const mime = config.get(fields.mime);
    const version = config.get(fields.version);
    const fileId = config.get(fields.fileId);
    return {
      siteTitle: String(config.get(fields.title)),
      systemName: String(config.get(fields.name)),
      iconUrl: typeof fileId === 'string' && fileId ? this.files.find(fileId).url
        : iconMimeTypes.includes(mime as IconMimeType) && typeof version === 'string' && existsSync(this.iconPath(target))
        ? `/api/v1/site-settings/${target}/icon?v=${encodeURIComponent(version)}`
        : null,
    };
  }

  private iconPath(target: SiteTarget): string {
    return path.join(this.iconDirectory, `${target}.icon`);
  }
}
