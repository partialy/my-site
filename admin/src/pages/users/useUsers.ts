import { useCallback, useEffect, useRef, useState } from 'react';
import { getUsers, setUserStatus, type UserPage, type UserQuery, type UserStatus } from '../../api/users';

const emptyPage: UserPage = { items: [], total: 0, page: 1, pageSize: 20 };

export function useUsers(query: UserQuery) {
  const [result, setResult] = useState<UserPage>(emptyPage);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const reload = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const response = await getUsers(query);
      if (!response.success) throw new Error(response.msg);
      if (id === requestId.current) setResult(response.data);
    } catch (cause) {
      if (id === requestId.current) setError(cause instanceof Error ? cause.message : '加载用户失败');
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void reload();
    return () => { requestId.current += 1; };
  }, [reload]);

  const updateStatus = useCallback(async (id: number, status: UserStatus) => {
    setSavingId(id);
    setError(null);
    try {
      const response = await setUserStatus(id, status);
      if (!response.success) throw new Error(response.msg);
      setResult((current) => ({ ...current, items: current.items.map((item) => item.id === id ? response.data : item) }));
      return response.msg;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : '修改用户状态失败';
      setError(message);
      throw new Error(message);
    } finally {
      setSavingId(null);
    }
  }, []);

  return { result, loading, savingId, error, reload, updateStatus };
}
