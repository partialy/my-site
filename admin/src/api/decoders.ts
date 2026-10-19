import type { AdminSummary, LoginData, SetupStatusData } from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseAdminSummary(value: unknown): AdminSummary {
  if (!isRecord(value) || typeof value.id !== 'number' || typeof value.username !== 'string') {
    throw new Error('管理员信息格式异常');
  }
  return { id: value.id, username: value.username };
}

export function parseSetupStatus(value: unknown): SetupStatusData {
  if (!isRecord(value) || typeof value.initialized !== 'boolean') {
    throw new Error('初始化状态格式异常');
  }
  return { initialized: value.initialized };
}

export function parseLoginData(value: unknown): LoginData {
  if (!isRecord(value) || typeof value.token !== 'string' || value.tokenType !== 'Bearer' ||
      typeof value.expiresIn !== 'number') {
    throw new Error('登录响应格式异常');
  }
  return {
    token: value.token,
    tokenType: 'Bearer',
    expiresIn: value.expiresIn,
    admin: parseAdminSummary(value.admin),
  };
}

export function parseNull(value: unknown): null {
  if (value !== null) throw new Error('响应数据格式异常');
  return null;
}
