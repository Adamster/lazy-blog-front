import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";
import { PostDetailedResponse } from "@/shared/api/openapi";
import { addToastError, addToastSuccess } from "@/shared/lib/toasts";
import { postKeys } from "./post-keys";

/**
 * Optimistically flip `isPublished` on the cached detailed post so the
 * `[ Draft ]` chip + publish/unpublish row react instantly. Snapshots for
 * rollback, invalidates on settle. `published` is the target state.
 */
function usePublishToggle(
  postId: string,
  postSlug: string,
  published: boolean,
  mutationFn: () => Promise<unknown>,
  messages: { success: string; error: string }
) {
  const queryClient = useQueryClient();
  const key = postKeys.detail(postSlug);

  return useMutation({
    mutationFn,

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<PostDetailedResponse>(key);

      if (previous) {
        queryClient.setQueryData<PostDetailedResponse>(key, {
          ...previous,
          isPublished: published,
        });
      }

      return { previous };
    },

    onError: (error: unknown, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(key, context.previous);
      }
      addToastError(messages.error, error);
    },

    onSuccess: () => addToastSuccess(messages.success),

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

/**
 * Publish / unpublish (hide) a post from the post-header kebab. Both optimistic
 * toggles update the `getPostBySlug` cache so the `[ Draft ]` chip + the
 * publish/unpublish menu row flip immediately, then self-heal on error.
 */
export const usePublishPost = (postId: string, postSlug: string) =>
  usePublishToggle(
    postId,
    postSlug,
    true,
    () => apiClient.posts.publishPost({ id: postId }),
    { success: "Post has been published", error: "Error publishing post" }
  );

export const useHidePost = (postId: string, postSlug: string) =>
  usePublishToggle(
    postId,
    postSlug,
    false,
    () => apiClient.posts.hidePost({ id: postId }),
    { success: "Post has been unpublished", error: "Error unpublishing post" }
  );
