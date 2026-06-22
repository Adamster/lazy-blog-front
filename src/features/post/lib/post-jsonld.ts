import type { PostDetailedResponse } from "@/shared/api/openapi";

/** Strip common markdown so `articleBody` is plain text for crawlers. */
function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_~>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * schema.org `Article` for a post — the SEO recovery for a client-rendered body:
 * the article text lives in `articleBody` (markdown-stripped) so crawlers index
 * the content even though it's no longer in the server HTML.
 */
export function buildPostJsonLd(post: PostDetailedResponse, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.summary ?? undefined,
    image: post.coverUrl ?? undefined,
    author: {
      "@type": "Person",
      name: post.author.userName ?? "Unknown",
    },
    datePublished: post.createdAtUtc,
    mainEntityOfPage: url,
    articleBody: stripMarkdown(post.body),
  };
}
