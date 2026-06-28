"use client";

import { GlitchText } from "@/shared/ui/effects";

/** Arcade title block — glitching headline + control hint. No lockup; the app's
 *  global header owns the brand. */
export function ArcadeHeader() {
  return (
    <header>
      <h1 className="font-display text-[40px] leading-[1.04] font-bold tracking-[-0.02em] text-[var(--m-fg)]">
        <GlitchText>FOLLOW THE WHITE RABBIT</GlitchText>
      </h1>
      <p className="mt-4 text-[14px] leading-[1.6] text-[var(--m-muted)]">
        Steer with the <span className="text-[var(--m-fg)]">arrow keys</span>.
        Pausing is also a valid strategy.
      </p>
    </header>
  );
}
