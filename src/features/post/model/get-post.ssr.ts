import { cache } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API || "https://blog-api-prod.notlazy.org";

export const getPostSSR = cache(async (slug: string) => {
  try {
    // ISR: cache the post and revalidate at most once a minute so pages are
    // crawlable/cacheable (the SEO win) while edits still propagate quickly.
    const response = await fetch(`${API_URL}/api/posts/${slug}`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) return null;

    return await response.json();
  } catch {
    return null;
  }
});
