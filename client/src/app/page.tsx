import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { ShowcaseDeck } from "@/components/showcase/ShowcaseDeck";
import {
  getHomeShowcaseWorks,
  resolveInitialWorkIndex,
} from "@/services/showcaseService";
import {
  getShowcaseConfig,
  getSiteFooterConfig,
  getSiteProfile,
} from "@/services/siteService";

interface HomePageProps {
  searchParams?: Promise<{ work?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const [resolvedParams, works, site, footer, showcase] = await Promise.all([
    searchParams ?? Promise.resolve(undefined),
    getHomeShowcaseWorks(),
    getSiteProfile(),
    getSiteFooterConfig(),
    getShowcaseConfig(),
  ]);

  const initialWorkIndex = resolveInitialWorkIndex(works, resolvedParams?.work);

  const itemListJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${site.brandName} 精选作品`,
    itemListElement: works.map((work, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "SoftwareApplication",
        name: `${work.name} (${work.enName})`,
        applicationCategory: work.category,
        softwareVersion: work.version,
        description: work.summary,
        url: `${site.url}/works/${work.slug}`,
        image: `${site.url}${work.heroImage}`,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "CNY",
        },
      },
    })),
  };

  if (works.length === 0) {
    return (
      <main className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-6 text-center text-[#f4f5f7]">
        <h1 className="text-2xl font-semibold tracking-tight">{site.brandName}</h1>
        <p className="mt-3 text-sm text-[#9499a6]">暂无配置首页展示作品，请前往管理端开启展示或查看全部作品目录。</p>
        <div className="mt-6 flex gap-3">
          <Link href="/works" className="inline-flex h-10 items-center rounded-full bg-[#f4f5f7] px-5 text-sm font-medium text-[#08090c]">
            浏览全部作品
          </Link>
          <Link href="/about" className="inline-flex h-10 items-center rounded-full border border-white/14 px-5 text-sm font-medium text-[#d6dae4]">
            关于作者
          </Link>
        </div>
      </main>
    );
  }

  return (
    <>
      <JsonLd data={itemListJsonLd} />
      <ShowcaseDeck
        works={works}
        brandName={site.brandName}
        siteIconUrl={site.siteIconUrl}
        domainLabel={site.domainLabel}
        footer={footer}
        showcaseConfig={showcase}
        initialWorkIndex={initialWorkIndex}
      />
      {/* 服务端渲染语义化索引链接，保障搜索引擎收录全部作品页 */}
      <nav aria-label="全部作品索引" className="sr-only">
        <ul>
          {works.map((work) => (
            <li key={work.uuid}>
              <a href={`/works/${work.slug}`}>
                {work.name} ({work.enName}) — {work.tagline}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
