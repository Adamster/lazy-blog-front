import { cache } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API || "https://blog-api-prod.notlazy.org";

export const getPostSSR = cache(async (slug: string) => {
  try {
    // ISR: cache the post and revalidate at most once a minute so pages are
    // crawlable/cacheable (the SEO win) while edits still propagate quickly.
    // Tagged per-slug so publish/unpublish/edit can bust THIS post's cache on
    // demand (via `revalidatePost`) instead of waiting out the 60s window.
    const response = await fetch(`${API_URL}/api/posts/${slug}`, {
      next: { revalidate: 60, tags: [`post:${slug}`] },
    });

    if (!response.ok) return null;

    return await response.json();
  } catch {
    return null;
  }
});
