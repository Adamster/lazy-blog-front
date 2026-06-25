"use client";

import { useEffect, useState } from "react";
import { pick } from "@/shared/lib/glyphs";
import { prefersReducedMotion } from "@/shared/lib/prefers-reduced-motion";

interface SpotlightDecodeProps {
  /** The resolved message hidden under the scramble. */
  text: string;
  className?: string;
}

const COLS = 40;
const ROWS = 9;

/**
 * Pointer spotlight decode — a screen-black panel filled with a scrambling glyph
 * field; the resolved `text` line shows ONLY inside a circular CSS `mask` that
 * follows the cursor (2px `--m-accent` rim). Move the pointer to read the
 * message. LAB-only (pointer-global toy). Reduced motion: the whole field
 * resolves to the static message, no mask, no scramble.
 */
export function SpotlightDecode({
  text,
  className = "",
}: SpotlightDecodeProps) {
  const [scramble, setScramble] = useState("");
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) {
      // Defer the flag flip (no synchronous in-effect set); skip the scramble.
      const raf = requestAnimationFrame(() => setReduced(true));
      return () => cancelAnimationFrame(raf);
    }
    const id = setInterval(() => {
      let field = "";
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) field += pick();
        field += "\n";
      }
      setScramble(field);
    }, 90);
    return () => clearInterval(id);
  }, []);

  // Center the resolved message line in the field grid.
  const padded = text
    .slice(0, COLS)
    .padStart(Math.floor((COLS + text.length) / 2))
    .padEnd(COLS);
  const resolved = Array.from({ length: ROWS })
    .map((_, r) => (r === Math.floor(ROWS / 2) ? padded : " ".repeat(COLS)))
    .join("\n");

  if (reduced) {
    return (
      <div
        className={`border-2 border-[var(--m-dim)] bg-[#0d0d0d] ${className}`}
      >
        <pre className="overflow-hidden p-5 text-[12px] leading-[1.4] text-[var(--m-accent)]">
          {resolved}
        </pre>
      </div>
    );
  }

  const maskStyle = pos
    ? {
        WebkitMaskImage: `radial-gradient(circle 64px at ${pos.x}px ${pos.y}px, #000 60%, transparent 100%)`,
        maskImage: `radial-gradient(circle 64px at ${pos.x}px ${pos.y}px, #000 60%, transparent 100%)`,
      }
    : {
        WebkitMaskImage:
          "radial-gradient(circle 0 at -100px -100px, #000, #000)",
        maskImage: "radial-gradient(circle 0 at -100px -100px, #000, #000)",
      };

  return (
    <div
      className={`relative overflow-hidden border-2 border-[var(--m-dim)] bg-[#0d0d0d] ${className}`}
      onPointerMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
      onPointerLeave={() => setPos(null)}
    >
      {/* Scramble field — always visible. */}
      <pre
        aria-hidden="true"
        className="overflow-hidden p-5 text-[12px] leading-[1.4] text-[var(--m-muted2)]"
      >
        {scramble}
      </pre>
      {/* Resolved line — masked to a spotlight under the cursor. */}
      <pre
        aria-label={text}
        className="pointer-events-none absolute inset-0 overflow-hidden p-5 text-[12px] leading-[1.4] text-[var(--m-accent)]"
        style={maskStyle}
      >
        {resolved}
      </pre>
    </div>
  );
}
