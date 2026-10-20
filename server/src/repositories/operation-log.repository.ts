import type Database from 'better-sqlite3';

export interface OperationLogRecord {
  id: number;
  actor_type: string;
  actor_id: string | null;
  actor_name: string;
  module: string;
  action: string;
  target_type: string;
  target_id: string | null;
  summary: string;
  changed_fields: string;
  ip: string | null;
  duration_ms: number | null;
  created_at: string;
}

export interface OperationLogInsert extends Omit<OperationLogRecord, 'id'> {}

export interface OperationLogQuery {
  page: number;
  pageSize: number;
  module?: string;
  actor?: string;
  startTime?: string;
  endTime?: string;
}

export class OperationLogRepository {
  constructor(private readonly db: Database.Database) {}

  create(input: OperationLogInsert): number {
    const result = this.db.prepare(`
      INSERT INTO operation_log (
        actor_type, actor_id, actor_name, module, action, target_type, target_id,
        summary, changed_fields, ip, duration_ms, created_at
      ) VALUES (
        @actor_type, @actor_id, @actor_name, @module, @action, @target_type, @target_id,
        @summary, @changed_fields, @ip, @duration_ms, @created_at
      )
    `).run(input);
    return Number(result.lastInsertRowid);
  }

  list(query: OperationLogQuery): { items: OperationLogRecord[]; total: number } {
    const conditions: string[] = [];
    const params: Record<string, string | number> = {};
    if (query.module) {
      conditions.push("module LIKE @module ESCAPE '!'");
      params.module = `%${query.module.replace(/[!%_]/g, '!$&')}%`;
    }
    if (query.actor) {
      conditions.push("actor_name LIKE @actor ESCAPE '!'");
      params.actor = `%${query.actor.replace(/[!%_]/g, '!$&')}%`;
    }
    if (query.startTime) {
      conditions.push('created_at >= @startTime');
      params.startTime = query.startTime;
    }
    if (query.endTime) {
      conditions.push('created_at <= @endTime');
      params.endTime = query.endTime;
    }
    const where = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
    const total = (this.db.prepare(`SELECT COUNT(*) AS total FROM operation_log${where}`).get(params) as { total: number }).total;
    const items = this.db.prepare(`
      SELECT * FROM operation_log${where} ORDER BY id DESC LIMIT @limit OFFSET @offset
    `).all({ ...params, limit: query.pageSize, offset: (query.page - 1) * query.pageSize }) as OperationLogRecord[];
    return { items, total };
  }
}
