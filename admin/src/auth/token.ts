const TOKEN_KEY = 'mysite_admin_token';

/**
 * 获取当前 sessionStorage 中的 Token
 */
export function getToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * 存储 Token 至 sessionStorage
 */
export function setToken(token: string): void {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch (err) {
    console.error('Failed to save token to sessionStorage', err);
  }
}

/**
 * 清除 Token
 */
export function removeToken(): void {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch (err) {
    console.error('Failed to remove token from sessionStorage', err);
  }
}
