import { request } from './client';
import { buildPageParams, isOptionalString, isRecord, parseNull, parsePageData } from './decoders';
import type { ApiResponse, PageData, PageQuery } from './types';

export type WorkIconKey = 'orbit' | 'feather' | 'audio' | 'layers' | 'box' | 'aperture';
export type WorkPlatform = 'PC' | 'Web' | 'Android';
export type WorkStatus = 'draft' | 'published';

export interface WorkMetric {
  label: string;
  value: string;
  context: string;
}

export interface WorkHighlight {
  index: string;
  title: string;
  description: string;
}

export interface WorkTechLayer {
  layer: string;
  stack: string;
  note: string;
}

export interface WorkRelease {
  version: string;
  date: string;
  summary: string;
}

export interface WorkItem {
  uuid: string;
  id: string;
  slug: string;
  name: string;
  enName: string;
  shortTitle: string;
  tagline: string;
  summary: string;
  category: string;
  categoryLabel: string;
  year: string;
  version: string;
  license: string;
  platforms: WorkPlatform[];
  accentHex: string;
  iconKey: WorkIconKey;
  iconImage: string;
  iconFileId: string | null;
  heroImage: string;
  heroFileId: string | null;
  heroAlt: string;
  links: {
    github: string;
    gitee: string;
    website: string;
  };
  installCommand: string;
  metrics: WorkMetric[];
  highlights: WorkHighlight[];
  techStack: WorkTechLayer[];
  releases: WorkRelease[];
  detailIntro: string;
  detailArchitecture: string;
  featuredHome: boolean;
  status: WorkStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkPayload {
  slug: string;
  name: string;
  enName: string;
  shortTitle: string;
  tagline: string;
  summary: string;
  category: string;
  year: string;
  version: string;
  license: string;
  platforms: WorkPlatform[];
  accentHex: string;
  iconKey: WorkIconKey;
  iconImage: string;
  iconFileId: string | null;
  heroImage: string;
  heroFileId: string | null;
  heroAlt: string;
  githubUrl: string;
  giteeUrl: string;
  websiteUrl: string;
  installCommand: string;
  metrics: WorkMetric[];
  highlights: WorkHighlight[];
  techStack: WorkTechLayer[];
  releases: WorkRelease[];
  detailIntro: string;
  detailArchitecture: string;
  featuredHome: boolean;
  status: WorkStatus;
  sortOrder: number;
}

export interface AdminWorkListQuery extends PageQuery {
  search?: string;
  category?: string;
  status?: WorkStatus;
  featuredHome?: boolean;
}

function parseString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function parseMetrics(value: unknown): WorkMetric[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).map((item) => ({
    label: parseString(item.label),
    value: parseString(item.value),
    context: parseString(item.context),
  }));
}

function parseHighlights(value: unknown): WorkHighlight[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).map((item) => ({
    index: parseString(item.index),
    title: parseString(item.title),
    description: parseString(item.description),
  }));
}

function parseTechStack(value: unknown): WorkTechLayer[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).map((item) => ({
    layer: parseString(item.layer),
    stack: parseString(item.stack),
    note: parseString(item.note),
  }));
}

function parseReleases(value: unknown): WorkRelease[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).map((item) => ({
    version: parseString(item.version),
    date: parseString(item.date),
    summary: parseString(item.summary),
  }));
}

function parseWorkItem(value: unknown): WorkItem {
  if (!isRecord(value) || typeof value.uuid !== 'string' || typeof value.slug !== 'string' ||
    typeof value.name !== 'string' || !isOptionalString(value.heroFileId) ||
    !isOptionalString(value.iconFileId ?? null)) {
    throw new Error('作品数据格式异常');
  }
  const linksRaw = isRecord(value.links) ? value.links : {};
  const platformsRaw = Array.isArray(value.platforms)
    ? value.platforms.filter((p): p is WorkPlatform => p === 'PC' || p === 'Web' || p === 'Android')
    : ['Web' as WorkPlatform];

  return {
    uuid: value.uuid,
    id: parseString(value.id, value.slug),
    slug: value.slug,
    name: value.name,
    enName: parseString(value.enName),
    shortTitle: parseString(value.shortTitle, value.name),
    tagline: parseString(value.tagline),
    summary: parseString(value.summary),
    category: parseString(value.category),
    categoryLabel: parseString(value.categoryLabel, parseString(value.category)),
    year: parseString(value.year),
    version: parseString(value.version),
    license: parseString(value.license),
    platforms: platformsRaw.length > 0 ? platformsRaw : ['Web'],
    accentHex: parseString(value.accentHex, '#E5A93C'),
    iconKey: (typeof value.iconKey === 'string' ? value.iconKey : 'orbit') as WorkIconKey,
    iconImage: parseString(value.iconImage),
    iconFileId: (value.iconFileId as string | null | undefined) ?? null,
    heroImage: parseString(value.heroImage),
    heroFileId: value.heroFileId,
    heroAlt: parseString(value.heroAlt),
    links: {
      github: parseString(linksRaw.github),
      gitee: parseString(linksRaw.gitee),
      website: parseString(linksRaw.website),
    },
    installCommand: parseString(value.installCommand),
    metrics: parseMetrics(value.metrics),
    highlights: parseHighlights(value.highlights),
    techStack: parseTechStack(value.techStack),
    releases: parseReleases(value.releases),
    detailIntro: parseString(value.detailIntro),
    detailArchitecture: parseString(value.detailArchitecture),
    featuredHome: Boolean(value.featuredHome),
    status: value.status === 'draft' ? 'draft' : 'published',
    sortOrder: typeof value.sortOrder === 'number' ? value.sortOrder : 0,
    createdAt: parseString(value.createdAt),
    updatedAt: parseString(value.updatedAt),
  };
}

export function getAdminWorks(query: AdminWorkListQuery, signal?: AbortSignal): Promise<ApiResponse<PageData<WorkItem>>> {
  const params = buildPageParams(query);
  if (query.search) params.set('search', query.search);
  if (query.category) params.set('category', query.category);
  if (query.status) params.set('status', query.status);
  if (query.featuredHome !== undefined) params.set('featuredHome', String(query.featuredHome));
  return request(`/works?${params.toString()}`, (value) => parsePageData(value, parseWorkItem, '作品列表格式异常'), { signal });
}

export function getAdminWorkDetail(uuid: string): Promise<ApiResponse<WorkItem>> {
  return request(`/works/${encodeURIComponent(uuid)}`, parseWorkItem);
}

export function createAdminWork(payload: WorkPayload): Promise<ApiResponse<WorkItem>> {
  return request('/works', parseWorkItem, { method: 'POST', body: payload });
}

export function updateAdminWork(uuid: string, payload: WorkPayload): Promise<ApiResponse<WorkItem>> {
  return request(`/works/${encodeURIComponent(uuid)}`, parseWorkItem, { method: 'PUT', body: payload });
}

export function deleteAdminWork(uuid: string): Promise<ApiResponse<null>> {
  return request(`/works/${encodeURIComponent(uuid)}`, parseNull, { method: 'DELETE' });
}

export function reorderAdminWorks(items: Array<{ uuid: string; sortOrder: number; featuredHome?: boolean }>): Promise<ApiResponse<null>> {
  return request('/works/reorder', parseNull, { method: 'PUT', body: { items } });
}
