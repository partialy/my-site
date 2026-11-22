import { request } from './client';
import { buildPageParams, isRecord, parsePageData } from './decoders';
import type { ApiResponse, PageData, PageQuery } from './types';

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

export interface OperationLogQuery extends PageQuery {
  module?: string;
  actor?: string;
  startTime?: string;
  endTime?: string;
}

export type OperationLogPage = PageData<OperationLogItem>;

function parseOperationLogItem(item: unknown): OperationLogItem {
  if (!isRecord(item) || typeof item.id !== 'number' || typeof item.actorType !== 'string' ||
      !(item.actorId === null || typeof item.actorId === 'string') ||
      typeof item.actorName !== 'string' || typeof item.module !== 'string' || typeof item.action !== 'string' ||
      typeof item.targetType !== 'string' || !(item.targetId === null || typeof item.targetId === 'string') ||
      typeof item.summary !== 'string' || !Array.isArray(item.changedFields) ||
      !item.changedFields.every((field: unknown) => typeof field === 'string') ||
      !(item.ip === null || typeof item.ip === 'string') ||
      !(item.durationMs === null || typeof item.durationMs === 'number') ||
      typeof item.createdAt !== 'string') {
    throw new Error('操作日志数据格式异常');
  }
  return item as unknown as OperationLogItem;
}

function parseOperationLogPage(value: unknown): OperationLogPage {
  return parsePageData(value, parseOperationLogItem, '操作日志列表格式异常');
}

export function getOperationLogs(query: OperationLogQuery, signal?: AbortSignal): Promise<ApiResponse<OperationLogPage>> {
  const params = buildPageParams(query);
  if (query.module) params.set('module', query.module);
  if (query.actor) params.set('actor', query.actor);
  if (query.startTime) params.set('startTime', query.startTime);
  if (query.endTime) params.set('endTime', query.endTime);
  return request(`/operation-logs?${params.toString()}`, parseOperationLogPage, { signal });
}
