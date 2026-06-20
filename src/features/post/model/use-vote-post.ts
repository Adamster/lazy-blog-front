import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";
import {
  PostDetailedResponse,
  VotePostDirectionEnum,
} from "@/shared/api/openapi";
import { addToastError } from "@/shared/lib/toasts";
import { postKeys } from "./post-keys";

type VoteVars = { direction: VotePostDirectionEnum };

/**
 * Applies one vote to a post's `voteDirection` + net `rating`, with toggle
 * semantics: voting the active direction clears it; voting the other direction
 * flips it (a ±2 swing on the net rating). Mirrors the backend so the optimistic
 * cache matches the eventual server state. The vote and stored-direction enums
 * share the same `'Up' | 'Down'` values, so they compare directly.
 */
export function applyVote(
  post: PostDetailedResponse,
  direction: VotePostDirectionEnum
): PostDetailedResponse {
  const current = post.voteDirection;
  const isActive = current === direction;

  // Strip the current vote's contribution, then add the new one — unless we're
  // toggling the active direction off (which leaves the post unvoted).
  let rating = post.rating;
  if (current === VotePostDirectionEnum.Up) rating -= 1;
  else if (current === VotePostDirectionEnum.Down) rating += 1;

  const next = isActive ? null : direction;
  if (!isActive) rating += direction === VotePostDirectionEnum.Up ? 1 : -1;

  return { ...post, voteDirection: next, rating };
}

/**
 * Vote on a post with an optimistic update: `onMutate` snapshots the cached
 * detailed post, applies the vote delta + direction flip immediately, and
 * returns the snapshot; `onError` rolls back; `onSettled` invalidates so the
 * server-confirmed counts replace the optimistic ones. Keyed by `slug`, matching
 * the `usePostBySlug` query.
 */
export const useVotePost = (postId: string, postSlug: string) => {
  const queryClient = useQueryClient();
  const key = postKeys.detail(postSlug);

  return useMutation({
    mutationFn: ({ direction }: VoteVars) =>
      apiClient.posts.votePost({ id: postId, direction }),

    onMutate: async ({ direction }: VoteVars) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<PostDetailedResponse>(key);

      if (previous) {
        queryClient.setQueryData<PostDetailedResponse>(
          key,
          applyVote(previous, direction)
        );
      }

      return { previous };
    },

    onError: (error: unknown, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(key, context.previous);
      }

      const status = (error as { response?: { status?: number } })?.response
        ?.status;
      if (status === 400) {
        addToastError("Error", error);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
};
