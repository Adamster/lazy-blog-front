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
  rating: number;
}

// `voteDirection`/`rating` come from the parent's detail query, which the vote
// mutation patches — so the parent re-renders in sync, no second observer here.
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
