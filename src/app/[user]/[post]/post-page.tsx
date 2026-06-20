"use client";

import { ErrorMessage } from "@/shared/ui/error-message";
import { Loading } from "@/shared/ui/loading";
import { PostViewMono } from "@/features/post/ui/post-view";
import { usePostBySlug } from "@/features/post/model/use-post-by-slug";
import { useIncrementViewPost } from "@/features/post/model/use-increment-view-post";
import { useCommentsById } from "@/features/comment/model/use-comments-by-id";
import { CommentsMono } from "@/features/comment/ui/comments-section";

export default function PostPage({ slug }: { slug: string }) {
  const { data, error, isLoading } = usePostBySlug(slug);

  useIncrementViewPost(data?.id || "", data?.author?.id || "");

  // The route is the composition root: it joins the post (post feature) with its
  // comments (comment feature) and passes the rendered comments down as a slot,
  // so neither feature reaches sideways into the other (FSD).
  const { data: postComments, isLoading: postCommentsLoading } =
    useCommentsById(data?.id || "");

  if (isLoading) return <Loading />;
  if (error) return <ErrorMessage error={error} />;
  if (!data) return null;

  return (
    <PostViewMono
      post={data}
      commentsCount={postComments?.length ?? 0}
      comments={
        <CommentsMono
          postId={data.id}
          postComments={postComments}
          postCommentsLoading={postCommentsLoading}
          isPostPublished={data.isPublished}
        />
      }
    />
  );
}
