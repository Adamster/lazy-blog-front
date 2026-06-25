"use server";

import { updateTag } from "next/cache";

/**
 * Bust the tag-cached SERVER reads a publish / unpublish / edit affects:
 *   - `posts:all`           — the sitemap + RSS feed (so an (un)published post
 *                             drops out / surfaces)
 *   - `posts:user:<handle>` — the author profile's `generateMetadata`
 * The post page itself is client-rendered now, so it has no SSR tag to bust.
 * `updateTag` (Next 16) is the Server-Action primitive with read-your-own-writes
 * semantics.
 */
export async function revalidatePost(authorHandle: string) {
  updateTag("posts:all");
  updateTag(`posts:user:${authorHandle}`);
}
