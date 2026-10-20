import { z } from 'zod';
import { OperationLogRepository, type OperationLogQuery, type OperationLogRecord } from '../repositories/operation-log.repository';

export const operationLogQuerySchema = z.strictObject({
  page: z.coerce.number().int().min(1).max(1_000_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  module: z.string().trim().min(1).max(100).optional(),
  actor: z.string().trim().min(1).max(100).optional(),
  startTime: z.iso.datetime({ offset: true }).optional(),
  endTime: z.iso.datetime({ offset: true }).optional(),
}).refine((value) => !value.startTime || !value.endTime || Date.parse(value.startTime) <= Date.parse(value.endTime), {
  path: ['endTime'], message: '结束时间不能早于开始时间',
});

export interface OperationActor {
  type: 'admin' | 'user' | 'system';
  id?: string | number;
  name: string;
}

/** 审计只收业务摘要和字段名，不接收原值、请求体或响应体。 */
export interface RecordOperationInput {
  actor: OperationActor;
  module: string;
  action: string;
  targetType: string;
  targetId?: string | number;
  summary: string;
  changedFields?: string[];
  ip?: string | null;
  durationMs?: number;
}

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

function safeText(value: string, maxLength: number): string {
  return value.trim().slice(0, maxLength);
}

function toItem(row: OperationLogRecord): OperationLogItem {
  let changedFields: string[] = [];
  try {
    const parsed: unknown = JSON.parse(row.changed_fields);
    if (Array.isArray(parsed) && parsed.every((field) => typeof field === 'string')) changedFields = parsed;
  } catch { /* 历史异常数据不影响日志查询。 */ }
  return {
    id: row.id, actorType: row.actor_type, actorId: row.actor_id, actorName: row.actor_name,
    module: row.module, action: row.action, targetType: row.target_type, targetId: row.target_id,
    summary: row.summary, changedFields, ip: row.ip, durationMs: row.duration_ms, createdAt: row.created_at,
  };
}

export class OperationLogService {
  constructor(private readonly repository: OperationLogRepository) {}

  record(input: RecordOperationInput): number {
    // 字段名仅作定位；敏感字段及任何字段值都不保存。
    const fields = (input.changedFields ?? [])
      .filter((field) => /^[A-Za-z][A-Za-z0-9_.-]{0,99}$/.test(field) && !/password|secret|token|key/i.test(field))
      .slice(0, 50);
    return this.repository.create({
      actor_type: input.actor.type,
      actor_id: input.actor.id === undefined ? null : String(input.actor.id),
      actor_name: safeText(input.actor.name, 100),
      module: safeText(input.module, 100), action: safeText(input.action, 50),
      target_type: safeText(input.targetType, 100),
      target_id: input.targetId === undefined ? null : safeText(String(input.targetId), 200),
      summary: safeText(input.summary, 500), changed_fields: JSON.stringify(fields),
      ip: input.ip ? safeText(input.ip, 100) : null,
      duration_ms: input.durationMs === undefined ? null : Math.max(0, Math.round(input.durationMs)),
      created_at: new Date().toISOString(),
    });
  }

  list(query: z.infer<typeof operationLogQuerySchema>) {
    const normalized: OperationLogQuery = {
      ...query,
      startTime: query.startTime ? new Date(query.startTime).toISOString() : undefined,
      endTime: query.endTime ? new Date(query.endTime).toISOString() : undefined,
    };
    const result = this.repository.list(normalized);
    return { items: result.items.map(toItem), total: result.total, page: query.page, pageSize: query.pageSize };
  }
}
