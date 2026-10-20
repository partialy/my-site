import { request } from './client';
import type { ApiResponse } from './types';

export interface OperationLogItem {
  id: number;
  actorType: string;
  actorId: string | null;
  actorName: string;
  module: string;
  action: string;
  targetType: string;
  targetId: string | null;
  summary: string;
  changedFields: string[];
  ip: string | null;
  durationMs: number | null;
  createdAt: string;
}

export interface OperationLogQuery {
  page: number;
  pageSize: number;
  module?: string;
  actor?: string;
  startTime?: string;
  endTime?: string;
}

export interface OperationLogPage {
  items: OperationLogItem[];
  total: number;
  page: number;
  pageSize: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseOperationLogPage(value: unknown): OperationLogPage {
  if (!isRecord(value) || !Array.isArray(value.items) ||
      typeof value.total !== 'number' || typeof value.page !== 'number' || typeof value.pageSize !== 'number') {
    throw new Error('操作日志列表格式异常');
  }
  for (const item of value.items) {
    if (!isRecord(item) || typeof item.id !== 'number' || typeof item.actorType !== 'string' ||
        !(item.actorId === null || typeof item.actorId === 'string') ||
        typeof item.actorName !== 'string' || typeof item.module !== 'string' || typeof item.action !== 'string' ||
        typeof item.targetType !== 'string' || !(item.targetId === null || typeof item.targetId === 'string') ||
        typeof item.summary !== 'string' || !Array.isArray(item.changedFields) ||
        !item.changedFields.every((field: unknown) => typeof field === 'string') ||
        !(item.ip === null || typeof item.ip === 'string') ||
        !(item.durationMs === null || typeof item.durationMs === 'number') ||
        typeof item.createdAt !== 'string') throw new Error('操作日志数据格式异常');
  }
  return value as unknown as OperationLogPage;
}

export function getOperationLogs(query: OperationLogQuery): Promise<ApiResponse<OperationLogPage>> {
  const params = new URLSearchParams({ page: String(query.page), pageSize: String(query.pageSize) });
  if (query.module) params.set('module', query.module);
  if (query.actor) params.set('actor', query.actor);
  if (query.startTime) params.set('startTime', query.startTime);
  if (query.endTime) params.set('endTime', query.endTime);
  return request(`/operation-logs?${params.toString()}`, parseOperationLogPage);
}
