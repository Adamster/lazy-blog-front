"use client";

import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/shared/lib/prefers-reduced-motion";

interface Channel {
  /** 11px/0.12em accent channel label. */
  name: string;
  /** Lines drawn on the screen (mono 14px/1.6). */
  lines: string[];
}

const CHANNELS: Channel[] = [
  {
    name: "CH 01 · SLOTH TV",
    lines: ["▪ now playing:", "  doing nothing,", "  beautifully."],
  },
  {
    name: "CH 02 · DEPLOY CAM",
    lines: ["$ git push", "→ shipped.", "→ went to sleep."],
  },
  { name: "CH 03 · STATIC", lines: ["no signal —", "try CH 01.", ""] },
  {
    name: "CH 04 · BRUTALIST",
    lines: ["square corners.", "2px borders.", "lime accent."],
  },
];

/**
 * CRT channel-surf — a contained "TV" panel; the button hard-cuts to the next
 * channel with a one-frame static + roll-bar over the scoped scanline screen
 * (`.mono-tv-*`, the scanline recipe applied at a scoped panel scale). The
 * static bar is `--m-muted2`, the channel label 11px/0.12em accent. LAB-only.
 * Reduced motion: an instant cut — no roll, no static frame.
 */
export function ChannelSurf({ className = "" }: { className?: string }) {
  const [ch, setCh] = useState(0);
  const [rolling, setRolling] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const surf = () => {
    const reduced = prefersReducedMotion();
    const next = (c: number) => (c + 1) % CHANNELS.length;
    if (reduced) {
      setCh(next);
      return;
    }
    setRolling(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setCh(next);
      setRolling(false);
    }, 160);
  };

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const channel = CHANNELS[ch];

  return (
    <div className={className}>
      <div className="relative overflow-hidden border-2 border-[var(--m-dim)] bg-[#0d0d0d]">
        <div className="flex items-center justify-between border-b-2 border-[var(--m-dim)] px-3 py-2">
          <span className="text-[11px] leading-none tracking-[0.12em] text-[var(--m-accent)] uppercase">
            {channel.name}
          </span>
          <span className="mono-tv-rec" aria-hidden="true" />
        </div>
        <div className="relative min-h-[160px] p-5 text-[14px] leading-[1.6]">
          {channel.lines.map((l, i) => (
            <div
              key={i}
              className="[font-family:var(--font-mono)] text-[var(--m-muted)]"
            >
              {l}
            </div>
          ))}
          {/* Scoped scanline drape — always painted on the screen. */}
          <div className="mono-tv-scan" aria-hidden="true" />
          {/* One-frame static + roll bar on a channel cut. */}
          {rolling ? <div className="mono-tv-roll" aria-hidden="true" /> : null}
        </div>
      </div>
      <button
        type="button"
        onClick={surf}
        className="mt-4 inline-flex h-9 items-center justify-center border-2 border-[var(--m-dim)] px-4 text-[11px] font-semibold tracking-[0.12em] text-[var(--m-muted)] uppercase transition-colors hover:border-[var(--m-accent)] hover:text-[var(--m-accent)]"
      >
        Surf channel
      </button>
    </div>
  );
}
