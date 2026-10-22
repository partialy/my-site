import { request } from './client';

export interface UploadSettings {
  strategy: 'local' | 'qiniu';
  localDomain: string;
  accessKey: string;
  secretKeyConfigured: boolean;
  bucket: string;
  root: string;
  uploadUrl: string;
  domain: string;
}

export interface UploadSettingsInput extends Omit<UploadSettings, 'secretKeyConfigured'> {
  secretKey: string;
}

function parseSettings(value: unknown): UploadSettings {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error('上传设置格式异常');
  const item = value as Record<string, unknown>;
  if ((item.strategy !== 'local' && item.strategy !== 'qiniu') ||
    typeof item.localDomain !== 'string' || typeof item.accessKey !== 'string' || typeof item.secretKeyConfigured !== 'boolean' ||
    typeof item.bucket !== 'string' || typeof item.root !== 'string' ||
    typeof item.uploadUrl !== 'string' || typeof item.domain !== 'string') throw new Error('上传设置格式异常');
  return item as unknown as UploadSettings;
}

export function getUploadSettings() { return request('/upload-settings', parseSettings); }
export function saveUploadSettings(input: UploadSettingsInput) {
  return request('/upload-settings', parseSettings, { method: 'PUT', body: input });
}
