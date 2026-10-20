import { useCallback, useEffect, useRef, useState } from 'react';
import { getOperationLogs, type OperationLogPage, type OperationLogQuery } from '../../api/operationLogs';

const emptyPage: OperationLogPage = { items: [], total: 0, page: 1, pageSize: 10 };

export function useOperationLogs(query: OperationLogQuery) {
  const [result, setResult] = useState<OperationLogPage>(emptyPage);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const reload = useCallback(async () => {
    const currentId = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const response = await getOperationLogs(query);
      if (!response.success) throw new Error(response.msg);
      if (requestId.current === currentId) setResult(response.data);
    } catch (cause) {
      if (requestId.current === currentId) setError(cause instanceof Error ? cause.message : '加载操作日志失败');
    } finally {
      if (requestId.current === currentId) setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void reload();
    return () => { requestId.current += 1; };
  }, [reload]);

  return { result, loading, error, reload };
}
