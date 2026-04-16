import { SITE_URL } from "@/shared/types";
import { getAllPostsSSR } from "@/features/post/model/get-all-posts.ssr";

export const revalidate = 3600;

function escapeXml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const posts = await getAllPostsSSR();
  const published = posts.filter((p) => p.isPublished);

  const lastBuildDate =
    published[0]?.createdAtUtc?.toString() ?? new Date().toUTCString();

  const items = published
    .slice(0, 50)
    .map((post) => {
      const url = `${SITE_URL}/${post.author?.userName}/${post.slug}`;
      const pubDate = new Date(post.createdAtUtc).toUTCString();
      const title = escapeXml(post.title ?? "");
      const description = escapeXml(post.summary ?? "");
      const author = escapeXml(post.author?.userName ?? "");

      return `
    <item>
      <title>${title}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${description}</description>
      <author>${author}</author>
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>!Lazy Blog</title>
    <link>${SITE_URL}</link>
    <description>The fine art of not being lazy… most of the time</description>
    <language>en</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
