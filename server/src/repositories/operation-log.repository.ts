import type Database from 'better-sqlite3';
import type { PageResult, PaginationQuery } from '../shared/pagination';
import { TableListRepository } from './table-list.repository';
import { operationLogListResource } from './resources/operation-log-list.resource';

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

export interface OperationLogQuery extends PaginationQuery {
  module?: string;
  actor?: string;
  startTime?: string;
  endTime?: string;
}

export class OperationLogRepository {
  private readonly tableList: TableListRepository;

  constructor(private readonly db: Database.Database) {
    this.tableList = new TableListRepository(db);
  }

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

  list(query: OperationLogQuery): PageResult<OperationLogRecord> {
    return this.tableList.list<OperationLogRecord, OperationLogQuery>(operationLogListResource, query);
  }
}
