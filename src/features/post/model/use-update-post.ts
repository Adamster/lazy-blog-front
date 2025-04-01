/* eslint-disable @typescript-eslint/no-explicit-any */

import { apiClient } from "@/shared/api/api-client";
import { UpdatePostOperationRequest } from "@/shared/api/openapi";
import { addToastError, addToastSuccess } from "@/shared/lib/toasts";
import { useUser } from "@/shared/providers/user-provider";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export const useUpdatePost = () => {
  const router = useRouter();
  const { user } = useUser();

  return useMutation({
    mutationFn: ({ id, updatePostRequest }: UpdatePostOperationRequest) =>
      apiClient.posts.updatePost({
        id,
        updatePostRequest,
      }),
    onSuccess: (data, { updatePostRequest }) => {
      addToastSuccess("Post has been updated");

      if (updatePostRequest.isPublished) {
        router.push(`/${user?.userName}/${updatePostRequest.slug}`);
      }
    },
    onError: (error: any) => {
      addToastError("Error updating post", error);
    },
  });
};
