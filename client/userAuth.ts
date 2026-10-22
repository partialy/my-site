/** 前台项目可复用的业务用户接口；Token 存储由具体项目决定。 */
export interface ClientUser {
  uuid: string;
  account: string;
  nickname: string;
  avatar: string | null;
  status: 'active' | 'disabled';
  createdAt: string;
  updatedAt: string;
}

export interface UserLoginResult {
  token: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: ClientUser;
}

export interface UserAuthClientOptions {
  apiBaseUrl?: string;
  getToken?: () => string | null;
}

interface ApiEnvelope<T> {
  code: number;
  msg: string;
  data: T;
  success: boolean;
}

export function createUserAuthClient(options: UserAuthClientOptions = {}) {
  const base = (options.apiBaseUrl ?? '/api/v1').replace(/\/+$/, '');

  async function request<T>(path: string, method: 'GET' | 'POST', body?: object, authenticated = false): Promise<T> {
    const token = authenticated ? options.getToken?.() : null;
    if (authenticated && !token) throw new Error('请先登录');
    const response = await fetch(`${base}/users${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const result = await response.json() as ApiEnvelope<T>;
    if (!response.ok || !result.success || result.code !== 0) throw new Error(result.msg || '请求失败');
    return result.data;
  }

  return {
    register: (input: { account: string; password: string; nickname?: string }) =>
      request<ClientUser>('/register', 'POST', input),
    login: (input: { account: string; password: string }) =>
      request<UserLoginResult>('/login', 'POST', input),
    me: () => request<ClientUser>('/me', 'GET', undefined, true),
  };
}
