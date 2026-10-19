import { request } from './client';
import { parseNull } from './decoders';
import type { ApiResponse } from './types';

export type RequestLogMode = 'all' | 'white_list' | 'off';
export type WhitelistRuleType = 'wildcard' | 'exact';

export interface WhitelistRule {
  id: string;
  name: string;
  type: WhitelistRuleType;
  path: string;
  remark: string;
  createdAt: string;
  updatedAt: string;
}

export interface SystemConfig {
  requestLogMode: RequestLogMode;
  requestLogWhitelist: WhitelistRule[];
  consoleLogEnabled: boolean;
  consoleLogFormat: string;
}

export type SystemConfigUpdate = Pick<
  SystemConfig,
  'requestLogMode' | 'consoleLogEnabled' | 'consoleLogFormat'
>;

export interface WhitelistRuleInput {
  name?: string;
  type: WhitelistRuleType;
  path: string;
  remark?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseRule(value: unknown): WhitelistRule {
  if (!isRecord(value) || typeof value.id !== 'string' ||
    typeof value.name !== 'string' ||
    (value.type !== 'wildcard' && value.type !== 'exact') ||
    typeof value.path !== 'string' || typeof value.remark !== 'string' ||
    typeof value.createdAt !== 'string' || typeof value.updatedAt !== 'string') {
    throw new Error('白名单规则响应格式异常');
  }
  return {
    id: value.id,
    name: value.name,
    type: value.type,
    path: value.path,
    remark: value.remark,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

function parseRuleList(value: unknown): WhitelistRule[] {
  if (!Array.isArray(value)) throw new Error('白名单列表响应格式异常');
  return value.map(parseRule);
}

function parseSystemConfig(value: unknown): SystemConfig {
  if (!isRecord(value) ||
    (value.requestLogMode !== 'all' && value.requestLogMode !== 'white_list' && value.requestLogMode !== 'off') ||
    typeof value.consoleLogEnabled !== 'boolean' ||
    typeof value.consoleLogFormat !== 'string') {
    throw new Error('系统配置响应格式异常');
  }
  return {
    requestLogMode: value.requestLogMode,
    requestLogWhitelist: parseRuleList(value.requestLogWhitelist),
    consoleLogEnabled: value.consoleLogEnabled,
    consoleLogFormat: value.consoleLogFormat,
  };
}

export function getSystemConfig(): Promise<ApiResponse<SystemConfig>> {
  return request('/system-config', parseSystemConfig);
}

export function updateSystemConfig(data: SystemConfigUpdate): Promise<ApiResponse<SystemConfig>> {
  return request('/system-config', parseSystemConfig, { method: 'PUT', body: data });
}

export function getWhitelistRules(): Promise<ApiResponse<WhitelistRule[]>> {
  return request('/system-config/whitelist', parseRuleList);
}

export function createWhitelistRule(data: WhitelistRuleInput): Promise<ApiResponse<WhitelistRule>> {
  return request('/system-config/whitelist', parseRule, { method: 'POST', body: data });
}

export function updateWhitelistRule(id: string, data: WhitelistRuleInput): Promise<ApiResponse<WhitelistRule>> {
  return request(`/system-config/whitelist/${encodeURIComponent(id)}`, parseRule, { method: 'PUT', body: data });
}

export function deleteWhitelistRule(id: string): Promise<ApiResponse<null>> {
  return request(`/system-config/whitelist/${encodeURIComponent(id)}`, parseNull, { method: 'DELETE' });
}
