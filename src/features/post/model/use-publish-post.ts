/* eslint-disable @typescript-eslint/no-explicit-any */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";
import { addToastError, addToastSuccess } from "@/shared/lib/toasts";

/**
 * Publish / unpublish (hide) a post from the post-header kebab. Both invalidate
 * the detailed-post query so the `[ Draft ]` chip + publish/unpublish row flip
 * after the change lands. `slug` keys the invalidation to the post in view.
 */
export const usePublishPost = (postId: string, postSlug: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.posts.publishPost({ id: postId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["getPostBySlug", postSlug] });
      addToastSuccess("Post has been published");
    },
    onError: (error: any) => {
      addToastError("Error publishing post", error);
    },
  });
};

export const useHidePost = (postId: string, postSlug: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.posts.hidePost({ id: postId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["getPostBySlug", postSlug] });
      addToastSuccess("Post has been unpublished");
    },
    onError: (error: any) => {
      addToastError("Error unpublishing post", error);
    },
  });
};
