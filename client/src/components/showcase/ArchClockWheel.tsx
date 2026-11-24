"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, ChevronDown, ChevronUp } from "lucide-react";
import type { WorkItem } from "@/services/types";
import {
  buildRingSlots,
  computeSlotVisualState,
  evaluateWheelStep,
  getVirtualWorkIndexForSlot,
  polarToCartesian,
  SLOT_STEP_DEG,
  SLOTS_PER_CIRCLE,
} from "@/lib/showcase/archWheel";
import { WorkIcon } from "@/components/showcase/WorkIcon";

interface ArchClockWheelProps {
  works: WorkItem[];
  activeWorkIndex: number;
  rotationDeg: number;
  onSelectSlot: (slotBaseAngleDeg: number, workIndex: number) => void;
  onStep: (direction: 1 | -1) => void;
}

const ARCH_RADIUS = 290;
const CENTER_X = -124;
const ARCH_EASE = [0.22, 1, 0.36, 1] as const;
const WHEEL_TRANSITION = {
  duration: 0.78,
  ease: ARCH_EASE,
};
const ENTRANCE_WHEEL_TRANSITION = {
  duration: 1.05,
  delay: 0.06,
  ease: ARCH_EASE,
};
const ENTRANCE_SWEEP_DEG = 18;

function describeArcSegment(
  cx: number,
  cy: number,
  radius: number,
  startAngleDeg: number,
  endAngleDeg: number
): string {
  const startRad = (startAngleDeg * Math.PI) / 180;
  const endRad = (endAngleDeg * Math.PI) / 180;
  const x1 = cx + radius * Math.cos(startRad);
  const y1 = cy + radius * Math.sin(startRad);
  const x2 = cx + radius * Math.cos(endRad);
  const y2 = cy + radius * Math.sin(endRad);
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${radius} ${radius} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

export function ArchClockWheel({
  works,
  activeWorkIndex,
  rotationDeg,
  onSelectSlot,
  onStep,
}: ArchClockWheelProps) {
  const lastWheelMsRef = useRef<number>(0);
  const hoverCloseTimerRef = useRef<number | null>(null);
  const [isActivePreviewOpen, setIsActivePreviewOpen] =
    useState<boolean>(false);
  const prefersReducedMotion = useReducedMotion();
  const [initialRotationDeg] = useState<number>(rotationDeg);
  const isInitialPose = rotationDeg === initialRotationDeg;
  const activeWheelTransition =
    isInitialPose && !prefersReducedMotion
      ? ENTRANCE_WHEEL_TRANSITION
      : WHEEL_TRANSITION;
  const ringSlots = useMemo(() => buildRingSlots(works.length), [works.length]);

  const openActivePreview = useCallback(() => {
    if (hoverCloseTimerRef.current !== null) {
      window.clearTimeout(hoverCloseTimerRef.current);
      hoverCloseTimerRef.current = null;
    }
    setIsActivePreviewOpen(true);
  }, []);

  const scheduleCloseActivePreview = useCallback(() => {
    if (hoverCloseTimerRef.current !== null) {
      window.clearTimeout(hoverCloseTimerRef.current);
    }
    hoverCloseTimerRef.current = window.setTimeout(() => {
      setIsActivePreviewOpen(false);
      hoverCloseTimerRef.current = null;
    }, 120);
  }, []);

  useEffect(() => {
    return () => {
      if (hoverCloseTimerRef.current !== null) {
        window.clearTimeout(hoverCloseTimerRef.current);
      }
    };
  }, []);

  const arcPaths = useMemo(() => {
    const cx = ARCH_RADIUS;
    const cy = ARCH_RADIUS;
    const gapDeg = 4.6;
    const segments: string[] = [];
    for (let i = 0; i < SLOTS_PER_CIRCLE; i++) {
      const start = i * SLOT_STEP_DEG + gapDeg;
      const end = (i + 1) * SLOT_STEP_DEG - gapDeg;
      segments.push(describeArcSegment(cx, cy, ARCH_RADIUS, start, end));
    }
    return segments;
  }, []);

  const tickMarks = useMemo(() => {
    const cx = ARCH_RADIUS;
    const cy = ARCH_RADIUS;
    const ticks: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (let deg = 0; deg < 360; deg += 5) {
      if (deg % SLOT_STEP_DEG === 0) continue;
      const rad = (deg * Math.PI) / 180;
      const innerR = ARCH_RADIUS - 7;
      const outerR = ARCH_RADIUS - 2;
      ticks.push({
        x1: Number((cx + innerR * Math.cos(rad)).toFixed(2)),
        y1: Number((cy + innerR * Math.sin(rad)).toFixed(2)),
        x2: Number((cx + outerR * Math.cos(rad)).toFixed(2)),
        y2: Number((cy + outerR * Math.sin(rad)).toFixed(2)),
      });
    }
    return ticks;
  }, []);

  const handleArchWheel = (event: React.WheelEvent<HTMLElement>) => {
    event.stopPropagation();
    const now = Date.now();
    const step = evaluateWheelStep(
      now,
      lastWheelMsRef.current,
      event.deltaY,
      520,
      20
    );
    if (step !== 0) {
      lastWheelMsRef.current = now;
      onStep(step);
    }
  };

  const activeWork = works[activeWorkIndex] ?? works[0];
  const activeCoreTags = useMemo(() => {
    const firstLayer = activeWork?.techStack?.[0]?.stack ?? "";
    return firstLayer
      .split("·")
      .map((token) => token.trim())
      .filter(Boolean)
      .slice(0, 3);
  }, [activeWork]);

  return (
    <>
      <motion.aside
        aria-label="作品时钟轮盘导航"
        data-testid="arch-clock-wheel"
        onWheel={handleArchWheel}
        initial={prefersReducedMotion ? false : { opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.9, delay: 0.04, ease: ARCH_EASE }}
        className="pointer-events-auto fixed inset-y-0 left-0 z-30 hidden w-[368px] select-none lg:block"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-[340px] bg-gradient-to-r from-[#08090c] via-[#08090c]/88 to-transparent"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-0 flex -translate-y-1/2 items-center"
        >
          <motion.div
            initial={prefersReducedMotion ? false : { scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: ARCH_EASE }}
            style={{ transformOrigin: "0% 50%" }}
            className="h-px w-[128px] bg-gradient-to-r from-transparent via-white/10 to-white/20"
          />
        </div>

        <motion.div
          initial={
            prefersReducedMotion
              ? false
              : {
                  rotate: initialRotationDeg - ENTRANCE_SWEEP_DEG,
                  scale: 0.96,
                  opacity: 0,
                }
          }
          animate={{ rotate: rotationDeg, scale: 1, opacity: 1 }}
          transition={{
            rotate: activeWheelTransition,
            scale: { duration: 1.0, delay: 0.06, ease: ARCH_EASE },
            opacity: { duration: 0.72, delay: 0.06, ease: ARCH_EASE },
          }}
          style={{
            width: ARCH_RADIUS * 2,
            height: ARCH_RADIUS * 2,
            left: CENTER_X - ARCH_RADIUS,
            top: `calc(50% - ${ARCH_RADIUS}px)`,
          }}
          className="absolute will-change-transform"
        >
          <svg
            width={ARCH_RADIUS * 2}
            height={ARCH_RADIUS * 2}
            viewBox={`0 0 ${ARCH_RADIUS * 2} ${ARCH_RADIUS * 2}`}
            className="pointer-events-none absolute inset-0 overflow-visible"
            aria-hidden="true"
          >
            <circle
              cx={ARCH_RADIUS}
              cy={ARCH_RADIUS}
              r={ARCH_RADIUS - 16}
              fill="none"
              stroke="rgba(255,255,255,0.045)"
              strokeWidth="1"
              strokeDasharray="2 6"
            />

            {tickMarks.map((tick, idx) => (
              <line
                key={idx}
                x1={tick.x1}
                y1={tick.y1}
                x2={tick.x2}
                y2={tick.y2}
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="1"
                strokeLinecap="round"
              />
            ))}

            {arcPaths.map((d, idx) => (
              <path
                key={idx}
                d={d}
                fill="none"
                stroke="rgba(244,245,247,0.34)"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            ))}
          </svg>

          {ringSlots.map((slot) => {
            const dynamicWorkIndex = getVirtualWorkIndexForSlot(
              slot.slotIndex,
              rotationDeg,
              works.length
            );
            const work = works[dynamicWorkIndex];
            if (!work) return null;

            const effectiveAngle = slot.baseAngleDeg + rotationDeg;
            const visual = computeSlotVisualState(effectiveAngle);
            const { x, y } = polarToCartesian(ARCH_RADIUS, slot.baseAngleDeg);

            return (
              <div
                key={slot.slotIndex}
                style={{
                  left: ARCH_RADIUS + x,
                  top: ARCH_RADIUS + y,
                }}
                className="absolute h-0 w-0"
              >
                <motion.div
                  initial={
                    prefersReducedMotion
                      ? false
                      : {
                          rotate: -(initialRotationDeg - ENTRANCE_SWEEP_DEG),
                          opacity: 0,
                        }
                  }
                  animate={{
                    rotate: -rotationDeg,
                    opacity: visual.opacity,
                  }}
                  transition={{
                    rotate: activeWheelTransition,
                    opacity: isInitialPose
                      ? { duration: 0.72, delay: 0.14, ease: ARCH_EASE }
                      : { duration: 0.35, ease: ARCH_EASE },
                  }}
                  style={{
                    transformOrigin: "0px 0px",
                    pointerEvents: visual.isAccessible ? "auto" : "none",
                  }}
                  className="relative h-0 w-0 will-change-transform"
                >
                  <button
                    type="button"
                    aria-label={`切换到作品：${work.name}（${work.enName}）`}
                    aria-current={visual.isActive ? "true" : undefined}
                    aria-hidden={!visual.isAccessible}
                    tabIndex={visual.isAccessible ? 0 : -1}
                    data-slot-active={visual.isActive ? "true" : "false"}
                    data-work-slug={work.slug}
                    onClick={() =>
                      onSelectSlot(slot.baseAngleDeg, dynamicWorkIndex)
                    }
                    onMouseEnter={
                      visual.isActive ? openActivePreview : undefined
                    }
                    onMouseLeave={
                      visual.isActive ? scheduleCloseActivePreview : undefined
                    }
                    onFocus={visual.isActive ? openActivePreview : undefined}
                    onBlur={
                      visual.isActive ? scheduleCloseActivePreview : undefined
                    }
                    className="group absolute top-0 left-0 flex -translate-x-2 -translate-y-1/2 items-center text-left focus-visible:outline-none"
                  >
                    <motion.span
                      animate={{
                        scale: visual.nodeScale,
                      }}
                      transition={WHEEL_TRANSITION}
                      style={{
                        borderColor: visual.isActive
                          ? work.accentHex
                          : "rgba(244, 245, 247, 0.55)",
                        backgroundColor: visual.isActive
                          ? work.accentHex
                          : "#08090c",
                        boxShadow: visual.isActive
                          ? `0 0 18px ${work.accentHex}66`
                          : "none",
                      }}
                      className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-300 group-hover:border-white"
                    >
                      {visual.isActive && (
                        <span className="h-1.5 w-1.5 rounded-full bg-[#08090c]" />
                      )}
                    </motion.span>

                    <motion.span
                      animate={{
                        scale: visual.scale,
                        x: visual.isActive ? 20 : 14,
                      }}
                      transition={WHEEL_TRANSITION}
                      style={{
                        borderColor: visual.isActive
                          ? `${work.accentHex}99`
                          : "rgba(255, 255, 255, 0.14)",
                        backgroundColor: visual.isActive
                          ? "rgba(20, 23, 30, 0.96)"
                          : "rgba(15, 17, 22, 0.85)",
                        boxShadow: visual.isActive
                          ? `0 12px 32px -8px rgba(0, 0, 0, 0.75), 0 0 0 1px ${work.accentHex}33`
                          : "0 6px 18px -6px rgba(0, 0, 0, 0.5)",
                      }}
                      className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border transition-colors duration-300 group-hover:border-white/45 group-focus-visible:ring-2 group-focus-visible:ring-white/70"
                    >
                      {work.iconImage ? (
                        <WorkIcon
                          iconKey={work.iconKey}
                          iconImage={work.iconImage}
                          alt={work.name}
                          className="h-5 w-5"
                          imgClassName="h-full w-full object-cover"
                          strokeWidth={visual.isActive ? 2 : 1.65}
                        />
                      ) : (
                        <span
                          style={{
                            color: visual.isActive
                              ? work.accentHex
                              : "rgba(244, 245, 247, 0.76)",
                          }}
                          className="transition-colors duration-300 group-hover:text-white"
                        >
                          <WorkIcon
                            iconKey={work.iconKey}
                            className="h-5 w-5"
                            strokeWidth={visual.isActive ? 2 : 1.65}
                          />
                        </span>
                      )}
                    </motion.span>

                    <motion.span
                      initial={
                        prefersReducedMotion ? false : { opacity: 0, x: -12 }
                      }
                      animate={{
                        opacity: visual.showTitle ? 1 : 0,
                        x: visual.showTitle ? 0 : -10,
                      }}
                      transition={{
                        duration: isInitialPose ? 0.62 : 0.42,
                        delay:
                          isInitialPose && visual.showTitle ? 0.28 : 0,
                        ease: ARCH_EASE,
                      }}
                      className={`absolute left-[96px] flex flex-col whitespace-nowrap ${
                        visual.isActive
                          ? "pointer-events-auto pr-4"
                          : "pointer-events-none"
                      }`}
                    >
                      <span className="text-[19px] font-semibold tracking-tight text-[#f4f5f7]">
                        {work.shortTitle}
                      </span>
                      <span className="mt-0.5 font-mono text-[11px] tracking-wide text-[#9499a6]">
                        {work.enName}
                      </span>
                    </motion.span>

                    {!visual.isActive && visual.isAccessible && (
                      <span className="pointer-events-none absolute left-[82px] translate-x-1 whitespace-nowrap text-xs font-medium text-[#b4b9c5] opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100">
                        {work.shortTitle}
                      </span>
                    )}
                  </button>
                </motion.div>
              </div>
            );
          })}
        </motion.div>

        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.32, ease: ARCH_EASE }}
          className="absolute bottom-7 left-7 flex items-center gap-2"
        >
          <button
            type="button"
            onClick={() => onStep(-1)}
            aria-label="旋转到上一个作品"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-[#12141a]/90 text-[#c4c8d4] transition-colors duration-200 hover:border-white/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <ChevronUp className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onStep(1)}
            aria-label="旋转到下一个作品"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-[#12141a]/90 text-[#c4c8d4] transition-colors duration-200 hover:border-white/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </button>
          <span className="ml-2 font-mono text-xs tabular-nums text-[#7c8291]">
            {String(activeWorkIndex + 1).padStart(2, "0")} /{" "}
            {String(works.length).padStart(2, "0")}
            <span className="mx-2 text-white/20">·</span>
            <span className="font-sans text-[#9fa5b5]">
              {activeWork?.shortTitle}
            </span>
          </span>
        </motion.div>
      </motion.aside>

      {/* 3 点钟激活作品悬浮预览卡片 */}
      <AnimatePresence>
        {isActivePreviewOpen && activeWork && (
          <motion.div
            key={`preview-${activeWork.id}`}
            data-testid="wheel-active-preview-card"
            role="region"
            aria-label={`${activeWork.name} 悬浮预览卡片`}
            onMouseEnter={openActivePreview}
            onMouseLeave={scheduleCloseActivePreview}
            initial={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, x: -12, scale: 0.96 }
            }
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, x: -8, scale: 0.97 }
            }
            transition={{
              duration: prefersReducedMotion ? 0.14 : 0.34,
              ease: ARCH_EASE,
            }}
            style={{ transformOrigin: "0% 50%" }}
            className="pointer-events-auto fixed top-1/2 left-[346px] z-[58] hidden w-[280px] -translate-y-1/2 overflow-hidden rounded-2xl border border-white/14 bg-[#0f121a]/95 backdrop-blur-2xl shadow-[0_28px_68px_-16px_rgba(0,0,0,0.92)] lg:block"
          >
            <div
              aria-hidden="true"
              style={{
                background: `linear-gradient(90deg, ${activeWork.accentHex}cc 0%, ${activeWork.accentHex}20 75%, transparent 100%)`,
              }}
              className="h-[2px] w-full"
            />

            <div className="p-4">
              <div className="flex items-center justify-between gap-2 text-[11px] text-[#8d93a3]">
                <div className="flex items-center gap-1.5 font-medium">
                  <span style={{ color: activeWork.accentHex }}>
                    {activeWork.category}
                  </span>
                  <span aria-hidden="true" className="text-white/22">
                    ·
                  </span>
                  <span className="font-mono tabular-nums">
                    {activeWork.version}
                  </span>
                  <span aria-hidden="true" className="text-white/22">
                    ·
                  </span>
                  <span>{activeWork.license}</span>
                </div>
              </div>

              <p className="mt-2.5 text-[13px] leading-[1.6] font-medium text-[#eceff5]">
                {activeWork.tagline}
              </p>

              {activeCoreTags.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {activeCoreTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md border border-white/[0.09] bg-white/[0.03] px-2 py-0.5 font-mono text-[10px] text-[#aeb4c2]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-3.5 flex items-center justify-between border-t border-white/[0.07] pt-2.5">
                <span className="font-mono text-[10px] text-[#7a808f]">
                  {activeWork.enName}
                </span>
                <Link
                  href={`/works/${activeWork.slug}`}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-[#d8dce6] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/60"
                >
                  <span>查看详情</span>
                  <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
