"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { prefersReducedMotion } from "@/shared/lib/prefers-reduced-motion";

// Gimmick parked — static `[ NOT ] LAZY`. Flip to `false` to bring the
// typewriter cycle back (the SUFFIXES + loop below are kept intact).
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
    if (PAUSED || prefersReducedMotion()) return;

    let timer: ReturnType<typeof setTimeout>;
    let i = 0;
    let len = SUFFIXES[0].length;
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
          timer = setTimeout(tick, HOLD_MS);
        }
      }
    };

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
