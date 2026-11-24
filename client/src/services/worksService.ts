import { requestApi } from "@/lib/api/client";
import type { PaginatedData } from "@/lib/api/types";
import { filterWorks } from "@/lib/showcase/searchWorks";
import { MOCK_WORKS } from "./mockData";
import type { WorkItem } from "./types";
import { mapServerWorkToItem, type ServerWorkDto } from "./workMapper";

export interface WorksDirectoryQuery {
  category?: string;
  query?: string;
  offset?: number;
  limit?: number;
}

/**
 * 获取「全部作品」目录数据（GET /api/v1/works）。
 * 严格遵循全局 offset / limit 分页规范；后端未启动时自动降级为本地模拟数据。
 */
export async function getWorksDirectory(
  params: WorksDirectoryQuery = {}
): Promise<{ list: WorkItem[]; total: number; categories: string[] }> {
  const offset = Math.max(0, params.offset ?? 0);
  const limit = Math.min(100, Math.max(1, params.limit ?? 100));

  try {
    const page = await requestApi<PaginatedData<ServerWorkDto>>("/works", {
      query: { offset, limit },
      cache: "no-store",
    });
    const allWorks = page.list.map(mapServerWorkToItem);
    const categories = [
      "全部",
      ...Array.from(new Set(allWorks.map((w) => w.category))),
    ];
    const filtered = filterWorks(allWorks, {
      category: params.category,
      query: params.query,
    });
    return {
      list: filtered,
      total: filtered.length,
      categories,
    };
  } catch {
    const categories = [
      "全部",
      ...Array.from(new Set(MOCK_WORKS.map((w) => w.category))),
    ];
    const filtered = filterWorks(MOCK_WORKS, {
      category: params.category,
      query: params.query,
    });
    return {
      list: filtered.slice(offset, offset + limit),
      total: filtered.length,
      categories,
    };
  }
}
