import { requestApi } from "@/lib/api/client";
import type { PaginatedData } from "@/lib/api/types";
import { MOCK_WORKS } from "./mockData";
import type { WorkItem } from "./types";
import { mapServerWorkToItem, type ServerWorkDto } from "./workMapper";

/**
 * 获取首页展厅作品列表（GET /api/v1/works?featuredOnly=true&offset=0&limit=20）。
 * 后端未启动或异常时安全降级回本地示例数据，保障首屏可用。
 */
export async function getHomeShowcaseWorks(): Promise<WorkItem[]> {
  try {
    const page = await requestApi<PaginatedData<ServerWorkDto>>("/works", {
      query: { featuredOnly: true, offset: 0, limit: 20 },
      cache: "no-store",
    });
    return page.list.map(mapServerWorkToItem);
  } catch {
    return MOCK_WORKS;
  }
}

/**
 * 根据 URL query `?work=slug` 解析初始展示作品索引。
 */
export function resolveInitialWorkIndex(
  works: WorkItem[],
  slug?: string | null
): number {
  if (!slug || works.length === 0) return 0;
  const idx = works.findIndex((w) => w.slug === slug || w.uuid === slug);
  return idx >= 0 ? idx : 0;
}
