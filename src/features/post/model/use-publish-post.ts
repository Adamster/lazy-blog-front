import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";
import { revalidatePost } from "./revalidate-post.action";
import { PostDetailedResponse } from "@/shared/api/openapi";
import { addToastError, addToastSuccess } from "@/shared/lib/toasts";
import { postKeys } from "./post-keys";

// Optimistically flips `isPublished`, busts the SSR caches on success, and
// invalidates the client queries so the change propagates everywhere.
function usePublishToggle(
  postId: string,
  postSlug: string,
  authorHandle: string,
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

    onSuccess: async () => {
      addToastSuccess(messages.success);
      // The post page is client-rendered — only the still-tag-cached server reads
      // (sitemap / feed / profile meta) need busting.
      await revalidatePost(authorHandle);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
      queryClient.invalidateQueries({ queryKey: postKeys.list() });
      queryClient.invalidateQueries({
        queryKey: postKeys.byUser(authorHandle),
      });
    },
  });
}

export const usePublishPost = (
  postId: string,
  postSlug: string,
  authorHandle: string
) =>
  usePublishToggle(
    postId,
    postSlug,
    authorHandle,
    true,
    () => apiClient.posts.publishPost({ id: postId }),
    {
      success: "Live. Now go do nothing — you earned it.",
      error: "Error publishing post",
    }
  );

export const useHidePost = (
  postId: string,
  postSlug: string,
  authorHandle: string
) =>
  usePublishToggle(
    postId,
    postSlug,
    authorHandle,
    false,
    () => apiClient.posts.hidePost({ id: postId }),
    {
      success: "Unpublished. Back to draft, nobody saw a thing.",
      error: "Error unpublishing post",
    }
  );
