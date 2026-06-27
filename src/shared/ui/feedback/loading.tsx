"use client";

import { useEffect, useState } from "react";

interface IProps {
  inline?: boolean;
  /** Inline spinner uses the feed/section gap (`mt-5`) — the card-padding-aware
   *  section rhythm — instead of the default `my-6`. */
  section?: boolean;
}

/** Terminal ASCII spinner frames — cycled at 100ms. */
const FRAMES = ["│", "/", "─", "\\"];

/**
 * Bare animated ASCII spinner glyph (`│ / ─ \` at 100ms). Inherits colour/size
 * from the caller — drop it inline anywhere (buttons, status rows). The mono
 * font is pinned so the box-drawing frames align.
 */
export function Spinner({ className = "" }: { className?: string }) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setFrame((f) => (f + 1) % FRAMES.length), 100);
    return () => clearInterval(id);
  }, []);

  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block w-[1ch] text-center leading-none tabular-nums ${className}`}
      style={{ fontFamily: "var(--font-mono)" }}
    >
      {FRAMES[frame]}
    </span>
  );
}

/**
 * Brutalist-Mono loading indicator — the {@link Spinner} in the accent colour.
 * `inline` centers a small spinner in flow; the block form fills the content
 * area below the header (`min-h-app`) with the spinner + `LOADING` label.
 */
export const Loading = ({ inline = false, section = false }: IProps) => {
  const glyph = (
    <Spinner className="text-[14px] font-bold text-[var(--m-accent)]" />
  );

  // `mono-scope` so the `--m-*` tokens resolve (the route-level loading UI
  // mounts outside any page scope, where the accent would otherwise be unset).
  if (inline) {
    return (
      <div
        className={`mono-scope flex justify-center ${section ? "mt-5" : "my-6"}`}
      >
        {glyph}
      </div>
    );
  }

  return (
    <div className="mono-scope min-h-app flex items-center justify-center gap-3">
      {glyph}
      <span className="text-[11px] tracking-[0.12em] text-[var(--m-muted2)] uppercase">
        Loading
      </span>
    </div>
  );
};
