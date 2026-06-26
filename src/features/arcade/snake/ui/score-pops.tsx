"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { prefersReducedMotion } from "@/shared/lib/prefers-reduced-motion";

/** A single live float — a unique key + the SIGNED points delta (±N). */
interface Pop {
  id: number;
  delta: number;
}

/** Float lifetime (ms) — long enough to read "+10", short enough to feel snappy. */
const POP_MS = 800;
/** How far the float rises over its life (px) — a small upward drift, no shift. */
const RISE_PX = 22;

/**
 * The "+N points" juice that pops by the live SCORE readout when the snake
 * catches a white rabbit. A keyed list of transient floats so rapid eats stack
 * and overlap gracefully — each fades in, rises, fades out, then self-removes on
 * animation end (no timers to leak).
 *
 * It watches the live `score` for any real CHANGE: each jump spawns one float
 * carrying the SIGNED delta (`score - prev`). A GAIN reads `+N` in the lime accent
 * (the green positive rabbit, +10/+20/+30/+50); a PENALTY reads `−N` in the error
 * red (a negative rabbit, −10/−20/−30/−50) — the color reinforces the hit. The
 * parent mounts this ONLY while the run is live ("playing") and UNMOUNTS it the
 * moment the run ends, so the restart's score RESET (N → 0) lands while this is
 * unmounted and a fresh run remounts with `prevRef` re-seeded to 0 — no spurious
 * −N float on a new game. NOTE the engine clamps score ≥ 0, so an in-play penalty
 * at score 0 produces no change → no float (correct: nothing was lost).
 *
 * Placement: an `absolute` overlay anchored to the SCORE number's RIGHT edge
 * (the parent wraps the number in a `relative inline-block`, so `left-full`
 * lands flush past the last digit regardless of digit count) and vertically
 * CENTRED on the number, `pointer-events-none`, so it never shifts layout.
 * On-system: ~18px readout size, tabular-nums. Under `prefers-reduced-motion` the
 * floats DON'T drift — a brief static fade in place; the score number itself
 * already updated, so no info is animation-only.
 */
export function ScorePops({ score }: { score: number }) {
  const reduce = prefersReducedMotion();
  // Last score we reacted to. Seeded with the incoming score so the FIRST render
  // (and any remount) never reads as a jump from 0 → score (no false "+score"
  // pop on mount / hydration / a run already in progress).
  const prevRef = useRef(score);
  // Monotonic key source — never reused, so rapid pops can't collide.
  const nextId = useRef(0);
  const [pops, setPops] = useState<Pop[]>([]);

  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = score;
    // Any real change (gain OR penalty) is a float; no change spawns nothing.
    // The parent only mounts this during a live run and remounts it per run
    // (prevRef re-seeds to 0), so every in-life change here is a real eat —
    // the restart N→0 reset happens while we're unmounted, never as a delta.
    if (score === prev) return;
    const delta = score - prev;
    const id = nextId.current++;
    // Defer the spawn into a fresh frame — repo lint rule forbids a synchronous
    // setState inside an effect body.
    const raf = requestAnimationFrame(() =>
      setPops((list) => [...list, { id, delta }])
    );
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const remove = (id: number) =>
    setPops((list) => list.filter((p) => p.id !== id));

  return (
    // Anchored to the number's RIGHT edge (`left-full` past the last digit) and
    // vertically CENTRED on it: `top-1/2` + `-translate-y-1/2` on THIS wrapper
    // does the static centring, NOT a transform on the motion span (framer owns
    // the span's transform via its `y`, so centring there would be overwritten).
    // `ml-4` (16px) sets the gap off the digits; `pointer-events-none` + absolute
    // → zero layout shift, and a high z so it paints over the cell's contents.
    <div
      className="pointer-events-none absolute top-1/2 left-full z-[2] ml-4 -translate-y-1/2"
      aria-hidden
    >
      {pops.map((pop) => {
        // A gain rises (and reads lime); a penalty SINKS (and reads error red) —
        // direction + color reinforce the sign at a glance. `−` is the proper
        // minus glyph; the magnitude is always shown unsigned after the sign.
        const gain = pop.delta > 0;
        const sign = gain ? "+" : "−";
        const drift = reduce ? 0 : gain ? -RISE_PX : RISE_PX;
        return (
          <motion.span
            key={pop.id}
            // One pass, no enter/exit handoff: fade in → hold → fade out while
            // drifting the whole time. Reduced motion holds y at 0 (pure fade).
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: [0, 1, 1, 0], y: drift }}
            transition={{
              duration: POP_MS / 1000,
              ease: "easeOut",
              times: [0, 0.15, 0.55, 1],
            }}
            onAnimationComplete={() => remove(pop.id)}
            // Stacked at the wrapper origin (top-left) so multiple rapid pops
            // overlap; whitespace-nowrap keeps "+10" on one line beside the number.
            className={`absolute top-0 left-0 text-[18px] leading-none font-semibold tracking-[0.06em] whitespace-nowrap tabular-nums ${
              gain ? "text-[var(--m-accent)]" : "text-[var(--m-error)]"
            }`}
          >
            {`${sign}${Math.abs(pop.delta)}`}
          </motion.span>
        );
      })}
    </div>
  );
}
