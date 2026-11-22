import { request } from './client';
import { parseAdminSummary, parseLoginData, parseNull } from './decoders';
import type {
  AdminSummary,
  ApiResponse,
  ChangePasswordRequest,
  LoginData,
  LoginRequest,
  ResetPasswordRequest,
} from './types';

/**
 * 管理员登录
 * POST /api/v1/admin/auth/login
 * 鉴权：无
 */
export async function login(data: LoginRequest): Promise<ApiResponse<LoginData>> {
  return request<LoginData>('/auth/login', parseLoginData, {
    method: 'POST',
    body: data,
    requiresAuth: false,
  });
}

/**
 * 获取当前登录管理员信息
 * GET /api/v1/admin/auth/me
 * 鉴权：JWT (Authorization: Bearer <Token>)
 */
export async function getMe(): Promise<ApiResponse<AdminSummary>> {
  return request<AdminSummary>('/auth/me', parseAdminSummary, {
    method: 'GET',
    requiresAuth: true,
  });
}

/**
 * 修改当前管理员密码
 * PUT /api/v1/admin/auth/password
 * 鉴权：JWT (Authorization: Bearer <Token>)
 */
export async function changePassword(
  data: ChangePasswordRequest
): Promise<ApiResponse<null>> {
  return request<null>('/auth/password', parseNull, {
    method: 'PUT',
    body: data,
    requiresAuth: true,
  });
}

/**
 * 通过 Setup Key 重置管理员密码
 * POST /api/v1/admin/auth/reset-password
 * 鉴权：无（校验 SETUP_KEY）
 */
export async function resetPassword(
  data: ResetPasswordRequest
): Promise<ApiResponse<null>> {
  return request<null>('/auth/reset-password', parseNull, {
    method: 'POST',
    body: data,
    requiresAuth: false,
  });
}
