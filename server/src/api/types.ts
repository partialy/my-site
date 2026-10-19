import type { FailureCode } from './codes';
import { ApiCode } from './codes';

export interface ValidationErrorData {
  fieldErrors: Record<string, string[]>;
}

export type ApiResponse<TData> =
  | { code: typeof ApiCode.Success; msg: string; data: TData; success: true }
  | { code: FailureCode; msg: string; data: null | ValidationErrorData; success: false };

export interface AdminSummary {
  id: number;
  username: string;
}

export interface SetupStatusData {
  initialized: boolean;
}

export interface LoginData {
  token: string;
  tokenType: 'Bearer';
  expiresIn: number;
  admin: AdminSummary;
}

export function ok<TData>(data: TData, msg = '成功'): ApiResponse<TData> {
  return { code: ApiCode.Success, msg, data, success: true };
}
