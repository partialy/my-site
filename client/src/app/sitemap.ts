import type { MetadataRoute } from "next";
import { getSiteProfile } from "@/services/siteService";
import { getAllWorkSlugs } from "@/services/workDetailService";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [site, works] = await Promise.all([
    getSiteProfile(),
    getAllWorkSlugs(),
  ]);
  const baseUrl = site.url.replace(/\/+$/, "");
  const lastModified = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/works`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  const workRoutes: MetadataRoute.Sitemap = works.map((work) => ({
    url: `${baseUrl}/works/${work.slug}`,
    lastModified: new Date(work.updatedAt),
    changeFrequency: "monthly",
    priority: 0.85,
  }));

  return [...staticRoutes, ...workRoutes];
}
