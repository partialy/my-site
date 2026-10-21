import { getFiles, type FileItem, type FileQuery } from '../../api/files';
import { readFilter, writeFilter } from '../../hooks/tableFilterParams';
import { useTableQuery, type TableQueryOptions } from '../../hooks/useTableQuery';

export interface FileFilters extends Pick<FileQuery, 'search' | 'sortBy' | 'sortOrder' | 'status'> {}

export const defaultFileFilters: FileFilters = { sortBy: 'createdAt', sortOrder: 'desc', status: 'all' };

const options: TableQueryOptions<FileItem, FileFilters> = {
  defaultPageSize: 20,
  defaultFilters: defaultFileFilters,
  filters: {
    read(params) {
      const rawSortBy = params.get('sortBy');
      const rawSortOrder = params.get('sortOrder');
      const rawStatus = params.get('status');
      return {
        search: readFilter(params, 'search', 200),
        sortBy: rawSortBy === 'size' ? 'size' : 'createdAt',
        sortOrder: rawSortOrder === 'asc' ? 'asc' : 'desc',
        status: rawStatus === 'active' || rawStatus === 'archived' ? rawStatus : 'all',
      };
    },
    write(params, filters) {
      writeFilter(params, 'search', filters.search);
      if (filters.sortBy === 'size') params.set('sortBy', 'size');
      else params.delete('sortBy');
      if (filters.sortOrder === 'asc') params.set('sortOrder', 'asc');
      else params.delete('sortOrder');
      if (filters.status === 'active' || filters.status === 'archived') params.set('status', filters.status);
      else params.delete('status');
    },
  },
  fetchPage: (query, signal) => getFiles(query, signal),
};

export function useFilesPage() {
  return useTableQuery(options);
}
