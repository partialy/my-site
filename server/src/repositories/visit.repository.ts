import type Database from 'better-sqlite3';

export interface VisitRecord {
  day: string;
  visitorId: string;
  path: string;
  pageTitle: string;
  referrer: string;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface VisitTrendPoint {
  day: string;
  visits: number;
}

export interface VisitQuery {
  page: number;
  pageSize: number;
  path?: string;
  visitorId?: string;
  startDay?: string;
  endDay?: string;
}

interface VisitRow {
  id: number;
  visit_day: string;
  visitor_id: string;
  path: string;
  page_title: string;
  referrer: string;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
}

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

function toItem(row: VisitRow): VisitLogItem {
  return {
    id: row.id, day: row.visit_day, visitorId: row.visitor_id,
    path: row.path, pageTitle: row.page_title, referrer: row.referrer,
    ip: row.ip, userAgent: row.user_agent, createdAt: row.created_at,
  };
}

export class VisitRepository {
  constructor(private readonly db: Database.Database) {}

  list(query: VisitQuery) {
    const conditions: string[] = [];
    const params: Record<string, string | number> = {};
    if (query.path) {
      conditions.push("path LIKE @path ESCAPE '!'");
      params.path = `%${query.path.replace(/[!%_]/g, '!$&')}%`;
    }
    if (query.visitorId) {
      conditions.push("visitor_id LIKE @visitorId ESCAPE '!'");
      params.visitorId = `%${query.visitorId.replace(/[!%_]/g, '!$&')}%`;
    }
    if (query.startDay) {
      conditions.push('visit_day >= @startDay');
      params.startDay = query.startDay;
    }
    if (query.endDay) {
      conditions.push('visit_day <= @endDay');
      params.endDay = query.endDay;
    }
    const where = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
    const total = (this.db.prepare(`SELECT COUNT(*) AS count FROM visit${where}`).get(params) as { count: number }).count;
    const rows = this.db.prepare(`
      SELECT id, visit_day, visitor_id, path, page_title, referrer, ip, user_agent, created_at
      FROM visit${where} ORDER BY id DESC LIMIT @limit OFFSET @offset
    `).all({ ...params, limit: query.pageSize, offset: (query.page - 1) * query.pageSize }) as VisitRow[];
    return { items: rows.map(toItem), total, page: query.page, pageSize: query.pageSize };
  }

  create(record: VisitRecord): boolean {
    const result = this.db.prepare(`
      INSERT OR IGNORE INTO visit
        (visit_day, visitor_id, path, page_title, referrer, ip, user_agent, created_at)
      VALUES (@day, @visitorId, @path, @pageTitle, @referrer, @ip, @userAgent, @createdAt)
    `).run(record);
    return result.changes === 1;
  }

  count(day: string): number {
    return (this.db.prepare('SELECT COUNT(*) AS count FROM visit WHERE visit_day = ?').get(day) as { count: number }).count;
  }

  countSince(day: string): number {
    return (this.db.prepare('SELECT COUNT(*) AS count FROM visit WHERE visit_day >= ?').get(day) as { count: number }).count;
  }

  trendSince(day: string): VisitTrendPoint[] {
    return this.db.prepare(`
      SELECT visit_day AS day, COUNT(*) AS visits FROM visit
      WHERE visit_day >= ? GROUP BY visit_day ORDER BY visit_day
    `).all(day) as VisitTrendPoint[];
  }
}
