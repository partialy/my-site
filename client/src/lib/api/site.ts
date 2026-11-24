import { requestApi } from "./client";
import type { PublicDictionaryGroup, PublicSiteSettings } from "./types";

export const DEFAULT_SITE_SETTINGS: PublicSiteSettings = {
  projectName: "MySite",
  copyright: "© 2026 MySite · 个人主页与作品集",
  admin: {
    siteTitle: "MySite Admin",
    systemName: "MySite Admin",
    iconUrl: null,
  },
  client: {
    siteTitle: "个人主页 · 作品展示与提供",
    systemName: "MySite",
    iconUrl: null,
  },
};

/**
 * 获取公开站点设置（GET /api/v1/site-settings）。
 * 服务端不可用时自动降级返回默认配置，保证 SSR 首屏与构建不中断。
 */
export async function getPublicSiteSettings(): Promise<PublicSiteSettings> {
  try {
    return await requestApi<PublicSiteSettings>("/site-settings", {
      next: { revalidate: 60 },
    });
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}

/**
 * 批量获取公开数据字典选项（GET /api/v1/dictionaries）。
 */
export async function getPublicDictionaries(
  codes: string[]
): Promise<Record<string, PublicDictionaryGroup>> {
  if (codes.length === 0) return {};
  try {
    return await requestApi<Record<string, PublicDictionaryGroup>>(
      "/dictionaries",
      {
        query: { codes: codes.join(",") },
        next: { revalidate: 60 },
      }
    );
  } catch {
    return {};
  }
}
