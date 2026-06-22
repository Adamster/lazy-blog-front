"use client";

import type { VoteDirection } from "@/shared/api/openapi";
import { useAuth, useUser } from "@/entities/session";
import { useIncrementViewPost } from "../model/use-increment-view-post";
import { usePostRatingHistory } from "../model/use-post-rating-history";
import { PostVote } from "./post-vote";

interface IProps {
  postId: string;
  postSlug: string;
  authorId: string;
  voteDirection: VoteDirection | null;
  /** REAL net rating from the API (upvotes − downvotes). */
  rating: number;
}

/**
 * Client island for the rating band. The viewer's `voteDirection` + net `rating`
 * come from the parent (which owns the authenticated detail query) — the vote
 * mutation patches that shared cache, so the parent re-renders these props in
 * sync, no second observer needed here. This island only adds the up/down counts
 * + cumulative series, the `canVote` gate, and the debounced view-increment.
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

  const { data: history } = usePostRatingHistory(postSlug);

  useIncrementViewPost(postId, authorId, postSlug);

  const isAuthor = !!user?.id && user.id === authorId;
  const canVote = isAuthenticated && !isAuthor;

  return (
    <PostVote
      voteDirection={voteDirection}
      postId={postId}
      postSlug={postSlug}
      rating={rating}
      canVote={canVote}
      likes={history?.upVotes ?? 0}
      dislikes={history?.downVotes ?? 0}
      ratingSeries={history?.series.map((p) => p.cumulativeRating) ?? []}
    />
  );
};
