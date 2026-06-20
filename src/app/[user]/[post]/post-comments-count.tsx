"use client";

import { useCommentsById } from "@/features/comment/model/use-comments-by-id";

/**
 * Live comment count for the byline metric. A tiny client island so the rest of
 * the byline (and the whole article) stays server-rendered. Shares the same
 * query key as the comments thread, so the cache is hit once.
 */
export function PostCommentsCount({ postId }: { postId: string }) {
  const { data } = useCommentsById(postId);
  return <>{data?.length ?? 0}</>;
}
