import { useCallback, useEffect, useRef, useState } from 'react';
import { getVisitLogs } from '../../api/visits';
import type { VisitLogPage, VisitLogQuery } from '../../api/visits';

const emptyPage: VisitLogPage = { items: [], total: 0, page: 1, pageSize: 10 };

export function useVisitLogs(query: VisitLogQuery) {
  const [result, setResult] = useState<VisitLogPage>(emptyPage);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const reload = useCallback(async () => {
    const currentId = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const response = await getVisitLogs(query);
      if (!response.success) throw new Error(response.msg);
      if (currentId === requestId.current) setResult(response.data);
    } catch (cause) {
      if (currentId === requestId.current) setError(cause instanceof Error ? cause.message : '加载访问日志失败');
    } finally {
      if (currentId === requestId.current) setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void reload();
    return () => { requestId.current += 1; };
  }, [reload]);

  return { result, loading, error, reload };
}
