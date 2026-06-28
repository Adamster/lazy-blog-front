"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/shared/lib/prefers-reduced-motion";

const CONFETTI_COLORS = ["#cdff48", "#e6e6e6", "#7d7d7d"] as const;
const PARTICLE_COUNT = 90;
const DURATION_MS = 2600;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rot: number;
  vr: number;
}

/** Fire-once confetti burst — square chips, on-system palette. Mount ONLY for a
 *  record game-over; renders nothing under `prefers-reduced-motion`. */
export function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let particles: Particle[] = [];

    const size = () => {
      w = canvas.clientWidth || 760;
      h = canvas.clientHeight || 450;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();

    particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: w * (0.35 + Math.random() * 0.3),
      y: h * (0.18 + Math.random() * 0.12),
      vx: (Math.random() - 0.5) * 7,
      vy: Math.random() * -5 - 2,
      size: 4 + Math.random() * 5,
      color: CONFETTI_COLORS[(Math.random() * CONFETTI_COLORS.length) | 0],
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
    }));

    let rafId = 0;
    let start = 0;

    const frame = (now: number) => {
      if (!start) start = now;
      const elapsed = now - start;
      const life = Math.min(elapsed / DURATION_MS, 1);
      const alpha = 1 - life * life;

      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = alpha;
      for (const p of particles) {
        p.vy += 0.14; // gravity
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
      ctx.globalAlpha = 1;

      if (life < 1) {
        rafId = requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, w, h);
      }
    };
    rafId = requestAnimationFrame(frame);

    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[2] block size-full"
    />
  );
}
