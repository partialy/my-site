import { MOCK_ABOUT_PROFILE, MOCK_WORKS } from "./mockData";
import { fetchPortfolioProfile } from "./siteService";
import type { AboutProfile } from "./types";

/**
 * 获取「关于作者」页面展示数据（GET /api/v1/portfolio/profile）。
 */
export async function getAboutPageData(): Promise<AboutProfile> {
  const remote = await fetchPortfolioProfile();
  if (remote?.about) {
    return remote.about;
  }
  return {
    ...MOCK_ABOUT_PROFILE,
    worksCount: MOCK_WORKS.length,
  };
}
