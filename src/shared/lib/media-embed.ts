// Single source of truth for validating a YouTube/Spotify URL into a whitelisted
// embed descriptor (shared by the read view + the Crepe editor node).
// SECURITY: only a strict-regex id/type from a whitelisted host ever reaches an
// iframe `src` — `embedSrc()` rebuilds the URL, never passing the raw input through.

export interface YouTubeEmbed {
  kind: "youtube";
  id: string;
}

export interface SpotifyEmbed {
  kind: "spotify";
  type: SpotifyType;
  id: string;
}

export type MediaEmbed = YouTubeEmbed | SpotifyEmbed;

const SPOTIFY_TYPES = [
  "track",
  "album",
  "playlist",
  "episode",
  "show",
] as const;
export type SpotifyType = (typeof SPOTIFY_TYPES)[number];

const SPOTIFY_TYPE_SET = new Set<string>(SPOTIFY_TYPES);

const YT_ID = /^[\w-]{11}$/;
const SPOTIFY_ID = /^[A-Za-z0-9]{22}$/;

const YT_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
  "youtu.be",
]);

const SPOTIFY_HOSTS = new Set(["open.spotify.com", "play.spotify.com"]);

export function parseEmbedUrl(raw: string): MediaEmbed | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const host = url.hostname.toLowerCase();

  if (YT_HOSTS.has(host)) return parseYouTube(url, host);
  if (SPOTIFY_HOSTS.has(host)) return parseSpotify(url);
  return null;
}

function valid<T extends MediaEmbed>(embed: T, id: string): T | null {
  return embed.id === id ? embed : null;
}

function parseYouTube(url: URL, host: string): YouTubeEmbed | null {
  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0] ?? "";
    return YT_ID.test(id) ? { kind: "youtube", id } : null;
  }

  const v = url.searchParams.get("v");
  if (v && YT_ID.test(v)) return { kind: "youtube", id: v };

  const segs = url.pathname.split("/").filter(Boolean);
  if (
    (segs[0] === "shorts" || segs[0] === "embed" || segs[0] === "v") &&
    segs[1] &&
    YT_ID.test(segs[1])
  ) {
    return { kind: "youtube", id: segs[1] };
  }

  return null;
}

function parseSpotify(url: URL): SpotifyEmbed | null {
  // Strip a leading locale segment (`/intl-de/…`) and an `/embed/` prefix.
  let segs = url.pathname.split("/").filter(Boolean);
  if (segs[0]?.startsWith("intl-")) segs = segs.slice(1);
  if (segs[0] === "embed") segs = segs.slice(1);

  const [type, id] = segs;
  if (!type || !id) return null;
  if (!SPOTIFY_TYPE_SET.has(type)) return null;
  if (!SPOTIFY_ID.test(id)) return null;

  return valid({ kind: "spotify", type: type as SpotifyType, id }, id);
}

// Builds the canonical iframe `src` from a VALIDATED descriptor — only a regex-
// constrained id/type is interpolated, never a raw user URL.
export function embedSrc(embed: MediaEmbed): string {
  if (embed.kind === "youtube") {
    return `https://www.youtube-nocookie.com/embed/${embed.id}`;
  }
  return `https://open.spotify.com/embed/${embed.type}/${embed.id}`;
}

// Spotify's recommended player heights: compact for track/episode, taller otherwise.
const SPOTIFY_COMPACT = new Set<SpotifyType>(["track", "episode"]);
export function spotifyHeight(type: SpotifyType): number {
  return SPOTIFY_COMPACT.has(type) ? 152 : 352;
}

export function embedLabel(embed: MediaEmbed): string {
  return embed.kind === "youtube" ? "YouTube video" : `Spotify ${embed.type}`;
}

// Pulls only the `src` out of an `<iframe>` tag (caller validates it); the rest
// of the tag is untrusted and discarded.
function iframeSrc(tag: string): string | null {
  const m = /\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(tag);
  const src = m?.[1] ?? m?.[2];
  return src ? src : null;
}

// Matches each `<iframe>` (self-closing or not) in a blob; the optional body +
// closing tag are consumed so a non-self-closing tag leaves no dangling remnant.
const IFRAME_TAG =
  /<iframe\b[^>]*?>(?:(?:(?!<iframe\b)[\s\S])*?<\/iframe\s*>)?/gi;

export type IframeBlobPart =
  | { kind: "embed"; embed: MediaEmbed }
  | { kind: "text"; value: string };

// Splits a raw HTML blob into ordered parts: whitelisted iframes become `embed`
// parts, everything else stays `text`.
// SECURITY: a non-whitelisted iframe is kept as INERT text (the read view escapes
// it); only the validated descriptor ever reaches a player.
export function splitIframeBlob(html: string): IframeBlobPart[] {
  const parts: IframeBlobPart[] = [];
  let lastIndex = 0;
  let hasEmbed = false;

  IFRAME_TAG.lastIndex = 0;
  for (let m = IFRAME_TAG.exec(html); m; m = IFRAME_TAG.exec(html)) {
    const tag = m[0];
    const src = iframeSrc(tag);
    const embed = src ? parseEmbedUrl(src) : null;
    if (!embed) continue; // non-whitelisted iframe stays in the text run

    const before = html.slice(lastIndex, m.index);
    if (before) parts.push({ kind: "text", value: before });
    parts.push({ kind: "embed", embed });
    lastIndex = m.index + tag.length;
    hasEmbed = true;
  }

  if (!hasEmbed) return [{ kind: "text", value: html }];

  const tail = html.slice(lastIndex);
  if (tail) parts.push({ kind: "text", value: tail });
  return parts;
}
