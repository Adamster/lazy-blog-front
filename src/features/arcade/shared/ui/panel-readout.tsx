"use client";

import { formatScore } from "../model/format-score";

/** Board side-panel label — the 11px/0.12em data-label tier (muted2, like the
 *  field labels and every stat-block label). Shared by every board panel. */
export function PanelLabel({ children }: { children: string }) {
  return (
    <div className="text-[11px] leading-[1.2] tracking-[0.12em] text-[var(--m-muted2)] uppercase">
      {children}
    </div>
  );
}

/**
 * Small ON-BOARD stat for a board's side panel (owner call 2026-07-04: run
 * stats joined the boards so FULLSCREEN shows them — the top stats band is
 * outside the fullscreen element): an 11px/0.12em muted2 data label over an
 * 18px display value, sign-coloured per the stat rule (accent > 0, muted 0).
 */
export function PanelReadout({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <PanelLabel>{label}</PanelLabel>
      <div
        className={`font-display text-[18px] leading-[1.18] font-bold tabular-nums ${
          value > 0 ? "text-[var(--m-accent)]" : "text-[var(--m-muted)]"
        }`}
      >
        {formatScore(value)}
      </div>
    </div>
  );
}
