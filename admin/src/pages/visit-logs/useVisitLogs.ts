import { getVisitLogs, type VisitLogItem } from '../../api/visits';
import { readFilter, writeFilter } from '../../hooks/tableFilterParams';
import { useTableQuery, type TableQueryOptions } from '../../hooks/useTableQuery';

export interface VisitLogFilters {
  path?: string;
  visitorId?: string;
  startDay?: string;
  endDay?: string;
}

const options: TableQueryOptions<VisitLogItem, VisitLogFilters> = {
  defaultPageSize: 10,
  defaultFilters: {},
  filters: {
    read(params) {
      return {
        path: readFilter(params, 'path', 500), visitorId: readFilter(params, 'visitorId', 36),
        startDay: readFilter(params, 'startDay', 10), endDay: readFilter(params, 'endDay', 10),
      };
    },
    write(params, filters) {
      for (const key of ['path', 'visitorId', 'startDay', 'endDay'] as const) {
        writeFilter(params, key, filters[key]);
      }
    },
  },
  fetchPage: (query, signal) => getVisitLogs(query, signal),
};

export function useVisitLogs() {
  return useTableQuery(options);
}
