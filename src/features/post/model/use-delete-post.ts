/* eslint-disable @typescript-eslint/no-explicit-any */

import { apiClient } from "@/shared/api/api-client";
import { addToastError, addToastSuccess } from "@/shared/lib/toasts";
import { useUser } from "@/entities/session";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { postKeys } from "./post-keys";

export const useDeletePost = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: (postId: string) =>
      apiClient.posts.deletePost({
        id: postId,
      }),

    onSuccess: () => {
      addToastSuccess("Post has been deleted");

      queryClient.invalidateQueries({ queryKey: postKeys.list() });
      queryClient.invalidateQueries({ queryKey: postKeys.byUser() });

      router.push(`/${user?.userName}`);
    },

    onError: (error: any) => {
      addToastError("Error deleting post", error);
    },
  });
};
