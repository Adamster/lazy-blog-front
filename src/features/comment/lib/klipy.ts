/**
 * Tiny typed KLIPY GIF client — `trending()` (the default grid) + `search()` (on
 * type). Client-side only: comments fetch GIFs straight from the KLIPY CDN, no
 * backend hop. (Replaces Giphy, whose public key is permanently 403 BANNED.)
 *
 * KEY — owner has no Vercel/env access, so the key is hardcoded as the fallback
 * per the project's `?? "fallback"` rule; an env var overrides it when set.
 * KLIPY embeds the key in the URL PATH (not a query param):
 *   GET https://api.klipy.com/api/v1/{KEY}/gifs/trending
 *   GET https://api.klipy.com/api/v1/{KEY}/gifs/search?q=...
 * KLIPY is lifetime-free; a 4xx/5xx surfaces as the picker's error state.
 */
const KLIPY_API_KEY =
  process.env.NEXT_PUBLIC_KLIPY_API_KEY ??
  "NJanJbp9oWs8id66NePI74yQ7HuOuB12bjLIl4tp1IVCuR19YQU84kOi6q0ZIdyq";
const KLIPY_ROOT = `https://api.klipy.com/api/v1/${KLIPY_API_KEY}`;

/** KLIPY serves GIFs and (transparent) stickers from parallel endpoints
 *  (`/gifs/*` vs `/stickers/*`) with an identical response shape. */
export type MediaKind = "gif" | "sticker";

/** One file rendition (a single format under a size bucket). */
interface KlipyRendition {
  url: string;
  width: number;
  height: number;
}

/** A size bucket (hd/md/sm/xs) holds one rendition per format. */
interface KlipyFormats {
  gif?: KlipyRendition;
  webp?: KlipyRendition;
  jpg?: KlipyRendition;
}

interface KlipyRaw {
  id: number | string;
  title?: string;
  /** Size buckets, largest → smallest. We use `sm` (grid) + `md` (insert). */
  file: {
    hd?: KlipyFormats;
    md?: KlipyFormats;
    sm?: KlipyFormats;
    xs?: KlipyFormats;
  };
  /** Inline base64 JPEG placeholder — our reduced-motion still fallback. */
  blur_preview?: string;
}

interface KlipyListResponse {
  result: boolean;
  data: {
    data: KlipyRaw[];
  };
}

/** A normalised GIF result the picker grid renders. */
export interface GifResult {
  id: string;
  /** Alt / accessible name (KLIPY `title`, may be empty). */
  title: string;
  /** Animated grid thumbnail (`file.sm.gif`, ~165–220px tall). */
  thumbUrl: string;
  /** Static first-frame of the thumbnail (reduced-motion grid). */
  stillUrl: string;
  /** The rendition inserted into the comment (`file.md.gif`, ~450–640px). */
  fullUrl: string;
  width: number;
  height: number;
}

function normalize(raw: KlipyRaw): GifResult | null {
  const sm = raw.file.sm;
  const thumb = sm?.gif;
  // Insert the medium animated GIF; fall back to the small one if absent.
  const full = raw.file.md?.gif ?? thumb;
  if (!thumb || !full) return null;
  return {
    id: String(raw.id),
    title: raw.title?.trim() || "GIF",
    thumbUrl: thumb.url,
    // Static frame for reduced-motion: the small still JPEG, else the inline
    // blur placeholder, else the animated thumb (worst case).
    stillUrl: sm?.jpg?.url ?? raw.blur_preview ?? thumb.url,
    fullUrl: full.url,
    width: full.width,
    height: full.height,
  };
}

async function request(
  kind: MediaKind,
  path: string,
  params: Record<string, string>,
  signal?: AbortSignal
): Promise<GifResult[]> {
  const query = new URLSearchParams({
    per_page: "48",
    rating: "pg-13",
    ...params,
  });
  // `gif` → /gifs, `sticker` → /stickers (KLIPY's parallel endpoints).
  const res = await fetch(`${KLIPY_ROOT}/${kind}s/${path}?${query}`, {
    signal,
  });
  if (!res.ok) throw new Error(`KLIPY request failed (${res.status})`);
  const json = (await res.json()) as KlipyListResponse;
  return json.data.data
    .map(normalize)
    .filter((g): g is GifResult => g !== null);
}

/** Trending GIFs/stickers — the picker's default grid (before any search). */
export function fetchTrending(
  kind: MediaKind,
  signal?: AbortSignal
): Promise<GifResult[]> {
  return request(kind, "trending", {}, signal);
}

/** Search GIFs/stickers by query (KLIPY pagination is page-based, not offset). */
export function searchMedia(
  kind: MediaKind,
  query: string,
  signal?: AbortSignal
): Promise<GifResult[]> {
  return request(kind, "search", { q: query, page: "1" }, signal);
}
