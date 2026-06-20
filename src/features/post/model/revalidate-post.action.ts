"use server";

import { updateTag } from "next/cache";

/**
 * Bust every SSR cache a post lives in after a publish / unpublish / delete:
 *   - `post:<slug>`        — the post page (draft badge / cover overlay / menu)
 *   - `posts:all`          — the home feed (so an unpublished post drops out)
 *   - `posts:user:<handle>`— the author's profile feed
 * so a following `router.refresh()` (and the next visit to those routes) renders
 * fresh data instead of waiting out the ISR window. `updateTag` (Next 16) is the
 * Server-Action primitive with read-your-own-writes semantics.
 */
export async function revalidatePost(slug: string, authorHandle: string) {
  updateTag(`post:${slug}`);
  updateTag("posts:all");
  updateTag(`posts:user:${authorHandle}`);
}
