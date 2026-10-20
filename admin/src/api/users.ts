import { request } from './client';
import type { ApiResponse } from './types';

export type UserStatus = 'active' | 'disabled';

export interface UserItem {
  id: number;
  account: string;
  nickname: string;
  avatar: string | null;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UserQuery {
  page: number;
  pageSize: number;
  search?: string;
  status?: UserStatus;
}

export interface UserPage {
  items: UserItem[];
  total: number;
  page: number;
  pageSize: number;
}

function parseUser(value: unknown): UserItem {
  if (typeof value !== 'object' || value === null) throw new Error('用户数据格式异常');
  const user = value as Partial<UserItem>;
  if (typeof user.id !== 'number' || typeof user.account !== 'string' ||
    typeof user.nickname !== 'string' || !(user.avatar === null || typeof user.avatar === 'string') ||
    (user.status !== 'active' && user.status !== 'disabled') ||
    typeof user.createdAt !== 'string' || typeof user.updatedAt !== 'string') throw new Error('用户数据格式异常');
  return user as UserItem;
}

function parseUserPage(value: unknown): UserPage {
  if (typeof value !== 'object' || value === null) throw new Error('用户列表格式异常');
  const page = value as Partial<UserPage>;
  if (!Array.isArray(page.items) || typeof page.total !== 'number' ||
    typeof page.page !== 'number' || typeof page.pageSize !== 'number') throw new Error('用户列表格式异常');
  return { items: page.items.map(parseUser), total: page.total, page: page.page, pageSize: page.pageSize };
}

export function getUsers(query: UserQuery): Promise<ApiResponse<UserPage>> {
  const params = new URLSearchParams({ page: String(query.page), pageSize: String(query.pageSize) });
  if (query.search) params.set('search', query.search);
  if (query.status) params.set('status', query.status);
  return request(`/users?${params.toString()}`, parseUserPage);
}

export function getUser(id: number): Promise<ApiResponse<UserItem>> {
  return request(`/users/${id}`, parseUser);
}

export function setUserStatus(id: number, status: UserStatus): Promise<ApiResponse<UserItem>> {
  return request(`/users/${id}/status`, parseUser, { method: 'PUT', body: { status } });
}
