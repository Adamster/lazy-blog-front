"use client";

import { useCommentsById } from "@/features/comment/model/use-comments-by-id";
import { CommentsSection } from "@/features/comment/ui/comments-section";

interface IProps {
  postId: string;
  isPostPublished: boolean;
}

/**
 * Client island for the comments thread + composer. The route is the
 * composition root joining the post (server-rendered) with its comments,
 * so neither feature reaches sideways into the other (FSD).
 */
export function PostComments({ postId, isPostPublished }: IProps) {
  const { data: postComments, isLoading } = useCommentsById(postId);

  return (
    <CommentsSection
      postId={postId}
      postComments={postComments}
      postCommentsLoading={isLoading}
      isPostPublished={isPostPublished}
    />
  );
}
