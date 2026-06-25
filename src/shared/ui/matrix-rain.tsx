"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useIsMounted } from "@/shared/lib/use-is-mounted";
import { MATRIX_GLYPHS } from "@/shared/lib/glyphs";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
/** ~18fps — slow enough to read as falling glyphs, cheap enough to be idle. */
const FRAME_MS = 1000 / 18;

interface MatrixRainProps {
  /** Glyph alphabet the columns draw from. */
  glyphs?: readonly string[];
  /** Column/row pitch in px (glyph cell size). */
  step?: number;
  /** Trail fade per frame (0–1; higher = shorter trails). */
  fade?: number;
  /** Stop/start the loop without unmounting (e.g. tab inactive). Default true. */
  active?: boolean;
  className?: string;
}

/**
 * Matrix glyph-rain on `<canvas>` — falling columns drawn in the LIVE accent
 * (read from `getComputedStyle` so it tracks the theme). Sits on its own
 * screen-black surface (the documented canvas exception to `--m-*` tokens),
 * `pointer-events-none` as a backdrop.
 *
 * Render loop: `requestAnimationFrame` throttled to ~18fps, dims cached + kept
 * current via a `ResizeObserver`, glyph colour re-read on resize. FULL cleanup
 * on unmount / when `active` flips false: cancels the rAF, disconnects the RO,
 * removes the reduced-motion MQ listener — no leaked timers.
 *
 * Reduced motion: paints ONE static frame of glyphs and never loops.
 */
export function MatrixRain({
  glyphs = MATRIX_GLYPHS,
  step = 14,
  fade = 0.16,
  active = true,
  className = "",
}: MatrixRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !active) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let drops: number[] = [];
    let accent = "#cdff48";
    let accentBright = "#eaffc0";

    const readAccent = () => {
      const v = getComputedStyle(canvas).getPropertyValue("--m-accent").trim();
      if (v) accent = v;
      // A brighter "head" tint — fall back to the accent if blending is moot.
      accentBright = v || accentBright;
    };

    const resize = () => {
      width = canvas.clientWidth || 800;
      height = canvas.clientHeight || 260;
      canvas.width = width;
      canvas.height = height;
      const cols = Math.max(1, Math.floor(width / step));
      drops = Array.from({ length: cols }, () => Math.random() * -30);
      readAccent();
    };

    const drawFrame = () => {
      ctx.fillStyle = `rgba(13,13,13,${fade})`;
      ctx.fillRect(0, 0, width, height);
      ctx.font = `${step}px var(--font-mono), monospace`;
      for (let i = 0; i < drops.length; i++) {
        const ch = glyphs[Math.floor(Math.random() * glyphs.length)];
        const x = i * step;
        const y = drops[i] * step;
        ctx.fillStyle = Math.random() > 0.92 ? accentBright : accent;
        ctx.fillText(ch, x, y);
        if (y > height && Math.random() > 0.975) drops[i] = 0;
        drops[i] += Math.random() * 0.6 + 0.7;
      }
    };

    resize();

    const ro = new ResizeObserver(() => resize());
    ro.observe(canvas);

    const mq = window.matchMedia(REDUCED_MOTION);
    let rafId = 0;
    let last = 0;

    const loop = (now: number) => {
      rafId = requestAnimationFrame(loop);
      if (now - last < FRAME_MS) return;
      last = now;
      drawFrame();
    };

    const start = () => {
      if (mq.matches) {
        // Reduced motion: paint one static frame, no loop.
        ctx.fillStyle = "#0d0d0d";
        ctx.fillRect(0, 0, width, height);
        drawFrame();
        return;
      }
      rafId = requestAnimationFrame(loop);
    };

    const onMqChange = () => {
      cancelAnimationFrame(rafId);
      rafId = 0;
      start();
    };
    mq.addEventListener("change", onMqChange);

    start();

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      mq.removeEventListener("change", onMqChange);
    };
  }, [glyphs, step, fade, active]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none block size-full ${className}`}
    />
  );
}

/**
 * Fullscreen matrix-rain takeover — a screen-black `.mono-portal` layer over the
 * whole viewport with a centred "wake up" hint. Mirrors {@link Modal}
 * conventions: Esc / click to close, body scroll locked while open, focus moved
 * in and restored on close. Sits at `--m-z-rain` (above modals, under toasts so
 * the konami unlock toast still reads).
 */
export function MatrixRainOverlay({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const mounted = useIsMounted();
  const layerRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    restoreFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const { body } = document;
    const prevOverflow = body.style.overflow;
    body.style.overflow = "hidden";
    layerRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown, true);

    return () => {
      body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKeyDown, true);
      restoreFocusRef.current?.focus?.();
      restoreFocusRef.current = null;
    };
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      ref={layerRef}
      role="dialog"
      aria-modal="true"
      aria-label="Matrix rain — press Escape or click to dismiss"
      tabIndex={-1}
      onClick={onClose}
      className="mono-portal fixed inset-0 z-[var(--m-z-rain)] cursor-pointer bg-black outline-none"
    >
      <MatrixRain />
      <div className="pointer-events-none absolute bottom-10 left-1/2 -translate-x-1/2 text-[11px] tracking-[0.12em] text-[var(--m-accent)] uppercase">
        Click or press esc to wake up
      </div>
    </div>,
    document.body
  );
}
