// Owner rule: 1h author-edit grace, then locked. Frontend-only hint — backend is the authoritative gate.
export const COMMENT_EDIT_WINDOW_MS = 60 * 60 * 1000;

// Unparseable timestamp → not editable (fail closed).
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

// 0 means closed — used to schedule the exact re-render that drops Edit live.
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
