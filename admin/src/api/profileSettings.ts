import { request } from './client';
import { isOptionalString, isRecord } from './decoders';
import type { ApiResponse } from './types';

export interface ProfilePrinciple {
  index: string;
  title: string;
  body: string;
}

export interface ProfileSettingsData {
  site: {
    brandName: string;
    brandEn: string;
    domainLabel: string;
    title: string;
    description: string;
    keywords: string[];
    url: string;
    ogImage: string;
    ogImageFileId: string | null;
  };
  footer: {
    years: string;
    owner: string;
    domain: string;
    domainHref: string;
    icpNumber: string;
    icpHref: string;
  };
  about: {
    authorName: string;
    authorRole: string;
    location: string;
    email: string;
    bio: string;
    principles: ProfilePrinciple[];
  };
}

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function parseProfileSettings(value: unknown): ProfileSettingsData {
  if (!isRecord(value) || !isRecord(value.site) || !isRecord(value.footer) || !isRecord(value.about)) {
    throw new Error('主页配置格式异常');
  }
  const { site, footer, about } = value;
  if (!isOptionalString(site.ogImageFileId ?? null)) {
    throw new Error('主页配置图片标识异常');
  }
  const keywords = Array.isArray(site.keywords)
    ? site.keywords.filter((item): item is string => typeof item === 'string')
    : [];
  const principles = Array.isArray(about.principles)
    ? about.principles.filter(isRecord).map((p) => ({
      index: str(p.index),
      title: str(p.title),
      body: str(p.body),
    }))
    : [];

  return {
    site: {
      brandName: str(site.brandName),
      brandEn: str(site.brandEn),
      domainLabel: str(site.domainLabel),
      title: str(site.title),
      description: str(site.description),
      keywords,
      url: str(site.url),
      ogImage: str(site.ogImage),
      ogImageFileId: (site.ogImageFileId as string | null | undefined) ?? null,
    },
    footer: {
      years: str(footer.years),
      owner: str(footer.owner),
      domain: str(footer.domain),
      domainHref: str(footer.domainHref),
      icpNumber: str(footer.icpNumber),
      icpHref: str(footer.icpHref),
    },
    about: {
      authorName: str(about.authorName),
      authorRole: str(about.authorRole),
      location: str(about.location),
      email: str(about.email),
      bio: str(about.bio),
      principles,
    },
  };
}

export function getProfileSettings(signal?: AbortSignal): Promise<ApiResponse<ProfileSettingsData>> {
  return request('/profile-settings', parseProfileSettings, { signal });
}

export function updateProfileSettings(payload: ProfileSettingsData): Promise<ApiResponse<ProfileSettingsData>> {
  return request('/profile-settings', parseProfileSettings, { method: 'PUT', body: payload });
}
