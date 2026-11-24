"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Compass, FolderKanban, Home, User, X } from "lucide-react";
import type { WorkItem } from "@/services/types";
import { WorkIcon } from "@/components/showcase/WorkIcon";

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  brandName: string;
  domainLabel: string;
  works: WorkItem[];
  activeWorkIndex: number;
  onSelectWork: (index: number) => void;
}

const DRAWER_EASE = [0.22, 1, 0.36, 1] as const;

export function MobileNavDrawer({
  isOpen,
  onClose,
  brandName,
  domainLabel,
  works,
  activeWorkIndex,
  onSelectWork,
}: MobileNavDrawerProps) {
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[75] lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="站点导航侧栏"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.28,
              ease: DRAWER_EASE,
            }}
            onClick={onClose}
            aria-hidden="true"
            className="fixed inset-0 bg-black/62 backdrop-blur-[2px]"
          />

          <motion.aside
            data-testid="mobile-nav-drawer"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.42,
              ease: DRAWER_EASE,
            }}
            className="fixed inset-y-0 left-0 flex w-[65vw] min-w-[238px] max-w-[320px] flex-col border-r border-white/10 bg-[#0b0d13]/92 backdrop-blur-2xl shadow-[24px_0_64px_rgba(0,0,0,0.75)]"
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-4">
              <Link
                href="/"
                onClick={onClose}
                className="flex min-w-0 items-center gap-2.5 focus-visible:outline-none"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/14 bg-gradient-to-br from-white/12 to-white/[0.03] text-[#e5a93c] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]">
                  <Compass
                    className="h-[18px] w-[18px]"
                    strokeWidth={1.85}
                    aria-hidden="true"
                  />
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold tracking-tight text-[#f4f5f7]">
                    {brandName}
                  </div>
                  <div className="truncate font-mono text-[10px] text-[#7f8594]">
                    {domainLabel}
                  </div>
                </div>
              </Link>

              <button
                type="button"
                onClick={onClose}
                aria-label="关闭侧栏"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#8f95a3] transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-4">
              <div className="px-2 pb-2 text-[11px] font-medium tracking-wider text-[#747a88]">
                作品列表 · {String(works.length).padStart(2, "0")}
              </div>

              <ul className="space-y-1">
                {works.map((work, idx) => {
                  const isActive = idx === activeWorkIndex;
                  return (
                    <li key={work.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectWork(idx);
                          onClose();
                        }}
                        aria-current={isActive ? "true" : undefined}
                        className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${
                          isActive
                            ? "bg-white/[0.08] text-[#f4f5f7]"
                            : "text-[#9aa0b0] hover:bg-white/[0.04] hover:text-[#e6e9f0]"
                        }`}
                      >
                        <span
                          style={{
                            borderColor: isActive
                              ? `${work.accentHex}70`
                              : "rgba(255,255,255,0.1)",
                            color: isActive ? work.accentHex : "#9aa0b0",
                          }}
                          className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-[#12151d]"
                        >
                          <WorkIcon
                            iconKey={work.iconKey}
                            iconImage={work.iconImage}
                            alt={work.name}
                            className="h-4 w-4"
                            imgClassName="h-full w-full object-cover"
                          />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[13px] font-medium leading-tight">
                            {work.name}
                          </div>
                          <div className="mt-0.5 truncate font-mono text-[10px] text-[#787e8d]">
                            {work.enName}
                          </div>
                        </div>
                        {isActive && (
                          <span
                            style={{ backgroundColor: work.accentHex }}
                            className="h-1.5 w-1.5 shrink-0 rounded-full"
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <nav
              aria-label="切换页面"
              className="border-t border-white/[0.08] px-3 py-3.5"
            >
              <div className="px-2 pb-2 text-[11px] font-medium tracking-wider text-[#747a88]">
                切换页面
              </div>
              <div className="space-y-1">
                <Link
                  href="/"
                  onClick={onClose}
                  className="flex items-center gap-2.5 rounded-xl bg-white/[0.06] px-2.5 py-2 text-[13px] font-medium text-[#f4f5f7] transition-colors hover:bg-white/[0.1]"
                >
                  <Home
                    className="h-4 w-4 text-[#c7ccd8]"
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />
                  <span>作品展厅</span>
                </Link>
                <Link
                  href="/works"
                  onClick={onClose}
                  className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium text-[#9aa0b0] transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  <FolderKanban
                    className="h-4 w-4"
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />
                  <span>全部作品</span>
                </Link>
                <Link
                  href="/about"
                  onClick={onClose}
                  className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium text-[#9aa0b0] transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  <User
                    className="h-4 w-4"
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />
                  <span>关于作者</span>
                </Link>
              </div>
            </nav>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
