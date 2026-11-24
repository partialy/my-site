import type { SiteFooterConfig } from "@/services/types";

interface SiteFooterProps {
  footer: SiteFooterConfig;
  variant?: "page" | "inline";
  maxWidthClass?: string;
}

/**
 * 居中双行版权与备案页脚（仅放置于页面内容末尾）。
 */
export function SiteFooter({
  footer,
  variant = "page",
  maxWidthClass = "max-w-6xl",
}: SiteFooterProps) {
  const inner = (
    <div className="flex flex-col items-center justify-center gap-1.5 text-center text-xs leading-relaxed text-[#7c8291]">
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5">
        <span className="font-mono tabular-nums text-[#8d93a3]">
          © {footer.years}
        </span>
        <span className="font-medium text-[#c0c6d4]">{footer.owner}</span>
        <span aria-hidden="true" className="text-white/22">
          ·
        </span>
        <a
          href={footer.domainHref}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono tracking-tight text-[#8d93a3] transition-colors hover:text-[#f4f5f7] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50"
        >
          {footer.domain}
        </a>
      </div>

      <a
        href={footer.icpHref}
        target="_blank"
        rel="noopener noreferrer"
        className="tracking-wide text-[#7c8291] transition-colors hover:text-[#c7ccd8] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50"
      >
        {footer.icpNumber}
      </a>
    </div>
  );

  if (variant === "inline") {
    return (
      <footer
        aria-label="站点版权与备案信息"
        className="w-full border-t border-white/[0.08] pt-6 pb-8 lg:pt-5 lg:pb-2"
      >
        {inner}
      </footer>
    );
  }

  return (
    <footer
      aria-label="站点版权与备案信息"
      className="mt-auto w-full border-t border-white/[0.08] bg-[#08090c]"
    >
      <div className={`mx-auto w-full ${maxWidthClass} px-6 py-7`}>{inner}</div>
    </footer>
  );
}
