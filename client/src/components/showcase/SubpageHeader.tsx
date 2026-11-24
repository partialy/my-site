import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SiteBrandMark } from "@/components/showcase/SiteBrandMark";

interface SubpageHeaderProps {
  brandName: string;
  siteIconUrl?: string | null;
  activePath: "works" | "about" | "detail";
  backHref?: string;
  backLabel?: string;
  rightSlot?: React.ReactNode;
}

export function SubpageHeader({
  brandName,
  siteIconUrl,
  activePath,
  backHref = "/",
  backLabel = "返回展厅",
  rightSlot,
}: SubpageHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/8 bg-[#08090c]/90 backdrop-blur-md">
      <div className="mx-auto flex h-[76px] max-w-6xl items-center justify-between gap-6 px-6">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="group inline-flex items-center gap-2.5 text-base font-semibold tracking-tight whitespace-nowrap text-[#f4f5f7] transition-opacity hover:opacity-90 lg:text-[17px]"
          >
            <SiteBrandMark
              iconUrl={siteIconUrl}
              alt={brandName}
              className={`${
                siteIconUrl ? "flex h-7 w-7 lg:h-8 lg:w-8" : "hidden h-8 w-8 lg:flex"
              } shrink-0 items-center justify-center rounded-[10px] border border-white/14 bg-gradient-to-br from-white/12 to-white/[0.03] text-[#e5a93c] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] transition-colors group-hover:border-white/25`}
            />
            <span>{brandName}</span>
          </Link>

          <nav
            aria-label="主导航"
            className="hidden items-center gap-7 text-[13px] font-medium text-[#9499a6] md:flex"
          >
            <Link
              href="/"
              className="whitespace-nowrap transition-colors hover:text-white"
            >
              作品展厅
            </Link>
            <Link
              href="/works"
              className={`whitespace-nowrap transition-colors hover:text-white ${
                activePath === "works" || activePath === "detail"
                  ? "text-[#f4f5f7]"
                  : ""
              }`}
            >
              全部作品
            </Link>
            <Link
              href="/about"
              className={`whitespace-nowrap transition-colors hover:text-white ${
                activePath === "about" ? "text-[#f4f5f7]" : ""
              }`}
            >
              关于作者
            </Link>
          </nav>
        </div>

        {rightSlot !== undefined ? (
          <div className="flex shrink-0 items-center">{rightSlot}</div>
        ) : (
          <Link
            href={backHref}
            className="inline-flex h-9 items-center gap-2 rounded-full border border-white/14 bg-[#12151c] px-4 text-xs font-medium whitespace-nowrap text-[#e4e7ef] transition-colors hover:border-white/30 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{backLabel}</span>
          </Link>
        )}
      </div>
    </header>
  );
}
