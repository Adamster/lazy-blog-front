import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";
import { revalidatePost } from "./revalidate-post.action";
import { PostDetailedResponse } from "@/shared/api/openapi";
import { addToastError, addToastSuccess } from "@/shared/lib/toasts";
import { postKeys } from "./post-keys";

/**
 * Optimistically flip `isPublished` on the cached detailed post so the
 * unpublished badge + publish/unpublish row react instantly. On success it busts
 * the SSR caches (post page + home + author feeds) and invalidates the matching
 * client queries so the change propagates everywhere, not just this page.
 * `published` is the target state.
 */
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
      // The post page is client-rendered: the optimistic cache flip + the
      // onSettled invalidations below update every client surface. Only the
      // still-tag-cached server reads (sitemap / feed / profile meta) need
      // busting.
      await revalidatePost(authorHandle);
    },

    onSettled: () => {
      // Client-query caches for the same surfaces (the post detail + the home /
      // profile feeds it appears in) so a later client navigation is fresh too.
      queryClient.invalidateQueries({ queryKey: key });
      queryClient.invalidateQueries({ queryKey: postKeys.list() });
      queryClient.invalidateQueries({
        queryKey: postKeys.byUser(authorHandle),
      });
    },
  });
}

/**
 * Publish / unpublish (hide) a post from the post-header kebab. Both optimistic
 * toggles update the `getPostBySlug` cache so the unpublished badge + the
 * publish/unpublish menu row flip immediately, then self-heal on error and
 * propagate to the home + author feeds.
 */
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
    { success: "Post has been published", error: "Error publishing post" }
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
    { success: "Post has been unpublished", error: "Error unpublishing post" }
  );
