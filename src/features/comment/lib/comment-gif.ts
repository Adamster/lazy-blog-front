/**
 * Comment-GIF whitelist — the SINGLE source of truth for safely turning a
 * markdown image URL inside a comment body into an `<img src>`.
 *
 * SECURITY MODEL (mirrors `shared/lib/media-embed.ts`): a comment is plain text.
 * A picked GIF is authored as an inline markdown image `![gif](<url>)` (anywhere
 * in the body — the comment editor inserts it as an inline image node). The
 * renderer NEVER trusts arbitrary image URLs — `parseGifUrl()` accepts a URL
 * ONLY when its host is a whitelisted KLIPY/Tenor MEDIA CDN and the protocol is
 * https. Anything else returns `null` and the markdown is left as literal text
 * (it never reaches an `<img src>`). No HTML, no `dangerouslySetInnerHTML`.
 *
 * NOTE: new GIFs are KLIPY-hosted (`static.klipy.com`); the Tenor hosts are kept
 * tolerant so any older Tenor-sourced comment bodies still render. Giphy hosts
 * were dropped — its public key is permanently 403 BANNED, so no Giphy URLs are
 * authored anymore (any legacy Giphy comment now renders the literal markdown).
 *
 * Both the editor (insertion guard, `comment-toolbar.tsx`) and the read view
 * (`comment-markdown.tsx`) gate through `parseGifUrl` — the editor never carries
 * an off-list `src`, and the renderer literalises any image it doesn't trust.
 * The old trailing-GIF carrier (`parseCommentBody`/`appendGifs`) is retired now
 * that GIFs are first-class inline images; legacy trailing `![gif](url)` lines
 * still render, since the renderer treats any whitelisted image as a GIF.
 */

/** KLIPY + Tenor media CDN hosts we allow as an `<img src>`. */
const GIF_HOSTS = new Set([
  "static.klipy.com",
  "media.tenor.com",
  "c.tenor.com",
]);

/**
 * Validate a raw URL string for use as a comment GIF `<img src>`. Returns the
 * canonical https URL string when the host is whitelisted, else `null`.
 */
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
