import { request } from './client';
import type { ApiResponse } from './types';

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

export interface VisitLogQuery {
  page: number;
  pageSize: number;
  path?: string;
  visitorId?: string;
  startDay?: string;
  endDay?: string;
}

export interface VisitLogPage {
  items: VisitLogItem[];
  total: number;
  page: number;
  pageSize: number;
}

function parseVisitLogPage(value: unknown): VisitLogPage {
  if (typeof value !== 'object' || value === null) throw new Error('访问日志列表格式异常');
  const page = value as Partial<VisitLogPage>;
  if (!Array.isArray(page.items) || typeof page.total !== 'number' ||
    typeof page.page !== 'number' || typeof page.pageSize !== 'number') throw new Error('访问日志列表格式异常');
  for (const item of page.items) {
    if (typeof item !== 'object' || item === null ||
      typeof item.id !== 'number' || typeof item.day !== 'string' ||
      typeof item.visitorId !== 'string' || typeof item.path !== 'string' ||
      typeof item.pageTitle !== 'string' || typeof item.referrer !== 'string' ||
      !(item.ip === null || typeof item.ip === 'string') ||
      !(item.userAgent === null || typeof item.userAgent === 'string') ||
      typeof item.createdAt !== 'string') throw new Error('访问日志数据格式异常');
  }
  return page as VisitLogPage;
}

export function getVisitLogs(query: VisitLogQuery, signal?: AbortSignal): Promise<ApiResponse<VisitLogPage>> {
  const params = new URLSearchParams({ page: String(query.page), pageSize: String(query.pageSize) });
  if (query.path) params.set('path', query.path);
  if (query.visitorId) params.set('visitorId', query.visitorId);
  if (query.startDay) params.set('startDay', query.startDay);
  if (query.endDay) params.set('endDay', query.endDay);
  return request(`/visits?${params.toString()}`, parseVisitLogPage, { signal });
}
