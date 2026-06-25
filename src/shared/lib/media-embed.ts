/**
 * Shared media-embed parser — the SINGLE source of truth for turning a YouTube /
 * Spotify URL into a validated, whitelisted embed descriptor. Used by BOTH the
 * read view (`MediaEmbed` via `remarkMediaEmbeds` in `post-body.tsx`) and the
 * Crepe editor node (`editor-embed-node.ts`), so the two agree by construction.
 *
 * SECURITY MODEL — the only thing that ever reaches an iframe `src` is an id /
 * type we extracted with a strict regex from a WHITELISTED host. We never pass a
 * user-supplied URL through: `embedSrc()` rebuilds the canonical embed URL from
 * the validated, character-class-constrained id. A URL that doesn't match a known
 * host + shape returns `null`, and the caller falls back to a plain link.
 */

/** A YouTube video embed (id is the 11-char video id, validated below). */
export interface YouTubeEmbed {
  kind: "youtube";
  id: string;
}

/** A Spotify embed. `type` is one of the whitelisted resource types; `id` is the
 *  22-char base62 resource id. */
export interface SpotifyEmbed {
  kind: "spotify";
  type: SpotifyType;
  id: string;
}

export type MediaEmbed = YouTubeEmbed | SpotifyEmbed;

/** Spotify resource types we embed. A type outside this set is rejected. */
const SPOTIFY_TYPES = [
  "track",
  "album",
  "playlist",
  "episode",
  "show",
] as const;
export type SpotifyType = (typeof SPOTIFY_TYPES)[number];

const SPOTIFY_TYPE_SET = new Set<string>(SPOTIFY_TYPES);

/** YouTube video ids are exactly 11 chars from this URL-safe alphabet. */
const YT_ID = /^[\w-]{11}$/;
/** Spotify resource ids are 22-char base62. */
const SPOTIFY_ID = /^[A-Za-z0-9]{22}$/;

/** Whitelisted YouTube hosts (with/without `www.`, plus the short + nocookie). */
const YT_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
  "youtu.be",
]);

const SPOTIFY_HOSTS = new Set(["open.spotify.com", "play.spotify.com"]);

/**
 * Parse a raw URL string into a validated embed descriptor, or `null` if it is
 * not a YouTube / Spotify URL we can safely embed.
 *
 * Accepted YouTube shapes:
 *   - `…youtube.com/watch?v=<id>`     (the `v` query param)
 *   - `…youtu.be/<id>`                 (short link path)
 *   - `…youtube.com/shorts/<id>`       (shorts path)
 *   - `…youtube.com/embed/<id>`        (already-embed link)
 * Accepted Spotify shapes:
 *   - `open.spotify.com/<type>/<id>`   (optionally locale-prefixed, e.g. `/intl-de/`)
 *   - `open.spotify.com/embed/<type>/<id>`
 */
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
  // youtu.be/<id>  — id is the first path segment.
  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0] ?? "";
    return YT_ID.test(id) ? { kind: "youtube", id } : null;
  }

  // youtube.com/watch?v=<id>
  const v = url.searchParams.get("v");
  if (v && YT_ID.test(v)) return { kind: "youtube", id: v };

  // youtube.com/shorts/<id>  |  /embed/<id>  |  /v/<id>
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
  // Strip a leading locale segment (`/intl-de/track/…`) and an `/embed/` prefix,
  // then expect `<type>/<id>`.
  let segs = url.pathname.split("/").filter(Boolean);
  if (segs[0]?.startsWith("intl-")) segs = segs.slice(1);
  if (segs[0] === "embed") segs = segs.slice(1);

  const [type, id] = segs;
  if (!type || !id) return null;
  if (!SPOTIFY_TYPE_SET.has(type)) return null;
  if (!SPOTIFY_ID.test(id)) return null;

  return valid({ kind: "spotify", type: type as SpotifyType, id }, id);
}

/**
 * Build the canonical, privacy-friendly iframe `src` from a VALIDATED descriptor.
 * The id/type came from `parseEmbedUrl`'s strict regexes, so the only thing
 * interpolated is a `[\w-]{11}` / base62 token — never a raw user URL.
 */
export function embedSrc(embed: MediaEmbed): string {
  if (embed.kind === "youtube") {
    return `https://www.youtube-nocookie.com/embed/${embed.id}`;
  }
  return `https://open.spotify.com/embed/${embed.type}/${embed.id}`;
}

/**
 * Spotify's recommended player heights. Track/episode use the compact player;
 * album/playlist/show use the taller list player. YouTube has no fixed height —
 * it keeps a 16:9 aspect-ratio box (see `MediaEmbed`).
 */
const SPOTIFY_COMPACT = new Set<SpotifyType>(["track", "episode"]);
export function spotifyHeight(type: SpotifyType): number {
  return SPOTIFY_COMPACT.has(type) ? 152 : 352;
}

/** A short human label for the embed (placeholder cards, iframe titles). */
export function embedLabel(embed: MediaEmbed): string {
  return embed.kind === "youtube" ? "YouTube video" : `Spotify ${embed.type}`;
}
