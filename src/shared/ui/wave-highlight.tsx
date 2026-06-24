"use client";

import { useEffect, useRef, useState } from "react";
import { useInViewOnce } from "@/shared/lib/use-in-view";
import { prefersReducedMotion } from "@/shared/lib/prefers-reduced-motion";

interface WaveHighlightProps {
  /** The phrase the caret sweeps under. */
  children: string;
  className?: string;
}

/** Glyph cadence — matches the MatrixText one-shot ~360ms feel across the chars. */
const STEP_MS = 26;

/**
 * Caret sweep highlight — a `▌` block-caret (`--m-accent`) travels left→right
 * under a phrase once on scroll-in, turning each character accent-active as it
 * passes, then rests with the whole phrase accent and the caret gone. Powers the
 * `:wave[…]` post directive. Reduced motion: the phrase rests accent immediately,
 * no caret travel.
 */
export function WaveHighlight({
  children,
  className = "",
}: WaveHighlightProps) {
  const { ref, inView } = useInViewOnce<HTMLSpanElement>();
  const chars = [...children];
  // Resting end-state under reduced motion = all chars lit, caret parked off.
  const [pos, setPos] = useState(-1);
  const [done, setDone] = useState(false);
  const raf = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!inView) return;
    if (prefersReducedMotion()) {
      // Defer the resting end-state to the next frame (no synchronous set).
      const raf = requestAnimationFrame(() => {
        setPos(chars.length);
        setDone(true);
      });
      return () => cancelAnimationFrame(raf);
    }
    let i = 0;
    raf.current = setInterval(() => {
      i += 1;
      setPos(i);
      if (i >= chars.length) {
        if (raf.current) clearInterval(raf.current);
        raf.current = null;
        setDone(true);
      }
    }, STEP_MS);
    return () => {
      if (raf.current) clearInterval(raf.current);
    };
    // chars.length is derived from `children`; re-run only when view/text change.
  }, [inView, chars.length]);

  return (
    <span
      ref={ref}
      className={`mono-wave text-[14px] leading-[1.6] ${className}`}
      aria-label={children}
    >
      {chars.map((c, i) => (
        <span
          key={i}
          className={i < pos ? "mono-wave--lit" : undefined}
          aria-hidden="true"
        >
          {c}
        </span>
      ))}
      {!done && pos >= 0 ? (
        <span className="mono-wave-caret" aria-hidden="true">
          ▌
        </span>
      ) : null}
    </span>
  );
}
