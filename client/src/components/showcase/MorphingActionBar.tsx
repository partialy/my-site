"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, GitBranch, Globe } from "lucide-react";
import type { WorkItem } from "@/services/types";
import { GithubIcon } from "@/components/icons/GithubIcon";

interface MorphingActionBarProps {
  work: WorkItem;
  isCompact: boolean;
  heroAnchorRef: React.RefObject<HTMLDivElement | null>;
  slideOneRef: React.RefObject<HTMLElement | null>;
  viewportMode?: "desktop" | "mobile";
}

interface AnchorCoords {
  left: number;
  top: number;
  viewportWidth: number;
  measured: boolean;
}

const COMPACT_COUNT = 4;
const DESKTOP_COMPACT_SIZE = 44;
const DESKTOP_COMPACT_GAP = 10;
const DESKTOP_COMPACT_DOCK_WIDTH =
  COMPACT_COUNT * DESKTOP_COMPACT_SIZE +
  (COMPACT_COUNT - 1) * DESKTOP_COMPACT_GAP;

export const MOBILE_COMPACT_SIZE = 34;
export const MOBILE_COMPACT_GAP = 6;
export const MOBILE_COMPACT_DOCK_WIDTH =
  COMPACT_COUNT * MOBILE_COMPACT_SIZE +
  (COMPACT_COUNT - 1) * MOBILE_COMPACT_GAP;
export const MOBILE_TOP_RIGHT_PADDING_X = 14;
export const MOBILE_TOP_RIGHT_TOP = 11;

const MORPH_EASE = [0.22, 1, 0.36, 1] as const;
const MORPH_DURATION = 0.84;

export function MorphingActionBar({
  work,
  isCompact,
  heroAnchorRef,
  slideOneRef,
  viewportMode = "desktop",
}: MorphingActionBarProps) {
  const prefersReducedMotion = useReducedMotion();
  const [coords, setCoords] = useState<AnchorCoords>({
    left: 420,
    top: 520,
    viewportWidth: 1440,
    measured: false,
  });

  useLayoutEffect(() => {
    const updatePosition = () => {
      const anchorEl = heroAnchorRef.current;
      const slideEl = slideOneRef.current;
      if (!anchorEl) return;

      const anchorRect = anchorEl.getBoundingClientRect();
      const slideTop = slideEl ? slideEl.getBoundingClientRect().top : 0;
      const restTop = anchorRect.top - slideTop;

      setCoords({
        left: Math.round(anchorRect.left),
        top: Math.round(restTop),
        viewportWidth: window.innerWidth,
        measured: true,
      });
    };

    updatePosition();
    const raf1 = requestAnimationFrame(() => {
      updatePosition();
    });
    const settleTimer = window.setTimeout(updatePosition, 160);

    const observer = new ResizeObserver(updatePosition);
    if (heroAnchorRef.current) observer.observe(heroAnchorRef.current);
    if (slideOneRef.current) observer.observe(slideOneRef.current);
    window.addEventListener("resize", updatePosition);

    return () => {
      cancelAnimationFrame(raf1);
      window.clearTimeout(settleTimer);
      observer.disconnect();
      window.removeEventListener("resize", updatePosition);
    };
  }, [heroAnchorRef, slideOneRef, work.id, viewportMode]);

  useEffect(() => {
    let active = true;
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (!active || !heroAnchorRef.current) return;
        const anchorRect = heroAnchorRef.current.getBoundingClientRect();
        const slideTop = slideOneRef.current
          ? slideOneRef.current.getBoundingClientRect().top
          : 0;
        setCoords({
          left: Math.round(anchorRect.left),
          top: Math.round(anchorRect.top - slideTop),
          viewportWidth: window.innerWidth,
          measured: true,
        });
      });
    }
    return () => {
      active = false;
    };
  }, [heroAnchorRef, slideOneRef]);

  const isDesktop = viewportMode === "desktop";
  const topRightPaddingX = isDesktop ? 32 : MOBILE_TOP_RIGHT_PADDING_X;
  const topRightTop = isDesktop ? 16 : MOBILE_TOP_RIGHT_TOP;
  const compactDockWidth = isDesktop
    ? DESKTOP_COMPACT_DOCK_WIDTH
    : MOBILE_COMPACT_DOCK_WIDTH;
  const buttonSize = isCompact
    ? isDesktop
      ? DESKTOP_COMPACT_SIZE
      : MOBILE_COMPACT_SIZE
    : isDesktop
      ? 44
      : 40;

  const targetX = isCompact
    ? Math.max(14, coords.viewportWidth - topRightPaddingX - compactDockWidth)
    : coords.left;
  const targetY = isCompact ? topRightTop : coords.top;

  const githubHref = work.links.github.trim();
  const giteeHref = work.links.gitee.trim();
  const websiteHref = work.links.website.trim();

  const giteeAction = {
    key: "gitee",
    label: giteeHref ? "前往 Gitee" : "暂未提供",
    tooltipLabel: giteeHref ? "前往 Gitee" : "Gitee 暂未提供",
    ariaLabel: giteeHref ? `前往 ${work.name} Gitee 仓库` : `${work.name} Gitee 暂未提供`,
    href: giteeHref,
    internal: false,
    primary: false,
    disabled: !giteeHref,
    icon: GitBranch,
  };

  const websiteAction = {
    key: "website",
    label: websiteHref ? "前往官网" : "暂未开放",
    tooltipLabel: websiteHref ? "前往官网" : "官网暂未开放",
    ariaLabel: websiteHref ? `前往 ${work.name} 官方网站` : `${work.name} 官网暂未开放`,
    href: websiteHref,
    internal: false,
    primary: false,
    disabled: !websiteHref,
    icon: Globe,
  };

  const actions = [
    {
      key: "details",
      label: "查看详情",
      tooltipLabel: "查看详情",
      ariaLabel: `查看${work.name}详情`,
      href: `/works/${work.slug}`,
      internal: true,
      primary: true,
      disabled: false,
      icon: ArrowUpRight,
    },
    {
      key: "github",
      label: githubHref ? "前往 GitHub" : "暂未提供",
      tooltipLabel: githubHref ? "前往 GitHub" : "GitHub 暂未提供",
      ariaLabel: githubHref ? `前往 ${work.name} GitHub 仓库` : `${work.name} GitHub 暂未提供`,
      href: githubHref,
      internal: false,
      primary: false,
      disabled: !githubHref,
      icon: GithubIcon,
    },
    ...(isDesktop
      ? [giteeAction, websiteAction]
      : [websiteAction, giteeAction]),
  ];

  return (
    <motion.nav
      aria-label="作品快捷操作"
      data-testid="morphing-action-bar"
      data-dock-mode={isCompact ? "compact" : "hero"}
      initial={false}
      animate={{
        x: targetX,
        y: targetY,
        opacity: coords.measured ? 1 : 0,
      }}
      transition={{
        duration: prefersReducedMotion ? 0 : MORPH_DURATION,
        ease: MORPH_EASE,
      }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        maxWidth: isCompact
          ? undefined
          : Math.max(280, coords.viewportWidth - coords.left - 20),
      }}
      className="z-50 will-change-transform"
    >
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.72, delay: 0.24, ease: MORPH_EASE }}
        className={`flex items-center ${
          isCompact
            ? isDesktop
              ? "gap-2.5"
              : "gap-1.5"
            : "flex-wrap gap-2.5 xl:flex-nowrap"
        }`}
      >
        {actions.map((action) => {
          const IconComponent = action.icon;
          const baseClasses = action.primary
            ? "bg-[#f4f5f7] text-[#08090c] border-[#f4f5f7] hover:bg-white shadow-[0_8px_24px_-8px_rgba(244,245,247,0.35)]"
            : action.disabled
              ? "bg-[#13161d]/65 text-[#7a8090] border-white/8 cursor-not-allowed opacity-60 backdrop-blur-md"
              : "bg-[#13161d]/90 text-[#e4e7ef] border-white/14 hover:border-white/35 hover:bg-[#1a1e28] hover:text-white backdrop-blur-md";

          const content = (
            <motion.span
              initial={false}
              animate={{
                paddingLeft: isCompact ? 0 : isDesktop ? 14 : 12,
                paddingRight: isCompact ? 0 : isDesktop ? 16 : 14,
              }}
              transition={{
                duration: prefersReducedMotion ? 0 : isCompact ? 0.56 : 0.52,
                ease: MORPH_EASE,
              }}
              style={{
                height: `${buttonSize}px`,
                minWidth: `${buttonSize}px`,
                width: isCompact ? `${buttonSize}px` : undefined,
              }}
              className={`group relative flex items-center justify-center rounded-full border text-[13px] font-medium whitespace-nowrap transition-[height,min-width,width,color,border-color,background-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none ${baseClasses}`}
            >
              <IconComponent
                className={
                  isCompact && !isDesktop
                    ? "h-3.5 w-3.5 shrink-0"
                    : "h-4 w-4 shrink-0"
                }
                strokeWidth={action.primary ? 2.1 : 1.8}
                aria-hidden="true"
              />
              <motion.span
                initial={false}
                animate={{
                  maxWidth: isCompact ? 0 : 96,
                  opacity: isCompact ? 0 : 1,
                  marginLeft: isCompact ? 0 : 7,
                }}
                transition={{
                  maxWidth: {
                    duration: prefersReducedMotion
                      ? 0
                      : isCompact
                        ? 0.48
                        : 0.52,
                    ease: MORPH_EASE,
                  },
                  marginLeft: {
                    duration: prefersReducedMotion
                      ? 0
                      : isCompact
                        ? 0.48
                        : 0.52,
                    ease: MORPH_EASE,
                  },
                  opacity: {
                    duration: prefersReducedMotion
                      ? 0
                      : isCompact
                        ? 0.26
                        : 0.34,
                    ease: MORPH_EASE,
                  },
                }}
                className="inline-block overflow-hidden whitespace-nowrap"
              >
                {action.label}
              </motion.span>

              {isCompact && (
                <span
                  role="tooltip"
                  className="pointer-events-none absolute top-[calc(100%+10px)] right-1/2 hidden translate-x-1/2 rounded-md border border-white/12 bg-[#14171f]/95 px-2.5 py-1 text-[11px] font-medium whitespace-nowrap text-[#f4f5f7] opacity-0 shadow-lg transition-all duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 lg:block"
                >
                  {action.tooltipLabel}
                </span>
              )}
            </motion.span>
          );

          if (action.disabled) {
            return (
              <button
                key={action.key}
                type="button"
                disabled
                aria-disabled="true"
                aria-label={action.ariaLabel}
                title={action.tooltipLabel}
                className="rounded-full focus-visible:outline-none"
              >
                {content}
              </button>
            );
          }

          if (action.internal) {
            return (
              <Link
                key={action.key}
                href={action.href}
                aria-label={action.ariaLabel}
                className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/75"
              >
                {content}
              </Link>
            );
          }

          return (
            <a
              key={action.key}
              href={action.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={action.ariaLabel}
              className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/75"
            >
              {content}
            </a>
          );
        })}
      </motion.div>
    </motion.nav>
  );
}
