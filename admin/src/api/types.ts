/**
 * 业务错误码定义
 * 固定业务码：
 * 0: 成功
 * -1: 通用失败
 * 1001: 参数错误
 * 1002: 初始化密钥错误
 * 1003: 已初始化
 * 1004: 账号或密码错误
 * 1005: 未提供 Token
 * 1006: Token 无效
 * 1007: Token 过期
 * 1008: 原密码错误
 * 1009: 接口不存在
 */
export const ApiCode = {
  SUCCESS: 0,
  FAIL: -1,
  VALIDATION_ERROR: 1001,
  INVALID_SETUP_KEY: 1002,
  ALREADY_INITIALIZED: 1003,
  INVALID_CREDENTIALS: 1004,
  TOKEN_MISSING: 1005,
  TOKEN_INVALID: 1006,
  TOKEN_EXPIRED: 1007,
  INVALID_OLD_PASSWORD: 1008,
  NOT_FOUND: 1009,
} as const;

export type ApiCode = (typeof ApiCode)[keyof typeof ApiCode];

/**
 * 参数错误（1001）对应的字段错误结构
 */
export interface ValidationErrorData {
  fieldErrors: Record<string, string[]>;
}

/**
 * 成功分支
 */
export interface ApiSuccessResponse<TData> {
  code: 0;
  msg: string;
  data: TData;
  success: true;
}

/**
 * 参数校验失败分支 (1001)
 */
export interface ApiValidationErrorResponse {
  code: typeof ApiCode.VALIDATION_ERROR;
  msg: string;
  data: ValidationErrorData;
  success: false;
}

/**
 * 普通业务失败或系统错误分支
 */
export interface ApiGeneralErrorResponse {
  code: Exclude<ApiCode | number, 0 | typeof ApiCode.VALIDATION_ERROR>;
  msg: string;
  data: null;
  success: false;
}

/**
 * 统一 API 响应契约（判别联合类型）
 */
export type ApiResponse<TData> =
  | ApiSuccessResponse<TData>
  | ApiValidationErrorResponse
  | ApiGeneralErrorResponse;

/**
 * 管理员摘要信息
 */
export interface AdminSummary {
  id: number;
  username: string;
}

/**
 * 初始化状态数据
 */
export interface SetupStatusData {
  initialized: boolean;
}

/**
 * 初始化管理员请求参数
 */
export interface SetupAdminRequest {
  username: string;
  password: string;
  setupKey: string;
  projectName: string;
  siteSettings: {
    admin: { siteTitle: string; systemName: string };
    client: { siteTitle: string; systemName: string };
  };
}

/**
 * 登录请求参数
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * 登录成功响应数据
 */
export interface LoginData {
  token: string;
  tokenType: "Bearer";
  expiresIn: number; // 单位：秒，固定 43200
  admin: AdminSummary;
}

/**
 * 修改密码请求参数
 */
export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}
