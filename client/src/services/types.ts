export type WorkIconKey =
  | "orbit"
  | "feather"
  | "audio"
  | "layers"
  | "box"
  | "aperture";

export type WorkPlatform = "PC" | "Web" | "Android";

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

/**
 * 作品展示数据模型（同时保留 uuid 与 slug，兼顾管理端主键规范与前台 SEO）。
 */
export interface WorkItem {
  /** 对外资源标识（32 位无连字符 UUID v4） */
  uuid: string;
  id: string;
  /** 前台语义化路由标识 */
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
  iconImage?: string;
  heroImage: string;
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
  updatedAt: string;
}

/**
 * 站点基础与 SEO 配置（后续可由后台站点/主页配置接口返回）。
 */
export interface SiteProfile {
  brandName: string;
  brandEn: string;
  domainLabel: string;
  title: string;
  description: string;
  keywords: string[];
  url: string;
  ogImage: string;
  siteIconUrl?: string | null;
  authorName: string;
  authorRole: string;
}

/**
 * 页脚版权与备案配置（后续可由后台配置接口返回）。
 */
export interface SiteFooterConfig {
  years: string;
  owner: string;
  domain: string;
  domainHref: string;
  icpNumber: string;
  icpHref: string;
}

/**
 * 首页展厅交互配置（由后台主页配置控制）。
 */
export interface ShowcaseAutoRotateConfig {
  autoRotateEnabled: boolean;
  autoRotateIntervalSec: number;
}

export interface AboutPrinciple {
  index: string;
  title: string;
  body: string;
}

/**
 * 「关于作者」页面展示数据（后续可由后台个人资料接口返回）。
 */
export interface AboutProfile {
  authorName: string;
  authorRole: string;
  location: string;
  email: string;
  bio: string;
  principles: AboutPrinciple[];
  worksCount: number;
}

export interface WorkDetailResult {
  work: WorkItem;
  prevWork: WorkItem;
  nextWork: WorkItem;
}
