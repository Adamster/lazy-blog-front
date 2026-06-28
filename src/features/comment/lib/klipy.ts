// Client-side KLIPY GIF client (replaces Giphy, whose public key is permanently 403 banned).
// Key is hardcoded as fallback per the no-Vercel-access `?? "fallback"` rule; env var overrides.
// KLIPY embeds the key in the URL PATH, not a query param: .../api/v1/{KEY}/gifs/trending
const KLIPY_API_KEY =
  process.env.NEXT_PUBLIC_KLIPY_API_KEY ??
  "NJanJbp9oWs8id66NePI74yQ7HuOuB12bjLIl4tp1IVCuR19YQU84kOi6q0ZIdyq";
const KLIPY_ROOT = `https://api.klipy.com/api/v1/${KLIPY_API_KEY}`;

// KLIPY serves gifs and stickers from parallel endpoints (`/gifs/*` vs `/stickers/*`), identical shape.
export type MediaKind = "gif" | "sticker";

interface KlipyRendition {
  url: string;
  width: number;
  height: number;
}

interface KlipyFormats {
  gif?: KlipyRendition;
  webp?: KlipyRendition;
  jpg?: KlipyRendition;
}

interface KlipyRaw {
  id: number | string;
  title?: string;
  // Size buckets, largest → smallest. We use `sm` (grid) + `md` (insert).
  file: {
    hd?: KlipyFormats;
    md?: KlipyFormats;
    sm?: KlipyFormats;
    xs?: KlipyFormats;
  };
  // Inline base64 placeholder — reduced-motion still fallback.
  blur_preview?: string;
}

interface KlipyListResponse {
  result: boolean;
  data: {
    data: KlipyRaw[];
  };
}

export interface GifResult {
  id: string;
  title: string;
  thumbUrl: string;
  stillUrl: string;
  fullUrl: string;
  width: number;
  height: number;
}

function normalize(raw: KlipyRaw): GifResult | null {
  const sm = raw.file.sm;
  const thumb = sm?.gif;
  const full = raw.file.md?.gif ?? thumb;
  if (!thumb || !full) return null;
  return {
    id: String(raw.id),
    title: raw.title?.trim() || "GIF",
    thumbUrl: thumb.url,
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
  const res = await fetch(`${KLIPY_ROOT}/${kind}s/${path}?${query}`, {
    signal,
  });
  if (!res.ok) throw new Error(`KLIPY request failed (${res.status})`);
  const json = (await res.json()) as KlipyListResponse;
  return json.data.data
    .map(normalize)
    .filter((g): g is GifResult => g !== null);
}

export function fetchTrending(
  kind: MediaKind,
  signal?: AbortSignal
): Promise<GifResult[]> {
  return request(kind, "trending", {}, signal);
}

// KLIPY pagination is page-based, not offset.
export function searchMedia(
  kind: MediaKind,
  query: string,
  signal?: AbortSignal
): Promise<GifResult[]> {
  return request(kind, "search", { q: query, page: "1" }, signal);
}
