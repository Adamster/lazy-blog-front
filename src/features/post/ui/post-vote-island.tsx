"use client";

import type { NullableOfVoteDirection } from "@/shared/api/openapi";
import { useAuth, useUser } from "@/entities/session";
import { useIncrementViewPost } from "../model/use-increment-view-post";
import { usePostBySlug } from "../model/use-post-by-slug";
import { PostVote } from "./post-vote";

interface IProps {
  postId: string;
  postSlug: string;
  authorId: string;
  voteDirection: NullableOfVoteDirection | null;
  /** REAL net rating from the API (upvotes − downvotes). */
  rating: number;
}

/**
 * Client island for the rating band. Decides `canVote` from auth (authed &
 * non-author) and fires the debounced view-increment for the current reader.
 * Slotted into the server-rendered article so the read view stays a Server
 * Component. Shown to everyone; the click itself is gated via `canVote`.
 */
export const PostVoteIsland = ({
  postId,
  postSlug,
  authorId,
  voteDirection,
  rating,
}: IProps) => {
  const { isAuthenticated } = useAuth();
  const { user } = useUser();

  // `voteDirection` is per-viewer, so the server-rendered prop is the anonymous
  // value (null). Re-read it from the authenticated client query so the band
  // reflects THIS reader's actual vote (highlight + correct toggle direction);
  // fall back to the SSR prop until that resolves.
  const { data: post } = usePostBySlug(postSlug);
  const viewerVoteDirection = post ? post.voteDirection : voteDirection;
  const netRating = post ? post.rating : rating;

  // Count a view for readers other than the author (handled inside the hook).
  useIncrementViewPost(postId, authorId);

  const isAuthor = !!user?.id && user.id === authorId;
  const canVote = isAuthenticated && !isAuthor;

  return (
    <PostVote
      voteDirection={viewerVoteDirection}
      postId={postId}
      postSlug={postSlug}
      rating={netRating}
      canVote={canVote}
    />
  );
};
