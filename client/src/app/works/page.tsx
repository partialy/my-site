import type { Metadata } from "next";
import { WorksDirectoryClient } from "@/components/showcase/WorksDirectoryClient";
import { getSiteFooterConfig, getSiteProfile } from "@/services/siteService";
import { getWorksDirectory } from "@/services/worksService";

interface WorksIndexPageProps {
  searchParams?: Promise<{ q?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteProfile();

  return {
    title: "全部作品索引",
    description: `浏览并搜索 ${site.authorName} 打造的全部开源作品与独立软件，涵盖效率工具、出版排版、音频处理与前端设计系统。`,
    alternates: {
      canonical: "/works",
    },
  };
}

export default async function WorksIndexPage({
  searchParams,
}: WorksIndexPageProps) {
  const [resolved, directory, site, footer] = await Promise.all([
    searchParams ?? Promise.resolve(undefined),
    getWorksDirectory(),
    getSiteProfile(),
    getSiteFooterConfig(),
  ]);

  const initialQuery = typeof resolved?.q === "string" ? resolved.q : "";

  return (
    <WorksDirectoryClient
      brandName={site.brandName}
      footer={footer}
      works={directory.list}
      categories={directory.categories}
      initialQuery={initialQuery}
    />
  );
}
