import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";
import { CommentResponse, UserResponse } from "@/shared/api/openapi";
import { addToastError, addToastSuccess } from "@/shared/lib/toasts";
import { commentKeys } from "./comment-keys";

/**
 * Build the placeholder comment shown optimistically while the POST is in
 * flight. The server owns the real id + timestamp; we mint a temporary id so the
 * row has a stable React key until `onSettled` invalidation swaps in the
 * server's record.
 */
function optimisticComment(
  body: string,
  user: UserResponse,
  tempId: string
): CommentResponse {
  return {
    id: tempId,
    body,
    createdAtUtc: new Date(),
    user: {
      id: user.id ?? "",
      displayName: user.displayName ?? "",
      userName: user.userName ?? "",
      avatarUrl: user.avatarUrl ?? null,
    },
  };
}

/**
 * Post a new comment with an optimistic append: `onMutate` snapshots the cached
 * thread and appends a placeholder so the comment shows instantly; `onError`
 * rolls back; `onSettled` invalidates so the server-confirmed record (real id +
 * timestamp) replaces the placeholder. Keyed by `postId`, matching
 * `useCommentsById`.
 */
export const useAddComment = (
  postId: string,
  user: UserResponse | undefined
) => {
  const queryClient = useQueryClient();
  const key = commentKeys.byPost(postId);

  return useMutation({
    mutationFn: (body: string) =>
      apiClient.comments.addComment({
        addCommentRequest: { postId, userId: user?.id ?? "", body },
      }),

    onMutate: async (body: string) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<CommentResponse[]>(key);

      if (user) {
        const tempId = `optimistic-${Date.now()}`;
        queryClient.setQueryData<CommentResponse[]>(key, (current) => [
          ...(current ?? []),
          optimisticComment(body, user, tempId),
        ]);
      }

      return { previous };
    },

    onError: (error: unknown, _body, context) => {
      if (context?.previous) {
        queryClient.setQueryData(key, context.previous);
      }
      addToastError("Error posting comment", error);
    },

    onSuccess: () => {
      addToastSuccess("Comment has been posted");
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
};
