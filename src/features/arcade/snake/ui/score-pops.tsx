"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { prefersReducedMotion } from "@/shared/lib/prefers-reduced-motion";

interface Pop {
  id: number;
  delta: number;
}

const POP_MS = 800;
const RISE_PX = 22;

/**
 * The "+N" juice by the live SCORE readout. Watches `score` for any change and
 * spawns one float per jump carrying the SIGNED delta (gain = `+N` lime rising,
 * penalty = `−N` red sinking). The parent mounts this ONLY while a run is live and
 * UNMOUNTS at run end, so the restart's N→0 reset lands while unmounted and a fresh
 * run remounts with `prevRef` re-seeded to 0 — no spurious `−N` on a new game. (The
 * engine clamps score ≥ 0, so a penalty at 0 produces no change → no float.)
 */
export function ScorePops({ score }: { score: number }) {
  const reduce = prefersReducedMotion();
  // Seeded with the incoming score so the first render/remount isn't read as a 0→score jump.
  const prevRef = useRef(score);
  const nextId = useRef(0);
  const [pops, setPops] = useState<Pop[]>([]);

  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = score;
    if (score === prev) return;
    const delta = score - prev;
    const id = nextId.current++;
    // Defer into a fresh frame — repo lint rule: no synchronous setState in an effect.
    const raf = requestAnimationFrame(() =>
      setPops((list) => [...list, { id, delta }])
    );
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const remove = (id: number) =>
    setPops((list) => list.filter((p) => p.id !== id));

  return (
    // Centred on THIS wrapper, NOT the motion span (framer owns the span's
    // transform via `y`, so centring there would be overwritten). Anchored to the
    // number's right edge (`left-full`); pointer-events-none + absolute → no layout shift.
    <div
      className="pointer-events-none absolute top-1/2 left-full z-[2] ml-4 -translate-y-1/2"
      aria-hidden
    >
      {pops.map((pop) => {
        // Gain rises (lime); penalty sinks (red). `−` is the proper minus glyph.
        const gain = pop.delta > 0;
        const sign = gain ? "+" : "−";
        const drift = reduce ? 0 : gain ? -RISE_PX : RISE_PX;
        return (
          <motion.span
            key={pop.id}
            // One pass: fade in → hold → fade out while drifting. Reduced motion holds y at 0.
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: [0, 1, 1, 0], y: drift }}
            transition={{
              duration: POP_MS / 1000,
              ease: "easeOut",
              times: [0, 0.15, 0.55, 1],
            }}
            onAnimationComplete={() => remove(pop.id)}
            // Stacked at the wrapper origin so rapid pops overlap.
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
