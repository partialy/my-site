import { z } from 'zod';
import { ApiError } from '../api/api-error';
import { ApiCode } from '../api/codes';
import { ConfigManager } from '../config/config-manager';
import type { ConfigRecord } from '../repositories/config.repository';

export const configInputSchema = z.strictObject({
  key: z.string().trim().min(1).max(100).regex(/^[A-Za-z][A-Za-z0-9_.:-]*$/, '键只能以字母开头，包含字母、数字、下划线、点、冒号或连字符'),
  name: z.string().trim().min(1).max(100),
  value: z.string().max(65_535),
  enabled: z.boolean(),
  remark: z.string().trim().max(500),
});

export type ConfigInput = z.infer<typeof configInputSchema>;

export interface ConfigItem extends ConfigInput {
  createdAt: string;
  updatedAt: string;
}

function displayValue(raw: string): string {
  try {
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === 'string' ? parsed : JSON.stringify(parsed);
  } catch {
    return raw;
  }
}

function toItem(record: ConfigRecord): ConfigItem {
  return {
    key: record.key, name: record.name, value: displayValue(record.value),
    enabled: record.enabled === 1, remark: record.remark,
    createdAt: record.created_at, updatedAt: record.updated_at,
  };
}

export class ConfigService {
  constructor(private readonly manager: ConfigManager) {}

  list(): ConfigItem[] {
    return this.manager.list().map(toItem);
  }

  create(input: ConfigInput): ConfigItem {
    if (this.manager.has(input.key)) throw new ApiError(409, ApiCode.ConfigKeyExists, '配置键已存在');
    return toItem(this.manager.create(input.key, input.name, input.value, input.enabled, input.remark));
  }

  update(oldKey: string, input: ConfigInput): ConfigItem {
    if (!this.manager.has(oldKey)) throw new ApiError(404, ApiCode.NotFound, '配置不存在');
    if (oldKey !== input.key && this.manager.has(input.key)) {
      throw new ApiError(409, ApiCode.ConfigKeyExists, '配置键已存在');
    }
    const row = this.manager.update(oldKey, input.key, input.name, input.value, input.enabled, input.remark);
    if (!row) throw new ApiError(404, ApiCode.NotFound, '配置不存在');
    return toItem(row);
  }

  delete(key: string): void {
    if (!this.manager.delete(key)) throw new ApiError(404, ApiCode.NotFound, '配置不存在');
  }
}
