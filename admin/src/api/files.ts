import { getPublicApiBaseUrl, request } from './client';
import type { ApiResponse } from './types';

export interface FileItem {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
}

export interface FilePage {
  items: FileItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface FileQuery {
  page: number;
  pageSize: number;
  search?: string;
  mimeTypes?: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseFile(value: unknown): FileItem {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.name !== 'string' ||
    typeof value.mimeType !== 'string' || typeof value.size !== 'number' ||
    typeof value.url !== 'string' || typeof value.createdAt !== 'string') {
    throw new Error('文件数据格式异常');
  }
  const apiBase = getPublicApiBaseUrl().replace(/\/+$/, '');
  const url = value.url.startsWith('/api/v1/')
    ? `${apiBase}${value.url.slice('/api/v1'.length)}` : value.url;
  return { id: value.id, name: value.name, mimeType: value.mimeType,
    size: value.size, url, createdAt: value.createdAt };
}

function parseFilePage(value: unknown): FilePage {
  if (!isRecord(value) || !Array.isArray(value.items) || typeof value.total !== 'number' ||
    typeof value.page !== 'number' || typeof value.pageSize !== 'number') {
    throw new Error('文件列表格式异常');
  }
  return { items: value.items.map(parseFile), total: value.total,
    page: value.page, pageSize: value.pageSize };
}

function parseEmpty(value: unknown): null {
  if (value !== null) throw new Error('删除文件响应格式异常');
  return null;
}

export function getFiles(query: FileQuery): Promise<ApiResponse<FilePage>> {
  const params = new URLSearchParams({ page: String(query.page), pageSize: String(query.pageSize) });
  if (query.search) params.set('search', query.search);
  if (query.mimeTypes?.length) params.set('mimeTypes', query.mimeTypes.join(','));
  return request(`/files?${params.toString()}`, parseFilePage);
}

export function uploadFile(file: File): Promise<ApiResponse<FileItem>> {
  const contentType = file.name.toLowerCase().endsWith('.ico') ? 'image/x-icon'
    : file.type || 'application/octet-stream';
  return request('/files', parseFile, { method: 'POST', rawBody: file,
    contentType,
    headers: { 'X-File-Name': encodeURIComponent(file.name) } });
}

export function archiveFile(id: string): Promise<ApiResponse<null>> {
  return request(`/files/${encodeURIComponent(id)}`, parseEmpty, { method: 'DELETE' });
}
