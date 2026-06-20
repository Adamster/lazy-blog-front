"use client";

import { useEffect, useState } from "react";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!<>-_/\\[]{}=+*#%&".split(
  ""
);
const pick = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

interface Props {
  /** The message that resolves out of the scramble. */
  text: string;
  className?: string;
  /** ms per character as the message decodes. */
  speed?: number;
  /** ms to hold the fully-revealed message. */
  holdMs?: number;
  /** ms of pure scramble before the decode begins. */
  scrambleMs?: number;
}

/**
 * "Matrix" decode text — cycles forever: random glyphs scramble, resolve
 * left-to-right into `text`, hold, then scramble again. Reusable across the
 * mono surfaces (empty states, etc.). Respects reduced-motion (stays static).
 */
export function MatrixText({
  text,
  className = "",
  speed = 55,
  holdMs = 2200,
  scrambleMs = 2700,
}: Props) {
  const [out, setOut] = useState(text);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return; // keep the static message for reduced-motion users
    }

    const chars = [...text];
    const revealDur = chars.length * speed;
    const cycle = scrambleMs + revealDur + holdMs;
    const FRAME = 80; // glyph-swap cadence (higher = slower flicker)
    let elapsed = 0;

    const id = setInterval(() => {
      elapsed = (elapsed + FRAME) % cycle;
      let revealed: number;
      if (elapsed < scrambleMs) revealed = 0;
      else if (elapsed < scrambleMs + revealDur)
        revealed = Math.floor((elapsed - scrambleMs) / speed);
      else revealed = chars.length;

      setOut(
        chars
          .map((c, i) => (c === " " ? " " : i < revealed ? c : pick()))
          .join("")
      );
    }, FRAME);

    return () => clearInterval(id);
  }, [text, speed, holdMs, scrambleMs]);

  return (
    <span className={className} aria-label={text}>
      {out}
    </span>
  );
}
