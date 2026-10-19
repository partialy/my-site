import { useCallback, useEffect, useRef, useState } from 'react';
import { getFiles } from '../../api/files';
import type { FilePage, FileQuery } from '../../api/files';

const emptyPage: FilePage = { items: [], total: 0, page: 1, pageSize: 20 };

export function useFileLibrary(query: FileQuery, enabled = true) {
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
      const response = await getFiles(query);
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
