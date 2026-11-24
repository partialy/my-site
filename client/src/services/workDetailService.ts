import { ApiError, requestApi } from "@/lib/api/client";
import type { PaginatedData } from "@/lib/api/types";
import { MOCK_WORKS } from "./mockData";
import type { WorkDetailResult } from "./types";
import { mapServerWorkToItem, type ServerWorkDto } from "./workMapper";

interface ServerWorkDetailResponse {
  work: ServerWorkDto;
  prevWork: ServerWorkDto;
  nextWork: ServerWorkDto;
}

/**
 * 按语义化 slug（或兼容 uuid）获取单个作品详情及上下相邻作品（GET /api/v1/works/:slugOrUuid）。
 */
export async function getWorkDetailBySlug(
  slugOrUuid: string
): Promise<WorkDetailResult | null> {
  try {
    const detail = await requestApi<ServerWorkDetailResponse>(
      `/works/${encodeURIComponent(slugOrUuid)}`,
      { cache: "no-store" }
    );
    return {
      work: mapServerWorkToItem(detail.work),
      prevWork: mapServerWorkToItem(detail.prevWork),
      nextWork: mapServerWorkToItem(detail.nextWork),
    };
  } catch (error) {
    if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
      return null;
    }
    const idx = MOCK_WORKS.findIndex(
      (w) => w.slug === slugOrUuid || w.uuid === slugOrUuid
    );
    if (idx < 0) return null;
    const total = MOCK_WORKS.length;
    return {
      work: MOCK_WORKS[idx]!,
      prevWork: MOCK_WORKS[(idx - 1 + total) % total]!,
      nextWork: MOCK_WORKS[(idx + 1) % total]!,
    };
  }
}

/**
 * 获取全部公开作品的 slug 与更新时间（供 generateStaticParams 与 sitemap.xml 使用）。
 */
export async function getAllWorkSlugs(): Promise<
  Array<{ uuid: string; slug: string; updatedAt: string }>
> {
  try {
    const page = await requestApi<PaginatedData<ServerWorkDto>>("/works", {
      query: { offset: 0, limit: 100 },
      cache: "no-store",
    });
    return page.list.map((w) => ({
      uuid: w.uuid,
      slug: w.slug,
      updatedAt: w.updatedAt,
    }));
  } catch {
    return MOCK_WORKS.map((w) => ({
      uuid: w.uuid,
      slug: w.slug,
      updatedAt: w.updatedAt,
    }));
  }
}
