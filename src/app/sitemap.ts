import type { MetadataRoute } from "next";
import { SITE_URL } from "@/shared/types";
import { getAllPostsSSR } from "@/features/post/model/get-all-posts.ssr";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPostsSSR();

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      changeFrequency: "daily",
      priority: 1,
    },
  ];

  const seenUsers = new Set<string>();
  const userEntries: MetadataRoute.Sitemap = [];
  const postEntries: MetadataRoute.Sitemap = [];
  const tagSet = new Set<string>();

  for (const post of posts) {
    if (!post.isPublished) continue;

    const userName = post.author?.userName;
    if (userName && !seenUsers.has(userName)) {
      seenUsers.add(userName);
      userEntries.push({
        url: `${SITE_URL}/${userName}`,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }

    if (userName && post.slug) {
      postEntries.push({
        url: `${SITE_URL}/${userName}/${post.slug}`,
        lastModified: post.createdAtUtc,
        changeFrequency: "monthly",
        priority: 0.8,
      });
    }

    for (const tag of post.tags ?? []) {
      if (tag?.tag) tagSet.add(tag.tag);
    }
  }

  const tagEntries: MetadataRoute.Sitemap = Array.from(tagSet).map((tag) => ({
    url: `${SITE_URL}/tag/${tag}`,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return [...staticEntries, ...userEntries, ...tagEntries, ...postEntries];
}
