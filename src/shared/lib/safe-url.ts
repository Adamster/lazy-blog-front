// Single source of truth for "is this UGC href safe to render": returns the
// canonical URL for `http(s):` only, else `null` (caller falls back to inert
// text) — rejects `javascript:`/`data:`/relative/malformed.
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
