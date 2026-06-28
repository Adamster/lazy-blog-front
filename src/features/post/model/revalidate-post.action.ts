"use server";

import { updateTag } from "next/cache";

// Busts the tag-cached server reads (sitemap/feed + author profile meta). The
// post page itself is client-rendered now, so it has no SSR tag to bust.
export async function revalidatePost(authorHandle: string) {
  updateTag("posts:all");
  updateTag(`posts:user:${authorHandle}`);
}
