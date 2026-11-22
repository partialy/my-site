import type Database from 'better-sqlite3';
import { mapPageResult, type PaginationQuery } from '../shared/pagination';
import { TableListRepository } from './table-list.repository';
import { visitListResource } from './resources/visit-list.resource';

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

export interface VisitQuery extends PaginationQuery {
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
  private readonly tableList: TableListRepository;

  constructor(private readonly db: Database.Database) {
    this.tableList = new TableListRepository(db);
  }

  list(query: VisitQuery) {
    return mapPageResult(this.tableList.list<VisitRow, VisitQuery>(visitListResource, query), toItem);
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
