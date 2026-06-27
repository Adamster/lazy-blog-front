/**
 * Shared href sanitizer for user-authored links. Returns the canonicalised URL
 * when it is a safe `http:`/`https:` destination, or `null` to reject it
 * (`javascript:`, `data:`, `vbscript:`, relative/opaque, malformed, …) so the
 * caller can fall back to inert text / `#` instead of an executable link.
 *
 * This is the single source of truth for "is this href safe to render": the
 * comment-body link/autolink renderer gates on it, so the security posture is
 * consistent wherever UGC links are rendered.
 */
export function safeHref(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  return url.toString();
}
