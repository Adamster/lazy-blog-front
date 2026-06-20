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
        inline ? "text-[20px]" : "text-[32px]"
      }`}
      style={{ fontFamily: "var(--font-mono)" }}
    >
      {FRAMES[frame]}
    </span>
  );

  if (inline) {
    return <div className="my-6 flex justify-center">{glyph}</div>;
  }

  return (
    <div
      className={`flex min-h-screen flex-col items-center justify-center gap-4 ${
        compensateHeader ? "-mt-16" : ""
      }`}
    >
      {glyph}
      <span className="text-[11px] tracking-[0.18em] text-[var(--m-muted2)] uppercase">
        Loading
      </span>
    </div>
  );
};
