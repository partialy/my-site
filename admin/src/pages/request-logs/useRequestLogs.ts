import { getRequestLogs, type RequestLogItem } from '../../api/requestLogs';
import { readFilter, writeFilter } from '../../hooks/tableFilterParams';
import { useTableQuery, type TableQueryOptions } from '../../hooks/useTableQuery';

export interface RequestLogFilters {
  path?: string;
  method?: string;
  status?: string;
}

const options: TableQueryOptions<RequestLogItem, RequestLogFilters> = {
  defaultPageSize: 10,
  defaultFilters: {},
  filters: {
    read(params) {
      return {
        path: readFilter(params, 'path', 500), method: readFilter(params, 'method', 16),
        status: readFilter(params, 'status', 3),
      };
    },
    write(params, filters) {
      for (const key of ['path', 'method', 'status'] as const) writeFilter(params, key, filters[key]);
    },
  },
  fetchPage: (query, signal) => getRequestLogs({ ...query,
    status: /^[1-5]\d{2}$/.test(query.status ?? '') ? Number(query.status) : undefined }, signal),
};

export function useRequestLogs() {
  return useTableQuery(options);
}
