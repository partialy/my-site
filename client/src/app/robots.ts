import type { MetadataRoute } from "next";
import { getSiteProfile } from "@/services/siteService";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const site = await getSiteProfile();
  const baseUrl = site.url.replace(/\/+$/, "");

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
