"use client";

import { useEffect, useRef, useState } from "react";
import { useInViewOnce } from "@/shared/lib/use-in-view";
import { prefersReducedMotion } from "@/shared/lib/prefers-reduced-motion";
import { ConsoleTitleBar } from "./overlays/console";

interface BootLine {
  text: string;
  tone: "muted" | "accent" | "muted2";
}

const TONE_CLASS: Record<BootLine["tone"], string> = {
  muted: "text-[var(--m-muted)]",
  muted2: "text-[var(--m-muted2)]",
  accent: "text-[var(--m-accent)]",
};

/** The fake BIOS log, in order. The final line lands in accent. */
const BOOT: BootLine[] = [
  { text: "NOT LAZY BIOS v2.0 — (c) sloth systems", tone: "muted2" },
  { text: "POST ............................ MEM OK", tone: "muted" },
  { text: "DETECT CPU ............ 1x slow & steady", tone: "muted" },
  { text: "MOUNT /sloth ........................ OK", tone: "muted" },
  { text: "LOAD accent=lime schema=brutalist ... OK", tone: "muted" },
  { text: "CHECK reduced-motion guard .......... OK", tone: "muted" },
  { text: "STAY LAZY ✓", tone: "accent" },
];

/**
 * Boot sequence — a fake BIOS log that types itself out one line at a time on the
 * screen-black console (reusing {@link ConsoleTitleBar}), at the MatrixText
 * one-shot cadence. Fires when scrolled into view; a `▮` caret blinks on the line
 * being typed. LAB-only toy. Reduced motion: prints the whole log instantly, no
 * typing, no caret.
 */
export function BootSequence({ className = "" }: { className?: string }) {
  const { ref, inView } = useInViewOnce<HTMLDivElement>();
  const [shown, setShown] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!inView) return;
    if (prefersReducedMotion()) {
      // Print the whole log on the next frame (no synchronous in-effect set).
      const raf = requestAnimationFrame(() => setShown(BOOT.length));
      return () => cancelAnimationFrame(raf);
    }
    timer.current = setInterval(() => {
      setShown((n) => {
        if (n >= BOOT.length) {
          if (timer.current) clearInterval(timer.current);
          timer.current = null;
          return n;
        }
        return n + 1;
      });
    }, 360);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [inView]);

  const done = shown >= BOOT.length;

  return (
    <div
      ref={ref}
      className={`border-2 border-[var(--m-dim)] bg-[#0d0d0d] ${className}`}
    >
      <ConsoleTitleBar title="boot ~ /dev/sloth0" />
      <div className="min-h-[180px] p-5 text-[14px] leading-[1.6]">
        {BOOT.slice(0, shown).map((line, i) => (
          <div
            key={i}
            className={`break-words whitespace-pre-wrap ${TONE_CLASS[line.tone]}`}
          >
            {line.text}
          </div>
        ))}
        {!done ? <span className="mono-caret" aria-hidden="true" /> : null}
      </div>
    </div>
  );
}
