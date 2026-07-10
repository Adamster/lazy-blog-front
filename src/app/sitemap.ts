import type { MetadataRoute } from "next";
import { SITE_URL } from "@/shared/types";
import { getAllPostsSSR } from "@/features/post/model/get-all-posts.ssr";
import { HOME_HREF, userHref, postHref } from "@/shared/lib/routes";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPostsSSR();

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}${HOME_HREF}`,
      changeFrequency: "daily",
      priority: 1,
    },
    // Lazy Cam product site (single page; support/privacy are anchors)
    {
      url: `${SITE_URL}/cam`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  const seenUsers = new Set<string>();
  const userEntries: MetadataRoute.Sitemap = [];
  const postEntries: MetadataRoute.Sitemap = [];

  for (const post of posts) {
    if (!post.isPublished) continue;

    const userName = post.author?.userName;
    if (userName && !seenUsers.has(userName)) {
      seenUsers.add(userName);
      userEntries.push({
        url: `${SITE_URL}${userHref(userName)}`,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }

    if (userName && post.slug) {
      postEntries.push({
        url: `${SITE_URL}${postHref(userName, post.slug)}`,
        lastModified: post.createdAtUtc,
        changeFrequency: "monthly",
        priority: 0.8,
      });
    }
  }

  return [...staticEntries, ...userEntries, ...postEntries];
}
