/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";
import { VotePostDirectionEnum } from "@/shared/api/openapi";
import { addToastError } from "@/shared/lib/toasts";

export const useVotePost = (postId: string, postSlug: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ direction }: { direction: VotePostDirectionEnum }) =>
      apiClient.posts.votePost({ id: postId, direction }),

    onError: (error: any) => {
      queryClient.invalidateQueries({ queryKey: ["getPostBySlug", postSlug] });

      if (error?.response?.status === 400) {
        addToastError("Error", error);
      }
    },
  });
};
