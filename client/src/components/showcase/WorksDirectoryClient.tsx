"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, GitBranch, Globe } from "lucide-react";
import type { SiteFooterConfig, WorkItem } from "@/services/types";
import { buildWorksSearchHref, filterWorks } from "@/lib/showcase/searchWorks";
import { GithubIcon } from "@/components/icons/GithubIcon";
import { PillSearchInput } from "@/components/showcase/PillSearchInput";
import { SiteFooter } from "@/components/showcase/SiteFooter";
import { SubpageHeader } from "@/components/showcase/SubpageHeader";
import { WorkIcon } from "@/components/showcase/WorkIcon";

interface WorksDirectoryClientProps {
  brandName: string;
  footer: SiteFooterConfig;
  works: WorkItem[];
  categories: string[];
  initialQuery?: string;
}

export function WorksDirectoryClient({
  brandName,
  footer,
  works,
  categories,
  initialQuery = "",
}: WorksDirectoryClientProps) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("全部");
  const [query, setQuery] = useState<string>(initialQuery);

  const filtered = useMemo(
    () => filterWorks(works, { category: selectedCategory, query }),
    [works, selectedCategory, query]
  );

  const handleQueryChange = (next: string) => {
    setQuery(next);
    if (!next.trim() && query.trim()) {
      router.replace("/works", { scroll: false });
    }
  };

  const handleQuerySubmit = (submitted: string) => {
    setQuery(submitted);
    router.replace(buildWorksSearchHref(submitted), { scroll: false });
  };

  const handleResetFilters = () => {
    setQuery("");
    setSelectedCategory("全部");
    router.replace("/works", { scroll: false });
  };

  const trimmedQuery = query.trim();

  return (
    <div className="relative z-10 flex min-h-dvh flex-col text-[#f4f5f7]">
      <SubpageHeader
        brandName={brandName}
        activePath="works"
        rightSlot={
          <PillSearchInput
            value={query}
            onChange={handleQueryChange}
            onSubmit={handleQuerySubmit}
            placeholder="搜索"
            inputId="works-directory-search"
          />
        }
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-14 lg:py-20">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium tracking-wide text-[#8f95a3]">
            <span>作品目录</span>
            <span aria-hidden="true" className="text-white/25">
              ·
            </span>
            <span className="font-mono tabular-nums">
              {trimmedQuery
                ? `匹配「${trimmedQuery}」共 ${filtered.length} 件作品`
                : `共 ${works.length} 件开源与独立作品`}
            </span>
            {trimmedQuery && (
              <>
                <span aria-hidden="true" className="text-white/25">
                  ·
                </span>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-[#d6dae4] underline decoration-white/30 underline-offset-4 transition-colors hover:text-white"
                >
                  清除搜索
                </button>
              </>
            )}
          </div>
          <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-[#f4f5f7] sm:text-4xl">
            全部作品索引
          </h1>
        </div>

        <div className="mt-10">
          <div
            role="tablist"
            aria-label="按作品类别筛选"
            className="flex flex-wrap items-center gap-1.5 border-b border-white/8 pb-6"
          >
            {categories.map((cat) => {
              const active = cat === selectedCategory;
              return (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedCategory(cat)}
                  className={`h-9 rounded-lg px-3.5 text-xs font-medium whitespace-nowrap transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${
                    active
                      ? "bg-[#f4f5f7] text-[#08090c]"
                      : "bg-[#111319] text-[#9aa0b0] hover:bg-[#191d26] hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <div className="mt-14 flex flex-col items-center justify-center rounded-2xl border border-white/8 bg-[#0f1117]/70 px-6 py-16 text-center">
              <p className="text-base font-medium text-[#f4f5f7]">
                未找到与「{trimmedQuery || selectedCategory}」相关的作品
              </p>
              <p className="mt-2 text-sm text-[#8f95a3]">
                试试其他关键词（如 Rust、Markdown、Next.js、音频、设计系统）或重置筛选条件。
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-6 inline-flex h-10 items-center rounded-full border border-white/18 bg-[#161922] px-5 text-xs font-medium text-[#f4f5f7] transition-colors hover:border-white/35 hover:bg-[#1e222e]"
              >
                重置筛选与搜索
              </button>
            </div>
          ) : (
            <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2">
              {filtered.map((work) => (
                <article
                  key={work.id}
                  data-work-card={work.slug}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-white/8 bg-[#0f1117] transition-colors duration-200 hover:border-white/18"
                >
                  <Link
                    href={`/works/${work.slug}`}
                    className="relative block aspect-[16/10] w-full overflow-hidden bg-[#13161e]"
                  >
                    <Image
                      src={work.heroImage}
                      alt={work.heroAlt}
                      fill
                      sizes="(max-width: 768px) 100vw, 540px"
                      referrerPolicy="no-referrer"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0f1117]/80 via-transparent to-transparent"
                    />
                  </Link>

                  <div className="flex flex-1 flex-col justify-between p-6">
                    <div>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-xs text-[#8f95a3]">
                          <span style={{ color: work.accentHex }}>
                            {work.category}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">
                            {work.version}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">
                            {work.year}
                          </span>
                        </div>
                        <span
                          style={{ color: work.accentHex }}
                          className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-md"
                        >
                          <WorkIcon
                            iconKey={work.iconKey}
                            iconImage={work.iconImage}
                            alt={work.name}
                            className="h-4 w-4"
                            imgClassName="h-full w-full object-cover"
                          />
                        </span>
                      </div>

                      <h2 className="mt-3 text-xl font-semibold tracking-tight text-[#f4f5f7]">
                        <Link
                          href={`/works/${work.slug}`}
                          className="hover:underline"
                        >
                          {work.name}
                          <span className="ml-2 font-mono text-sm font-normal text-[#8a909e]">
                            {work.enName}
                          </span>
                        </Link>
                      </h2>

                      <p className="mt-2.5 text-sm leading-relaxed text-[#9ca2b2]">
                        {work.summary}
                      </p>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-5">
                      <Link
                        href={`/works/${work.slug}`}
                        className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#f4f5f7] px-4 text-xs font-medium whitespace-nowrap text-[#08090c] transition-colors hover:bg-white"
                      >
                        <span>查看详情</span>
                        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>

                      <div className="flex items-center gap-2">
                        {work.links.github.trim() ? (
                          <a
                            href={work.links.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`前往 ${work.name} GitHub`}
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/12 text-[#b8becb] transition-colors hover:border-white/30 hover:text-white"
                          >
                            <GithubIcon className="h-4 w-4" />
                          </a>
                        ) : (
                          <button
                            type="button"
                            disabled
                            title="GitHub 暂未提供"
                            aria-label={`${work.name} GitHub 暂未提供`}
                            className="flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-full border border-white/8 text-[#646a78] opacity-50"
                          >
                            <GithubIcon className="h-4 w-4" />
                          </button>
                        )}
                        {work.links.gitee.trim() ? (
                          <a
                            href={work.links.gitee}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`前往 ${work.name} Gitee`}
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/12 text-[#b8becb] transition-colors hover:border-white/30 hover:text-white"
                          >
                            <GitBranch className="h-4 w-4" aria-hidden="true" />
                          </a>
                        ) : (
                          <button
                            type="button"
                            disabled
                            title="Gitee 暂未提供"
                            aria-label={`${work.name} Gitee 暂未提供`}
                            className="flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-full border border-white/8 text-[#646a78] opacity-50"
                          >
                            <GitBranch className="h-4 w-4" aria-hidden="true" />
                          </button>
                        )}
                        {work.links.website.trim() ? (
                          <a
                            href={work.links.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`前往 ${work.name} 官网`}
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/12 text-[#b8becb] transition-colors hover:border-white/30 hover:text-white"
                          >
                            <Globe className="h-4 w-4" aria-hidden="true" />
                          </a>
                        ) : (
                          <button
                            type="button"
                            disabled
                            title="官网暂未开放"
                            aria-label={`${work.name} 官网暂未开放`}
                            className="flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-full border border-white/8 text-[#646a78] opacity-50"
                          >
                            <Globe className="h-4 w-4" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>

      <SiteFooter footer={footer} maxWidthClass="max-w-6xl" />
    </div>
  );
}
