import { getFiles, type FileItem } from '../../api/files';
import { readFilter, writeFilter } from '../../hooks/tableFilterParams';
import { useTableQuery, type TableQueryOptions } from '../../hooks/useTableQuery';

export interface FileFilters { search?: string }

const options: TableQueryOptions<FileItem, FileFilters> = {
  defaultPageSize: 20,
  defaultFilters: {},
  filters: {
    read: (params) => ({ search: readFilter(params, 'search', 200) }),
    write: (params, filters) => writeFilter(params, 'search', filters.search),
  },
  fetchPage: (query, signal) => getFiles(query, signal),
};

export function useFilesPage() {
  return useTableQuery(options);
}
