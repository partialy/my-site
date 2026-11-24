import type { WorkItem } from "@/services/types";

export interface WorkFilterOptions {
  category?: string;
  query?: string;
}

/**
 * 不区分大小写的多字段作品搜索与分类筛选。
 */
export function filterWorks(
  works: WorkItem[],
  options: WorkFilterOptions
): WorkItem[] {
  const category = options.category?.trim() || "全部";
  const normalizedQuery = (options.query ?? "").trim().toLowerCase();

  return works.filter((work) => {
    if (category !== "全部" && work.category !== category) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
    const haystack = [
      work.name,
      work.enName,
      work.shortTitle,
      work.tagline,
      work.summary,
      work.category,
      work.version,
      work.year,
      work.license,
      work.detailIntro,
      work.detailArchitecture,
      ...work.platforms,
      ...work.highlights.map((h) => `${h.title} ${h.description}`),
      ...work.techStack.map((t) => `${t.layer} ${t.stack} ${t.note}`),
      ...work.releases.map((r) => `${r.version} ${r.summary}`),
    ]
      .join(" ")
      .toLowerCase();

    return tokens.every((token) => haystack.includes(token));
  });
}

/**
 * 构造携带可选搜索关键词的「全部作品」目标链接。
 */
export function buildWorksSearchHref(rawQuery: string): string {
  const trimmed = rawQuery.trim();
  if (!trimmed) {
    return "/works";
  }
  return `/works?q=${encodeURIComponent(trimmed)}`;
}
