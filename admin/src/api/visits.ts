import { request } from './client';
import { buildPageParams, parsePageData } from './decoders';
import type { ApiResponse, PageData, PageQuery } from './types';

export interface VisitLogItem {
  id: number;
  day: string;
  visitorId: string;
  path: string;
  pageTitle: string;
  referrer: string;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface VisitLogQuery extends PageQuery {
  path?: string;
  visitorId?: string;
  startDay?: string;
  endDay?: string;
}

export type VisitLogPage = PageData<VisitLogItem>;

function parseVisitLogItem(value: unknown): VisitLogItem {
  if (typeof value !== 'object' || value === null) throw new Error('访问日志数据格式异常');
  const item = value as Partial<VisitLogItem>;
  if (typeof item.id !== 'number' || typeof item.day !== 'string' ||
    typeof item.visitorId !== 'string' || typeof item.path !== 'string' ||
    typeof item.pageTitle !== 'string' || typeof item.referrer !== 'string' ||
    !(item.ip === null || typeof item.ip === 'string') ||
    !(item.userAgent === null || typeof item.userAgent === 'string') ||
    typeof item.createdAt !== 'string') throw new Error('访问日志数据格式异常');
  return item as VisitLogItem;
}

function parseVisitLogPage(value: unknown): VisitLogPage {
  return parsePageData(value, parseVisitLogItem, '访问日志列表格式异常');
}

export function getVisitLogs(query: VisitLogQuery, signal?: AbortSignal): Promise<ApiResponse<VisitLogPage>> {
  const params = buildPageParams(query);
  if (query.path) params.set('path', query.path);
  if (query.visitorId) params.set('visitorId', query.visitorId);
  if (query.startDay) params.set('startDay', query.startDay);
  if (query.endDay) params.set('endDay', query.endDay);
  return request(`/visits?${params.toString()}`, parseVisitLogPage, { signal });
}
