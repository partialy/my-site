import { cache } from "react";
import { requestApi } from "@/lib/api/client";
import { fetchPublicSiteSettings } from "@/lib/api/site";
import { MOCK_SITE_FOOTER, MOCK_SITE_PROFILE } from "./mockData";
import type {
  AboutProfile,
  ShowcaseAutoRotateConfig,
  SiteFooterConfig,
  SiteProfile,
} from "./types";

export const DEFAULT_SHOWCASE_CONFIG: ShowcaseAutoRotateConfig = {
  autoRotateEnabled: true,
  autoRotateIntervalSec: 5,
};

export interface ServerPortfolioProfileResponse {
  site: SiteProfile;
  footer: SiteFooterConfig;
  about: AboutProfile;
  showcase?: ShowcaseAutoRotateConfig;
}

/**
 * 从服务端拉取完整的个人主页聚合配置（同一次渲染内自动去重）；后端不可用时返回 null 以便安全降级。
 */
export const fetchPortfolioProfile = cache(
  async (): Promise<ServerPortfolioProfileResponse | null> => {
    try {
      return await requestApi<ServerPortfolioProfileResponse>(
        "/portfolio/profile",
        { cache: "no-store" }
      );
    } catch {
      return null;
    }
  }
);

/**
 * 获取站点基础信息与 SEO 元数据配置：
 * 优先融合「外观设置」中的前台网站名称、标签页标题与站点图标。
 */
export async function getSiteProfile(): Promise<SiteProfile> {
  const [remoteProfile, remoteSettings] = await Promise.all([
    fetchPortfolioProfile(),
    fetchPublicSiteSettings(),
  ]);

  const baseSite = remoteProfile?.site ?? MOCK_SITE_PROFILE;
  const clientSystemName = remoteSettings?.client.systemName?.trim();
  const clientSiteTitle = remoteSettings?.client.siteTitle?.trim();
  const clientIconUrl = remoteSettings?.client.iconUrl ?? null;

  return {
    ...baseSite,
    brandName: clientSystemName || baseSite.brandName,
    title: clientSiteTitle || baseSite.title,
    siteIconUrl: clientIconUrl,
  };
}

/**
 * 获取站点底部版权与备案信息配置。
 */
export async function getSiteFooterConfig(): Promise<SiteFooterConfig> {
  const remote = await fetchPortfolioProfile();
  return remote?.footer ?? MOCK_SITE_FOOTER;
}

/**
 * 获取首页展厅自动轮播配置。
 */
export async function getShowcaseConfig(): Promise<ShowcaseAutoRotateConfig> {
  const remote = await fetchPortfolioProfile();
  return remote?.showcase ?? DEFAULT_SHOWCASE_CONFIG;
}
