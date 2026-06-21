"use client";

import { useEffect, useState } from "react";

interface IProps {
  inline?: boolean;
  compensateHeader?: boolean;
}

/** Terminal ASCII spinner frames — cycled at 100ms. */
const FRAMES = ["│", "/", "─", "\\"];

/**
 * Brutalist-Mono loading indicator — a terminal ASCII spinner (`│ / ─ \`
 * cycling at 100ms) in the accent colour, instead of a soft spinning ring.
 * `inline` centers a small spinner in flow; the block form fills the viewport
 * (spinner + `LOADING` label) and compensates for the fixed header by default.
 */
export const Loading = ({
  inline = false,
  compensateHeader = true,
}: IProps) => {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setFrame((f) => (f + 1) % FRAMES.length), 100);
    return () => clearInterval(id);
  }, []);

  const glyph = (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block w-[1ch] text-center leading-none font-bold text-[var(--m-accent)] tabular-nums ${
        inline ? "text-[14px]" : "text-[15px]"
      }`}
      style={{ fontFamily: "var(--font-mono)" }}
    >
      {FRAMES[frame]}
    </span>
  );

  // `mono-scope` so the `--m-*` tokens resolve (the route-level loading UI
  // mounts outside any page scope, where the accent would otherwise be unset).
  if (inline) {
    return <div className="mono-scope my-6 flex justify-center">{glyph}</div>;
  }

  return (
    <div
      className={`mono-scope flex min-h-screen items-center justify-center gap-3 ${
        compensateHeader ? "-mt-16" : ""
      }`}
    >
      {glyph}
      <span className="text-[10px] tracking-[0.18em] text-[var(--m-muted2)] uppercase">
        Loading
      </span>
    </div>
  );
};
