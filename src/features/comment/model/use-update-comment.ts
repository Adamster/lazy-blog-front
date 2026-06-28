import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";
import { CommentResponse } from "@/shared/api/openapi";
import { addToastError, addToastSuccess } from "@/shared/lib/toasts";
import { commentKeys } from "./comment-keys";

type UpdateVars = { commentId: string; body: string };

export const useUpdateComment = (postId: string, userId: string) => {
  const queryClient = useQueryClient();
  const key = commentKeys.byPost(postId);

  return useMutation({
    mutationFn: ({ commentId, body }: UpdateVars) =>
      apiClient.comments.updateComment({
        updateCommentRequest: { userId, commentId, body },
      }),

    onMutate: async ({ commentId, body }: UpdateVars) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<CommentResponse[]>(key);

      queryClient.setQueryData<CommentResponse[]>(key, (current) =>
        current?.map((comment) =>
          comment.id === commentId ? { ...comment, body } : comment
        )
      );

      return { previous };
    },

    onError: (error: unknown, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(key, context.previous);
      }
      addToastError("Error updating comment", error);
    },

    onSuccess: () => {
      addToastSuccess("Comment has been updated");
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
};
