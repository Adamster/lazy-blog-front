"use client";

import { useInViewOnce } from "@/shared/lib/use-in-view";
import { prefersReducedMotion } from "@/shared/lib/prefers-reduced-motion";

interface ScanTextProps {
  /** The highlighted text. */
  children: string;
  className?: string;
}

/**
 * Scanline highlight — a resting accent wash on the text (the text itself stays
 * `--m-fg` for AA contrast) plus a one-shot accent light-bar sweep across it the
 * first time it scrolls into view (and again on hover, the server-safe path).
 * Styling = `.mono-scan` (tailwind.css); the sweep is a `.mono-scan--sweep`
 * class toggled on scroll-in. Reduced motion: the resting wash only, no sweep.
 */
export function ScanText({ children, className = "" }: ScanTextProps) {
  const { ref, inView } = useInViewOnce<HTMLSpanElement>();
  const sweep = inView && !prefersReducedMotion();
  return (
    <span
      ref={ref}
      className={`mono-scan ${sweep ? "mono-scan--sweep" : ""} ${className}`}
    >
      {children}
    </span>
  );
}
