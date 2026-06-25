"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { prefersReducedMotion } from "@/shared/lib/prefers-reduced-motion";

/** A single live float — a unique key + the actual points grabbed. */
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
 * It watches the live `score` for a real INCREASE only: each upward jump spawns
 * one float carrying the ACTUAL delta (`score - prev`), so it reads `+10` today
 * and auto-adapts if scoring ever varies. A score RESET (new game → 0) or any
 * non-increase (trickster = +length/+0, death) spawns nothing — only the catch
 * that moved the number.
 *
 * Placement: an `absolute` overlay pinned to the SCORE number's cell,
 * `pointer-events-none`, so it never shifts layout. On-system: lime accent, the
 * Caption-12 readout size, tabular-nums. Under `prefers-reduced-motion` the
 * floats DON'T rise — a brief static fade in place; the score number itself
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
    // Only a real INCREASE is a catch. A decrease/reset (new game → 0) or no
    // change spawns nothing.
    if (score <= prev) return;
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
    // Anchored to the number's top edge (the cell's Label is ~19px tall + a 8px
    // gap → the 46px number starts ~27px down). The pops sit just above the
    // number's top-left and rise off it, clear of both the `// SCORE` label and
    // the digits. `pointer-events-none` + absolute → zero layout shift.
    <div
      className="pointer-events-none absolute top-[18px] left-0 z-[1]"
      aria-hidden
    >
      {pops.map((pop) => (
        <motion.span
          key={pop.id}
          // One pass, no enter/exit handoff: fade in → hold → fade out while
          // drifting up the whole time. Reduced motion holds y at 0 (pure fade).
          initial={{ opacity: 0, y: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            y: reduce ? 0 : -RISE_PX,
          }}
          transition={{
            duration: POP_MS / 1000,
            ease: "easeOut",
            times: [0, 0.15, 0.55, 1],
          }}
          onAnimationComplete={() => remove(pop.id)}
          className="absolute top-0 left-0 text-[12px] leading-none font-semibold tracking-[0.06em] text-[var(--m-accent)] tabular-nums"
        >
          {`+${pop.delta}`}
        </motion.span>
      ))}
    </div>
  );
}
