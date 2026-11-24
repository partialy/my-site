/**
 * 服务端统一 API 响应结构（对齐 server/api-docs/index.md）。
 */
export interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
  success: boolean;
}

/**
 * 参数校验失败（code = 1001）时的字段错误信息。
 */
export interface ValidationErrorData {
  fieldErrors?: Record<string, string[]>;
}

/**
 * 统一分页请求参数（禁止使用 page / pageSize）。
 */
export interface PaginationParams {
  offset?: number;
  limit?: number;
}

/**
 * 统一分页响应结构（对齐根目录 AGENTS.md）。
 */
export interface PaginatedData<T> {
  list: T[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}

/**
 * 公开站点设置（GET /api/v1/site-settings）。
 */
export interface PublicSiteSettings {
  projectName: string;
  copyright: string;
  admin: {
    siteTitle: string;
    systemName: string;
    iconUrl: string | null;
  };
  client: {
    siteTitle: string;
    systemName: string;
    iconUrl: string | null;
  };
}

/**
 * 公开数据字典子项。
 */
export interface PublicDictionaryItem {
  uuid: string;
  label: string;
  value: string;
  sort: number;
  enabled: boolean;
  color?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * 公开数据字典分组。
 */
export interface PublicDictionaryGroup {
  code: string;
  name: string;
  items: PublicDictionaryItem[];
}
