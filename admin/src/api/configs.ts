import { request } from './client';
import { parseNull } from './decoders';
import type { ApiResponse } from './types';

export interface ConfigItem {
  key: string;
  name: string;
  value: string;
  enabled: boolean;
  remark: string;
  createdAt: string;
  updatedAt: string;
}

export type ConfigInput = Pick<ConfigItem, 'key' | 'name' | 'value' | 'enabled' | 'remark'>;

function parseConfigItem(value: unknown): ConfigItem {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('配置项响应格式异常');
  }
  const item = value as Record<string, unknown>;
  if (typeof item.key !== 'string' || typeof item.name !== 'string' ||
    typeof item.value !== 'string' || typeof item.enabled !== 'boolean' ||
    typeof item.remark !== 'string' || typeof item.createdAt !== 'string' ||
    typeof item.updatedAt !== 'string') {
    throw new Error('配置项响应格式异常');
  }
  return {
    key: item.key, name: item.name, value: item.value,
    enabled: item.enabled, remark: item.remark,
    createdAt: item.createdAt, updatedAt: item.updatedAt,
  };
}

function parseConfigList(value: unknown): ConfigItem[] {
  if (!Array.isArray(value)) throw new Error('配置列表响应格式异常');
  return value.map(parseConfigItem);
}

export function getConfigs(): Promise<ApiResponse<ConfigItem[]>> {
  return request('/configs', parseConfigList);
}

export function createConfig(data: ConfigInput): Promise<ApiResponse<ConfigItem>> {
  return request('/configs', parseConfigItem, { method: 'POST', body: data });
}

export function updateConfig(key: string, data: ConfigInput): Promise<ApiResponse<ConfigItem>> {
  return request(`/configs/${encodeURIComponent(key)}`, parseConfigItem, { method: 'PUT', body: data });
}

export function deleteConfig(key: string): Promise<ApiResponse<null>> {
  return request(`/configs/${encodeURIComponent(key)}`, parseNull, { method: 'DELETE' });
}
