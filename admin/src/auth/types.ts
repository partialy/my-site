import type { AdminSummary, ApiResponse, LoginData, LoginRequest } from '../api/types';

export type AuthStatus =
  | 'idle'
  | 'checking'
  | 'authenticated'
  | 'unauthenticated'
  | 'network_error';

export interface AuthState {
  /** 系统初始化状态：null 表示尚在检测中 */
  initialized: boolean | null;
  /** 当前登录的管理员摘要 */
  admin: AdminSummary | null;
  /** 当前 Token 字符串 */
  token: string | null;
  /** 当前认证状态 */
  status: AuthStatus;
  /** 启动异常提示信息 */
  errorMessage: string | null;
}

export interface AuthContextValue {
  state: AuthState;
  /** 重新检测系统初始化与会话有效性 */
  checkStatusAndSession: () => Promise<void>;
  /** 登录操作（由 LoginPage 调用） */
  login: (data: LoginRequest) => Promise<ApiResponse<LoginData>>;
  /** 退出登录（清理本地 Token 与会话） */
  logout: () => void;
  /** 标记系统已初始化完成 */
  markInitialized: () => void;
  /** 更新当前管理员信息 */
  setAdmin: (admin: AdminSummary | null) => void;
}
