import { getAdminWorks, type WorkItem, type WorkStatus } from '../../api/works';
import { readFilter, writeFilter } from '../../hooks/tableFilterParams';
import { useTableQuery, type TableQueryOptions } from '../../hooks/useTableQuery';

export interface WorkFilters {
  search?: string;
  category?: string;
  status?: WorkStatus;
  featuredHome?: 'true' | 'false';
}

export const defaultWorkFilters: WorkFilters = {};

const options: TableQueryOptions<WorkItem, WorkFilters> = {
  defaultPageSize: 10,
  defaultFilters: defaultWorkFilters,
  filters: {
    read(params) {
      const status = params.get('status');
      const featured = params.get('featuredHome');
      return {
        search: readFilter(params, 'search', 120),
        category: readFilter(params, 'category', 60),
        status: status === 'draft' || status === 'published' ? status : undefined,
        featuredHome: featured === 'true' || featured === 'false' ? featured : undefined,
      };
    },
    write(params, values) {
      writeFilter(params, 'search', values.search);
      writeFilter(params, 'category', values.category);
      writeFilter(params, 'status', values.status);
      writeFilter(params, 'featuredHome', values.featuredHome);
    },
  },
  fetchPage(query, signal) {
    return getAdminWorks({
      offset: query.offset,
      limit: query.limit,
      search: query.search,
      category: query.category,
      status: query.status,
      featuredHome: query.featuredHome === undefined ? undefined : query.featuredHome === 'true',
    }, signal);
  },
};

export function useWorksPage() {
  return useTableQuery(options);
}
