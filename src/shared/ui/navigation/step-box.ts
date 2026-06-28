// Kept in ONE place so the composer Stepper and the edit-profile TabNav boxes stay identical.
export function stepBoxClass(active: boolean): string {
  return active
    ? "border-[var(--m-accent)] bg-[var(--m-accent)] text-[var(--m-bg)]"
    : "border-[var(--m-dim)] bg-transparent text-[var(--m-muted2)] group-hover:border-[var(--m-accent)] group-hover:text-[var(--m-accent)]";
}

export const STEP_BOX =
  "flex size-8 items-center justify-center border-2 text-[12px] leading-none font-semibold transition-colors";
