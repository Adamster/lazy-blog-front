"use client";

import { usePostBySlug } from "@/features/post/model/use-post-by-slug";
import { PostView } from "@/features/post/ui/post-view";
import { PostHeaderMenuIsland } from "@/features/post/ui/post-header-menu-island";
import { PostVoteIsland } from "@/features/post/ui/post-vote-island";
import { ErrorMessage, Loading } from "@/shared/ui";
import { PostComments } from "./post-comments";
import { PostCommentsCount } from "./post-comments-count";

/**
 * Client composition root for the post page: fetches the post AUTHENTICATED, so
 * `voteDirection` is the viewer's real vote and `views`/`rating` are live — then
 * slots the interactive islands into the read view. Replaces the old SSR render,
 * so there's no ISR cache, no anonymous-seed dance, and the view count + vote
 * update cleanly. SEO (meta + JSON-LD) is emitted server-side by the route shell.
 */
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
