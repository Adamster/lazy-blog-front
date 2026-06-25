"use client";

import { GlitchText } from "@/shared/ui";

/**
 * Arcade page title block — a glitching LAZY SNAKE title (our {@link GlitchText},
 * 40px Display) + a one-line control hint. No eyebrow, no NOT-LAZY lockup — the
 * app's global header owns the brand.
 */
export function ArcadeHeader() {
  return (
    <header>
      <h1 className="font-display text-[40px] leading-[1.04] font-bold tracking-[-0.02em] text-[var(--m-fg)]">
        <GlitchText>LAZY SNAKE</GlitchText>
      </h1>
      <p className="mt-4 text-[14px] leading-[1.6] text-[var(--m-muted)]">
        Arrows or <span className="text-[var(--m-fg)]">WASD</span> to steer,{" "}
        <span className="text-[var(--m-fg)]">Space</span> to pause.
      </p>
    </header>
  );
}
