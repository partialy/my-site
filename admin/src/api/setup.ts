import { request } from './client';
import { parseAdminSummary, parseSetupStatus } from './decoders';
import type { AdminSummary, ApiResponse, SetupAdminRequest, SetupStatusData } from './types';

/**
 * 获取系统初始化状态
 * GET /api/v1/setup/status
 * 鉴权：无
 */
export async function getSetupStatus(): Promise<ApiResponse<SetupStatusData>> {
  return request<SetupStatusData>('/setup/status', parseSetupStatus, {
    method: 'GET',
    requiresAuth: false,
  });
}

/**
 * 初始化管理员
 * POST /api/v1/setup/admin
 * 鉴权：无（需请求体中携带 setupKey）
 */
export async function setupAdmin(data: SetupAdminRequest): Promise<ApiResponse<AdminSummary>> {
  return request<AdminSummary>('/setup/admin', parseAdminSummary, {
    method: 'POST',
    body: data,
    requiresAuth: false,
  });
}
