import { getApiBaseUrl, request } from './client';
import type { ApiResponse } from './types';

export type SiteTarget = 'admin' | 'client';

export interface SiteIdentity {
  siteTitle: string;
  systemName: string;
  iconUrl: string | null;
}

export interface SiteSettings {
  admin: SiteIdentity;
  client: SiteIdentity;
}

export interface SiteSettingsInput {
  admin: Pick<SiteIdentity, 'siteTitle' | 'systemName'>;
  client: Pick<SiteIdentity, 'siteTitle' | 'systemName'>;
}

function parseIdentity(value: unknown): SiteIdentity {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('网站信息格式异常');
  }
  const item = value as Record<string, unknown>;
  if (typeof item.siteTitle !== 'string' || typeof item.systemName !== 'string' ||
    (item.iconUrl !== null && typeof item.iconUrl !== 'string')) {
    throw new Error('网站信息格式异常');
  }
  const iconUrl = item.iconUrl as string | null;
  const apiBase = getApiBaseUrl().replace(/\/+$/, '');
  return {
    siteTitle: item.siteTitle,
    systemName: item.systemName,
    iconUrl: iconUrl?.startsWith('/api/v1/') ? `${apiBase}${iconUrl.slice('/api/v1'.length)}` : iconUrl,
  };
}

function parseSettings(value: unknown): SiteSettings {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('网站信息格式异常');
  }
  const item = value as Record<string, unknown>;
  return { admin: parseIdentity(item.admin), client: parseIdentity(item.client) };
}

export const defaultSiteSettings: SiteSettings = {
  admin: { siteTitle: 'NodeBase Admin', systemName: 'NodeBase Admin', iconUrl: null },
  client: { siteTitle: 'NodeBase Client', systemName: 'NodeBase Client', iconUrl: null },
};

export function getSiteSettings(): Promise<ApiResponse<SiteSettings>> {
  return request('/site-settings', parseSettings, { requiresAuth: false });
}

export function updateSiteSettings(input: SiteSettingsInput): Promise<ApiResponse<SiteSettings>> {
  return request('/site-settings', parseSettings, { method: 'PUT', body: input });
}

export function uploadSiteIcon(target: SiteTarget, file: File): Promise<ApiResponse<SiteSettings>> {
  const contentType = file.name.toLowerCase().endsWith('.ico') ? 'image/x-icon' : file.type;
  return request(`/site-settings/${target}/icon`, parseSettings, {
    method: 'PUT', rawBody: file, contentType,
  });
}

export function deleteSiteIcon(target: SiteTarget): Promise<ApiResponse<SiteSettings>> {
  return request(`/site-settings/${target}/icon`, parseSettings, { method: 'DELETE' });
}
