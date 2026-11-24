import type { Metadata, Viewport } from "next";
import { VisitTracker } from "@/components/analytics/VisitTracker";
import { JsonLd } from "@/components/seo/JsonLd";
import { CosmicStarfieldCanvas } from "@/components/showcase/CosmicStarfieldCanvas";
import { buildWebSiteJsonLd } from "@/lib/seo/jsonLd";
import { getSiteProfile } from "@/services/siteService";
import "@fontsource/plus-jakarta-sans/400.css";
import "@fontsource/plus-jakarta-sans/500.css";
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/plus-jakarta-sans/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/600.css";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#08090c",
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteProfile();

  return {
    metadataBase: new URL(site.url),
    title: {
      default: site.title,
      template: `%s — ${site.brandName}`,
    },
    description: site.description,
    keywords: site.keywords,
    authors: [{ name: site.authorName, url: site.url }],
    creator: site.authorName,
    alternates: {
      canonical: "/",
    },
    openGraph: {
      type: "website",
      locale: "zh_CN",
      url: site.url,
      siteName: site.brandName,
      title: site.title,
      description: site.description,
      images: [
        {
          url: site.ogImage,
          width: 1600,
          height: 900,
          alt: site.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: site.title,
      description: site.description,
      images: [site.ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const site = await getSiteProfile();

  return (
    <html lang="zh-CN">
      <body
        suppressHydrationWarning
        className="relative min-h-dvh bg-[#08090c] text-[#f4f5f7] antialiased"
      >
        <CosmicStarfieldCanvas />
        <JsonLd
          data={buildWebSiteJsonLd({
            siteName: site.brandName,
            description: site.description,
            authorName: site.authorName,
            authorRole: site.authorRole,
            url: site.url,
          })}
        />
        <VisitTracker />
        {children}
      </body>
    </html>
  );
}
