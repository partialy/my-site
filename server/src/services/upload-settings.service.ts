import { z } from 'zod';
import { ApiError } from '../api/api-error';
import { ApiCode } from '../api/codes';
import { ConfigManager, SysConfigKey } from '../config/config-manager';

const httpsUrl = z.url().refine((value) => new URL(value).protocol === 'https:', '必须使用 HTTPS');
const domainSchema = z.string().trim().max(300).refine((value) => {
  if (!value) return true;
  try {
    const url = new URL(value.startsWith('//') ? `https:${value}` : value);
    return url.protocol === 'https:' && !url.username && !url.password && url.pathname === '/' && !url.search && !url.hash;
  } catch { return false; }
}, '访问域名必须是 HTTPS 域名或 // 域名，不能带路径和参数');

export const uploadSettingsSchema = z.strictObject({
  strategy: z.enum(['local', 'qiniu']),
  localDomain: domainSchema,
  accessKey: z.string().trim().max(200),
  secretKey: z.string().trim().max(200),
  bucket: z.string().trim().max(100),
  root: z.string().trim().max(100).regex(/^[a-zA-Z0-9/_-]*$/, '目录只能包含字母、数字、斜杠、下划线和连字符'),
  uploadUrl: httpsUrl,
  domain: domainSchema,
});

export type UploadSettingsInput = z.infer<typeof uploadSettingsSchema>;
export interface UploadSettings extends UploadSettingsInput {}

const initial: UploadSettings = {
  strategy: 'local', localDomain: '', accessKey: '', secretKey: '', bucket: '', root: '',
  uploadUrl: 'https://upload.qiniup.com', domain: '',
};

export class UploadSettingsService {
  constructor(private readonly config: ConfigManager) {}

  private current(): UploadSettings {
    return { ...initial, ...this.config.getSysConfig().get(SysConfigKey.UploadSettings) as Partial<UploadSettings> | undefined };
  }

  get() {
    const { secretKey, ...settings } = this.current();
    return { ...settings, secretKeyConfigured: Boolean(secretKey) };
  }

  getStrategy(): 'local' | 'qiniu' {
    return this.current().strategy;
  }

  getLocalDomain(): string { return this.current().localDomain; }

  getQiniu(): UploadSettings {
    const settings = this.current();
    if (!settings.accessKey || !settings.secretKey || !settings.bucket || !settings.domain) {
      throw new ApiError(409, ApiCode.Failure, '七牛云配置不完整');
    }
    return settings;
  }

  update(input: UploadSettingsInput) {
    const next = { ...input, secretKey: input.secretKey || this.current().secretKey };
    if (next.strategy === 'qiniu' && (!next.accessKey || !next.secretKey || !next.bucket || !next.domain)) {
      throw new ApiError(400, ApiCode.ValidationError, '启用七牛云前请填写完整配置', { fieldErrors: { strategy: ['七牛云配置不完整'] } });
    }
    this.config.setSysConfig(SysConfigKey.UploadSettings, '上传设置', next);
    return this.get();
  }
}
