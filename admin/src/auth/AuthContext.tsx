import React, { createContext, useCallback, useEffect, useState } from 'react';
import { getMe, getSetupStatus, login as loginApi, onUnauthorized, ApiNetworkError, ApiCode } from '../api';
import type { AdminSummary, ApiResponse, LoginData, LoginRequest } from '../api/types';
import { getToken, removeToken, setToken as saveTokenToStorage } from './token';
import type { AuthContextValue, AuthState } from './types';
import { clearDictionaryCache } from '../dictionaries';

export const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    initialized: null,
    admin: null,
    token: getToken(),
    status: 'checking',
    errorMessage: null,
  });

  // 检查系统初始化与管理员会话
  const checkStatusAndSession = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      status: 'checking',
      errorMessage: null,
    }));

    try {
      // 1. 获取系统初始化状态
      const setupRes = await getSetupStatus();

      if (!setupRes.success) {
        setState((prev) => ({
          ...prev,
          status: 'network_error',
          errorMessage: setupRes.msg || '获取系统初始化状态失败',
        }));
        return;
      }

      const isInitialized = setupRes.data.initialized;

      if (!isInitialized) {
        // 未初始化状态
        removeToken();
        setState({
          initialized: false,
          admin: null,
          token: null,
          status: 'unauthenticated',
          errorMessage: null,
        });
        return;
      }

      // 已初始化，检查本地会话 Token
      const storedToken = getToken();
      if (!storedToken) {
        setState({
          initialized: true,
          admin: null,
          token: null,
          status: 'unauthenticated',
          errorMessage: null,
        });
        return;
      }

      // 使用 /auth/me 作为会话鉴权的最终依据
      try {
        const meRes = await getMe();
        if (meRes.success) {
          setState({
            initialized: true,
            admin: meRes.data,
            token: storedToken,
            status: 'authenticated',
            errorMessage: null,
          });
        } else if (
          meRes.code === ApiCode.TOKEN_MISSING ||
          meRes.code === ApiCode.TOKEN_INVALID ||
          meRes.code === ApiCode.TOKEN_EXPIRED
        ) {
          removeToken();
          setState({
            initialized: true,
            admin: null,
            token: null,
            status: 'unauthenticated',
            errorMessage: null,
          });
        } else {
          setState((prev) => ({
            ...prev,
            status: 'network_error',
            errorMessage: meRes.msg || '获取管理员信息失败，请重试',
          }));
        }
      } catch (meErr) {
        setState((prev) => ({
          ...prev,
          status: 'network_error',
          errorMessage: meErr instanceof Error ? meErr.message : '获取管理员信息失败，请重试',
        }));
      }
    } catch (err) {
      const message =
        err instanceof ApiNetworkError
          ? err.message
          : '连接后端服务失败，请检查服务状态并重试';
      setState((prev) => ({
        ...prev,
        status: 'network_error',
        errorMessage: message,
      }));
    }
  }, []);

  // 监听受保护接口 401 自动清理
  useEffect(() => {
    const unsubscribe = onUnauthorized(() => {
      clearDictionaryCache();
      setState((prev) => ({
        ...prev,
        admin: null,
        token: null,
        status: 'unauthenticated',
      }));
    });
    return unsubscribe;
  }, []);

  // 组件挂载时初次检查
  useEffect(() => {
    checkStatusAndSession();
  }, [checkStatusAndSession]);

  // 登录方法
  const login = useCallback(async (data: LoginRequest): Promise<ApiResponse<LoginData>> => {
    const res = await loginApi(data);
    if (res.success) {
      saveTokenToStorage(res.data.token);
      setState({
        initialized: true,
        admin: res.data.admin,
        token: res.data.token,
        status: 'authenticated',
        errorMessage: null,
      });
    }
    return res;
  }, []);

  // 退出登录方法：仅清理本地 Token 与状态
  const logout = useCallback(() => {
    clearDictionaryCache();
    removeToken();
    setState((prev) => ({
      ...prev,
      admin: null,
      token: null,
      status: 'unauthenticated',
    }));
  }, []);

  // 标记初始化完成
  const markInitialized = useCallback(() => {
    setState((prev) => ({
      ...prev,
      initialized: true,
      status: 'unauthenticated',
    }));
  }, []);

  // 更新管理员信息
  const setAdmin = useCallback((admin: AdminSummary | null) => {
    setState((prev) => ({
      ...prev,
      admin,
    }));
  }, []);

  const value: AuthContextValue = {
    state,
    checkStatusAndSession,
    login,
    logout,
    markInitialized,
    setAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
