"use client";

import { useEffect, useRef, useState } from "react";
import { useInViewOnce } from "@/shared/lib/use-in-view";
import { prefersReducedMotion } from "@/shared/lib/prefers-reduced-motion";
import { ConsoleTitleBar } from "./console";

/** Density ramp — sparse → dense glyphs, the ASCII "grey scale". */
const RAMP = " .:-=+*#%@";

/**
 * The sloth mark as a coarse density grid (0–9 → RAMP index). Hand-tuned so the
 * silhouette reads at terminal resolution; rendered in `--m-accent` on the
 * screen-black {@link ConsoleTitleBar} panel.
 */
const SLOTH: number[][] = [
  [0, 0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0],
  [0, 1, 3, 5, 5, 3, 1, 1, 3, 5, 5, 3, 1, 0],
  [0, 2, 5, 9, 7, 4, 2, 2, 4, 7, 9, 5, 2, 0],
  [1, 3, 6, 7, 4, 3, 3, 3, 3, 4, 7, 6, 3, 1],
  [1, 4, 6, 6, 5, 6, 7, 7, 6, 5, 6, 6, 4, 1],
  [1, 4, 6, 6, 6, 7, 9, 9, 7, 6, 6, 6, 4, 1],
  [1, 3, 5, 6, 6, 6, 6, 6, 6, 6, 6, 5, 3, 1],
  [0, 2, 4, 5, 6, 6, 6, 6, 6, 6, 5, 4, 2, 0],
  [0, 1, 3, 4, 5, 5, 5, 5, 5, 5, 4, 3, 1, 0],
  [0, 0, 2, 3, 4, 4, 4, 4, 4, 4, 3, 2, 0, 0],
  [0, 0, 1, 2, 3, 3, 3, 3, 3, 3, 2, 1, 0, 0],
  [0, 0, 0, 1, 2, 2, 2, 2, 2, 2, 1, 0, 0, 0],
];

const glyph = (d: number) => RAMP[Math.min(RAMP.length - 1, d)];
const fullRender = () =>
  SLOTH.map((row) => row.map(glyph).join(" ")).join("\n");

/**
 * ASCII portrait / sloth-cam — the sloth mark rendered as a density-glyph grid in
 * `--m-accent` on the screen-black panel, with a slow "developing" reveal (random
 * cells resolve from noise to the final glyph over ~1.4s) the first time it
 * scrolls into view. LAB-only toy. Reduced motion: paints the finished portrait
 * immediately, no develop.
 */
export function AsciiArt({ className = "" }: { className?: string }) {
  const { ref, inView } = useInViewOnce<HTMLDivElement>();
  const [frame, setFrame] = useState(() => fullRender());
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!inView) return;
    // Reduced motion: the initial state is already the finished portrait
    // (`fullRender()`), so nothing to do — skip the develop.
    if (prefersReducedMotion()) return;
    const STEPS = 18;
    let step = 0;
    timer.current = setInterval(() => {
      step++;
      const t = step / STEPS;
      setFrame(
        SLOTH.map((row) =>
          row
            .map((d) =>
              Math.random() < t
                ? glyph(d)
                : RAMP[Math.floor(Math.random() * RAMP.length)]
            )
            .join(" ")
        ).join("\n")
      );
      if (step >= STEPS) {
        setFrame(fullRender());
        if (timer.current) clearInterval(timer.current);
        timer.current = null;
      }
    }, 80);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [inView]);

  return (
    <div
      ref={ref}
      className={`border-2 border-[var(--m-dim)] bg-[#0d0d0d] ${className}`}
    >
      <ConsoleTitleBar title="sloth-cam ~ /dev/video0" />
      <pre
        aria-hidden="true"
        className="overflow-x-auto p-5 text-[12px] leading-[1.3] text-[var(--m-accent)]"
      >
        {frame}
      </pre>
    </div>
  );
}
