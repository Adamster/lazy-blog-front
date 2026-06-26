/**
 * Comment edit window — a comment is editable by its author only within this
 * window after creation (owner rule: a one-hour grace period, then it's locked).
 * The frontend hides the Edit affordance once the window closes; the backend is
 * the authoritative gate (a stale client must still be rejected server-side).
 */
export const COMMENT_EDIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

/**
 * True while `createdAtUtc` is still inside the {@link COMMENT_EDIT_WINDOW_MS}
 * window. `now` is injectable for deterministic tests. Accepts the `Date` the
 * openapi layer deserializes (already UTC-correct) or a raw string; an unparseable
 * value is treated as NOT editable (fail closed).
 */
export function canEditComment(
  createdAtUtc: string | Date,
  now: number = Date.now()
): boolean {
  const created =
    createdAtUtc instanceof Date ? createdAtUtc : new Date(createdAtUtc);
  const createdMs = created.getTime();
  if (Number.isNaN(createdMs)) return false;
  return now - createdMs < COMMENT_EDIT_WINDOW_MS;
}

/**
 * Milliseconds left in the edit window (clamped to ≥ 0). `0` means closed — used
 * to schedule the exact re-render that drops the Edit affordance live.
 */
export function editWindowRemainingMs(
  createdAtUtc: string | Date,
  now: number = Date.now()
): number {
  const created =
    createdAtUtc instanceof Date ? createdAtUtc : new Date(createdAtUtc);
  const createdMs = created.getTime();
  if (Number.isNaN(createdMs)) return 0;
  return Math.max(0, createdMs + COMMENT_EDIT_WINDOW_MS - now);
}
