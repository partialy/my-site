/**
 * 移动端混合滚动几何与状态辅助函数：
 * - 第 1 页（封面）使用单屏 PPT 吸附切换（0 <-> heroHeight）
 * - 第 2 页起完全使用原生自由滚动，不劫持滚动手势
 */

export type MobileSnapAction = "snap-to-content" | "snap-to-hero" | "none";

export function evaluateMobilePptGesture(
  scrollTop: number,
  heroHeight: number,
  deltaY: number,
  isAnimatingSnap: boolean,
  threshold = 20
): MobileSnapAction {
  if (isAnimatingSnap || heroHeight <= 0) return "none";
  if (Math.abs(deltaY) < threshold) return "none";

  if (scrollTop <= 12 && deltaY > 0) {
    return "snap-to-content";
  }

  if (scrollTop > 12 && scrollTop <= heroHeight + 16 && deltaY < 0) {
    return "snap-to-hero";
  }

  return "none";
}

export function shouldMobileHeaderBeCompact(
  scrollTop: number,
  heroHeight: number
): boolean {
  if (heroHeight <= 0) return false;
  return scrollTop >= heroHeight * 0.28;
}

export function easeOutQuinticBezier(t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  return 1 - Math.pow(1 - clamped, 4);
}
