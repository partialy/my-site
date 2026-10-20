import { getOperationLogs, type OperationLogItem } from '../../api/operationLogs';
import { readFilter, writeFilter } from '../../hooks/tableFilterParams';
import { useTableQuery, type TableQueryOptions } from '../../hooks/useTableQuery';

export interface OperationLogFilters {
  module?: string;
  actor?: string;
  startTime?: string;
  endTime?: string;
}

function localToIso(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

const options: TableQueryOptions<OperationLogItem, OperationLogFilters> = {
  defaultPageSize: 10,
  defaultFilters: {},
  filters: {
    read(params) {
      return {
        module: readFilter(params, 'module', 100), actor: readFilter(params, 'actor', 100),
        startTime: readFilter(params, 'startTime', 16), endTime: readFilter(params, 'endTime', 16),
      };
    },
    write(params, filters) {
      for (const key of ['module', 'actor', 'startTime', 'endTime'] as const) {
        writeFilter(params, key, filters[key]);
      }
    },
  },
  fetchPage: (query, signal) => getOperationLogs({ ...query,
    startTime: localToIso(query.startTime), endTime: localToIso(query.endTime) }, signal),
};

export function useOperationLogs() {
  return useTableQuery(options);
}
