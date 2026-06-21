/* eslint-disable @typescript-eslint/no-explicit-any */

import { apiClient } from "@/shared/api/api-client";
import { UpdatePostOperationRequest } from "@/shared/api/openapi";
import { addToastError, addToastSuccess } from "@/shared/lib/toasts";
import { useUser } from "@/entities/session";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { postKeys } from "./post-keys";
import { revalidatePost } from "./revalidate-post.action";

export const useUpdatePost = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: ({ id, updatePostRequest }: UpdatePostOperationRequest) =>
      apiClient.posts.updatePost({
        id,
        updatePostRequest,
      }),
    onSuccess: async (_data, { updatePostRequest }) => {
      addToastSuccess("Post has been updated");

      queryClient.invalidateQueries({
        queryKey: postKeys.detail(updatePostRequest.slug),
      });
      queryClient.invalidateQueries({ queryKey: postKeys.list() });
      queryClient.invalidateQueries({ queryKey: postKeys.byUser() });
      queryClient.invalidateQueries({ queryKey: postKeys.byTag() });

      // The post page + feeds are SSR (getPostSSR, tagged post:<slug>) — client
      // invalidation alone can't refresh them. Bust the SSR caches so the
      // redirect (and the feeds) reflect the edit, not the cached version.
      await revalidatePost(updatePostRequest.slug, user?.userName ?? "");

      if (updatePostRequest.isPublished) {
        router.push(`/${user?.userName}/${updatePostRequest.slug}`);
      }
    },
    onError: (error: any) => {
      addToastError("Error updating post", error);
    },
  });
};
