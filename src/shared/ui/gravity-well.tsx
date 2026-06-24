"use client";

import { useEffect, useRef, useState } from "react";
import { MATRIX_GLYPHS, pick } from "@/shared/lib/glyphs";
import { prefersReducedMotion } from "@/shared/lib/prefers-reduced-motion";

const COLS = 28;
const ROWS = 10;
/** Max px a glyph is pulled toward the cursor. */
const PULL = 16;
/** Radius (px) within which the well bends + intensifies chars. */
const RADIUS = 130;

/**
 * Glyph gravity well — a static mono-glyph grid that bends toward the cursor
 * (each glyph translates up to `PULL`px toward the pointer, and swaps to a random
 * glyph + accent as the pointer nears), settling back to a muted rest grid on
 * leave. Cell centers are read from the rendered grid geometry. LAB-only
 * (pointer-global toy). Reduced motion: an inert static grid — no bend, no swap.
 */
export function GravityWell({ className = "" }: { className?: string }) {
  // Stable base grid, built client-only so SSR emits no glyphs (no hydration drift).
  const [bases, setBases] = useState<string[] | null>(null);
  // Pointer position relative to the grid box, or null when outside.
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [reduced, setReduced] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Defer the client-only grid + reduced-motion flag to the next frame (no
    // synchronous in-effect set).
    const raf = requestAnimationFrame(() => {
      setReduced(prefersReducedMotion());
      setBases(
        Array.from(
          { length: COLS * ROWS },
          (_, i) => MATRIX_GLYPHS[i % MATRIX_GLYPHS.length]
        )
      );
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const el = boxRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setSize({ w: r.width, h: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [bases]);

  return (
    <div
      ref={boxRef}
      className={`relative overflow-hidden border-2 border-[var(--m-dim)] bg-[#0d0d0d] p-5 ${className}`}
      onPointerMove={
        reduced
          ? undefined
          : (e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setPointer({ x: e.clientX - rect.left, y: e.clientY - rect.top });
            }
      }
      onPointerLeave={() => setPointer(null)}
    >
      <div
        className="grid gap-x-2 gap-y-1 [font-family:var(--font-mono)] text-[14px] leading-none"
        style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
        aria-hidden="true"
      >
        {(bases ?? []).map((base, i) => {
          const col = i % COLS;
          const row = Math.floor(i / COLS);
          let dx = 0;
          let dy = 0;
          let near = 0;
          if (pointer && size.w > 0 && !reduced) {
            // Cell center in the same px space as the pointer (box has p-5=20px).
            const cx = 20 + ((col + 0.5) / COLS) * size.w;
            const cy = 20 + ((row + 0.5) / ROWS) * size.h;
            const ddx = pointer.x - cx;
            const ddy = pointer.y - cy;
            const dist = Math.hypot(ddx, ddy);
            if (dist < RADIUS) {
              const f = (1 - dist / RADIUS) * PULL;
              dx = (ddx / (dist || 1)) * f;
              dy = (ddy / (dist || 1)) * f;
              near = 1 - dist / RADIUS;
            }
          }
          return (
            <span
              key={i}
              className={
                near > 0.15
                  ? "text-[var(--m-accent)]"
                  : "text-[var(--m-muted2)]"
              }
              style={{
                transform: `translate(${dx}px, ${dy}px)`,
                transition: pointer ? "none" : "transform 0.4s ease-out",
              }}
            >
              {near > 0.4 ? pick() : base}
            </span>
          );
        })}
      </div>
    </div>
  );
}
