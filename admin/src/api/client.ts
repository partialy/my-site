import { getToken, removeToken } from '../auth/token';
import { ApiCode } from './types';
import type { ApiResponse, ValidationErrorData } from './types';

export class ApiNetworkError extends Error {
  constructor(message = '连接后端服务失败，请检查网络或服务端运行状态') {
    super(message);
    this.name = 'ApiNetworkError';
  }
}

type UnauthorizedHandler = () => void;
const unauthorizedHandlers = new Set<UnauthorizedHandler>();

export function onUnauthorized(handler: UnauthorizedHandler): () => void {
  unauthorizedHandlers.add(handler);
  return () => { unauthorizedHandlers.delete(handler); };
}

function notifyUnauthorized(): void {
  removeToken();
  unauthorizedHandlers.forEach((handler) => handler());
}

export function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL || '/api/v1/admin';
}

export function getPublicApiBaseUrl(): string {
  return getApiBaseUrl().replace(/\/admin\/?$/, '');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseFieldErrors(value: unknown): ValidationErrorData {
  if (!isRecord(value) || !isRecord(value.fieldErrors)) {
    throw new ApiNetworkError('服务端参数错误响应格式异常');
  }
  const fieldErrors: Record<string, string[]> = {};
  for (const [field, messages] of Object.entries(value.fieldErrors)) {
    if (!Array.isArray(messages) || !messages.every((message) => typeof message === 'string')) {
      throw new ApiNetworkError('服务端参数错误响应格式异常');
    }
    fieldErrors[field] = messages;
  }
  return { fieldErrors };
}

function parseResponse<TData>(raw: unknown, parseData: (value: unknown) => TData): ApiResponse<TData> {
  if (!isRecord(raw) || typeof raw.code !== 'number' || typeof raw.msg !== 'string' ||
      typeof raw.success !== 'boolean' || raw.success !== (raw.code === ApiCode.SUCCESS)) {
    throw new ApiNetworkError('服务端响应不符合 {code, msg, data, success} 契约');
  }
  if (raw.success) {
    return { code: ApiCode.SUCCESS, msg: raw.msg, data: parseData(raw.data), success: true };
  }
  if (raw.code === ApiCode.VALIDATION_ERROR) {
    return {
      code: ApiCode.VALIDATION_ERROR,
      msg: raw.msg,
      data: parseFieldErrors(raw.data),
      success: false,
    };
  }
  if (raw.data !== null) throw new ApiNetworkError('服务端错误响应格式异常');
  return { code: raw.code, msg: raw.msg, data: null, success: false };
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  rawBody?: BodyInit;
  contentType?: string;
  requiresAuth?: boolean;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  baseUrl?: string;
}

export async function request<TData>(
  endpoint: string,
  parseData: (value: unknown) => TData,
  options: RequestOptions = {},
): Promise<ApiResponse<TData>> {
  const { method = 'GET', body, rawBody, contentType, requiresAuth = true } = options;
  const headers: Record<string, string> = { Accept: 'application/json', ...options.headers };
  if (body !== undefined && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
  if (contentType) headers['Content-Type'] = contentType;
  if (requiresAuth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const url = `${(options.baseUrl ?? getApiBaseUrl()).replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}`;
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: rawBody ?? (body !== undefined ? JSON.stringify(body) : undefined),
      signal: options.signal,
    });
  } catch (cause) {
    if (options.signal?.aborted) throw cause;
    throw new ApiNetworkError();
  }

  let raw: unknown;
  try {
    raw = await response.json();
  } catch {
    throw new ApiNetworkError(`HTTP ${response.status} 响应不是合法 JSON`);
  }
  const result = parseResponse(raw, parseData);
  if (requiresAuth && (
    result.code === ApiCode.TOKEN_MISSING ||
    result.code === ApiCode.TOKEN_INVALID ||
    result.code === ApiCode.TOKEN_EXPIRED
  )) {
    notifyUnauthorized();
  }
  return result;
}

export interface DownloadedFile {
  blob: Blob;
  fileName: string;
}

export async function downloadFile(endpoint: string, fallbackName: string, method: 'GET' | 'POST' = 'GET'): Promise<DownloadedFile> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const url = `${getApiBaseUrl().replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}`;
  let response: Response;
  try {
    response = await fetch(url, { method, headers });
  } catch {
    throw new ApiNetworkError();
  }

  if (!response.ok) {
    let raw: unknown;
    try {
      raw = await response.json();
    } catch {
      throw new ApiNetworkError(`HTTP ${response.status} 下载失败`);
    }
    const result = parseResponse(raw, (value: unknown) => value);
    if (result.code === ApiCode.TOKEN_MISSING || result.code === ApiCode.TOKEN_INVALID || result.code === ApiCode.TOKEN_EXPIRED) {
      notifyUnauthorized();
    }
    throw new ApiNetworkError(result.msg);
  }

  const disposition = response.headers.get('Content-Disposition') ?? '';
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(disposition)?.[1];
  const plain = /filename="?([^";]+)"?/i.exec(disposition)?.[1];
  let fileName = fallbackName;
  try {
    fileName = encoded ? decodeURIComponent(encoded) : plain ?? fallbackName;
  } catch {
    fileName = fallbackName;
  }
  fileName = fileName.replace(/[\\/]/g, '_');
  return { blob: await response.blob(), fileName };
}
