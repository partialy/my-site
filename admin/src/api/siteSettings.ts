import { getPublicApiBaseUrl, request } from './client';
import type { ApiResponse } from './types';

export type SiteTarget = 'admin' | 'client';

export interface SiteIdentity {
  siteTitle: string;
  systemName: string;
  iconUrl: string | null;
}

export interface SiteSettings {
  projectName: string;
  copyright: string;
  admin: SiteIdentity;
  client: SiteIdentity;
  loginAppearance: LoginAppearance;
}

export interface LoginAppearanceInput {
  backgroundMode: 'solid' | 'gradient' | 'image';
  solidColor: string;
  gradientStartColor: string;
  gradientEndColor: string;
  gradientDirection: number;
  backgroundFileId: string | null;
  cardOpacity: number;
}

export interface LoginAppearance extends LoginAppearanceInput {
  backgroundUrl: string | null;
}

export interface SiteSettingsInput {
  projectName?: string;
  copyright: string;
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
  const apiBase = getPublicApiBaseUrl().replace(/\/+$/, '');
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
  if (typeof item.projectName !== 'string' || typeof item.copyright !== 'string') {
    throw new Error('项目名称或版权信息格式异常');
  }
  return { projectName: item.projectName, copyright: item.copyright,
    admin: parseIdentity(item.admin), client: parseIdentity(item.client),
    loginAppearance: parseLoginAppearance(item.loginAppearance) };
}

function parseLoginAppearance(value: unknown): LoginAppearance {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error('登录外观格式异常');
  const item = value as Record<string, unknown>;
  if (!['solid', 'gradient', 'image'].includes(String(item.backgroundMode)) ||
    typeof item.solidColor !== 'string' || typeof item.gradientStartColor !== 'string' ||
    typeof item.gradientEndColor !== 'string' || typeof item.gradientDirection !== 'number' ||
    (item.backgroundFileId !== null && typeof item.backgroundFileId !== 'string') ||
    (item.backgroundUrl !== null && typeof item.backgroundUrl !== 'string') ||
    typeof item.cardOpacity !== 'number') throw new Error('登录外观格式异常');
  const apiBase = getPublicApiBaseUrl().replace(/\/+$/, '');
  const url = item.backgroundUrl as string | null;
  return {
    backgroundMode: item.backgroundMode as LoginAppearance['backgroundMode'],
    solidColor: item.solidColor, gradientStartColor: item.gradientStartColor,
    gradientEndColor: item.gradientEndColor, gradientDirection: item.gradientDirection,
    backgroundFileId: item.backgroundFileId as string | null,
    backgroundUrl: url?.startsWith('/api/v1/') ? `${apiBase}${url.slice('/api/v1'.length)}` : url,
    cardOpacity: item.cardOpacity,
  };
}

export const defaultLoginAppearance: LoginAppearance = {
  backgroundMode: 'solid', solidColor: '#f4f7fc', gradientStartColor: '#e9f0ff',
  gradientEndColor: '#f8fafc', gradientDirection: 135, backgroundFileId: null,
  backgroundUrl: null, cardOpacity: 95,
};

export const defaultSiteSettings: SiteSettings = {
  projectName: 'NodeBase',
  copyright: `NodeBase Admin © ${new Date().getFullYear()} · 可复制的轻量管理端基础框架`,
  admin: { siteTitle: 'NodeBase Admin', systemName: 'NodeBase Admin', iconUrl: null },
  client: { siteTitle: 'NodeBase Client', systemName: 'NodeBase Client', iconUrl: null },
  loginAppearance: defaultLoginAppearance,
};

export function getSiteSettings(): Promise<ApiResponse<SiteSettings>> {
  return request('/site-settings', parseSettings, { requiresAuth: false });
}

export function updateSiteSettings(input: SiteSettingsInput): Promise<ApiResponse<SiteSettings>> {
  return request('/site-settings', parseSettings, { method: 'PUT', body: input });
}

export function updateLoginAppearance(input: LoginAppearanceInput): Promise<ApiResponse<SiteSettings>> {
  return request('/site-settings/login-appearance', parseSettings, { method: 'PUT', body: input });
}

export function uploadSiteIcon(target: SiteTarget, file: File): Promise<ApiResponse<SiteSettings>> {
  const contentType = file.name.toLowerCase().endsWith('.ico') ? 'image/x-icon' : file.type;
  return request(`/site-settings/${target}/icon`, parseSettings, {
    method: 'PUT', rawBody: file, contentType,
  });
}

export function selectSiteIcon(target: SiteTarget, fileId: string): Promise<ApiResponse<SiteSettings>> {
  return request(`/site-settings/${target}/icon-file`, parseSettings, {
    method: 'PUT', body: { fileId },
  });
}

export function deleteSiteIcon(target: SiteTarget): Promise<ApiResponse<SiteSettings>> {
  return request(`/site-settings/${target}/icon`, parseSettings, { method: 'DELETE' });
}
