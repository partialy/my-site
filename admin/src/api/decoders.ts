import type { AdminSummary, LoginData, PageData, PageQuery, SetupStatusData } from './types';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isOptionalString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

export function buildPageParams(query: PageQuery): URLSearchParams {
  return new URLSearchParams({ offset: String(query.offset), limit: String(query.limit) });
}

export function parsePageData<TItem>(
  value: unknown,
  parseItem: (item: unknown) => TItem,
  errorMessage = '列表格式异常',
): PageData<TItem> {
  if (!isRecord(value) || !Array.isArray(value.list) || typeof value.total !== 'number' ||
    typeof value.offset !== 'number' || typeof value.limit !== 'number' ||
    typeof value.hasMore !== 'boolean') {
    throw new Error(errorMessage);
  }
  return {
    list: value.list.map(parseItem),
    total: value.total,
    offset: value.offset,
    limit: value.limit,
    hasMore: value.hasMore,
  };
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
