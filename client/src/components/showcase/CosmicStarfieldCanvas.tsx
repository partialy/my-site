"use client";

import { useEffect, useRef } from "react";

interface StarParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  tint: "white" | "blue" | "amber";
}

interface LoopNode {
  angle: number;
  distFactor: number;
  radius: number;
  isAmber: boolean;
  wobblePhase: number;
  wobbleSpeed: number;
  wobbleAmp: number;
}

interface StarlinkLoop {
  cx: number;
  cy: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  rotSpeed: number;
  nodes: LoopNode[];
  chords: [number, number][];
}

const STAR_COLORS: Record<StarParticle["tint"], string> = {
  white: "234, 240, 252",
  blue: "184, 212, 255",
  amber: "242, 184, 99",
};

function createStarfield(
  width: number,
  height: number
): {
  stars: StarParticle[];
  loops: StarlinkLoop[];
} {
  const isCompact = width < 768;
  const starCount = isCompact ? 28 : 54;
  const loopCount = isCompact ? 2 : 4;

  const stars: StarParticle[] = Array.from({ length: starCount }, (_, idx) => {
    const roll = (idx * 37) % 100;
    const tint: StarParticle["tint"] =
      roll < 18 ? "amber" : roll < 44 ? "blue" : "white";
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.04 + Math.random() * 0.1;

    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 0.65 + Math.random() * 1.15,
      baseAlpha: 0.18 + Math.random() * 0.38,
      twinkleSpeed: 0.0007 + Math.random() * 0.0014,
      twinklePhase: Math.random() * Math.PI * 2,
      tint,
    };
  });

  const anchors = isCompact
    ? [
        [0.24, 0.28],
        [0.78, 0.72],
      ]
    : [
        [0.18, 0.22],
        [0.82, 0.24],
        [0.28, 0.78],
        [0.86, 0.74],
      ];

  const loops: StarlinkLoop[] = Array.from({ length: loopCount }, (_, idx) => {
    const [ax, ay] = anchors[idx % anchors.length];
    const nodeCount = 5 + (idx % 3);
    const radius = isCompact
      ? 38 + Math.random() * 18
      : 46 + Math.random() * 26;
    const driftAngle = Math.random() * Math.PI * 2;
    const driftSpeed = 0.09 + Math.random() * 0.11;

    const nodes: LoopNode[] = Array.from({ length: nodeCount }, (_, nIdx) => {
      const baseAngle = (nIdx / nodeCount) * Math.PI * 2;
      const jitter = (Math.random() - 0.5) * 0.34;
      return {
        angle: baseAngle + jitter,
        distFactor: 0.68 + Math.random() * 0.38,
        radius: 1.55 + Math.random() * 1.05,
        isAmber: nIdx % 3 === 0,
        wobblePhase: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.00055 + Math.random() * 0.00065,
        wobbleAmp: 3.5 + Math.random() * 3.5,
      };
    });

    const chords: [number, number][] = [];
    if (nodeCount >= 5) {
      chords.push([0, 2]);
      chords.push([1, Math.min(nodeCount - 1, 3)]);
    }
    if (nodeCount >= 6) {
      chords.push([2, 5]);
    }

    return {
      cx: width * ax + (Math.random() - 0.5) * 80,
      cy: height * ay + (Math.random() - 0.5) * 60,
      vx: Math.cos(driftAngle) * driftSpeed,
      vy: Math.sin(driftAngle) * driftSpeed,
      radius,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed:
        (Math.random() > 0.5 ? 1 : -1) * (0.00022 + Math.random() * 0.00025),
      nodes,
      chords,
    };
  });

  return { stars, loops };
}

export function CosmicStarfieldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );
    let prefersReduced = reducedMotionQuery.matches;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resizeCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resizeCanvas();
    let { stars, loops } = createStarfield(width, height);

    let rafId = 0;
    let lastTime = performance.now();

    const drawFrame = (now: number, animate: boolean) => {
      const dt = Math.min(48, Math.max(0, now - lastTime));
      const frameScale = animate ? dt / 16.6667 : 0;
      lastTime = now;

      ctx.clearRect(0, 0, width, height);

      for (const star of stars) {
        if (animate) {
          star.x += star.vx * frameScale;
          star.y += star.vy * frameScale;

          if (star.x < -8) star.x = width + 8;
          if (star.x > width + 8) star.x = -8;
          if (star.y < -8) star.y = height + 8;
          if (star.y > height + 8) star.y = -8;
        }

        const twinkle =
          0.62 + 0.38 * Math.sin(now * star.twinkleSpeed + star.twinklePhase);
        const alpha = star.baseAlpha * twinkle;
        const rgb = STAR_COLORS[star.tint];

        if (star.radius > 1.25) {
          const halo = ctx.createRadialGradient(
            star.x,
            star.y,
            0,
            star.x,
            star.y,
            star.radius * 3.4
          );
          halo.addColorStop(0, `rgba(${rgb}, ${(alpha * 0.45).toFixed(3)})`);
          halo.addColorStop(1, `rgba(${rgb}, 0)`);
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.radius * 3.4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = `rgba(${rgb}, ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const loop of loops) {
        if (animate) {
          loop.cx += loop.vx * frameScale;
          loop.cy += loop.vy * frameScale;
          loop.rotation += loop.rotSpeed * frameScale;

          const pad = loop.radius + 36;
          if (loop.cx < -pad) loop.cx = width + pad;
          if (loop.cx > width + pad) loop.cx = -pad;
          if (loop.cy < -pad) loop.cy = height + pad;
          if (loop.cy > height + pad) loop.cy = -pad;
        }

        const points = loop.nodes.map((node) => {
          const a = node.angle + loop.rotation;
          const wobble =
            Math.sin(now * node.wobbleSpeed + node.wobblePhase) * node.wobbleAmp;
          const r = loop.radius * node.distFactor + wobble;
          return {
            x: loop.cx + Math.cos(a) * r,
            y: loop.cy + Math.sin(a) * r,
            radius: node.radius,
            isAmber: node.isAmber,
          };
        });

        ctx.lineWidth = 0.7;
        for (let i = 0; i < points.length; i += 1) {
          const a = points[i];
          const b = points[(i + 1) % points.length];
          ctx.strokeStyle =
            a.isAmber || b.isAmber
              ? "rgba(242, 198, 128, 0.145)"
              : "rgba(220, 228, 245, 0.12)";
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }

        ctx.lineWidth = 0.55;
        for (const [fromIdx, toIdx] of loop.chords) {
          const a = points[fromIdx];
          const b = points[toIdx];
          if (!a || !b) continue;
          ctx.strokeStyle = "rgba(218, 226, 244, 0.085)";
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }

        for (const pt of points) {
          const rgb = pt.isAmber ? "242, 184, 99" : "232, 238, 250";
          const haloRadius = pt.radius * 4.2;
          const glow = ctx.createRadialGradient(
            pt.x,
            pt.y,
            0,
            pt.x,
            pt.y,
            haloRadius
          );
          glow.addColorStop(0, `rgba(${rgb}, ${pt.isAmber ? "0.42" : "0.32"})`);
          glow.addColorStop(
            0.5,
            `rgba(${rgb}, ${pt.isAmber ? "0.12" : "0.08"})`
          );
          glow.addColorStop(1, `rgba(${rgb}, 0)`);

          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, haloRadius, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = `rgba(${rgb}, ${pt.isAmber ? "0.68" : "0.56"})`;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const tick = (now: number) => {
      if (document.hidden) {
        lastTime = now;
      } else {
        drawFrame(now, !prefersReduced);
      }
      if (!prefersReduced) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    const handleResize = () => {
      const prevCompact = width < 768;
      resizeCanvas();
      const nextCompact = width < 768;
      if (prevCompact !== nextCompact) {
        const next = createStarfield(width, height);
        stars = next.stars;
        loops = next.loops;
      }
      if (prefersReduced) {
        drawFrame(performance.now(), false);
      }
    };

    const handleReducedMotionChange = (event: MediaQueryListEvent) => {
      prefersReduced = event.matches;
      window.cancelAnimationFrame(rafId);
      if (prefersReduced) {
        drawFrame(performance.now(), false);
      } else {
        lastTime = performance.now();
        rafId = window.requestAnimationFrame(tick);
      }
    };

    if (prefersReduced) {
      drawFrame(performance.now(), false);
    } else {
      rafId = window.requestAnimationFrame(tick);
    }

    window.addEventListener("resize", handleResize);
    reducedMotionQuery.addEventListener("change", handleReducedMotionChange);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
      reducedMotionQuery.removeEventListener(
        "change",
        handleReducedMotionChange
      );
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-testid="cosmic-starfield-canvas"
      className="pointer-events-none fixed inset-0 z-0 select-none"
    />
  );
}
