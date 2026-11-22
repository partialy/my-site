import { getPublicApiBaseUrl, request } from './client';
import { buildPageParams, parsePageData } from './decoders';
import type { ApiResponse, PageData, PageQuery } from './types';
import { uploadFile as uploadBrowserFile } from './uploadFile';
import type { UploadedFile } from './uploadFile';

export type FileItem = UploadedFile;

export type FilePage = PageData<FileItem>;

export interface FileQuery extends PageQuery {
  search?: string;
  mimeTypes?: string[];
  sortBy?: 'createdAt' | 'size';
  sortOrder?: 'asc' | 'desc';
  status?: 'active' | 'archived' | 'all';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseFile(value: unknown): FileItem {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.name !== 'string' ||
    typeof value.mimeType !== 'string' || typeof value.size !== 'number' ||
    typeof value.url !== 'string' || typeof value.createdAt !== 'string' ||
    (value.archivedAt !== null && typeof value.archivedAt !== 'string')) {
    throw new Error('文件数据格式异常');
  }
  const apiBase = getPublicApiBaseUrl().replace(/\/+$/, '');
  const rawUrl = value.url.startsWith('/api/v1/')
    ? `${apiBase}${value.url.slice('/api/v1'.length)}` : value.url;
  const url = new URL(rawUrl, window.location.origin).toString();
  return { id: value.id, name: value.name, mimeType: value.mimeType,
    size: value.size, url, createdAt: value.createdAt, archivedAt: value.archivedAt };
}

function parseFilePage(value: unknown): FilePage {
  return parsePageData(value, parseFile, '文件列表格式异常');
}

function parseEmpty(value: unknown): null {
  if (value !== null) throw new Error('删除文件响应格式异常');
  return null;
}

export function getFiles(query: FileQuery, signal?: AbortSignal): Promise<ApiResponse<FilePage>> {
  const params = buildPageParams(query);
  if (query.search) params.set('search', query.search);
  if (query.mimeTypes?.length) params.set('mimeTypes', query.mimeTypes.join(','));
  if (query.sortBy) params.set('sortBy', query.sortBy);
  if (query.sortOrder) params.set('sortOrder', query.sortOrder);
  if (query.status) params.set('status', query.status);
  return request(`/files?${params.toString()}`, parseFilePage, { signal });
}

export async function uploadFile(file: File): Promise<ApiResponse<FileItem>> {
  const data = await uploadBrowserFile(file, { apiBaseUrl: getPublicApiBaseUrl() });
  return { code: 0, msg: '文件已上传', data, success: true };
}

export function archiveFile(id: string): Promise<ApiResponse<null>> {
  return request(`/files/${encodeURIComponent(id)}`, parseEmpty, { method: 'DELETE' });
}

export function restoreFile(id: string): Promise<ApiResponse<null>> {
  return request(`/files/${encodeURIComponent(id)}/restore`, parseEmpty, { method: 'PUT' });
}

export function deleteFilePermanently(id: string): Promise<ApiResponse<null>> {
  return request(`/files/${encodeURIComponent(id)}/permanent`, parseEmpty, { method: 'DELETE' });
}
