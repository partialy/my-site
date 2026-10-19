import type Database from 'better-sqlite3';

export interface RequestLogQuery {
  page: number;
  pageSize: number;
  method?: string;
  path?: string;
  status?: number;
}

interface RequestLogRecord {
  id: number;
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

export interface RequestLogPage {
  items: RequestLogItem[];
  total: number;
  page: number;
  pageSize: number;
}

function toItem(record: RequestLogRecord): RequestLogItem {
  return {
    id: record.id, time: record.time, method: record.method,
    path: record.path, url: record.url,
    requestData: record.request_data, responseData: record.response_data,
    status: record.status, durationMs: record.duration_ms,
    ip: record.ip, origin: record.origin, referer: record.referer, userAgent: record.user_agent,
  };
}

export class RequestLogRepository {
  constructor(private readonly db: Database.Database) {}

  list(query: RequestLogQuery): RequestLogPage {
    const exists = this.db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'request_log'").get();
    if (!exists) return { items: [], total: 0, page: query.page, pageSize: query.pageSize };

    const conditions: string[] = [];
    const params: Record<string, string | number> = {};
    if (query.method) {
      conditions.push('method = @method');
      params.method = query.method;
    }
    if (query.path) {
      conditions.push("path LIKE @path ESCAPE '!'");
      params.path = `%${query.path.replace(/[!%_]/g, '!$&')}%`;
    }
    if (query.status !== undefined) {
      conditions.push('status = @status');
      params.status = query.status;
    }
    const where = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
    const total = (this.db.prepare(`SELECT COUNT(*) AS count FROM request_log${where}`).get(params) as { count: number }).count;
    const records = this.db.prepare(`
      SELECT * FROM request_log${where} ORDER BY id DESC LIMIT @limit OFFSET @offset
    `).all({ ...params, limit: query.pageSize, offset: (query.page - 1) * query.pageSize }) as RequestLogRecord[];
    return { items: records.map(toItem), total, page: query.page, pageSize: query.pageSize };
  }
}
