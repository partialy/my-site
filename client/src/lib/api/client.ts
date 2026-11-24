import type { ApiResponse, ValidationErrorData } from "./types";

/**
 * 服务端接口业务异常。
 */
export class ApiError extends Error {
  readonly code: number;
  readonly status: number;
  readonly fieldErrors?: Record<string, string[]>;

  constructor(
    message: string,
    options: {
      code?: number;
      status?: number;
      fieldErrors?: Record<string, string[]>;
    } = {}
  ) {
    super(message);
    this.name = "ApiError";
    this.code = options.code ?? -1;
    this.status = options.status ?? 500;
    this.fieldErrors = options.fieldErrors;
  }
}

export interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Query 参数 */
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Next.js 服务端缓存配置 */
  next?: NextFetchRequestConfig;
}

/**
 * 获取当前运行环境对应的 API 基础地址。
 * - SSR / RSC 服务端直连 `SERVER_INTERNAL_URL`
 * - 浏览器端走同源代理 `NEXT_PUBLIC_API_BASE_URL`（默认 `/api/v1`）
 */
export function getApiBaseUrl(): string {
  if (typeof window === "undefined") {
    const serverOrigin = (
      process.env.SERVER_INTERNAL_URL || "http://127.0.0.1:3000"
    ).replace(/\/+$/, "");
    return `${serverOrigin}/api/v1`;
  }
  return (process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1").replace(
    /\/+$/,
    ""
  );
}

/**
 * 将相对资源路径解析为可访问的完整 URL（用于图片等外部/代理资源）。
 */
export function resolveServerAssetUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  if (typeof window === "undefined") {
    const serverOrigin = (
      process.env.SERVER_INTERNAL_URL || "http://127.0.0.1:3000"
    ).replace(/\/+$/, "");
    return `${serverOrigin}${url.startsWith("/") ? "" : "/"}${url}`;
  }
  return url;
}

function buildUrl(
  path: string,
  query?: Record<string, string | number | boolean | undefined | null>
): string {
  const base = getApiBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const fullUrl = `${base}${normalizedPath}`;

  if (!query) return fullUrl;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `${fullUrl}?${qs}` : fullUrl;
}

/**
 * 统一请求服务端公开接口，自动校验 `{ code, msg, data, success }` 契约。
 */
export async function requestApi<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { query, body, headers, ...init } = options;
  const url = buildUrl(path, query);

  const mergedHeaders = new Headers(headers);
  mergedHeaders.set("Accept", "application/json");
  if (body !== undefined && !mergedHeaders.has("Content-Type")) {
    mergedHeaders.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...init,
    headers: mergedHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let payload: ApiResponse<T | ValidationErrorData>;
  try {
    payload = (await response.json()) as ApiResponse<T | ValidationErrorData>;
  } catch {
    throw new ApiError(`服务端响应解析失败（HTTP ${response.status}）`, {
      status: response.status,
    });
  }

  if (
    typeof payload !== "object" ||
    payload === null ||
    typeof payload.code !== "number" ||
    typeof payload.success !== "boolean"
  ) {
    throw new ApiError("服务端响应格式不符合统一契约", {
      status: response.status,
    });
  }

  if (!response.ok || !payload.success || payload.code !== 0) {
    const errorData = payload.data as ValidationErrorData | null;
    throw new ApiError(payload.msg || "请求失败", {
      code: payload.code,
      status: response.status,
      fieldErrors: errorData?.fieldErrors,
    });
  }

  return payload.data as T;
}
