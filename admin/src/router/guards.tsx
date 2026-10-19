import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth';
import { PageLoading } from '../components/PageLoading';
import { NetworkError } from '../components/NetworkError';

/**
 * 根启动守卫：
 * 负责初次连接检测、网络错误重试、初始化状态拦截
 */
export const BootGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state, checkStatusAndSession } = useAuth();
  const location = useLocation();

  // 1. 启动或刷新时的检测态：展示居中优雅加载态，避免闪烁
  if (state.status === 'checking') {
    return <PageLoading tip="正在连接并检测系统初始化与会话状态..." />;
  }

  // 2. 网络错误态：展示重试界面，严禁将网络错误当成“未初始化”
  if (state.status === 'network_error') {
    return (
      <NetworkError
        message={state.errorMessage}
        onRetry={checkStatusAndSession}
      />
    );
  }

  // 3. 未初始化状态：强制分流至 /setup
  if (state.initialized === false) {
    if (location.pathname !== '/setup') {
      return <Navigate to="/setup" replace />;
    }
    return <>{children}</>;
  }

  // 4. 已初始化状态：如果此时试图访问 /setup，重定向到登录页
  if (state.initialized === true && location.pathname === '/setup') {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

/**
 * 受保护后台路由守卫：
 * 要求已初始化且已登录
 */
export const ProtectedGuard: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { state } = useAuth();
  const location = useLocation();

  if (state.status !== 'authenticated') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

/**
 * 公开访问路由守卫（如 /login）：
 * 若已处于登录状态，自动重定向至后台首页
 */
export const PublicOnlyGuard: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { state } = useAuth();

  if (state.status === 'authenticated') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
