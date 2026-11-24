import { requestApi } from "@/lib/api/client";
import { MOCK_SITE_FOOTER, MOCK_SITE_PROFILE } from "./mockData";
import type { AboutProfile, SiteFooterConfig, SiteProfile } from "./types";

export interface ServerPortfolioProfileResponse {
  site: SiteProfile;
  footer: SiteFooterConfig;
  about: AboutProfile;
}

/**
 * 从服务端拉取完整的个人主页聚合配置；后端不可用时返回 null 以便安全降级。
 */
export async function fetchPortfolioProfile(): Promise<ServerPortfolioProfileResponse | null> {
  try {
    return await requestApi<ServerPortfolioProfileResponse>(
      "/portfolio/profile",
      { cache: "no-store" }
    );
  } catch {
    return null;
  }
}

/**
 * 获取站点基础信息与 SEO 元数据配置。
 */
export async function getSiteProfile(): Promise<SiteProfile> {
  const remote = await fetchPortfolioProfile();
  return remote?.site ?? MOCK_SITE_PROFILE;
}

/**
 * 获取站点底部版权与备案信息配置。
 */
export async function getSiteFooterConfig(): Promise<SiteFooterConfig> {
  const remote = await fetchPortfolioProfile();
  return remote?.footer ?? MOCK_SITE_FOOTER;
}
