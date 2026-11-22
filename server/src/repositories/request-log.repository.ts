import type Database from 'better-sqlite3';
import { createPageResult, mapPageResult, type PageResult, type PaginationQuery } from '../shared/pagination';
import { TableListRepository } from './table-list.repository';
import { requestLogListResource } from './resources/request-log-list.resource';

export interface RequestLogQuery extends PaginationQuery {
  method?: string;
  path?: string;
  status?: number;
}

interface RequestLogRecord {
  id: number;
  uuid: string;
  time: string;
  method: string;
  path: string;
  url: string;
  request_data: string | null;
  response_data: string | null;
  status: number;
  duration_ms: number;
  ip: string | null;
  origin: string | null;
  referer: string | null;
  user_agent: string | null;
}

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

export type RequestLogPage = PageResult<RequestLogItem>;

export interface RequestLogDashboard {
  total: number;
  successRate: number | null;
  sources: Array<{ name: string; count: number }>;
  topPaths: Array<{ path: string; count: number }>;
}

function sourceName(origin: string | null, referer: string | null): string {
  const source = origin || referer;
  if (!source) return '直接请求';
  try { return new URL(source).host || '其他来源'; }
  catch { return '其他来源'; }
}

function toItem(record: RequestLogRecord): RequestLogItem {
  return {
    uuid: record.uuid, time: record.time, method: record.method,
    path: record.path, url: record.url,
    requestData: record.request_data, responseData: record.response_data,
    status: record.status, durationMs: record.duration_ms,
    ip: record.ip, origin: record.origin, referer: record.referer, userAgent: record.user_agent,
  };
}

export class RequestLogRepository {
  private readonly tableList: TableListRepository;

  constructor(private readonly db: Database.Database) {
    this.tableList = new TableListRepository(db);
  }

  private exists(): boolean {
    return Boolean(this.db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'request_log'").get());
  }

  deleteByIds(ids: string[]): number {
    if (!this.exists()) return 0;
    const placeholders = ids.map(() => '?').join(',');
    return this.db.prepare(`DELETE FROM request_log WHERE uuid IN (${placeholders})`).run(...ids).changes;
  }

  deleteByTimeRange(startTime: string, endTime: string): number {
    if (!this.exists()) return 0;
    return this.db.prepare('DELETE FROM request_log WHERE time >= ? AND time <= ?').run(startTime, endTime).changes;
  }

  deleteBeforeTime(time: string): number {
    if (!this.exists()) return 0;
    return this.db.prepare('DELETE FROM request_log WHERE time < ?').run(time).changes;
  }

  deleteAfterTime(time: string): number {
    if (!this.exists()) return 0;
    return this.db.prepare('DELETE FROM request_log WHERE time > ?').run(time).changes;
  }

  deleteExceptLatest(count: number): number {
    if (!this.exists()) return 0;
    return this.db.prepare(`
      DELETE FROM request_log WHERE id NOT IN (
        SELECT id FROM request_log ORDER BY id DESC LIMIT ?
      )
    `).run(count).changes;
  }

  dashboard(since: string): RequestLogDashboard {
    if (!this.exists()) return { total: 0, successRate: null, sources: [], topPaths: [] };

    const filter = "time >= ? AND path NOT IN ('/api/v1/request-logs', '/api/v1/admin/request-logs', '/api/v1/admin/home')";
    const totals = this.db.prepare(`
      SELECT COUNT(*) AS total, SUM(CASE WHEN status < 400 THEN 1 ELSE 0 END) AS success
      FROM request_log WHERE ${filter}
    `).get(since) as { total: number; success: number | null };
    const groupedSources = this.db.prepare(`
      SELECT origin, referer, COUNT(*) AS count FROM request_log
      WHERE ${filter} GROUP BY origin, referer
    `).all(since) as Array<{ origin: string | null; referer: string | null; count: number }>;
    const sourceCounts = new Map<string, number>();
    for (const row of groupedSources) {
      const name = sourceName(row.origin, row.referer);
      sourceCounts.set(name, (sourceCounts.get(name) ?? 0) + row.count);
    }
    const sortedSources = [...sourceCounts].sort((a, b) => b[1] - a[1]);
    const sources = sortedSources.slice(0, 3).map(([name, count]) => ({ name, count }));
    const otherCount = sortedSources.slice(3).reduce((sum, [, count]) => sum + count, 0);
    if (otherCount > 0) sources.push({ name: '其余来源', count: otherCount });

    const topPaths = this.db.prepare(`
      SELECT path, COUNT(*) AS count FROM request_log
      WHERE ${filter} GROUP BY path ORDER BY count DESC, path LIMIT 5
    `).all(since) as Array<{ path: string; count: number }>;
    return {
      total: totals.total,
      successRate: totals.total ? Math.round((totals.success ?? 0) / totals.total * 1000) / 10 : null,
      sources, topPaths,
    };
  }

  list(query: RequestLogQuery): RequestLogPage {
    if (!this.exists()) return createPageResult([], 0, query);
    return mapPageResult(
      this.tableList.list<RequestLogRecord, RequestLogQuery>(requestLogListResource, query),
      toItem,
    );
  }
}
