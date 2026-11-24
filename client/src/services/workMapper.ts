import type { WorkItem } from "./types";

export interface ServerWorkDto {
  uuid: string;
  id: string;
  slug: string;
  name: string;
  enName: string;
  shortTitle: string;
  tagline: string;
  summary: string;
  category: string;
  categoryLabel?: string;
  year: string;
  version: string;
  license: string;
  platforms: WorkItem["platforms"];
  accentHex: string;
  iconKey: WorkItem["iconKey"];
  iconImage?: string;
  heroImage: string;
  heroAlt: string;
  links: WorkItem["links"];
  installCommand: string;
  metrics: WorkItem["metrics"];
  highlights: WorkItem["highlights"];
  techStack: WorkItem["techStack"];
  releases: WorkItem["releases"];
  detailIntro: string;
  detailArchitecture: string;
  updatedAt: string;
}

/**
 * 将服务端公开 WorkDto 规范化为前台展示 WorkItem（自动映射字典中文分类名）。
 */
export function mapServerWorkToItem(dto: ServerWorkDto): WorkItem {
  return {
    uuid: dto.uuid,
    id: dto.id || dto.slug,
    slug: dto.slug,
    name: dto.name,
    enName: dto.enName,
    shortTitle: dto.shortTitle,
    tagline: dto.tagline,
    summary: dto.summary,
    category: dto.categoryLabel || dto.category,
    year: dto.year,
    version: dto.version,
    license: dto.license,
    platforms: dto.platforms,
    accentHex: dto.accentHex,
    iconKey: dto.iconKey,
    iconImage: dto.iconImage || "",
    heroImage: dto.heroImage,
    heroAlt: dto.heroAlt,
    links: dto.links,
    installCommand: dto.installCommand,
    metrics: dto.metrics,
    highlights: dto.highlights,
    techStack: dto.techStack,
    releases: dto.releases,
    detailIntro: dto.detailIntro,
    detailArchitecture: dto.detailArchitecture,
    updatedAt: dto.updatedAt,
  };
}
