"use client";

import { useState } from "react";
import { Compass } from "lucide-react";

interface SiteBrandMarkProps {
  iconUrl?: string | null;
  alt: string;
  className?: string;
  iconClassName?: string;
}

const DEFAULT_SITE_ICON_URL = "/mysite-icon-dark_round_128x128.webp";

/**
 * 站点左上角品牌图标：优先展示后台配置的站点图标，未配置时使用默认圆形站点图标，加载失败时回退到指南针图标。
 */
export function SiteBrandMark({
  iconUrl,
  alt,
  className = "flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border border-white/14 bg-gradient-to-br from-white/12 to-white/[0.03] text-[#e5a93c] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] transition-colors group-hover:border-white/25",
  iconClassName = "h-[17px] w-[17px]",
}: SiteBrandMarkProps) {
  const effectiveIconUrl = iconUrl || DEFAULT_SITE_ICON_URL;
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showCustomIcon = failedUrl !== effectiveIconUrl;

  return (
    <span aria-hidden="true" className={`overflow-hidden ${className}`}>
      {showCustomIcon ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={effectiveIconUrl}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setFailedUrl(effectiveIconUrl)}
        />
      ) : (
        <Compass className={iconClassName} strokeWidth={1.85} />
      )}
    </span>
  );
}
