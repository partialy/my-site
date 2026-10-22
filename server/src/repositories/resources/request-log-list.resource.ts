import type { TableListResource } from '../table-list.repository';

export const requestLogListResource: TableListResource = {
  table: 'request_log',
  columns: ['uuid', 'time', 'method', 'path', 'url', 'request_data', 'response_data',
    'status', 'duration_ms', 'ip', 'origin', 'referer', 'user_agent'],
  orderBy: 'id', order: 'DESC',
  equalityFilters: { method: 'method', status: 'status' },
  containsFilters: { path: 'path' },
};
