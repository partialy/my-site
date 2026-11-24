import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Mail } from "lucide-react";
import { SiteFooter } from "@/components/showcase/SiteFooter";
import { SubpageHeader } from "@/components/showcase/SubpageHeader";
import { getAboutPageData } from "@/services/aboutService";
import { getSiteFooterConfig, getSiteProfile } from "@/services/siteService";

export async function generateMetadata(): Promise<Metadata> {
  const about = await getAboutPageData();

  return {
    title: "关于作者",
    description: `了解 ${about.authorName} 的开源工程理念、常用技术栈与合作联系方式。`,
    alternates: {
      canonical: "/about",
    },
  };
}

export default async function AboutPage() {
  const [about, site, footer] = await Promise.all([
    getAboutPageData(),
    getSiteProfile(),
    getSiteFooterConfig(),
  ]);

  return (
    <div className="relative z-10 flex min-h-dvh flex-col text-[#f4f5f7]">
      <SubpageHeader
        brandName={site.brandName}
        activePath="about"
        backHref="/"
        backLabel="返回轮盘展厅"
      />

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-14 lg:py-20">
        <div className="text-xs font-medium tracking-wide text-[#8f95a3]">
          关于作者 · {about.location}
        </div>
        <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-[#f4f5f7] sm:text-4xl">
          {about.authorName} — {about.authorRole}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-[1.8] text-[#a5abb8]">
          {about.bio}
        </p>

        <section className="mt-14 border-t border-white/8 pt-10">
          <h2 className="text-lg font-semibold text-[#f4f5f7]">三条创作原则</h2>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            {about.principles.map((item) => (
              <div
                key={item.index}
                className="rounded-2xl border border-white/8 bg-[#0f1117] p-6"
              >
                <div className="font-mono text-xs text-[#e5a93c] tabular-nums">
                  {item.index}
                </div>
                <h3 className="mt-2.5 text-base font-semibold text-[#f4f5f7]">
                  {item.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-[#9aa0b0]">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14 border-t border-white/8 pt-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-[#f4f5f7]">
                交流与开源合作
              </h2>
              <p className="mt-1.5 text-sm text-[#9aa0b0]">
                目前共维护 {about.worksCount} 个公开项目，欢迎通过邮件或代码仓库交流探讨。
              </p>
            </div>
            <div className="flex items-center gap-3">
              <a
                href={`mailto:${about.email}`}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-[#f4f5f7] px-5 text-xs font-medium whitespace-nowrap text-[#08090c] transition-colors hover:bg-white"
              >
                <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{about.email}</span>
              </a>
              <Link
                href="/works"
                className="inline-flex h-10 items-center gap-1.5 rounded-full border border-white/14 px-4 text-xs font-medium whitespace-nowrap text-[#d6dae4] transition-colors hover:border-white/30 hover:text-white"
              >
                <span>浏览作品目录</span>
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter footer={footer} maxWidthClass="max-w-4xl" />
    </div>
  );
}
