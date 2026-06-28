import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";
import { CommentResponse, UserResponse } from "@/shared/api/openapi";
import { addToastError, addToastSuccess } from "@/shared/lib/toasts";
import { commentKeys } from "./comment-keys";

// Temp id gives the optimistic row a stable React key until onSettled swaps in the server record.
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
