"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { prefersReducedMotion } from "@/shared/lib/prefers-reduced-motion";

/**
 * In-bar brand lockup → home. `[ NOT ] LAZY` is FIXED (accent badge + fg base);
 * only the witty SUFFIX after it types / holds / erases, looping — trailed by
 * the blinking terminal caret (`.mono-caret`). All caps, 11px / 0.12em mono
 * label scale. Under `prefers-reduced-motion` it rests on bare `[ NOT ] LAZY`.
 *
 * Suffixes + timings are tweakable constants — the cadence isn't final yet. An
 * empty `""` suffix is the bare-`LAZY` anchor beat in the loop.
 */
// Gimmick parked for now — show static `[ NOT ] LAZY`. Flip to `false` to bring
// the typewriter cycle back (the SUFFIXES + loop below are kept intact).
const PAUSED = true;

const BADGE = "not";
const BASE = "lazy";
const SUFFIXES = [
  "",
  ", probably",
  ", just efficient",
  ", just patient",
  ", just saving energy",
  ", just sleepy",
];

const TYPE_MS = 70; // per char while typing
const ERASE_MS = 40; // per char while erasing
const HOLD_MS = 2600; // pause on a finished phrase before erasing

export function HeaderLockup() {
  const [suffix, setSuffix] = useState(SUFFIXES[0]);

  useEffect(() => {
    if (PAUSED || prefersReducedMotion()) return; // rest on bare `[ NOT ] LAZY`

    let timer: ReturnType<typeof setTimeout>;
    let i = 0; // current suffix
    let len = SUFFIXES[0].length; // chars of the suffix shown
    let erasing = true;

    const tick = () => {
      if (erasing) {
        if (len > 0) {
          len -= 1;
          setSuffix(SUFFIXES[i].slice(0, len));
          timer = setTimeout(tick, ERASE_MS);
        } else {
          i = (i + 1) % SUFFIXES.length;
          erasing = false;
          timer = setTimeout(tick, TYPE_MS);
        }
      } else {
        const next = SUFFIXES[i];
        if (len < next.length) {
          len += 1;
          setSuffix(next.slice(0, len));
          timer = setTimeout(tick, TYPE_MS);
        } else {
          erasing = true;
          timer = setTimeout(tick, HOLD_MS); // hold finished phrase, then erase
        }
      }
    };

    // base phrase is already rendered — hold it, then start cycling
    timer = setTimeout(tick, HOLD_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Link
      href="/"
      aria-label="Home"
      style={{ fontFamily: "var(--font-mono)" }}
      className="inline-flex items-center text-[11px] leading-none font-medium tracking-[0.12em] whitespace-nowrap uppercase"
    >
      <span className="text-[var(--m-accent)]">[ {BADGE} ]</span>
      <span className="ml-1 text-[var(--m-fg)]">
        {BASE}
        {suffix}
      </span>
      <span className="mono-caret" aria-hidden="true" />
    </Link>
  );
}
