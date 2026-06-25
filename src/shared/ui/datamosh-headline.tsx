"use client";

import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/shared/lib/prefers-reduced-motion";

interface DatamoshHeadlineProps {
  children: string;
  className?: string;
}

/** Scroll-velocity (px/frame) above which the headline I-frame-smears. */
const SMEAR_THRESHOLD = 26;

/**
 * Datamosh scroll smear — a headline that I-frame-smears (slice-offset + accent /
 * error channel tear, the `.mono-datamosh--smear` state) while the page scrolls
 * fast, and self-heals the moment scrolling slows. Built on the `GlitchText` ghost
 * markup (accent + error clipped copies). LAB-only. Reduced motion: never smears
 * — renders as plain, still text.
 */
export function DatamoshHeadline({
  children,
  className = "",
}: DatamoshHeadlineProps) {
  const [smear, setSmear] = useState(false);
  const lastY = useRef(0);
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    lastY.current = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const v = Math.abs(y - lastY.current);
      lastY.current = y;
      if (v > SMEAR_THRESHOLD) {
        setSmear(true);
        if (settle.current) clearTimeout(settle.current);
        settle.current = setTimeout(() => setSmear(false), 140);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (settle.current) clearTimeout(settle.current);
    };
  }, []);

  return (
    <span
      className={`mono-datamosh ${smear ? "mono-datamosh--smear" : ""} ${className}`}
      data-text={children}
    >
      <span className="mono-datamosh-main">{children}</span>
      <span className="mono-datamosh-ghost mono-datamosh-g1" aria-hidden="true">
        {children}
      </span>
      <span className="mono-datamosh-ghost mono-datamosh-g2" aria-hidden="true">
        {children}
      </span>
    </span>
  );
}
