/**
 * Tiny typed Giphy client — `trending()` (the default grid) + `search()` (on
 * type). Client-side only: comments fetch GIFs straight from the Giphy CDN, no
 * backend hop.
 *
 * KEY — owner has no Vercel/env access, so the PUBLIC BETA key is hardcoded as
 * the fallback per the project's `?? "fallback"` rule; an env var overrides it
 * when one is set. The beta key is shared + heavily rate-limited (HTTP 429 →
 * surfaces as the picker's error state). Replace it with a production Giphy key
 * (`NEXT_PUBLIC_GIPHY_API_KEY`) before this sees real traffic.
 */
const GIPHY_KEY = process.env.NEXT_PUBLIC_GIPHY_API_KEY ?? "dc6zaTOxFJmzC"; // public beta key
const GIPHY_BASE = "https://api.giphy.com/v1/gifs";

/** The two renditions we use, narrowed from Giphy's `images` map. */
interface GiphyRendition {
  url: string;
  width: string;
  height: string;
}

interface GiphyRaw {
  id: string;
  title: string;
  images: {
    fixed_height_small?: GiphyRendition;
    fixed_height?: GiphyRendition;
    fixed_height_still?: GiphyRendition;
  };
}

interface GiphyListResponse {
  data: GiphyRaw[];
}

/** A normalised GIF result the picker grid renders. */
export interface GifResult {
  id: string;
  /** Alt / accessible name (Giphy `title`, may be empty). */
  title: string;
  /** Animated grid thumbnail (`fixed_height_small`, ~100px tall). */
  thumbUrl: string;
  /** Static first-frame of the thumbnail (reduced-motion grid). */
  stillUrl: string;
  /** The rendition inserted into the comment (`fixed_height`, ~200px tall). */
  fullUrl: string;
  width: number;
  height: number;
}

const num = (v: string | undefined): number =>
  Number.parseInt(v ?? "0", 10) || 0;

function normalize(raw: GiphyRaw): GifResult | null {
  const small = raw.images.fixed_height_small;
  const full = raw.images.fixed_height ?? small;
  if (!small || !full) return null;
  return {
    id: raw.id,
    title: raw.title?.trim() || "GIF",
    thumbUrl: small.url,
    stillUrl: raw.images.fixed_height_still?.url ?? small.url,
    fullUrl: full.url,
    width: num(full.width),
    height: num(full.height),
  };
}

async function request(
  path: string,
  params: Record<string, string>,
  signal?: AbortSignal
): Promise<GifResult[]> {
  const query = new URLSearchParams({
    api_key: GIPHY_KEY,
    rating: "pg-13",
    ...params,
  });
  const res = await fetch(`${GIPHY_BASE}/${path}?${query}`, { signal });
  if (!res.ok) throw new Error(`Giphy request failed (${res.status})`);
  const json = (await res.json()) as GiphyListResponse;
  return json.data.map(normalize).filter((g): g is GifResult => g !== null);
}

/** Trending GIFs — the picker's default grid (before any search). */
export function fetchTrendingGifs(signal?: AbortSignal): Promise<GifResult[]> {
  return request("trending", { limit: "24" }, signal);
}

/** Search GIFs by query. */
export function searchGifs(
  query: string,
  signal?: AbortSignal
): Promise<GifResult[]> {
  return request("search", { q: query, limit: "24", lang: "en" }, signal);
}
