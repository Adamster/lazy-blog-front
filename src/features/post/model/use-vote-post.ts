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

/**
 * Applies one vote to a post's `voteDirection` + net `rating`, with toggle
 * semantics: voting the active direction clears it; voting the other direction
 * flips it (a ±2 swing on the net rating). Mirrors the backend so the optimistic
 * cache matches the eventual server state. The vote and stored-direction enums
 * share the same `'Up' | 'Down'` values, so they compare directly.
 */
export function applyVote(
  post: PostDetailedResponse,
  direction: VoteDirection
): PostDetailedResponse {
  const current = post.voteDirection;
  const isActive = current === direction;

  // Strip the current vote's contribution, then add the new one — unless we're
  // toggling the active direction off (which leaves the post unvoted).
  let rating = post.rating;
  if (current === VoteDirection.Up) rating -= 1;
  else if (current === VoteDirection.Down) rating += 1;

  const next = isActive ? null : direction;
  if (!isActive) rating += direction === VoteDirection.Up ? 1 : -1;

  return { ...post, voteDirection: next, rating };
}

/**
 * Mirrors the same toggle on the rating-history up/down counts (+ net rating) so
 * the like/dislike figures move in the SAME tick as the highlight. The `series`
 * is left untouched (server-truthful) — the sparkline endpoint tracks the live
 * net in the view layer, so the chart follows a vote without fabricating history.
 */
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

/**
 * Vote on a post with a flicker-free optimistic update. `onMutate` patches BOTH
 * caches that feed the band — the detail post (`voteDirection` + net `rating`)
 * and the rating history (up/down counts) — so highlight, number and counts flip
 * together in one tick; `onError` rolls both back. We do NOT refetch the detail
 * on settle (the optimistic write mirrors the backend toggle exactly, and
 * refetching mid-interaction is what made the net rating bounce +2→+3→+2); the
 * rating history is only marked stale so its `series` reconciles on the next
 * natural refetch — no repaint now.
 */
export const useVotePost = (postId: string, postSlug: string) => {
  const queryClient = useQueryClient();
  const key = postKeys.detail(postSlug);
  const historyKey = postKeys.ratingHistory(postSlug);

  return useMutation({
    // The /vote endpoint returns 204 (empty body), but the generated `votePost`
    // wraps it in a JSONApiResponse and calls `.json()` — which throws on the
    // empty body, turning EVERY successful vote into an onError rollback (the
    // real source of the like/dislike/rating flicker). Use the raw call and
    // discard the body so a 204 resolves as success.
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
      // A vote moves net rating → the home highlights (top post / most active
      // user / monthly net) can shift, so mark the home stats stale. Default
      // refetchType: refetch if home is mounted, else reconcile on next visit.
      queryClient.invalidateQueries({ queryKey: postKeys.homeStats() });
    },
  });
};
