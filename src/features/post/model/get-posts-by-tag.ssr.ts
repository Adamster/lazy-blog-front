import { cache } from "react";
import { DisplayPostResponse } from "@/shared/api/openapi";

const API_URL =
  process.env.NEXT_PUBLIC_API || "https://blog-api-prod.notlazy.org";

// The route param is snake-cased (`web_dev`) but the API expects the human label
// (`web dev`) — replace `_` with spaces before calling. The caller seeds the
// result under `postKeys.byTag(rawTag)` so client hydration takes over.
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
