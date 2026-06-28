"use client";

import { useCommentsById } from "@/features/comment/model/use-comments-by-id";

// Shares the comments query key with the thread, so the count reuses that cache.
export function PostCommentsCount({ postId }: { postId: string }) {
  const { data } = useCommentsById(postId);
  return <>{data?.length ?? 0}</>;
}
