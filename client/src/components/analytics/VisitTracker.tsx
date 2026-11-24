"use client";

import { useEffect } from "react";
import { trackVisit } from "@/lib/analytics/visitTracker";

/**
 * 在浏览器端首次加载时上报页面访问（POST /api/v1/visits）。
 * 内部已基于 localStorage 与 UTC 日期做每日去重。
 */
export function VisitTracker() {
  useEffect(() => {
    void trackVisit();
  }, []);

  return null;
}
