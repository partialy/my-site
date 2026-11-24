/**
 * 站点 SEO 基础配置与 URL 辅助工具。
 */
export const SEO_DEFAULTS = {
  siteName: "MySite",
  title: "个人主页 · 作品展示与提供",
  description:
    "个人开发者主页与作品集，展示全栈开发项目、开源工具、技术实践并支持作品在线体验与下载。",
  keywords: [
    "个人主页",
    "作品集",
    "全栈开发",
    "开源项目",
    "Next.js",
    "TypeScript",
  ],
  authorName: "Partial",
  locale: "zh_CN",
} as const;

/**
 * 获取站点规范根地址（确保末尾无多余斜杠）。
 */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";
  return raw.replace(/\/+$/, "");
}

/**
 * 构造页面规范 Canonical URL。
 */
export function buildCanonicalUrl(path = "/"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalized}`;
}
