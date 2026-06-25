/**
 * Comment-GIF carrier + whitelist — the SINGLE source of truth for embedding a
 * GIF in a comment body and safely turning it back into an `<img>`.
 *
 * SECURITY MODEL (mirrors `shared/lib/media-embed.ts`): a comment is plain text.
 * A picked GIF is appended as a markdown image `![gif](<url>)` on its own line.
 * The renderer NEVER trusts arbitrary image URLs — `parseGifUrl()` accepts a URL
 * ONLY when its host is a whitelisted Giphy/Tenor MEDIA CDN and the protocol is
 * https. Anything else returns `null` and the markdown is left as literal text
 * (it never reaches an `<img src>`). No HTML, no `dangerouslySetInnerHTML`.
 */

/** Giphy + Tenor media CDN hosts we allow as an `<img src>`. */
const GIF_HOSTS = new Set([
  "media.giphy.com",
  "media0.giphy.com",
  "media1.giphy.com",
  "media2.giphy.com",
  "media3.giphy.com",
  "media4.giphy.com",
  "i.giphy.com",
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

/** Matches a markdown image on its own line: `![gif](<url>)`. */
const GIF_MARKDOWN_RE = /^!\[[^\]]*\]\((\S+)\)$/;

/** A parsed comment body: the plain text plus any whitelisted trailing GIF. */
export interface ParsedCommentBody {
  /** The comment text with the GIF line removed (trimmed). */
  text: string;
  /** Validated GIF `<img src>`, or `null` when there's no (valid) GIF. */
  gifUrl: string | null;
}

/**
 * Split a comment body into its text and an optional trailing whitelisted GIF.
 * The GIF must be a `![gif](url)` line whose URL passes {@link parseGifUrl}; an
 * unrecognised/untrusted line stays part of the text (rendered literally).
 */
export function parseCommentBody(body: string): ParsedCommentBody {
  const lines = body.split("\n");
  const last = lines[lines.length - 1]?.trim() ?? "";
  const match = last.match(GIF_MARKDOWN_RE);
  const gifUrl = match ? parseGifUrl(match[1]) : null;
  if (!gifUrl) return { text: body, gifUrl: null };
  return { text: lines.slice(0, -1).join("\n").trim(), gifUrl };
}

/** Append a GIF markdown line to a comment body (a blank line between if text). */
export function appendGif(body: string, gifUrl: string): string {
  const trimmed = body.trimEnd();
  const sep = trimmed ? "\n\n" : "";
  return `${trimmed}${sep}![gif](${gifUrl})`;
}
