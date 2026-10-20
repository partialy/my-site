import type { TableListResource } from '../table-list.repository';

export const operationLogListResource: TableListResource = {
  table: 'operation_log',
  columns: ['id', 'actor_type', 'actor_id', 'actor_name', 'module', 'action', 'target_type',
    'target_id', 'summary', 'changed_fields', 'ip', 'duration_ms', 'created_at'],
  orderBy: 'id', order: 'DESC',
  containsFilters: { module: 'module', actor: 'actor_name' },
  rangeFilters: {
    startTime: { column: 'created_at', operator: '>=' },
    endTime: { column: 'created_at', operator: '<=' },
  },
};
