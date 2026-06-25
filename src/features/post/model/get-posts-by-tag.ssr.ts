import { cache } from "react";
import { DisplayPostResponse } from "@/shared/api/openapi";

const API_URL =
  process.env.NEXT_PUBLIC_API || "https://blog-api-prod.notlazy.org";

/**
 * Server fetch for a tag's first feed page so the route SSRs real content
 * (crawlable `<h1>` + post links). Mirrors `usePostsByTag`'s request: the route
 * param is snake-cased (`web_dev`) but the API expects the human label
 * (`web dev`), so we replace `_` with spaces before calling
 * `/api/posts/t/{tag}`. ISR (`revalidate: 300`) matches the home/profile feed so
 * tag pages are cacheable. The caller seeds the result under the SAME key the
 * client hook reads — `postKeys.byTag(rawTag)` — so hydration takes over without
 * a refetch.
 */
export const getPostsByTagSSR = cache(
  async (tag: string, offset = 0): Promise<DisplayPostResponse[]> => {
    try {
      const apiTag = tag.replace(/_/g, " ");
      const url = new URL(
        `${API_URL}/api/posts/t/${encodeURIComponent(apiTag)}`
      );
      if (offset > 0) url.searchParams.set("offset", String(offset));

      const response = await fetch(url.toString(), {
        next: { revalidate: 300 },
      });
      if (!response.ok) return [];

      return (await response.json()) as DisplayPostResponse[];
    } catch {
      return [];
    }
  }
);
