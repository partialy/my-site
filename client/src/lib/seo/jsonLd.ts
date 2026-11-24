import type { WorkItem } from "@/services/types";
import { buildCanonicalUrl, getSiteUrl, SEO_DEFAULTS } from "./config";

/**
 * 生成个人主页（WebSite + Person）结构化数据。
 */
export function buildWebSiteJsonLd(options: {
  siteName: string;
  description: string;
  authorName?: string;
  authorRole?: string;
  url?: string;
}) {
  const siteUrl = options.url || getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: options.siteName,
    url: siteUrl,
    description: options.description,
    inLanguage: "zh-CN",
    author: {
      "@type": "Person",
      name: options.authorName || SEO_DEFAULTS.authorName,
      ...(options.authorRole ? { jobTitle: options.authorRole } : {}),
      url: siteUrl,
    },
  };
}

/**
 * 生成作品详情页（SoftwareApplication）结构化数据。
 */
export function buildSoftwareWorkJsonLd(options: {
  work: WorkItem;
  authorName: string;
  siteUrl?: string;
}) {
  const { work, authorName } = options;
  const baseUrl = (options.siteUrl || getSiteUrl()).replace(/\/+$/, "");
  const url = buildCanonicalUrl(`/works/${work.slug}`);

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `${work.name} (${work.enName})`,
    applicationCategory: work.category,
    softwareVersion: work.version,
    license: work.license,
    description: work.summary,
    url,
    image: `${baseUrl}${work.heroImage}`,
    author: {
      "@type": "Person",
      name: authorName,
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "CNY",
    },
  };
}
