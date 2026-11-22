import { useCallback, useEffect, useRef, useState } from 'react';
import { getFiles } from '../../api/files';
import type { FilePage, FileQuery } from '../../api/files';

export interface FileLibraryQuery extends Omit<FileQuery, 'offset' | 'limit'> {
  page: number;
  pageSize: number;
}

const emptyPage: FilePage = { list: [], total: 0, offset: 0, limit: 20, hasMore: false };

export function useFileLibrary(query: FileLibraryQuery, enabled = true) {
  const [result, setResult] = useState<FilePage>(emptyPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const reload = useCallback(async () => {
    if (!enabled) return;
    const currentId = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const { page, pageSize, ...filters } = query;
      const response = await getFiles({ ...filters, offset: (page - 1) * pageSize, limit: pageSize });
      if (!response.success) throw new Error(response.msg);
      if (currentId === requestId.current) setResult(response.data);
    } catch (cause) {
      if (currentId === requestId.current) setError(cause instanceof Error ? cause.message : '加载文件失败');
    } finally {
      if (currentId === requestId.current) setLoading(false);
    }
  }, [enabled, query]);

  useEffect(() => {
    void reload();
    return () => { requestId.current += 1; };
  }, [reload]);

  return { result, loading, error, reload };
}
