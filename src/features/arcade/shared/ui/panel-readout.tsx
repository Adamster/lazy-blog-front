"use client";

import { formatScore } from "../model/format-score";

/** Board side-panel label — the 11px/0.12em data-label tier (muted2, like the
 *  field labels and every stat-block label). Shared by every board panel.
 *  In FULLSCREEN (the board root stamps `data-board-fs`) it steps up to the
 *  in-set 18px so it isn't dwarfed by the enlarged well — paired with the
 *  PanelReadout value's 18→32 step (keeps the ~0.6 label:value proportion). */
export function PanelLabel({ children }: { children: string }) {
  return (
    <div className="text-[11px] leading-[1.2] tracking-[0.12em] text-[var(--m-muted2)] uppercase [[data-board-fs]_&]:text-[18px]">
      {children}
    </div>
  );
}

/**
 * Small ON-BOARD stat for a board's side panel (owner call 2026-07-04: run
 * stats joined the boards so FULLSCREEN shows them — the top stats band is
 * outside the fullscreen element): an 11px/0.12em muted2 data label over an
 * 18px display value, sign-coloured per the stat rule (accent > 0, muted 0).
 * In FULLSCREEN (the board root stamps `data-board-fs`) the value steps up to
 * the in-set 32px (H1) so it reads proportionally beside the enlarged well.
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
        className={`font-display text-[18px] leading-[1.18] font-bold tabular-nums [[data-board-fs]_&]:text-[32px] ${
          value > 0 ? "text-[var(--m-accent)]" : "text-[var(--m-muted)]"
        }`}
      >
        {formatScore(value)}
      </div>
    </div>
  );
}
