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
    icons: site.siteIconUrl
      ? {
          icon: site.siteIconUrl,
          shortcut: site.siteIconUrl,
          apple: site.siteIconUrl,
        }
      : {
          icon: [
            { url: "/mysite-icon-dark_round.ico", sizes: "any" },
            { url: "/mysite-icon-dark_round_16x16.webp", sizes: "16x16", type: "image/webp" },
            { url: "/mysite-icon-dark_round_24x24.webp", sizes: "24x24", type: "image/webp" },
            { url: "/mysite-icon-dark_round_32x32.webp", sizes: "32x32", type: "image/webp" },
            { url: "/mysite-icon-dark_round_48x48.webp", sizes: "48x48", type: "image/webp" },
            { url: "/mysite-icon-dark_round_64x64.webp", sizes: "64x64", type: "image/webp" },
            { url: "/mysite-icon-dark_round_128x128.webp", sizes: "128x128", type: "image/webp" },
            { url: "/mysite-icon-dark_round_256x256.webp", sizes: "256x256", type: "image/webp" },
            { url: "/mysite-icon-dark_round_512x512.webp", sizes: "512x512", type: "image/webp" },
            { url: "/mysite-icon-dark_round_1024x1024.webp", sizes: "1024x1024", type: "image/webp" },
          ],
          shortcut: "/mysite-icon-dark_round.ico",
          apple: "/mysite-icon-dark_round_256x256.webp",
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
