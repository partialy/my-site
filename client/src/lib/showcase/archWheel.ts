/**
 * 左侧凸弧时钟轮盘与全屏 PPT 垂直切页的纯几何及状态逻辑。
 * 与 React / DOM 解耦，便于单元测试和复用。
 */

export const SLOT_STEP_DEG = 30;
export const SLOTS_PER_CIRCLE = 12;
export const VISIBLE_HALF_ARC_DEG = 84;
export const ACCESSIBLE_HALF_ARC_DEG = 68;

export interface RingSlot {
  slotIndex: number;
  workIndex: number;
  baseAngleDeg: number;
}

export interface SlotVisualState {
  effectiveAngleDeg: number;
  isActive: boolean;
  isVisible: boolean;
  isAccessible: boolean;
  scale: number;
  opacity: number;
  nodeScale: number;
  showTitle: boolean;
}

/**
 * 将任意角度归一化到 (-180, 180] 区间。
 */
export function normalizeAngleDeg(deg: number): number {
  let n = ((deg % 360) + 360) % 360;
  if (n > 180) {
    n -= 360;
  }
  return n === 0 ? 0 : n;
}

/**
 * 构建 12 槽位 360° 时钟圆环（每槽间隔 30°）。
 */
export function buildRingSlots(workCount: number): RingSlot[] {
  if (workCount <= 0) return [];
  const slots: RingSlot[] = [];
  for (let i = 0; i < SLOTS_PER_CIRCLE; i++) {
    slots.push({
      slotIndex: i,
      workIndex: i % workCount,
      baseAngleDeg: i * SLOT_STEP_DEG,
    });
  }
  return slots;
}

/**
 * 计算任意连续旋转角下，物理槽位（0..11）对应的无限循环作品索引。
 * 槽位在可见前半圆（-90°..+90°）移动时作品索引保持不变，仅在不可见背面（约 ±180°）复用切换。
 */
export function getVirtualWorkIndexForSlot(
  slotIndex: number,
  rotationDeg: number,
  workCount: number
): number {
  if (workCount <= 0) return 0;
  const centerStep = Math.round(-rotationDeg / SLOT_STEP_DEG);
  const slotBaseDeg = slotIndex * SLOT_STEP_DEG;
  const effectiveDeg = normalizeAngleDeg(slotBaseDeg + rotationDeg);
  const offsetSteps = Math.round(effectiveDeg / SLOT_STEP_DEG);
  const virtualIndex = centerStep + offsetSteps;
  return ((virtualIndex % workCount) + workCount) % workCount;
}

/**
 * 根据当前旋转角和点击槽位的基准角，计算将其沿最短路径旋至 0°（3 点钟方向）的新角度。
 */
export function computeRotationForSlot(
  currentRotationDeg: number,
  slotBaseAngleDeg: number
): number {
  const currentEffective = normalizeAngleDeg(
    slotBaseAngleDeg + currentRotationDeg
  );
  return currentRotationDeg - currentEffective;
}

/**
 * 根据当前旋转角和目标作品索引，沿最短模步数旋至 0°（3 点钟方向）。
 */
export function computeRotationForWorkIndex(
  currentRotationDeg: number,
  targetWorkIndex: number,
  workCount: number
): number {
  if (workCount <= 0) return currentRotationDeg;
  const currentWork = getActiveWorkIndexFromRotation(
    currentRotationDeg,
    workCount
  );
  const normalizedTarget =
    ((targetWorkIndex % workCount) + workCount) % workCount;

  let stepDelta = normalizedTarget - currentWork;
  if (stepDelta > workCount / 2) {
    stepDelta -= workCount;
  } else if (stepDelta < -workCount / 2) {
    stepDelta += workCount;
  }

  return currentRotationDeg - stepDelta * SLOT_STEP_DEG;
}

/**
 * 单步旋转轮盘（+1 顺向切换下一个作品，-1 逆向切换上一个作品）。
 */
export function computeStepRotation(
  currentRotationDeg: number,
  step: 1 | -1
): number {
  return currentRotationDeg - step * SLOT_STEP_DEG;
}

/**
 * 根据当前旋转角反推处于 3 点钟（0°）激活位置的作品索引。
 */
export function getActiveWorkIndexFromRotation(
  rotationDeg: number,
  workCount: number
): number {
  if (workCount <= 0) return 0;
  const rawIndex = Math.round(-rotationDeg / SLOT_STEP_DEG);
  return ((rawIndex % workCount) + workCount) % workCount;
}

/**
 * 根据槽位相对 3 点钟方向（0°）的归一化有效角度，计算视觉权重、缩放、透明度与可访问性状态。
 */
export function computeSlotVisualState(
  effectiveAngleDeg: number
): SlotVisualState {
  const angle = normalizeAngleDeg(effectiveAngleDeg);
  const absAngle = Math.abs(angle);
  const isActive = absAngle < 12;
  const isVisible = absAngle <= VISIBLE_HALF_ARC_DEG + 16;
  const isAccessible = absAngle <= ACCESSIBLE_HALF_ARC_DEG;

  if (isActive) {
    return {
      effectiveAngleDeg: angle,
      isActive: true,
      isVisible: true,
      isAccessible: true,
      scale: 1.24,
      opacity: 1,
      nodeScale: 1.35,
      showTitle: true,
    };
  }

  const t = Math.min(absAngle / 95, 1);
  const scale = Number((1.0 - t * 0.22).toFixed(3));
  const opacity =
    absAngle > VISIBLE_HALF_ARC_DEG
      ? 0
      : Number(Math.max(0.28, 1 - t * 0.72).toFixed(3));

  return {
    effectiveAngleDeg: angle,
    isActive: false,
    isVisible,
    isAccessible,
    scale,
    opacity,
    nodeScale: 1,
    showTitle: false,
  };
}

/**
 * 极坐标转直角坐标（0° = 3 点钟，+90° = 6 点钟，-90° = 12 点钟）。
 */
export function polarToCartesian(
  radius: number,
  angleDeg: number
): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: Number((radius * Math.cos(rad)).toFixed(2)),
    y: Number((radius * Math.sin(rad)).toFixed(2)),
  };
}

/**
 * 将幻灯片索引限制在 [0, totalSlides - 1] 范围内。
 */
export function clampSlideIndex(
  current: number,
  delta: number,
  totalSlides: number
): number {
  if (totalSlides <= 0) return 0;
  return Math.max(0, Math.min(totalSlides - 1, current + delta));
}

/**
 * 滚轮翻页防抖门控：防止触控板惯性滑动一次跳过多页。
 */
export function evaluateWheelStep(
  nowMs: number,
  lastStepMs: number,
  deltaY: number,
  cooldownMs = 760,
  thresholdPx = 24
): -1 | 0 | 1 {
  if (Math.abs(deltaY) < thresholdPx) return 0;
  if (nowMs - lastStepMs < cooldownMs) return 0;
  return deltaY > 0 ? 1 : -1;
}
