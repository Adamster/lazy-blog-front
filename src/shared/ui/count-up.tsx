"use client";

import { useEffect, useRef, useState } from "react";
import { useInViewOnce } from "@/shared/lib/use-in-view";
import { prefersReducedMotion } from "@/shared/lib/prefers-reduced-motion";

interface CountUpProps {
  /** The final value the readout rolls up to. */
  value: number;
  /**
   * `"inline"` (default) — UI body 14px tabular; `"hero"` — Space Grotesk
   * 46/700/-0.02em stat number.
   */
  variant?: "inline" | "hero";
  /** Roll duration. Default 900ms. */
  durationMs?: number;
  className?: string;
}

const HERO =
  "font-display text-[46px] leading-[1.04] font-bold tracking-[-0.02em] tabular-nums text-[var(--m-fg)]";
const INLINE = "text-[14px] leading-[1.6] tabular-nums text-[var(--m-fg)]";

/**
 * Counting readout — a number that rolls 0 → `value` the first time it scrolls
 * into view (rAF eased), then rests. Powers the inline `:stat[1240]` post
 * directive (`variant="inline"`) and the LAB hero readout (`variant="hero"`).
 * Reduced motion: the final number is shown immediately, no roll.
 */
export function CountUp({
  value,
  variant = "inline",
  durationMs = 900,
  className = "",
}: CountUpProps) {
  const { ref, inView } = useInViewOnce<HTMLSpanElement>();
  const [display, setDisplay] = useState(value);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (!inView) return;
    if (prefersReducedMotion()) {
      // Defer the final-value set to the next frame (no synchronous in-effect set).
      raf.current = requestAnimationFrame(() => setDisplay(value));
      return () => {
        if (raf.current) cancelAnimationFrame(raf.current);
      };
    }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * value));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [inView, value, durationMs]);

  return (
    <span
      ref={ref}
      className={`${variant === "hero" ? HERO : INLINE} ${className}`}
      aria-label={String(value)}
    >
      {display.toLocaleString("en-US")}
    </span>
  );
}
