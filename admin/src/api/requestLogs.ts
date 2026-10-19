import { request } from './client';
import type { ApiResponse } from './types';

export interface RequestLogItem {
  id: number;
  time: string;
  method: string;
  path: string;
  url: string;
  requestData: string | null;
  responseData: string | null;
  status: number;
  durationMs: number;
  ip: string | null;
  origin: string | null;
  referer: string | null;
  userAgent: string | null;
}

export interface RequestLogQuery {
  page: number;
  pageSize: number;
  method?: string;
  path?: string;
  status?: number;
}

export interface RequestLogPage {
  items: RequestLogItem[];
  total: number;
  page: number;
  pageSize: number;
}

export type RequestLogCleanup =
  | { mode: 'ids'; ids: number[] }
  | { mode: 'timeRange'; startTime: string; endTime: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isOptionalString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function parseRequestLogItem(value: unknown): RequestLogItem {
  if (!isRecord(value) || typeof value.id !== 'number' || typeof value.time !== 'string' ||
    typeof value.method !== 'string' || typeof value.path !== 'string' || typeof value.url !== 'string' ||
    !isOptionalString(value.requestData) || !isOptionalString(value.responseData) ||
    typeof value.status !== 'number' || typeof value.durationMs !== 'number' ||
    !isOptionalString(value.ip) || !isOptionalString(value.origin) ||
    !isOptionalString(value.referer) || !isOptionalString(value.userAgent)) {
    throw new Error('请求日志数据格式异常');
  }
  return {
    id: value.id, time: value.time, method: value.method, path: value.path, url: value.url,
    requestData: value.requestData, responseData: value.responseData,
    status: value.status, durationMs: value.durationMs, ip: value.ip,
    origin: value.origin, referer: value.referer, userAgent: value.userAgent,
  };
}

function parseRequestLogPage(value: unknown): RequestLogPage {
  if (!isRecord(value) || !Array.isArray(value.items) || typeof value.total !== 'number' ||
    typeof value.page !== 'number' || typeof value.pageSize !== 'number') {
    throw new Error('请求日志列表格式异常');
  }
  return {
    items: value.items.map(parseRequestLogItem), total: value.total,
    page: value.page, pageSize: value.pageSize,
  };
}

export function getRequestLogs(query: RequestLogQuery): Promise<ApiResponse<RequestLogPage>> {
  const params = new URLSearchParams({ page: String(query.page), pageSize: String(query.pageSize) });
  if (query.method) params.set('method', query.method);
  if (query.path) params.set('path', query.path);
  if (query.status !== undefined) params.set('status', String(query.status));
  return request(`/request-logs?${params.toString()}`, parseRequestLogPage);
}

export function cleanupRequestLogs(input: RequestLogCleanup): Promise<ApiResponse<{ deleted: number }>> {
  return request('/request-logs', (value) => {
    if (!isRecord(value) || typeof value.deleted !== 'number' || !Number.isInteger(value.deleted) || value.deleted < 0) {
      throw new Error('日志清理结果格式异常');
    }
    return { deleted: value.deleted };
  }, { method: 'DELETE', body: input });
}
