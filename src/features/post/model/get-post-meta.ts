import { cache } from "react";
import type { PostDetailedResponse } from "@/shared/api/openapi";

const API_URL =
  process.env.NEXT_PUBLIC_API || "https://blog-api-prod.notlazy.org";

/**
 * Server-side, META-ONLY fetch of a post (title / summary / cover / author /
 * body) for `generateMetadata` + the JSON-LD `Article`. Uncached (`no-store`)
 * so there's no ISR staleness, and `React.cache`-wrapped so the metadata pass
 * and the page render share ONE request. The page BODY is fetched client-side
 * (authenticated) — this fetch is for SEO only.
 */
export const getPostMeta = cache(
  async (slug: string): Promise<PostDetailedResponse | null> => {
    try {
      const response = await fetch(`${API_URL}/api/posts/${slug}`, {
        cache: "no-store",
      });
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }
);
