import { getFiles, type FileItem, type FileQuery } from '../../api/files';
import { readFilter, writeFilter } from '../../hooks/tableFilterParams';
import { useTableQuery, type TableQueryOptions } from '../../hooks/useTableQuery';

export interface FileFilters extends Pick<FileQuery, 'search' | 'sortBy' | 'sortOrder'> {}

export const defaultFileFilters: FileFilters = { sortBy: 'createdAt', sortOrder: 'desc' };

const options: TableQueryOptions<FileItem, FileFilters> = {
  defaultPageSize: 20,
  defaultFilters: defaultFileFilters,
  filters: {
    read(params) {
      const rawSortBy = params.get('sortBy');
      const rawSortOrder = params.get('sortOrder');
      return {
        search: readFilter(params, 'search', 200),
        sortBy: rawSortBy === 'size' ? 'size' : 'createdAt',
        sortOrder: rawSortOrder === 'asc' ? 'asc' : 'desc',
      };
    },
    write(params, filters) {
      writeFilter(params, 'search', filters.search);
      if (filters.sortBy === 'size') params.set('sortBy', 'size');
      else params.delete('sortBy');
      if (filters.sortOrder === 'asc') params.set('sortOrder', 'asc');
      else params.delete('sortOrder');
    },
  },
  fetchPage: (query, signal) => getFiles(query, signal),
};

export function useFilesPage() {
  return useTableQuery(options);
}
