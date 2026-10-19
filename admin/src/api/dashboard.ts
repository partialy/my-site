import { request } from './client';
import type { ApiResponse } from './types';

export interface VisitTrendPoint {
  day: string;
  visits: number;
}

export interface DashboardData {
  visits: {
    today: number;
    yesterday: number;
    last7Days: number;
    trend7: VisitTrendPoint[];
    trend30: VisitTrendPoint[];
  };
  requestLogs: {
    total: number;
    successRate: number | null;
    sources: Array<{ name: string; count: number }>;
    topPaths: Array<{ path: string; count: number }>;
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseTrend(value: unknown): VisitTrendPoint[] {
  if (!Array.isArray(value)) throw new Error('访问趋势数据格式异常');
  return value.map((item: unknown) => {
    if (!isRecord(item) || typeof item.day !== 'string' || typeof item.visits !== 'number') {
      throw new Error('访问趋势数据格式异常');
    }
    return { day: item.day, visits: item.visits };
  });
}

function parseSources(value: unknown): DashboardData['requestLogs']['sources'] {
  if (!Array.isArray(value)) throw new Error('接口来源数据格式异常');
  return value.map((item: unknown) => {
    if (!isRecord(item) || typeof item.name !== 'string' || typeof item.count !== 'number') {
      throw new Error('接口来源数据格式异常');
    }
    return { name: item.name, count: item.count };
  });
}

function parseTopPaths(value: unknown): DashboardData['requestLogs']['topPaths'] {
  if (!Array.isArray(value)) throw new Error('热门接口数据格式异常');
  return value.map((item: unknown) => {
    if (!isRecord(item) || typeof item.path !== 'string' || typeof item.count !== 'number') {
      throw new Error('热门接口数据格式异常');
    }
    return { path: item.path, count: item.count };
  });
}

function parseDashboard(value: unknown): DashboardData {
  if (!isRecord(value) || !isRecord(value.visits) || !isRecord(value.requestLogs)) {
    throw new Error('仪表盘数据格式异常');
  }
  const { visits, requestLogs } = value;
  if (typeof visits.today !== 'number' || typeof visits.yesterday !== 'number' ||
    typeof visits.last7Days !== 'number' || typeof requestLogs.total !== 'number' ||
    (requestLogs.successRate !== null && typeof requestLogs.successRate !== 'number')) {
    throw new Error('仪表盘数据格式异常');
  }
  return {
    visits: {
      today: visits.today, yesterday: visits.yesterday, last7Days: visits.last7Days,
      trend7: parseTrend(visits.trend7), trend30: parseTrend(visits.trend30),
    },
    requestLogs: {
      total: requestLogs.total, successRate: requestLogs.successRate,
      sources: parseSources(requestLogs.sources), topPaths: parseTopPaths(requestLogs.topPaths),
    },
  };
}

export function getDashboard(): Promise<ApiResponse<DashboardData>> {
  return request('/dashboard', parseDashboard);
}
