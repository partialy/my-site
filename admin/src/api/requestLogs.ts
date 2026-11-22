import { request } from './client';
import { buildPageParams, isRecord, isOptionalString, parsePageData } from './decoders';
import type { ApiResponse, PageData, PageQuery } from './types';

export interface RequestLogItem {
  uuid: string;
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

export interface RequestLogQuery extends PageQuery {
  method?: string;
  path?: string;
  status?: number;
}

export type RequestLogPage = PageData<RequestLogItem>;

export type RequestLogCleanup =
  | { mode: 'ids'; ids: string[] }
  | { mode: 'timeRange'; startTime: string; endTime: string }
  | { mode: 'beforeTime' | 'afterTime'; time: string }
  | { mode: 'keepLatest'; count: number };

function parseRequestLogItem(value: unknown): RequestLogItem {
  if (!isRecord(value) || typeof value.uuid !== 'string' || typeof value.time !== 'string' ||
    typeof value.method !== 'string' || typeof value.path !== 'string' || typeof value.url !== 'string' ||
    !isOptionalString(value.requestData) || !isOptionalString(value.responseData) ||
    typeof value.status !== 'number' || typeof value.durationMs !== 'number' ||
    !isOptionalString(value.ip) || !isOptionalString(value.origin) ||
    !isOptionalString(value.referer) || !isOptionalString(value.userAgent)) {
    throw new Error('请求日志数据格式异常');
  }
  return {
    uuid: value.uuid, time: value.time, method: value.method, path: value.path, url: value.url,
    requestData: value.requestData, responseData: value.responseData,
    status: value.status, durationMs: value.durationMs, ip: value.ip,
    origin: value.origin, referer: value.referer, userAgent: value.userAgent,
  };
}

function parseRequestLogPage(value: unknown): RequestLogPage {
  return parsePageData(value, parseRequestLogItem, '请求日志列表格式异常');
}

export function getRequestLogs(query: RequestLogQuery, signal?: AbortSignal): Promise<ApiResponse<RequestLogPage>> {
  const params = buildPageParams(query);
  if (query.method) params.set('method', query.method);
  if (query.path) params.set('path', query.path);
  if (query.status !== undefined) params.set('status', String(query.status));
  return request(`/request-logs?${params.toString()}`, parseRequestLogPage, { signal });
}

export function cleanupRequestLogs(input: RequestLogCleanup): Promise<ApiResponse<{ deleted: number }>> {
  return request('/request-logs', (value) => {
    if (!isRecord(value) || typeof value.deleted !== 'number' || !Number.isInteger(value.deleted) || value.deleted < 0) {
      throw new Error('日志清理结果格式异常');
    }
    return { deleted: value.deleted };
  }, { method: 'DELETE', body: input });
}
