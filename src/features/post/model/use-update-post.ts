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

      // The sitemap / feed (and profile meta) are still tag-cached server reads;
      // bust them so they reflect the edit. The post page itself is
      // client-rendered, so the client cache (invalidated above) is enough.
      await revalidatePost(user?.userName ?? "");

      if (updatePostRequest.isPublished) {
        router.push(`/${user?.userName}/${updatePostRequest.slug}`);
      }
    },
    onError: (error: any) => {
      addToastError("Error updating post", error);
    },
  });
};
