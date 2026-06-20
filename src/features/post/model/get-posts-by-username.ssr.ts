import { cache } from "react";
import { UserPostResponse } from "@/shared/api/openapi";

const API_URL =
  process.env.NEXT_PUBLIC_API || "https://blog-api-prod.notlazy.org";

export const getPostsByUserNameSSR = cache(
  async (userName: string, offset = 0): Promise<UserPostResponse | null> => {
    try {
      const url = new URL(`${API_URL}/api/posts/${userName}/posts`);
      if (offset > 0) url.searchParams.set("offset", String(offset));

      // ISR: cache the profile feed and revalidate at most once every 5 min so
      // the route is crawlable/cacheable (the SEO win), matching the home feed.
      const response = await fetch(url.toString(), {
        next: { revalidate: 300 },
      });
      if (!response.ok) return null;

      return (await response.json()) as UserPostResponse;
    } catch {
      return null;
    }
  }
);
