"use client";

import { useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Search, X } from "lucide-react";

interface PillSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputId?: string;
  compactCircle?: boolean;
  onExpandRequest?: () => void;
  pillWidthPx?: number;
  pillHeightPx?: number;
  circleSizePx?: number;
}

const MORPH_EASE = [0.22, 1, 0.36, 1] as const;

export function PillSearchInput({
  value,
  onChange,
  onSubmit,
  placeholder = "搜索",
  className = "",
  inputId = "global-works-search",
  compactCircle = false,
  onExpandRequest,
  pillWidthPx,
  pillHeightPx,
  circleSizePx = 34,
}: PillSearchInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (compactCircle && onExpandRequest) {
      onExpandRequest();
      return;
    }
    onSubmit(value);
  };

  const handleClear = () => {
    onChange("");
    inputRef.current?.focus();
  };

  if (typeof pillWidthPx === "number" && typeof pillHeightPx === "number") {
    const targetWidth = compactCircle ? circleSizePx : pillWidthPx;
    const targetHeight = compactCircle ? circleSizePx : pillHeightPx;
    const horizontalPad = compactCircle ? 0 : pillWidthPx <= 116 ? 10 : 14;

    return (
      <motion.form
        role="search"
        aria-label="搜索全部作品"
        data-search-mode={compactCircle ? "circle" : "pill"}
        onSubmit={handleFormSubmit}
        initial={false}
        animate={{
          width: targetWidth,
          height: targetHeight,
          paddingLeft: horizontalPad,
          paddingRight: horizontalPad,
        }}
        transition={{
          duration: prefersReducedMotion ? 0 : 0.62,
          ease: MORPH_EASE,
        }}
        className={`group relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border transition-colors duration-200 ${
          compactCircle
            ? "border-white/14 bg-[#13161d]/90 backdrop-blur-md hover:border-white/35 hover:bg-[#1a1e28]"
            : "border-white/22 bg-transparent hover:border-white/40 focus-within:border-white/70 focus-within:bg-white/[0.04]"
        } ${className}`}
      >
        <button
          type={compactCircle ? "button" : "submit"}
          onClick={compactCircle ? onExpandRequest : undefined}
          aria-label={compactCircle ? "展开搜索框" : "执行搜索"}
          className={`flex shrink-0 items-center justify-center transition-colors duration-200 focus-visible:outline-none ${
            compactCircle
              ? "h-full w-full text-[#e4e7ef] hover:text-white"
              : "text-[#9ea4b3] group-focus-within:text-[#f4f5f7] hover:text-white"
          }`}
        >
          <Search
            className={
              compactCircle || pillHeightPx <= 36 ? "h-3.5 w-3.5" : "h-4 w-4"
            }
            strokeWidth={1.8}
            aria-hidden="true"
          />
        </button>

        {!compactCircle && (
          <>
            <input
              ref={inputRef}
              id={inputId}
              type="search"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              aria-label="搜索作品"
              autoComplete="off"
              className={`ml-1.5 w-full min-w-0 bg-transparent text-[#f4f5f7] placeholder:text-[#8b91a0] focus:outline-none [&::-webkit-search-cancel-button]:hidden ${
                pillHeightPx <= 36 ? "text-xs" : "ml-2 text-[13px]"
              }`}
            />

            {value.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="清空搜索关键词"
                className="ml-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[#8b91a0] transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/60"
              >
                <X className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
              </button>
            )}
          </>
        )}
      </motion.form>
    );
  }

  return (
    <form
      role="search"
      aria-label="搜索全部作品"
      onSubmit={handleFormSubmit}
      className={`group relative flex h-10 w-[136px] shrink-0 items-center rounded-full border border-white/22 bg-transparent px-3 transition-colors duration-200 hover:border-white/40 focus-within:border-white/70 focus-within:bg-white/[0.03] sm:h-11 sm:w-[152px] sm:px-3.5 ${className}`}
    >
      <button
        type="submit"
        aria-label="执行搜索"
        className="flex shrink-0 items-center justify-center text-[#9ea4b3] transition-colors duration-200 group-focus-within:text-[#f4f5f7] hover:text-white focus-visible:outline-none"
      >
        <Search className="h-4 w-4" strokeWidth={1.7} aria-hidden="true" />
      </button>

      <input
        ref={inputRef}
        id={inputId}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="搜索作品"
        autoComplete="off"
        className="ml-2 w-full min-w-0 bg-transparent text-[13px] text-[#f4f5f7] placeholder:text-[#8b91a0] focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />

      {value.length > 0 && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="清空搜索关键词"
          className="ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[#8b91a0] transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/60"
        >
          <X className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
        </button>
      )}
    </form>
  );
}
