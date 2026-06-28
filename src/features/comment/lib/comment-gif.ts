// Whitelist gate for comment GIF `<img src>`: only https on these CDN hosts; anything else stays literal text (no raw HTML).
// New GIFs are KLIPY; Tenor hosts kept tolerant for legacy comment bodies. Giphy dropped — its public key is permanently 403 banned.
const GIF_HOSTS = new Set([
  "static.klipy.com",
  "media.tenor.com",
  "c.tenor.com",
]);

export function parseGifUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (!GIF_HOSTS.has(url.hostname.toLowerCase())) return null;
  return url.toString();
}
