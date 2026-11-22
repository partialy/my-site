import { request } from './client';
import { isRecord } from './decoders';
import type { ApiResponse } from './types';

export type ApiDocAudience = 'admin' | 'client';
export type ApiDocMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface ApiDocEndpoint {
  title: string;
  method: ApiDocMethod;
  path: string;
  auth: boolean;
  authText: string;
  docPath: string;
}

export interface ApiDocGroup {
  audience: ApiDocAudience;
  module: string;
  endpoints: ApiDocEndpoint[];
}

export interface ApiDocCatalog {
  overviewMarkdown: string;
  groups: ApiDocGroup[];
  total: number;
}

export interface ApiDocDetail extends ApiDocEndpoint {
  audience: ApiDocAudience;
  module: string;
  content: string;
}

export interface ApiDocExport {
  filename: string;
  content: string;
}

function parseEndpoint(value: unknown): ApiDocEndpoint {
  if (!isRecord(value) || typeof value.title !== 'string' || typeof value.method !== 'string' ||
    typeof value.path !== 'string' || typeof value.auth !== 'boolean' ||
    typeof value.authText !== 'string' || typeof value.docPath !== 'string') {
    throw new Error('接口目录条目格式异常');
  }
  return {
    title: value.title,
    method: value.method as ApiDocMethod,
    path: value.path,
    auth: value.auth,
    authText: value.authText,
    docPath: value.docPath,
  };
}

function parseGroup(value: unknown): ApiDocGroup {
  if (!isRecord(value) || (value.audience !== 'admin' && value.audience !== 'client') ||
    typeof value.module !== 'string' || !Array.isArray(value.endpoints)) {
    throw new Error('接口目录分组格式异常');
  }
  return {
    audience: value.audience,
    module: value.module,
    endpoints: value.endpoints.map(parseEndpoint),
  };
}

function parseCatalog(value: unknown): ApiDocCatalog {
  if (!isRecord(value) || typeof value.overviewMarkdown !== 'string' ||
    !Array.isArray(value.groups) || typeof value.total !== 'number') {
    throw new Error('接口文档目录格式异常');
  }
  return {
    overviewMarkdown: value.overviewMarkdown,
    groups: value.groups.map(parseGroup),
    total: value.total,
  };
}

function parseDetail(value: unknown): ApiDocDetail {
  const endpoint = parseEndpoint(value);
  if (!isRecord(value) || (value.audience !== 'admin' && value.audience !== 'client') ||
    typeof value.module !== 'string' || typeof value.content !== 'string') {
    throw new Error('接口文档详情格式异常');
  }
  return {
    ...endpoint,
    audience: value.audience,
    module: value.module,
    content: value.content,
  };
}

function parseExport(value: unknown): ApiDocExport {
  if (!isRecord(value) || typeof value.filename !== 'string' || typeof value.content !== 'string') {
    throw new Error('接口文档导出数据格式异常');
  }
  return { filename: value.filename, content: value.content };
}

export function getApiDocsCatalog(search?: string, signal?: AbortSignal): Promise<ApiResponse<ApiDocCatalog>> {
  const params = new URLSearchParams();
  if (search?.trim()) params.set('search', search.trim());
  const query = params.toString();
  return request(`/api-docs${query ? `?${query}` : ''}`, parseCatalog, { signal });
}

export function getApiDocDetail(docPath: string, signal?: AbortSignal): Promise<ApiResponse<ApiDocDetail>> {
  const params = new URLSearchParams({ docPath });
  return request(`/api-docs/detail?${params.toString()}`, parseDetail, { signal });
}

export function exportApiDocs(): Promise<ApiResponse<ApiDocExport>> {
  return request('/api-docs/export', parseExport);
}
