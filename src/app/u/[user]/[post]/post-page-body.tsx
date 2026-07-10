"use client";

import { usePostBySlug } from "@/features/post/model/use-post-by-slug";
import { PostView } from "@/features/post/ui/post-view";
import { PostHeaderMenuIsland } from "@/features/post/ui/post-header-menu-island";
import { PostVoteIsland } from "@/features/post/ui/post-vote-island";
import { ErrorMessage, Loading } from "@/shared/ui";
import { PostComments } from "./post-comments";
import { PostCommentsCount } from "./post-comments-count";

// Fetches the post AUTHENTICATED so the vote is the viewer's and views/rating are
// live; replaced the SSR render (no ISR, no anonymous-seed dance). SEO is server-side.
export function PostPageBody({ slug }: { slug: string }) {
  const { data: post, isLoading, error } = usePostBySlug(slug);

  if (isLoading) return <Loading />;
  if (error || !post) return <ErrorMessage error={error ?? "Not Found"} />;

  const authorHandle = post.author.userName ?? "";

  return (
    <PostView
      post={post}
      commentsCount={<PostCommentsCount postId={post.id} />}
      headerMenu={
        <PostHeaderMenuIsland
          postId={post.id}
          postSlug={post.slug}
          authorId={post.author.id ?? ""}
          authorHandle={authorHandle}
          isPublished={post.isPublished}
        />
      }
      vote={
        <PostVoteIsland
          postId={post.id}
          postSlug={post.slug}
          authorId={post.author.id ?? ""}
          voteDirection={post.voteDirection}
          rating={post.rating}
        />
      }
      comments={
        <PostComments postId={post.id} isPostPublished={post.isPublished} />
      }
    />
  );
}
