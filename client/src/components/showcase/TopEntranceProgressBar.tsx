"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";

interface TopEntranceProgressBarProps {
  accentHex?: string;
}

const PROGRESS_EASE = [0.22, 1, 0.36, 1] as const;

export function TopEntranceProgressBar({
  accentHex = "#e5a93c",
}: TopEntranceProgressBarProps) {
  const prefersReducedMotion = useReducedMotion();
  const [completed, setCompleted] = useState(false);

  if (prefersReducedMotion || completed) {
    return null;
  }

  return (
    <motion.div
      aria-hidden="true"
      data-testid="global-entrance-progress"
      initial={{ opacity: 1 }}
      animate={{ opacity: [1, 1, 0] }}
      transition={{
        duration: 1.5,
        times: [0, 0.74, 1],
        ease: PROGRESS_EASE,
      }}
      onAnimationComplete={() => setCompleted(true)}
      className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[2px] w-full overflow-hidden bg-white/[0.06]"
    >
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{
          duration: 1.08,
          ease: PROGRESS_EASE,
        }}
        style={{
          transformOrigin: "0% 50%",
          backgroundImage: `linear-gradient(90deg, rgba(244, 245, 247, 0.25) 0%, #f4f5f7 72%, ${accentHex} 100%)`,
          boxShadow: `0 0 12px ${accentHex}66`,
        }}
        className="h-full w-full will-change-transform"
      />
    </motion.div>
  );
}
