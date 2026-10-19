import { useCallback, useEffect, useState } from 'react';
import { getDashboard, type DashboardData } from '../../api/dashboard';

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getDashboard();
      if (!result.success) throw new Error(result.msg);
      setData(result.data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '读取仪表盘数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);
  return { data, loading, error, reload };
}
