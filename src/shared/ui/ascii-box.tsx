"use client";

import { useEffect, useRef, useState } from "react";
import { useInViewOnce } from "@/shared/lib/use-in-view";
import { prefersReducedMotion } from "@/shared/lib/prefers-reduced-motion";
import { ConsoleTitleBar } from "./overlays/console";

/** The FSD stack diagram, drawn with box-draw glyphs. Accent lines marked `*`. */
const DIAGRAM: string[] = [
  "┌────────────────────────────┐",
  "│  app      · providers      │*",
  "├────────────────────────────┤",
  "│  widgets  · header / feed   │",
  "├────────────────────────────┤",
  "│  features · post / auth    │",
  "├────────────────────────────┤",
  "│  entities · post / user    │",
  "├────────────────────────────┤",
  "│  shared   · ui / lib       │*",
  "└────────────────────────────┘",
];

/**
 * ANSI box-draw constructor — a framed ASCII diagram (the FSD layer stack) that
 * builds itself one line at a time on scroll-in (the BootSequence stagger
 * cadence), accent-labelled rows marked with a trailing `*`. Mono 14px/1.6 on the
 * screen-black console. LAB-only. Reduced motion: the full diagram prints at once.
 */
export function AsciiBox({ className = "" }: { className?: string }) {
  const { ref, inView } = useInViewOnce<HTMLDivElement>();
  const [shown, setShown] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!inView) return;
    if (prefersReducedMotion()) {
      const raf = requestAnimationFrame(() => setShown(DIAGRAM.length));
      return () => cancelAnimationFrame(raf);
    }
    timer.current = setInterval(() => {
      setShown((n) => {
        if (n >= DIAGRAM.length) {
          if (timer.current) clearInterval(timer.current);
          timer.current = null;
          return n;
        }
        return n + 1;
      });
    }, 120);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [inView]);

  return (
    <div
      ref={ref}
      className={`border-2 border-[var(--m-dim)] bg-[#0d0d0d] ${className}`}
    >
      <ConsoleTitleBar title="fsd ~ stack.draw" />
      <pre className="min-h-[260px] overflow-x-auto p-5 [font-family:var(--font-mono)] text-[14px] leading-[1.6]">
        {DIAGRAM.slice(0, shown).map((line, i) => {
          const accent = line.endsWith("*");
          const text = accent ? line.slice(0, -1) : line;
          return (
            <div
              key={i}
              className={
                accent ? "text-[var(--m-accent)]" : "text-[var(--m-muted)]"
              }
            >
              {text}
            </div>
          );
        })}
      </pre>
    </div>
  );
}
