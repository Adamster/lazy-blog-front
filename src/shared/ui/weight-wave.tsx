"use client";

import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/shared/lib/prefers-reduced-motion";

interface WeightWaveProps {
  children: string;
  className?: string;
}

/** Wave step cadence (ms per character). */
const STEP_MS = 32;

/**
 * Weight-swap headline — on hover/focus a wave runs L→R, each character snapping
 * between REAL Space Grotesk weights (rest 700 → 500 on the active char, accent
 * while lit) before settling back. NO fake variable axis — the project ships
 * static Space Grotesk (500/600/700 only), so the wave swaps between loaded
 * weights. Display 40/-0.02em. LAB headline toy. Reduced motion: rests at 700,
 * no wave.
 */
export function WeightWave({ children, className = "" }: WeightWaveProps) {
  const chars = [...children];
  const [head, setHead] = useState(-1);
  const raf = useRef<ReturnType<typeof setInterval> | null>(null);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = prefersReducedMotion();
    return () => {
      if (raf.current) clearInterval(raf.current);
    };
  }, []);

  const run = () => {
    if (reduced.current) return;
    if (raf.current) clearInterval(raf.current);
    let i = 0;
    raf.current = setInterval(() => {
      setHead(i);
      i += 1;
      if (i > chars.length + 2) {
        if (raf.current) clearInterval(raf.current);
        raf.current = null;
        setHead(-1);
      }
    }, STEP_MS);
  };

  return (
    <span
      className={`font-display text-[40px] leading-none tracking-[-0.02em] ${className}`}
      onMouseEnter={run}
      onFocus={run}
      tabIndex={0}
      aria-label={children}
    >
      {chars.map((c, i) => {
        // A 3-char-wide crest centered on `head`.
        const active = head >= 0 && Math.abs(i - head) <= 1;
        return (
          <span
            key={i}
            aria-hidden="true"
            style={{ fontWeight: active ? 500 : 700 }}
            className={active ? "text-[var(--m-accent)]" : "text-[var(--m-fg)]"}
          >
            {c === " " ? " " : c}
          </span>
        );
      })}
    </span>
  );
}
