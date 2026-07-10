"use client";

import { useCommentsById } from "@/features/comment/model/use-comments-by-id";
import { CommentsSection } from "@/features/comment/ui/comments-section";

interface IProps {
  postId: string;
  isPostPublished: boolean;
}

// The route is the composition root joining post + comments, so neither feature imports the other (FSD).
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
