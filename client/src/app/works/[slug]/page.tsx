import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, GitBranch, Globe } from "lucide-react";
import { GithubIcon } from "@/components/icons/GithubIcon";
import { JsonLd } from "@/components/seo/JsonLd";
import { SiteFooter } from "@/components/showcase/SiteFooter";
import { SubpageHeader } from "@/components/showcase/SubpageHeader";
import { WorkIcon } from "@/components/showcase/WorkIcon";
import { buildSoftwareWorkJsonLd } from "@/lib/seo/jsonLd";
import { getSiteFooterConfig, getSiteProfile } from "@/services/siteService";
import {
  getAllWorkSlugs,
  getWorkDetailBySlug,
} from "@/services/workDetailService";

interface WorkDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllWorkSlugs();
  return slugs.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: WorkDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const [detail, site] = await Promise.all([
    getWorkDetailBySlug(slug),
    getSiteProfile(),
  ]);

  if (!detail) {
    return { title: "作品未找到" };
  }

  const { work } = detail;

  return {
    title: `${work.name} (${work.enName}) — ${work.tagline}`,
    description: work.summary,
    alternates: {
      canonical: `/works/${work.slug}`,
    },
    openGraph: {
      title: `${work.name} (${work.enName}) — ${site.brandName}`,
      description: work.summary,
      type: "article",
      url: `${site.url}/works/${work.slug}`,
      images: [
        {
          url: work.heroImage,
          width: 1600,
          height: 900,
          alt: work.heroAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${work.name} (${work.enName})`,
      description: work.summary,
      images: [work.heroImage],
    },
  };
}

export default async function WorkDetailPage({ params }: WorkDetailPageProps) {
  const { slug } = await params;
  const [detail, site, footer] = await Promise.all([
    getWorkDetailBySlug(slug),
    getSiteProfile(),
    getSiteFooterConfig(),
  ]);

  if (!detail) {
    notFound();
  }

  const { work, prevWork, nextWork } = detail;

  return (
    <div className="relative z-10 flex min-h-dvh flex-col text-[#f4f5f7]">
      <JsonLd
        data={buildSoftwareWorkJsonLd({
          work,
          authorName: site.authorName,
          siteUrl: site.url,
        })}
      />

      <SubpageHeader
        brandName={site.brandName}
        activePath="detail"
        backHref={`/?work=${work.slug}`}
        backLabel="回到展厅定位"
      />

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-14 lg:py-20">
        <div className="flex items-center gap-3 text-xs text-[#9499a6]">
          <span
            style={{ color: work.accentHex }}
            className="inline-flex items-center gap-1.5 font-medium"
          >
            <WorkIcon
              iconKey={work.iconKey}
              iconImage={work.iconImage}
              alt={work.name}
              className="h-4 w-4"
              imgClassName="h-5 w-5 rounded object-cover"
            />
            <span>{work.category}</span>
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">{work.version}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">{work.year}</span>
          <span aria-hidden="true">·</span>
          <span>{work.license} 开源协议</span>
        </div>

        <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-[#f4f5f7] sm:text-5xl">
          {work.name}
          <span className="ml-3 font-mono text-xl font-normal text-[#878d9c] sm:text-2xl">
            {work.enName}
          </span>
        </h1>

        <p className="mt-4 max-w-3xl text-base leading-relaxed text-[#b2b8c6] sm:text-lg">
          {work.tagline} — {work.summary}
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          {work.links.github.trim() ? (
            <a
              href={work.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-[#f4f5f7] px-5 text-sm font-medium whitespace-nowrap text-[#08090c] transition-colors hover:bg-white"
            >
              <GithubIcon className="h-4 w-4" />
              <span>前往 GitHub</span>
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex h-11 cursor-not-allowed items-center gap-2 rounded-full border border-white/10 bg-[#12151c]/70 px-5 text-sm font-medium whitespace-nowrap text-[#787e8d] opacity-60"
            >
              <GithubIcon className="h-4 w-4" />
              <span>GitHub 暂未提供</span>
            </button>
          )}
          {work.links.gitee.trim() ? (
            <a
              href={work.links.gitee}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-white/14 bg-[#12151c] px-5 text-sm font-medium whitespace-nowrap text-[#e4e7ef] transition-colors hover:border-white/30 hover:text-white"
            >
              <GitBranch className="h-4 w-4" aria-hidden="true" />
              <span>前往 Gitee</span>
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex h-11 cursor-not-allowed items-center gap-2 rounded-full border border-white/10 bg-[#12151c]/70 px-5 text-sm font-medium whitespace-nowrap text-[#787e8d] opacity-60"
            >
              <GitBranch className="h-4 w-4" aria-hidden="true" />
              <span>Gitee 暂未提供</span>
            </button>
          )}
          {work.links.website.trim() ? (
            <a
              href={work.links.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-white/14 bg-[#12151c] px-5 text-sm font-medium whitespace-nowrap text-[#e4e7ef] transition-colors hover:border-white/30 hover:text-white"
            >
              <Globe className="h-4 w-4" aria-hidden="true" />
              <span>前往官网</span>
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex h-11 cursor-not-allowed items-center gap-2 rounded-full border border-white/10 bg-[#12151c]/70 px-5 text-sm font-medium whitespace-nowrap text-[#787e8d] opacity-60"
            >
              <Globe className="h-4 w-4" aria-hidden="true" />
              <span>官网暂未开放</span>
            </button>
          )}
        </div>

        <div className="relative mt-10 aspect-[16/9] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#111319]">
          <Image
            src={work.heroImage}
            alt={work.heroAlt}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 1024px"
            referrerPolicy="no-referrer"
            className="object-cover"
          />
        </div>

        <section
          aria-label="核心性能指标"
          className="mt-12 grid grid-cols-1 gap-6 border-y border-white/8 py-8 sm:grid-cols-3"
        >
          {work.metrics.map((metric) => (
            <div key={metric.label}>
              <div className="font-mono text-2xl font-semibold tabular-nums text-[#f4f5f7]">
                {metric.value}
              </div>
              <div className="mt-1 text-sm font-medium text-[#d2d6e0]">
                {metric.label}
              </div>
              <div className="mt-1 text-xs text-[#848a99]">{metric.context}</div>
            </div>
          ))}
        </section>

        <section className="mt-14 grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h2 className="text-xl font-semibold tracking-tight text-[#f4f5f7]">
              设计缘起与核心能力
            </h2>
            <p className="mt-4 text-sm leading-[1.8] text-[#9fa5b5]">
              {work.detailIntro}
            </p>
          </div>
          <div className="space-y-6 lg:col-span-7">
            {work.highlights.map((item) => (
              <div
                key={item.index}
                className="rounded-2xl border border-white/8 bg-[#0f1117] p-6"
              >
                <div
                  style={{ color: work.accentHex }}
                  className="font-mono text-xs font-medium tabular-nums"
                >
                  {item.index}
                </div>
                <h3 className="mt-2 text-base font-semibold text-[#f4f5f7]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#9ca2b2]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 border-t border-white/8 pt-12">
          <h2 className="text-xl font-semibold tracking-tight text-[#f4f5f7]">
            工程架构与技术栈
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-[1.8] text-[#9fa5b5]">
            {work.detailArchitecture}
          </p>

          <div className="mt-6 divide-y divide-white/8 border-y border-white/8">
            {work.techStack.map((layer) => (
              <div
                key={layer.layer}
                className="grid grid-cols-1 gap-2 py-4 sm:grid-cols-12 sm:items-baseline"
              >
                <div className="text-xs font-medium text-[#8a909e] sm:col-span-4">
                  {layer.layer}
                </div>
                <div className="sm:col-span-8">
                  <div className="font-mono text-sm font-medium text-[#f4f5f7]">
                    {layer.stack}
                  </div>
                  <div className="mt-1 text-xs text-[#8a909e]">
                    {layer.note}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-[#0f1117] p-5">
            <div className="text-xs font-medium text-[#8a909e]">
              快速安装命令
            </div>
            <pre className="mt-2.5 overflow-x-auto font-mono text-sm text-[#f4f5f7]">
              <code>{work.installCommand}</code>
            </pre>
          </div>
        </section>

        <section className="mt-16 border-t border-white/8 pt-12">
          <h2 className="text-xl font-semibold tracking-tight text-[#f4f5f7]">
            版本演进记录
          </h2>
          <div className="mt-6 divide-y divide-white/8 border-y border-white/8">
            {work.releases.map((rel) => (
              <div
                key={rel.version}
                className="grid grid-cols-1 gap-2 py-4 sm:grid-cols-12 sm:items-baseline"
              >
                <div className="flex items-center gap-4 sm:col-span-4">
                  <span
                    style={{ color: work.accentHex }}
                    className="font-mono text-sm font-semibold tabular-nums"
                  >
                    {rel.version}
                  </span>
                  <span className="font-mono text-xs tabular-nums text-[#7e8494]">
                    {rel.date}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-[#b2b8c6] sm:col-span-8">
                  {rel.summary}
                </p>
              </div>
            ))}
          </div>
        </section>

        <nav
          aria-label="上下作品切换"
          className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-white/8 pt-8"
        >
          <Link
            href={`/works/${prevWork.slug}`}
            className="inline-flex items-center gap-2.5 text-sm text-[#a8aebc] transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>上一件：{prevWork.name}</span>
          </Link>
          <Link
            href={`/works/${nextWork.slug}`}
            className="inline-flex items-center gap-2.5 text-sm text-[#a8aebc] transition-colors hover:text-white"
          >
            <span>下一件：{nextWork.name}</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </nav>
      </main>

      <SiteFooter footer={footer} maxWidthClass="max-w-5xl" />
    </div>
  );
}
