import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ApiResponse } from '../api/types';

export interface TablePage<TItem> {
  items: TItem[];
  total: number;
  page: number;
  pageSize: number;
}

export type TableQuery<TFilters> = TFilters & { page: number; pageSize: number };

export interface TableFilterCodec<TFilters> {
  read(params: URLSearchParams): TFilters;
  write(params: URLSearchParams, filters: TFilters): void;
}

export interface TableQueryOptions<TItem, TFilters extends object> {
  defaultPageSize: number;
  defaultFilters: TFilters;
  filters: TableFilterCodec<TFilters>;
  fetchPage(query: TableQuery<TFilters>, signal: AbortSignal): Promise<ApiResponse<TablePage<TItem>>>;
}

function positiveInteger(raw: string | null, fallback: number, maximum: number): number {
  const value = Number(raw);
  return raw && Number.isSafeInteger(value) && value >= 1 && value <= maximum ? value : fallback;
}

/** URL 保存已提交条件；页面重载、前进后退和分页均使用同一份查询状态。 */
export function useTableQuery<TItem, TFilters extends object>(options: TableQueryOptions<TItem, TFilters>) {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.toString();
  const query = useMemo(() => {
    const params = new URLSearchParams(search);
    return {
      ...options.filters.read(params),
      page: positiveInteger(params.get('page'), 1, 1_000_000),
      pageSize: positiveInteger(params.get('pageSize'), options.defaultPageSize, 100),
    } as TableQuery<TFilters>;
  }, [search, options]);
  const [result, setResult] = useState<TablePage<TItem>>({ items: [], total: 0, page: 1, pageSize: options.defaultPageSize });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const requestId = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    const currentId = ++requestId.current;
    setLoading(true);
    setError(null);
    void options.fetchPage(query, controller.signal).then((response) => {
      if (!response.success) throw new Error(response.msg);
      if (requestId.current !== currentId) return;
      setResult(response.data);
      const lastPage = Math.max(1, Math.ceil(response.data.total / query.pageSize));
      if (query.page > lastPage) {
        setSearchParams((previous) => {
          const next = new URLSearchParams(previous);
          if (lastPage === 1) next.delete('page');
          else next.set('page', String(lastPage));
          return next;
        }, { replace: true });
      }
    }).catch((cause: unknown) => {
      if (controller.signal.aborted || requestId.current !== currentId) return;
      setError(cause instanceof Error ? cause.message : '加载列表失败');
    }).finally(() => {
      if (!controller.signal.aborted && requestId.current === currentId) setLoading(false);
    });
    return () => { controller.abort(); requestId.current += 1; };
  }, [query, version, options, setSearchParams]);

  const setFilters = useCallback((filters: TFilters, replace = false) => {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      options.filters.write(next, filters);
      next.delete('page');
      return next;
    }, { replace });
  }, [options, setSearchParams]);

  const resetFilters = useCallback(() => setFilters(options.defaultFilters), [options, setFilters]);
  const setPage = useCallback((page: number, pageSize: number) => {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      if (pageSize !== positiveInteger(previous.get('pageSize'), options.defaultPageSize, 100)) page = 1;
      if (page === 1) next.delete('page');
      else next.set('page', String(page));
      if (pageSize === options.defaultPageSize) next.delete('pageSize');
      else next.set('pageSize', String(pageSize));
      return next;
    });
  }, [options, setSearchParams]);

  const reload = useCallback(() => setVersion((value) => value + 1), []);
  const replaceItem = useCallback((matches: (item: TItem) => boolean, updated: TItem) => {
    setResult((current) => ({ ...current, items: current.items.map((item) => matches(item) ? updated : item) }));
  }, []);

  return { query, result, loading, error, setFilters, resetFilters, setPage, reload, replaceItem };
}
