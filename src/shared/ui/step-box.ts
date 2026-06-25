/**
 * Shared visual language for the composer step boxes ({@link Stepper}) and the
 * profile tab boxes ({@link TabNav}): a `size-8`, 2px-bordered square marker.
 * Active = filled accent with a bg-coloured glyph; inactive = dim border +
 * muted2 glyph that goes accent on group-hover. Kept in ONE place so the
 * composer stepper and the edit-profile tabs stay byte-identical.
 */
export function stepBoxClass(active: boolean): string {
  return active
    ? "border-[var(--m-accent)] bg-[var(--m-accent)] text-[var(--m-bg)]"
    : "border-[var(--m-dim)] bg-transparent text-[var(--m-muted2)] group-hover:border-[var(--m-accent)] group-hover:text-[var(--m-accent)]";
}

/** The square marker box itself — `size-8`, 2px border, 12px semibold glyph. */
export const STEP_BOX =
  "flex size-8 items-center justify-center border-2 text-[12px] leading-none font-semibold transition-colors";
