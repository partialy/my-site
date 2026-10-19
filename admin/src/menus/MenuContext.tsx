import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { getMenus, saveMenus } from '../api/menus';
import type { MenuItem } from '../api/menus';
import { useAuth } from '../auth';

interface MenuContextValue {
  items: MenuItem[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  save: (items: MenuItem[]) => Promise<void>;
}

const MenuContext = createContext<MenuContextValue | null>(null);

export const MenuProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state } = useAuth();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestVersion = useRef(0);

  const reload = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true);
    setError(null);
    try {
      const response = await getMenus();
      if (!response.success) throw new Error(response.msg);
      if (version === requestVersion.current) setItems(response.data);
    } catch (cause) {
      if (version === requestVersion.current) setError(cause instanceof Error ? cause.message : '加载菜单失败');
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (state.status === 'authenticated') {
      void reload();
    } else {
      requestVersion.current += 1;
      setItems([]);
      setError(null);
      setLoading(false);
    }
  }, [state.status, reload]);

  const save = useCallback(async (nextItems: MenuItem[]) => {
    const response = await saveMenus(nextItems);
    if (!response.success) throw new Error(response.msg);
    setItems(response.data);
  }, []);

  return <MenuContext.Provider value={{ items, loading, error, reload, save }}>{children}</MenuContext.Provider>;
};

export function useMenus(): MenuContextValue {
  const value = useContext(MenuContext);
  if (!value) throw new Error('useMenus 必须在 MenuProvider 内使用');
  return value;
}
