import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";
import { CommentResponse } from "@/shared/api/openapi";
import { addToastError, addToastSuccess } from "@/shared/lib/toasts";
import { commentKeys } from "./comment-keys";

export const useDeleteComment = (postId: string, commentId: string) => {
  const queryClient = useQueryClient();
  const key = commentKeys.byPost(postId);

  return useMutation({
    mutationFn: () => apiClient.comments.deleteComment({ id: commentId }),

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<CommentResponse[]>(key);

      queryClient.setQueryData<CommentResponse[]>(key, (current) =>
        current?.filter((comment) => comment.id !== commentId)
      );

      return { previous };
    },

    onError: (error: unknown, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(key, context.previous);
      }
      addToastError("Error deleting comment", error);
    },

    onSuccess: () => {
      addToastSuccess("Comment has been deleted");
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
};
