"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  Globe,
  Menu,
  Monitor,
  RotateCcw,
  Search,
  Smartphone,
  X,
} from "lucide-react";
import type {
  ShowcaseAutoRotateConfig,
  SiteFooterConfig,
  WorkItem,
  WorkPlatform,
} from "@/services/types";
import {
  clampSlideIndex,
  computeRotationForSlot,
  computeRotationForWorkIndex,
  computeStepRotation,
  evaluateWheelStep,
  getActiveWorkIndexFromRotation,
  SLOT_STEP_DEG,
} from "@/lib/showcase/archWheel";
import {
  easeOutQuinticBezier,
  evaluateMobilePptGesture,
  shouldMobileHeaderBeCompact,
} from "@/lib/showcase/mobileScroll";
import { buildWorksSearchHref } from "@/lib/showcase/searchWorks";
import { ArchClockWheel } from "@/components/showcase/ArchClockWheel";
import { MobileNavDrawer } from "@/components/showcase/MobileNavDrawer";
import {
  MOBILE_COMPACT_DOCK_WIDTH,
  MOBILE_COMPACT_GAP,
  MOBILE_COMPACT_SIZE,
  MorphingActionBar,
} from "@/components/showcase/MorphingActionBar";
import { PillSearchInput } from "@/components/showcase/PillSearchInput";
import { SiteBrandMark } from "@/components/showcase/SiteBrandMark";
import { SiteFooter } from "@/components/showcase/SiteFooter";
import { TopEntranceProgressBar } from "@/components/showcase/TopEntranceProgressBar";
import { WorkIcon } from "@/components/showcase/WorkIcon";

interface ShowcaseDeckProps {
  works: WorkItem[];
  brandName: string;
  siteIconUrl?: string | null;
  domainLabel: string;
  footer: SiteFooterConfig;
  showcaseConfig?: ShowcaseAutoRotateConfig;
  initialWorkIndex?: number;
}

const SLIDE_TITLES = [
  "作品概览",
  "核心亮点",
  "技术架构",
  "版本演进",
] as const;

const PLATFORM_PILL_STYLES: Record<
  WorkPlatform,
  { borderClass: string; Icon: typeof Monitor }
> = {
  PC: {
    borderClass: "border-[#60a5fa]/65 bg-[#60a5fa]/[0.07] text-[#93c5fd]",
    Icon: Monitor,
  },
  Web: {
    borderClass: "border-[#f5b942]/65 bg-[#f5b942]/[0.07] text-[#fbd37d]",
    Icon: Globe,
  },
  Android: {
    borderClass: "border-[#34d399]/65 bg-[#34d399]/[0.07] text-[#6ee7b7]",
    Icon: Smartphone,
  },
};

function PlatformPillRow({
  platforms,
  className = "",
}: {
  platforms: WorkPlatform[];
  className?: string;
}) {
  return (
    <div
      data-testid="work-platform-tags"
      aria-label="支持平台"
      className={`flex flex-wrap items-center gap-2 ${className}`}
    >
      {platforms.map((platform) => {
        const { borderClass, Icon } = PLATFORM_PILL_STYLES[platform];
        return (
          <span
            key={platform}
            className={`inline-flex h-6 items-center gap-1.5 rounded-full border px-2.5 font-mono text-[11px] font-medium tracking-wide ${borderClass}`}
          >
            <Icon
              className="h-3 w-3 shrink-0"
              strokeWidth={1.85}
              aria-hidden="true"
            />
            <span>{platform}</span>
          </span>
        );
      })}
    </div>
  );
}

const TOTAL_SLIDES = SLIDE_TITLES.length;
const SLIDE_EASE = [0.22, 1, 0.36, 1] as const;
const SLIDE_DURATION = 0.82;
const DESKTOP_SEARCH_YIELD_OFFSET_PX = -220;
const MOBILE_SEARCH_YIELD_OFFSET_PX = -(
  MOBILE_COMPACT_DOCK_WIDTH + MOBILE_COMPACT_GAP
);
const SEARCH_YIELD_DURATION = 0.84;
const DESKTOP_MEDIA_QUERY = "(min-width: 1024px)";
const AUTO_ROTATE_STOP_KEY = "mysite:showcase-auto-rotate-stopped";
const AUTO_ROTATE_STOP_EVENT = "mysite:auto-rotate-stop";

function subscribeAutoRotateStop(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(AUTO_ROTATE_STOP_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(AUTO_ROTATE_STOP_EVENT, callback);
  };
}

function getAutoRotateStopSnapshot(): boolean {
  try {
    return window.sessionStorage.getItem(AUTO_ROTATE_STOP_KEY) === "1";
  } catch {
    return false;
  }
}

function getAutoRotateStopServerSnapshot(): boolean {
  return true;
}

function subscribePageVisibility(callback: () => void) {
  document.addEventListener("visibilitychange", callback);
  return () => document.removeEventListener("visibilitychange", callback);
}

function getPageVisibilitySnapshot(): boolean {
  return document.visibilityState === "visible";
}

function getPageVisibilityServerSnapshot(): boolean {
  return false;
}

function subscribeDesktopMedia(callback: () => void) {
  const mql = window.matchMedia(DESKTOP_MEDIA_QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getDesktopSnapshot() {
  return window.matchMedia(DESKTOP_MEDIA_QUERY).matches;
}

function getDesktopServerSnapshot() {
  return true;
}

function FadeInBlock({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.14 }}
      transition={{ duration: 0.64, delay, ease: SLIDE_EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function ShowcaseDeck({
  works,
  brandName,
  siteIconUrl,
  domainLabel,
  footer,
  showcaseConfig,
  initialWorkIndex = 0,
}: ShowcaseDeckProps) {
  const router = useRouter();
  const safeInitial = Math.max(0, Math.min(works.length - 1, initialWorkIndex));
  const prefersReducedMotion = useReducedMotion();
  const isDesktop = useSyncExternalStore(
    subscribeDesktopMedia,
    getDesktopSnapshot,
    getDesktopServerSnapshot
  );
  const autoRotateStopped = useSyncExternalStore(
    subscribeAutoRotateStop,
    getAutoRotateStopSnapshot,
    getAutoRotateStopServerSnapshot
  );
  const isPageVisible = useSyncExternalStore(
    subscribePageVisibility,
    getPageVisibilitySnapshot,
    getPageVisibilityServerSnapshot
  );

  const [rotationDeg, setRotationDeg] = useState<number>(
    -safeInitial * SLOT_STEP_DEG
  );
  const [slideIndex, setSlideIndex] = useState<number>(0);
  const [mobilePastHero, setMobilePastHero] = useState<boolean>(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const heroAnchorRef = useRef<HTMLDivElement | null>(null);
  const slideOneRef = useRef<HTMLElement | null>(null);
  const mobileScrollRef = useRef<HTMLDivElement | null>(null);
  const mobileOverlayInputRef = useRef<HTMLInputElement | null>(null);
  const lastSlideWheelMsRef = useRef<number>(0);
  const isMobileSnappingRef = useRef<boolean>(false);
  const snapRafRef = useRef<number | null>(null);
  const mobileTouchRef = useRef<{
    startY: number;
    startScrollTop: number;
  } | null>(null);

  const activeWorkIndex = getActiveWorkIndexFromRotation(
    rotationDeg,
    works.length
  );
  const activeWork = works[activeWorkIndex] ?? works[0];
  const isCompact = isDesktop ? slideIndex > 0 : mobilePastHero;

  // 首页严格 100dvh 排版兜底截断（完整历史及多条数据留给详情页展示）
  const visibleMetrics = activeWork.metrics.slice(0, 3);
  const visibleHighlights = activeWork.highlights.slice(0, 3);
  const visibleTechStack = activeWork.techStack.slice(0, 4);
  const visibleReleases = activeWork.releases.slice(0, 3);

  const cancelMobileSnap = useCallback(() => {
    if (snapRafRef.current !== null) {
      cancelAnimationFrame(snapRafRef.current);
      snapRafRef.current = null;
    }
    isMobileSnappingRef.current = false;
  }, []);

  const animateMobileScrollTo = useCallback(
    (target: "hero" | "content") => {
      const container = mobileScrollRef.current;
      if (!container) return;

      cancelMobileSnap();

      const heroHeight = slideOneRef.current?.offsetHeight || window.innerHeight;
      const targetTop = target === "content" ? heroHeight : 0;
      const startTop = container.scrollTop;

      setMobilePastHero(target === "content");
      if (target === "hero") {
        setMobileSearchOpen(false);
      }

      if (prefersReducedMotion || Math.abs(targetTop - startTop) < 2) {
        container.scrollTop = targetTop;
        return;
      }

      isMobileSnappingRef.current = true;
      const durationMs = 740;
      const startTime = performance.now();

      const tick = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / durationMs);
        const eased = easeOutQuinticBezier(progress);
        container.scrollTop = startTop + (targetTop - startTop) * eased;

        if (progress < 1) {
          snapRafRef.current = requestAnimationFrame(tick);
        } else {
          container.scrollTop = targetTop;
          snapRafRef.current = null;
          isMobileSnappingRef.current = false;
        }
      };

      snapRafRef.current = requestAnimationFrame(tick);
    },
    [cancelMobileSnap, prefersReducedMotion]
  );

  useEffect(() => {
    return () => {
      cancelMobileSnap();
    };
  }, [cancelMobileSnap]);

  useEffect(() => {
    if (!mobileSearchOpen) return;
    const timer = window.setTimeout(() => {
      mobileOverlayInputRef.current?.focus();
    }, 60);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileSearchOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileSearchOpen]);

  const stopAutoRotateForSession = useCallback(() => {
    try {
      window.sessionStorage.setItem(AUTO_ROTATE_STOP_KEY, "1");
    } catch {
      // 忽略隐私模式下 sessionStorage 写入限制
    }
    window.dispatchEvent(new Event(AUTO_ROTATE_STOP_EVENT));
  }, []);

  const handleSelectSlot = useCallback(
    (slotBaseAngleDeg: number) => {
      stopAutoRotateForSession();
      setRotationDeg((prev) => computeRotationForSlot(prev, slotBaseAngleDeg));
      setSlideIndex(0);
    },
    [stopAutoRotateForSession]
  );

  const handleSelectWork = useCallback(
    (workIndex: number) => {
      stopAutoRotateForSession();
      setRotationDeg((prev) =>
        computeRotationForWorkIndex(prev, workIndex, works.length)
      );
      setSlideIndex(0);
      if (!isDesktop && mobileScrollRef.current) {
        cancelMobileSnap();
        mobileScrollRef.current.scrollTop = 0;
        setMobilePastHero(false);
        setMobileSearchOpen(false);
      }
    },
    [works.length, isDesktop, cancelMobileSnap, stopAutoRotateForSession]
  );

  const handleStepWork = useCallback(
    (direction: 1 | -1) => {
      stopAutoRotateForSession();
      setRotationDeg((prev) => computeStepRotation(prev, direction));
      setSlideIndex(0);
      if (!isDesktop && mobileScrollRef.current) {
        cancelMobileSnap();
        mobileScrollRef.current.scrollTop = 0;
        setMobilePastHero(false);
        setMobileSearchOpen(false);
      }
    },
    [isDesktop, cancelMobileSnap, stopAutoRotateForSession]
  );

  const goToSlide = useCallback(
    (nextIndex: number) => {
      stopAutoRotateForSession();
      if (!isDesktop) {
        animateMobileScrollTo(nextIndex === 0 ? "hero" : "content");
        return;
      }
      setSlideIndex(
        (prev) => clampSlideIndex(nextIndex, 0, TOTAL_SLIDES) ?? prev
      );
    },
    [isDesktop, animateMobileScrollTo, stopAutoRotateForSession]
  );

  const stepSlide = useCallback(
    (delta: -1 | 1) => {
      const next = clampSlideIndex(slideIndex, delta, TOTAL_SLIDES);
      if (next !== slideIndex) {
        stopAutoRotateForSession();
        setSlideIndex(next);
      }
    },
    [slideIndex, stopAutoRotateForSession]
  );

  const autoRotateEnabled = showcaseConfig?.autoRotateEnabled ?? true;
  const autoRotateIntervalMs =
    Math.max(1, showcaseConfig?.autoRotateIntervalSec ?? 5) * 1000;
  const isOnFirstSlide = isDesktop ? slideIndex === 0 : !mobilePastHero;
  const isSearching =
    searchQuery.trim().length > 0 || (!isDesktop && mobileSearchOpen);
  const shouldAutoRotate =
    !autoRotateStopped &&
    autoRotateEnabled &&
    works.length > 1 &&
    isOnFirstSlide &&
    !isSearching &&
    !mobileDrawerOpen &&
    isPageVisible;

  useEffect(() => {
    if (!shouldAutoRotate) return;
    const timer = window.setInterval(() => {
      setRotationDeg((prev) => computeStepRotation(prev, 1));
    }, autoRotateIntervalMs);
    return () => window.clearInterval(timer);
  }, [shouldAutoRotate, autoRotateIntervalMs]);

  useEffect(() => {
    if (!isDesktop) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (event.key === "ArrowDown" || event.key === "PageDown") {
        event.preventDefault();
        stepSlide(1);
      } else if (event.key === "ArrowUp" || event.key === "PageUp") {
        event.preventDefault();
        stepSlide(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        handleStepWork(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        handleStepWork(-1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isDesktop, stepSlide, handleStepWork]);

  useEffect(() => {
    if (isDesktop) return;
    const container = mobileScrollRef.current;
    if (!container) return;

    const onWheel = (event: WheelEvent) => {
      if (mobileDrawerOpen) return;
      if (isMobileSnappingRef.current) {
        event.preventDefault();
        return;
      }

      const heroHeight = slideOneRef.current?.offsetHeight || window.innerHeight;
      const action = evaluateMobilePptGesture(
        container.scrollTop,
        heroHeight,
        event.deltaY,
        isMobileSnappingRef.current,
        16
      );

      if (action === "snap-to-content") {
        event.preventDefault();
        animateMobileScrollTo("content");
      } else if (action === "snap-to-hero") {
        event.preventDefault();
        animateMobileScrollTo("hero");
      }
    };

    const onTouchStart = (event: TouchEvent) => {
      if (mobileDrawerOpen) return;
      const y = event.touches[0]?.clientY;
      if (typeof y === "number") {
        mobileTouchRef.current = {
          startY: y,
          startScrollTop: container.scrollTop,
        };
      }
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (mobileDrawerOpen || !mobileTouchRef.current) return;
      const endY = event.changedTouches[0]?.clientY;
      const { startY, startScrollTop } = mobileTouchRef.current;
      mobileTouchRef.current = null;
      if (typeof endY !== "number") return;

      const deltaY = startY - endY;
      const heroHeight = slideOneRef.current?.offsetHeight || window.innerHeight;
      const action = evaluateMobilePptGesture(
        startScrollTop,
        heroHeight,
        deltaY,
        isMobileSnappingRef.current,
        28
      );

      if (action === "snap-to-content") {
        animateMobileScrollTo("content");
      } else if (action === "snap-to-hero") {
        animateMobileScrollTo("hero");
      }
    };

    const onScroll = () => {
      if (isMobileSnappingRef.current) return;
      const heroHeight = slideOneRef.current?.offsetHeight || window.innerHeight;
      const pastHero = shouldMobileHeaderBeCompact(
        container.scrollTop,
        heroHeight
      );
      setMobilePastHero(pastHero);
      if (pastHero) {
        stopAutoRotateForSession();
      } else {
        setMobileSearchOpen(false);
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    container.addEventListener("touchstart", onTouchStart, { passive: true });
    container.addEventListener("touchend", onTouchEnd, { passive: true });
    container.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("wheel", onWheel);
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchend", onTouchEnd);
      container.removeEventListener("scroll", onScroll);
    };
  }, [isDesktop, mobileDrawerOpen, animateMobileScrollTo, stopAutoRotateForSession]);

  const handleDesktopWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!isDesktop) return;
    const now = Date.now();
    const step = evaluateWheelStep(
      now,
      lastSlideWheelMsRef.current,
      event.deltaY,
      760,
      22
    );
    if (step !== 0) {
      lastSlideWheelMsRef.current = now;
      stepSlide(step);
    }
  };

  const handleSearchSubmit = useCallback(
    (query: string) => {
      setMobileSearchOpen(false);
      router.push(buildWorksSearchHref(query));
    },
    [router]
  );

  const nextWork = works[(activeWorkIndex + 1) % works.length];

  return (
    <div
      data-testid="showcase-root"
      data-active-work={activeWork.slug}
      data-slide-index={isDesktop ? slideIndex : mobilePastHero ? 1 : 0}
      data-viewport-mode={isDesktop ? "desktop" : "mobile"}
      onWheel={handleDesktopWheel}
      className="relative z-10 h-dvh w-full overflow-hidden text-[#f4f5f7]"
    >
      <TopEntranceProgressBar accentHex={activeWork.accentHex} />

      {!prefersReducedMotion && (
        <motion.div
          aria-hidden="true"
          data-testid="entrance-veil"
          initial={{ opacity: 0.92 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.62, ease: SLIDE_EASE }}
          className="pointer-events-none fixed inset-0 z-[60] bg-[#08090c]"
        />
      )}

      <motion.div
        aria-hidden="true"
        initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.1, ease: SLIDE_EASE }}
        style={{
          background: `radial-gradient(640px circle at 76% 24%, ${activeWork.accentHex}14, transparent 70%)`,
        }}
        className="pointer-events-none fixed inset-0 z-0 transition-colors duration-700"
      />

      <motion.header
        initial={prefersReducedMotion ? false : { opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.72, delay: 0.08, ease: SLIDE_EASE }}
        className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-white/[0.09] bg-[#0b0d14]/65 px-3.5 backdrop-blur-xl shadow-[0_12px_36px_-14px_rgba(0,0,0,0.72),inset_0_1px_0_rgba(255,255,255,0.1)] lg:h-[76px] lg:border-b-0 lg:bg-transparent lg:px-8 lg:shadow-none lg:backdrop-blur-none"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/[0.06] via-white/[0.02] to-white/[0.05] lg:hidden"
        />

        <div className="relative z-10 flex items-center gap-2 lg:gap-8">
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            aria-label="打开导航侧栏"
            aria-expanded={mobileDrawerOpen}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#e4e7ef] transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 lg:hidden"
          >
            <Menu
              className="h-[19px] w-[19px]"
              strokeWidth={1.85}
              aria-hidden="true"
            />
          </button>

          <Link
            href="/"
            className="group inline-flex items-center gap-2.5 text-[15px] font-semibold tracking-tight whitespace-nowrap text-[#f4f5f7] transition-opacity hover:opacity-90 lg:text-[17px]"
          >
            <SiteBrandMark
              iconUrl={siteIconUrl}
              alt={brandName}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] border border-white/14 bg-gradient-to-br from-white/12 to-white/[0.03] text-[#e5a93c] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] transition-colors group-hover:border-white/25 lg:h-8 lg:w-8"
            />
            <span>{brandName}</span>
          </Link>

          <nav
            aria-label="主导航"
            className="hidden items-center gap-7 text-[13px] font-medium text-[#9499a6] lg:flex"
          >
            <Link
              href="/"
              className="whitespace-nowrap text-[#f4f5f7] transition-colors hover:text-white"
            >
              作品展厅
            </Link>
            <Link
              href="/works"
              className="whitespace-nowrap transition-colors hover:text-white"
            >
              全部作品
            </Link>
            <Link
              href="/about"
              className="whitespace-nowrap transition-colors hover:text-white"
            >
              关于作者
            </Link>
          </nav>
        </div>
      </motion.header>

      <MobileNavDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        brandName={brandName}
        siteIconUrl={siteIconUrl}
        domainLabel={domainLabel}
        works={works}
        activeWorkIndex={activeWorkIndex}
        onSelectWork={handleSelectWork}
      />

      <motion.div
        data-testid="home-search-dock"
        data-yielded={isCompact ? "true" : "false"}
        initial={false}
        animate={{
          x: isCompact
            ? isDesktop
              ? DESKTOP_SEARCH_YIELD_OFFSET_PX
              : MOBILE_SEARCH_YIELD_OFFSET_PX
            : 0,
        }}
        transition={{
          duration: prefersReducedMotion ? 0 : SEARCH_YIELD_DURATION,
          ease: SLIDE_EASE,
        }}
        className="fixed top-[11px] right-[14px] z-[45] will-change-transform lg:top-4 lg:right-8"
      >
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.72, delay: 0.12, ease: SLIDE_EASE }}
        >
          <PillSearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            onSubmit={handleSearchSubmit}
            placeholder="搜索"
            inputId="home-works-search"
            pillWidthPx={isDesktop ? 152 : 104}
            pillHeightPx={isDesktop ? 44 : 34}
            circleSizePx={MOBILE_COMPACT_SIZE}
            compactCircle={!isDesktop && isCompact}
            onExpandRequest={() => setMobileSearchOpen(true)}
          />
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {!isDesktop && mobileSearchOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileSearchOpen(false)}
              aria-hidden="true"
              className="fixed inset-0 z-[55] bg-black/45 backdrop-blur-[2px] lg:hidden"
            />
            <motion.form
              role="search"
              aria-label="移动端展开搜索作品"
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.28, ease: SLIDE_EASE }}
              onSubmit={(e) => {
                e.preventDefault();
                handleSearchSubmit(searchQuery);
              }}
              className="fixed inset-x-3.5 top-[64px] z-[60] flex h-11 items-center rounded-full border border-white/18 bg-[#10131c]/90 px-3.5 backdrop-blur-2xl shadow-[0_18px_40px_rgba(0,0,0,0.65)] lg:hidden"
            >
              <button
                type="submit"
                aria-label="执行搜索"
                className="flex shrink-0 items-center justify-center text-[#c0c6d4] hover:text-white"
              >
                <Search
                  className="h-4 w-4"
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
              </button>
              <input
                ref={mobileOverlayInputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索作品名称、技术栈..."
                aria-label="搜索作品"
                autoComplete="off"
                className="ml-2.5 w-full min-w-0 bg-transparent text-sm text-[#f4f5f7] placeholder:text-[#8b91a0] focus:outline-none [&::-webkit-search-cancel-button]:hidden"
              />
              <button
                type="button"
                onClick={() => setMobileSearchOpen(false)}
                aria-label="关闭搜索栏"
                className="ml-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#8f95a3] hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </motion.form>
          </>
        )}
      </AnimatePresence>

      <ArchClockWheel
        works={works}
        activeWorkIndex={activeWorkIndex}
        rotationDeg={rotationDeg}
        onSelectSlot={handleSelectSlot}
        onStep={handleStepWork}
      />

      <MorphingActionBar
        work={activeWork}
        isCompact={isCompact}
        heroAnchorRef={heroAnchorRef}
        slideOneRef={slideOneRef}
        viewportMode={isDesktop ? "desktop" : "mobile"}
      />

      {isDesktop ? (
        <main
          key="desktop-ppt-deck"
          className="relative z-10 h-dvh w-full overflow-hidden lg:pl-[368px] lg:pr-16"
        >
          <motion.div
            animate={{ y: `-${slideIndex * 100}%` }}
            initial={false}
            transition={{
              duration: SLIDE_DURATION,
              ease: SLIDE_EASE,
            }}
            className="h-dvh w-full will-change-transform"
          >
            {/* SLIDE 1 */}
            <section
              ref={slideOneRef}
              aria-label={`第 1 页：${activeWork.name} 概览`}
              className="relative flex h-dvh w-full shrink-0 flex-col justify-center overflow-hidden px-12 pt-20 pb-12"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeWork.id}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{
                    duration:
                      rotationDeg === -safeInitial * SLOT_STEP_DEG
                        ? 0.72
                        : 0.38,
                    delay:
                      rotationDeg === -safeInitial * SLOT_STEP_DEG ? 0.12 : 0,
                    ease: SLIDE_EASE,
                  }}
                  className="mx-auto grid w-full max-w-[1040px] grid-cols-12 items-center gap-10"
                >
                  <div className="col-span-7 flex flex-col">
                    <div className="flex items-center gap-2.5 text-xs font-medium tracking-wide text-[#9499a6]">
                      <span style={{ color: activeWork.accentHex }}>
                        {activeWork.category}
                      </span>
                      <span aria-hidden="true" className="text-white/20">
                        ·
                      </span>
                      <span className="font-mono tabular-nums">
                        {activeWork.version}
                      </span>
                      <span aria-hidden="true" className="text-white/20">
                        ·
                      </span>
                      <span className="font-mono tabular-nums">
                        {activeWork.year}
                      </span>
                      <span aria-hidden="true" className="text-white/20">
                        ·
                      </span>
                      <span>{activeWork.license}</span>
                    </div>

                    <h1 className="mt-4 text-balance text-[46px] leading-[1.14] font-semibold tracking-tight text-[#f4f5f7]">
                      {activeWork.name}
                    </h1>

                    <PlatformPillRow
                      platforms={activeWork.platforms}
                      className="mt-3.5"
                    />

                    <p className="mt-4 max-w-xl text-[15px] leading-[1.75] text-[#9fa5b5]">
                      {activeWork.summary}
                    </p>

                    <div
                      ref={heroAnchorRef}
                      aria-hidden="true"
                      className="mt-8 h-12 w-full"
                    />

                    <div className="mt-8 grid grid-cols-3 gap-5 border-t border-white/8 pt-6">
                      {visibleMetrics.map((metric) => (
                        <div key={metric.label}>
                          <div className="font-mono text-lg font-semibold tabular-nums text-[#f4f5f7]">
                            {metric.value}
                          </div>
                          <div className="mt-1 text-xs text-[#8a909e]">
                            {metric.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <motion.div
                    initial={
                      prefersReducedMotion
                        ? false
                        : { opacity: 0, y: 18, scale: 0.97 }
                    }
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      duration: 0.84,
                      delay: 0.18,
                      ease: SLIDE_EASE,
                    }}
                    className="col-span-5"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#111319] shadow-[0_28px_70px_-24px_rgba(0,0,0,0.85)]">
                      {!failedImages[activeWork.id] ? (
                        <Image
                          src={activeWork.heroImage}
                          alt={activeWork.heroAlt}
                          fill
                          priority
                          sizes="520px"
                          referrerPolicy="no-referrer"
                          onError={() =>
                            setFailedImages((prev) => ({
                              ...prev,
                              [activeWork.id]: true,
                            }))
                          }
                          className="object-cover"
                        />
                      ) : (
                        <div
                          style={{
                            background: `linear-gradient(135deg, #13161e 0%, ${activeWork.accentHex}26 100%)`,
                          }}
                          className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center"
                        >
                          <WorkIcon
                            iconKey={activeWork.iconKey}
                            className="h-10 w-10 text-white/80"
                          />
                          <span className="text-sm font-medium text-white/85">
                            {activeWork.name} · {activeWork.enName}
                          </span>
                        </div>
                      )}
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#08090c]/55 via-transparent to-transparent"
                      />
                      <div className="absolute right-4 bottom-3.5 left-4 flex items-center justify-between text-xs text-white/75">
                        <span className="font-mono tracking-wide">
                          {activeWork.enName}
                        </span>
                        <span className="font-mono tabular-nums text-white/60">
                          {activeWork.version}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </AnimatePresence>

              <motion.div
                initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.68, delay: 0.38, ease: SLIDE_EASE }}
                className="absolute right-0 bottom-7 left-0 flex justify-center"
              >
                <button
                  type="button"
                  onClick={() => goToSlide(1)}
                  aria-label="向下滚动查看第二页：核心亮点"
                  className="group flex items-center gap-2.5 rounded-full px-4 py-2 text-xs text-[#8f95a3] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                >
                  <span>向下滚动探索核心亮点</span>
                  <ArrowDown
                    className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-y-0.5"
                    aria-hidden="true"
                  />
                </button>
              </motion.div>
            </section>

            {/* SLIDE 2 */}
            <section
              aria-label={`第 2 页：${activeWork.name} 核心亮点`}
              className="relative flex h-dvh w-full shrink-0 flex-col justify-center overflow-hidden px-12 pt-24 pb-12"
            >
              <div className="mx-auto w-full max-w-[1040px]">
                <div className="flex flex-row items-end justify-between gap-4 border-b border-white/8 pb-6">
                  <div>
                    <div className="text-xs font-medium tracking-wide text-[#8f95a3]">
                      02. 核心亮点 · {activeWork.name}
                    </div>
                    <h2 className="mt-2.5 text-balance text-[34px] font-semibold tracking-tight text-[#f4f5f7]">
                      为创作者打磨的三大关键能力
                    </h2>
                  </div>
                  <p className="max-w-md text-sm leading-relaxed text-[#9499a6]">
                    {activeWork.detailIntro}
                  </p>
                </div>

                <div className="mt-8 grid grid-cols-3 gap-5">
                  {visibleHighlights.map((item) => (
                    <article
                      key={item.index}
                      className="flex flex-col justify-between rounded-2xl border border-white/8 bg-[#101218]/90 p-6 transition-colors duration-200 hover:border-white/16"
                    >
                      <div>
                        <span
                          style={{ color: activeWork.accentHex }}
                          className="font-mono text-xs font-medium tabular-nums"
                        >
                          {item.index}
                        </span>
                        <h3 className="mt-3 text-[17px] font-semibold tracking-tight text-[#f4f5f7]">
                          {item.title}
                        </h3>
                        <p className="mt-3 text-sm leading-[1.7] text-[#9aa0b0]">
                          {item.description}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="mt-7 grid grid-cols-3 gap-4 border-t border-white/8 pt-6">
                  {visibleMetrics.map((metric) => (
                    <div key={metric.label} className="flex flex-col">
                      <span className="font-mono text-2xl font-semibold tabular-nums text-[#f4f5f7]">
                        {metric.value}
                      </span>
                      <span className="mt-1 text-sm font-medium text-[#c5cad6]">
                        {metric.label}
                      </span>
                      <span className="mt-0.5 text-xs text-[#7d8392]">
                        {metric.context}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* SLIDE 3 (对齐最终版：右侧仅保留开源许可卡片) */}
            <section
              aria-label={`第 3 页：${activeWork.name} 技术架构`}
              className="relative flex h-dvh w-full shrink-0 flex-col justify-center overflow-hidden px-12 pt-24 pb-12"
            >
              <div className="mx-auto grid w-full max-w-[1040px] grid-cols-12 items-center gap-10">
                <div className="col-span-8">
                  <div className="text-xs font-medium tracking-wide text-[#8f95a3]">
                    03. 技术架构 · {activeWork.enName}
                  </div>
                  <h2 className="mt-2.5 text-balance text-[34px] font-semibold tracking-tight text-[#f4f5f7]">
                    清晰解耦的分层工程实现
                  </h2>
                  <p className="mt-3.5 text-sm leading-[1.75] text-[#9aa0b0]">
                    {activeWork.detailArchitecture}
                  </p>

                  <div className="mt-7 divide-y divide-white/8 border-y border-white/8">
                    {visibleTechStack.map((layer) => (
                      <div
                        key={layer.layer}
                        className="grid grid-cols-12 items-baseline gap-4 py-4"
                      >
                        <div className="col-span-4 text-xs font-medium text-[#8f95a3]">
                          {layer.layer}
                        </div>
                        <div className="col-span-8">
                          <div className="font-mono text-sm font-medium text-[#f4f5f7]">
                            {layer.stack}
                          </div>
                          <div className="mt-1 text-xs text-[#8f95a3]">
                            {layer.note}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="col-span-4 flex flex-col gap-5">
                  <div className="rounded-2xl border border-white/8 bg-[#101218]/80 p-5">
                    <div className="text-xs font-medium text-[#8f95a3]">
                      开源许可与源码镜像
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-[#a8aebc]">
                      采用{" "}
                      <span className="font-mono text-[#f4f5f7]">
                        {activeWork.license}
                      </span>{" "}
                      开源协议，代码同步托管于 GitHub 与国内高速 Gitee
                      镜像，右上角可随时一键直达。
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* SLIDE 4 */}
            <section
              aria-label={`第 4 页：${activeWork.name} 版本演进`}
              className="relative flex h-dvh w-full shrink-0 flex-col justify-between overflow-hidden px-12 pt-24 pb-6"
            >
              <div className="mx-auto my-auto w-full max-w-[1040px]">
                <div className="text-xs font-medium tracking-wide text-[#8f95a3]">
                  04. 版本演进 · {activeWork.name}
                </div>
                <h2 className="mt-2.5 text-balance text-[34px] font-semibold tracking-tight text-[#f4f5f7]">
                  持续打磨的迭代脉络
                </h2>

                <div className="mt-7 divide-y divide-white/8 border-y border-white/8">
                  {visibleReleases.map((rel) => (
                    <div
                      key={rel.version}
                      className="grid grid-cols-12 items-baseline gap-2 py-5"
                    >
                      <div className="col-span-4 flex items-center gap-4">
                        <span
                          style={{ color: activeWork.accentHex }}
                          className="font-mono text-sm font-semibold tabular-nums"
                        >
                          {rel.version}
                        </span>
                        <span className="font-mono text-xs tabular-nums text-[#7e8494]">
                          {rel.date}
                        </span>
                      </div>
                      <p className="col-span-8 text-sm leading-relaxed text-[#b8becb]">
                        {rel.summary}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-9 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      href={`/works/${activeWork.slug}`}
                      className="inline-flex h-11 items-center gap-2 rounded-full bg-[#f4f5f7] px-5 text-sm font-medium whitespace-nowrap text-[#08090c] transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/75"
                    >
                      <span>阅读完整作品档案</span>
                      <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => goToSlide(0)}
                      className="inline-flex h-11 items-center gap-2 rounded-full border border-white/14 bg-[#12151c] px-5 text-sm font-medium whitespace-nowrap text-[#d6dae4] transition-colors hover:border-white/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                    >
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>返回首页封面</span>
                    </button>
                  </div>

                  {nextWork && (
                    <button
                      type="button"
                      onClick={() => handleStepWork(1)}
                      className="group inline-flex h-11 items-center gap-3 rounded-full border border-white/12 bg-transparent px-5 text-sm text-[#c4c9d6] transition-colors hover:border-white/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                    >
                      <span className="text-xs text-[#878d9c]">下一件作品</span>
                      <span className="font-medium text-[#f4f5f7]">
                        {nextWork.name}
                      </span>
                      <ArrowRight
                        className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </button>
                  )}
                </div>
              </div>

              <div className="mx-auto w-full max-w-[1040px]">
                <SiteFooter footer={footer} variant="inline" />
              </div>
            </section>
          </motion.div>
        </main>
      ) : (
        <main
          key="mobile-hybrid-flow"
          ref={mobileScrollRef}
          data-testid="mobile-scroll-container"
          className="relative z-10 h-dvh w-full overflow-x-hidden overflow-y-auto overscroll-y-contain"
        >
          {/* Mobile Page 1 */}
          <section
            ref={slideOneRef}
            aria-label={`第 1 页：${activeWork.name} 概览`}
            className="relative flex min-h-dvh h-dvh w-full shrink-0 flex-col justify-center px-5 pt-20 pb-14 sm:px-8"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeWork.id}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.48, ease: SLIDE_EASE }}
                className="mx-auto flex w-full max-w-[640px] flex-col"
              >
                <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-[#9499a6]">
                  <span style={{ color: activeWork.accentHex }}>
                    {activeWork.category}
                  </span>
                  <span aria-hidden="true" className="text-white/20">
                    ·
                  </span>
                  <span className="font-mono tabular-nums">
                    {activeWork.version}
                  </span>
                  <span aria-hidden="true" className="text-white/20">
                    ·
                  </span>
                  <span className="font-mono tabular-nums">
                    {activeWork.year}
                  </span>
                  <span aria-hidden="true" className="text-white/20">
                    ·
                  </span>
                  <span>{activeWork.license}</span>
                </div>

                <h1 className="mt-3.5 text-balance text-3xl font-semibold tracking-tight text-[#f4f5f7] sm:text-4xl">
                  {activeWork.name}
                </h1>

                <PlatformPillRow
                  platforms={activeWork.platforms}
                  className="mt-3"
                />

                <p className="mt-3.5 text-sm leading-relaxed text-[#9fa5b5] sm:text-[15px]">
                  {activeWork.summary}
                </p>

                <div
                  ref={heroAnchorRef}
                  aria-hidden="true"
                  className="mt-5 h-[92px] w-full sm:mt-7 sm:h-12"
                />

                <div className="relative mt-5 aspect-[16/9] max-h-[220px] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#111319] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.85)] sm:max-h-[280px]">
                  {!failedImages[activeWork.id] ? (
                    <Image
                      src={activeWork.heroImage}
                      alt={activeWork.heroAlt}
                      fill
                      priority
                      sizes="100vw"
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setFailedImages((prev) => ({
                          ...prev,
                          [activeWork.id]: true,
                        }))
                      }
                      className="object-cover"
                    />
                  ) : (
                    <div
                      style={{
                        background: `linear-gradient(135deg, #13161e 0%, ${activeWork.accentHex}26 100%)`,
                      }}
                      className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center"
                    >
                      <WorkIcon
                        iconKey={activeWork.iconKey}
                        className="h-9 w-9 text-white/80"
                      />
                      <span className="text-sm font-medium text-white/85">
                        {activeWork.name} · {activeWork.enName}
                      </span>
                    </div>
                  )}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#08090c]/55 via-transparent to-transparent"
                  />
                  <div className="absolute right-4 bottom-3 left-4 flex items-center justify-between text-xs text-white/75">
                    <span className="font-mono tracking-wide">
                      {activeWork.enName}
                    </span>
                    <span className="font-mono tabular-nums text-white/60">
                      {activeWork.version}
                    </span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.68, delay: 0.32, ease: SLIDE_EASE }}
              className="absolute right-0 bottom-5 left-0 flex justify-center"
            >
              <button
                type="button"
                onClick={() => animateMobileScrollTo("content")}
                aria-label="向下滚动查看第二页：核心亮点"
                className="group flex items-center gap-2 rounded-full px-4 py-2 text-xs text-[#8f95a3] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                <span>向下滚动探索核心亮点</span>
                <ArrowDown
                  className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-y-0.5"
                  aria-hidden="true"
                />
              </button>
            </motion.div>
          </section>

          {/* Mobile Page 2+ Free Scroll */}
          <div
            data-testid="mobile-free-scroll-content"
            className="mx-auto w-full max-w-[680px] space-y-16 px-5 pt-20 pb-6 sm:px-8"
          >
            <section aria-label={`第 2 部分：${activeWork.name} 核心亮点`}>
              <FadeInBlock>
                <div className="border-b border-white/8 pb-5">
                  <div className="text-xs font-medium tracking-wide text-[#8f95a3]">
                    02. 核心亮点 · {activeWork.name}
                  </div>
                  <h2 className="mt-2 text-balance text-2xl font-semibold tracking-tight text-[#f4f5f7]">
                    为创作者打磨的三大关键能力
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-[#9499a6]">
                    {activeWork.detailIntro}
                  </p>
                </div>
              </FadeInBlock>

              <div className="mt-6 space-y-4">
                {visibleHighlights.map((item, idx) => (
                  <FadeInBlock key={item.index} delay={idx * 0.06}>
                    <article className="rounded-2xl border border-white/8 bg-[#101218]/90 p-5">
                      <span
                        style={{ color: activeWork.accentHex }}
                        className="font-mono text-xs font-medium tabular-nums"
                      >
                        {item.index}
                      </span>
                      <h3 className="mt-2.5 text-base font-semibold tracking-tight text-[#f4f5f7]">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm leading-[1.7] text-[#9aa0b0]">
                        {item.description}
                      </p>
                    </article>
                  </FadeInBlock>
                ))}
              </div>

              <FadeInBlock className="mt-7 grid grid-cols-1 gap-5 border-t border-white/8 pt-6 sm:grid-cols-3">
                {visibleMetrics.map((metric) => (
                  <div key={metric.label} className="flex flex-col">
                    <span className="font-mono text-2xl font-semibold tabular-nums text-[#f4f5f7]">
                      {metric.value}
                    </span>
                    <span className="mt-1 text-sm font-medium text-[#c5cad6]">
                      {metric.label}
                    </span>
                    <span className="mt-0.5 text-xs text-[#7d8392]">
                      {metric.context}
                    </span>
                  </div>
                ))}
              </FadeInBlock>
            </section>

            <section aria-label={`第 3 部分：${activeWork.name} 技术架构`}>
              <FadeInBlock>
                <div className="text-xs font-medium tracking-wide text-[#8f95a3]">
                  03. 技术架构 · {activeWork.enName}
                </div>
                <h2 className="mt-2 text-balance text-2xl font-semibold tracking-tight text-[#f4f5f7]">
                  清晰解耦的分层工程实现
                </h2>
                <p className="mt-3 text-sm leading-[1.75] text-[#9aa0b0]">
                  {activeWork.detailArchitecture}
                </p>
              </FadeInBlock>

              <FadeInBlock className="mt-6 divide-y divide-white/8 border-y border-white/8">
                {visibleTechStack.map((layer) => (
                  <div key={layer.layer} className="space-y-1 py-4">
                    <div className="text-xs font-medium text-[#8f95a3]">
                      {layer.layer}
                    </div>
                    <div className="font-mono text-sm font-medium text-[#f4f5f7]">
                      {layer.stack}
                    </div>
                    <div className="text-xs text-[#8f95a3]">{layer.note}</div>
                  </div>
                ))}
              </FadeInBlock>

              <FadeInBlock className="mt-6">
                <div className="rounded-2xl border border-white/8 bg-[#101218]/80 p-5">
                  <div className="text-xs font-medium text-[#8f95a3]">
                    开源许可与源码镜像
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-[#a8aebc]">
                    采用{" "}
                    <span className="font-mono text-[#f4f5f7]">
                      {activeWork.license}
                    </span>{" "}
                    开源协议，代码同步托管于 GitHub 与国内高速 Gitee
                    镜像，右上角可随时一键直达。
                  </p>
                </div>
              </FadeInBlock>
            </section>

            <section aria-label={`第 4 部分：${activeWork.name} 版本演进`}>
              <FadeInBlock>
                <div className="text-xs font-medium tracking-wide text-[#8f95a3]">
                  04. 版本演进 · {activeWork.name}
                </div>
                <h2 className="mt-2 text-balance text-2xl font-semibold tracking-tight text-[#f4f5f7]">
                  持续打磨的迭代脉络
                </h2>
              </FadeInBlock>

              <FadeInBlock className="mt-6 divide-y divide-white/8 border-y border-white/8">
                {visibleReleases.map((rel) => (
                  <div key={rel.version} className="space-y-1.5 py-4">
                    <div className="flex items-center gap-3">
                      <span
                        style={{ color: activeWork.accentHex }}
                        className="font-mono text-sm font-semibold tabular-nums"
                      >
                        {rel.version}
                      </span>
                      <span className="font-mono text-xs tabular-nums text-[#7e8494]">
                        {rel.date}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-[#b8becb]">
                      {rel.summary}
                    </p>
                  </div>
                ))}
              </FadeInBlock>

              <FadeInBlock className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href={`/works/${activeWork.slug}`}
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-[#f4f5f7] px-5 text-sm font-medium whitespace-nowrap text-[#08090c] transition-colors hover:bg-white"
                >
                  <span>阅读完整作品档案</span>
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>

                <button
                  type="button"
                  onClick={() => animateMobileScrollTo("hero")}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-white/14 bg-[#12151c] px-4 text-sm font-medium whitespace-nowrap text-[#d6dae4] transition-colors hover:border-white/30 hover:text-white"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>返回首页封面</span>
                </button>

                {nextWork && (
                  <button
                    type="button"
                    onClick={() => handleStepWork(1)}
                    className="group inline-flex h-10 items-center gap-2.5 rounded-full border border-white/12 bg-transparent px-4 text-sm text-[#c4c9d6] transition-colors hover:border-white/30 hover:text-white"
                  >
                    <span className="text-xs text-[#878d9c]">下一件作品</span>
                    <span className="font-medium text-[#f4f5f7]">
                      {nextWork.name}
                    </span>
                    <ArrowRight
                      className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </button>
                )}
              </FadeInBlock>
            </section>

            <FadeInBlock>
              <SiteFooter footer={footer} variant="inline" />
            </FadeInBlock>
          </div>
        </main>
      )}

      {/* 右侧 PPT 分页导航轨（仅桌面端） */}
      <motion.nav
        aria-label="幻灯片页面导航"
        initial={prefersReducedMotion ? false : { opacity: 0, x: 14 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.72, delay: 0.26, ease: SLIDE_EASE }}
        className="fixed top-1/2 right-4 z-30 hidden -translate-y-1/2 flex-col items-center gap-3 lg:right-7 lg:flex"
      >
        <button
          type="button"
          onClick={() => stepSlide(-1)}
          disabled={slideIndex === 0}
          aria-label="上一页"
          className="flex h-8 w-8 items-center justify-center rounded-full text-[#8a909e] transition-colors hover:bg-white/8 hover:text-white disabled:opacity-25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
        </button>

        <div className="flex flex-col items-center gap-2.5 py-1">
          {SLIDE_TITLES.map((title, idx) => {
            const isCurrent = idx === slideIndex;
            return (
              <button
                key={title}
                type="button"
                onClick={() => goToSlide(idx)}
                aria-label={`跳转到第 ${idx + 1} 页：${title}`}
                aria-current={isCurrent ? "step" : undefined}
                className="group relative flex h-6 w-6 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                <span
                  style={{
                    backgroundColor: isCurrent
                      ? activeWork.accentHex
                      : "rgba(255,255,255,0.22)",
                  }}
                  className={`block rounded-full transition-all duration-300 ${
                    isCurrent
                      ? "h-5 w-1.5"
                      : "h-1.5 w-1.5 group-hover:bg-white/60"
                  }`}
                />
                <span className="pointer-events-none absolute right-8 whitespace-nowrap rounded-md border border-white/10 bg-[#14171f]/95 px-2 py-0.5 text-[11px] text-[#e6e9f0] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  0{idx + 1} · {title}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => stepSlide(1)}
          disabled={slideIndex === TOTAL_SLIDES - 1}
          aria-label="下一页"
          className="flex h-8 w-8 items-center justify-center rounded-full text-[#8a909e] transition-colors hover:bg-white/8 hover:text-white disabled:opacity-25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
        </button>

        <span className="mt-1 font-mono text-[11px] tabular-nums text-[#7a808f]">
          0{slideIndex + 1}/0{TOTAL_SLIDES}
        </span>
      </motion.nav>
    </div>
  );
}
