"use client";

import { useState } from "react";
import { Compass } from "lucide-react";

interface SiteBrandMarkProps {
  iconUrl?: string | null;
  alt: string;
  className?: string;
  iconClassName?: string;
}

/**
 * 站点左上角品牌图标：优先展示后台配置的站点图标，未配置或加载失败时优雅回退到预设指南针图标。
 */
export function SiteBrandMark({
  iconUrl,
  alt,
  className = "flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border border-white/14 bg-gradient-to-br from-white/12 to-white/[0.03] text-[#e5a93c] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] transition-colors group-hover:border-white/25",
  iconClassName = "h-[17px] w-[17px]",
}: SiteBrandMarkProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showCustomIcon = Boolean(iconUrl && failedUrl !== iconUrl);

  return (
    <span aria-hidden="true" className={`overflow-hidden ${className}`}>
      {showCustomIcon ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={iconUrl!}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setFailedUrl(iconUrl ?? null)}
        />
      ) : (
        <Compass className={iconClassName} strokeWidth={1.85} />
      )}
    </span>
  );
}
