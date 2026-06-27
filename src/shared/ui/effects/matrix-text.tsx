"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { pick } from "@/shared/lib/glyphs";
import { prefersReducedMotion } from "@/shared/lib/prefers-reduced-motion";

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
  /**
   * `"loop"` (default) — scramble forever; `"hover"` — rest as plain text and
   * run ONE decode pass on pointer-enter / focus; `"scroll"` — rest as plain
   * text and run ONE decode pass when first scrolled into view (the `:type`
   * post directive + LAB "decode on scroll").
   */
  trigger?: "loop" | "hover" | "scroll";
}

/**
 * "Matrix" decode text — random glyphs (from the shared {@link MATRIX_GLYPHS})
 * scramble and resolve left-to-right into `text`. `trigger="loop"` cycles
 * forever (empty states, etc.); `trigger="hover"` runs a single decode on
 * enter/focus; `trigger="scroll"` runs a single decode the first time it scrolls
 * into view. Reusable across the mono surfaces. Respects reduced-motion: in
 * every mode the static `text` is shown and no scramble runs.
 */
export function MatrixText({
  text,
  className = "",
  speed = 55,
  holdMs = 2200,
  scrambleMs = 2700,
  trigger = "loop",
}: Props) {
  const [out, setOut] = useState(text);
  const frameRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spanRef = useRef<HTMLSpanElement>(null);

  // Looping decode — runs while mounted (loop mode only).
  useEffect(() => {
    if (trigger !== "loop") return;
    if (prefersReducedMotion()) return; // keep the static message

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
  }, [text, speed, holdMs, scrambleMs, trigger]);

  // One decode pass — shared by the hover/focus and scroll-in triggers.
  const runOnce = useCallback(() => {
    if (trigger === "loop" || prefersReducedMotion()) return;
    if (frameRef.current) clearInterval(frameRef.current);

    const chars = [...text];
    const total = 16;
    let frame = 0;
    frameRef.current = setInterval(() => {
      frame++;
      const reveal = Math.floor((frame / total) * chars.length);
      if (frame >= total) {
        if (frameRef.current) clearInterval(frameRef.current);
        frameRef.current = null;
        setOut(text);
        return;
      }
      setOut(
        chars
          .map((c, i) => (c === " " ? " " : i < reveal ? c : pick()))
          .join("")
      );
    }, 40);
  }, [text, trigger]);

  useEffect(() => {
    // Cleanup any in-flight one-shot pass on unmount.
    return () => {
      if (frameRef.current) clearInterval(frameRef.current);
    };
  }, []);

  // Scroll trigger — run the single decode the first time the span is in view.
  useEffect(() => {
    if (trigger !== "scroll") return;
    const node = spanRef.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      runOnce();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          runOnce();
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [trigger, runOnce]);

  const hoverProps =
    trigger === "hover"
      ? { onMouseEnter: runOnce, onFocus: runOnce, tabIndex: 0 }
      : undefined;

  return (
    <span ref={spanRef} className={className} aria-label={text} {...hoverProps}>
      {out}
    </span>
  );
}
