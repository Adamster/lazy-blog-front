import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";
import {
  PostDetailedResponse,
  PostRatingHistoryResponse,
  VoteDirection,
} from "@/shared/api/openapi";
import { addToastError } from "@/shared/lib/toasts";
import { postKeys } from "./post-keys";

type VoteVars = { direction: VoteDirection };

// Toggle semantics mirroring the backend so the optimistic cache matches the
// eventual server state.
export function applyVote(
  post: PostDetailedResponse,
  direction: VoteDirection
): PostDetailedResponse {
  const current = post.voteDirection;
  const isActive = current === direction;

  // Strip the current vote, then add the new one — unless toggling off.
  let rating = post.rating;
  if (current === VoteDirection.Up) rating -= 1;
  else if (current === VoteDirection.Down) rating += 1;

  const next = isActive ? null : direction;
  if (!isActive) rating += direction === VoteDirection.Up ? 1 : -1;

  return { ...post, voteDirection: next, rating };
}

// `series` is left untouched (server-truthful) — the view layer tracks the live
// net, so the chart follows a vote without fabricating history.
export function applyVoteToHistory(
  history: PostRatingHistoryResponse,
  current: VoteDirection | null,
  direction: VoteDirection
): PostRatingHistoryResponse {
  const isActive = current === direction;

  let upVotes = history.upVotes;
  let downVotes = history.downVotes;
  if (current === VoteDirection.Up) upVotes -= 1;
  else if (current === VoteDirection.Down) downVotes -= 1;
  if (!isActive) {
    if (direction === VoteDirection.Up) upVotes += 1;
    else downVotes += 1;
  }

  return { ...history, upVotes, downVotes, rating: upVotes - downVotes };
}

// Do NOT refetch the detail on settle — refetching mid-interaction made the net
// rating bounce +2→+3→+2; the optimistic write mirrors the backend exactly, so
// only the history is marked stale to reconcile its `series` later.
export const useVotePost = (postId: string, postSlug: string) => {
  const queryClient = useQueryClient();
  const key = postKeys.detail(postSlug);
  const historyKey = postKeys.ratingHistory(postSlug);

  return useMutation({
    // /vote returns 204; the generated `votePost` calls `.json()` and throws on
    // the empty body, turning every success into an onError rollback. Use the raw
    // call and discard the body so a 204 resolves as success.
    mutationFn: async ({ direction }: VoteVars) => {
      await apiClient.posts.votePostRaw({ id: postId, direction });
    },

    onMutate: async ({ direction }: VoteVars) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: key }),
        queryClient.cancelQueries({ queryKey: historyKey }),
      ]);

      const previousPost = queryClient.getQueryData<PostDetailedResponse>(key);
      const previousHistory =
        queryClient.getQueryData<PostRatingHistoryResponse>(historyKey);

      if (previousPost) {
        queryClient.setQueryData<PostDetailedResponse>(
          key,
          applyVote(previousPost, direction)
        );
      }
      if (previousHistory) {
        queryClient.setQueryData<PostRatingHistoryResponse>(
          historyKey,
          applyVoteToHistory(
            previousHistory,
            previousPost?.voteDirection ?? null,
            direction
          )
        );
      }

      return { previousPost, previousHistory };
    },

    onError: (error: unknown, _vars, context) => {
      if (context?.previousPost) {
        queryClient.setQueryData(key, context.previousPost);
      }
      if (context?.previousHistory) {
        queryClient.setQueryData(historyKey, context.previousHistory);
      }

      const status = (error as { response?: { status?: number } })?.response
        ?.status;
      if (status === 400) {
        addToastError("Error", error);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: historyKey,
        refetchType: "none",
      });
      // A vote moves net rating → the home highlights can shift, so mark stale.
      queryClient.invalidateQueries({ queryKey: postKeys.homeStats() });
    },
  });
};
