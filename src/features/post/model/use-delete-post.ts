/* eslint-disable @typescript-eslint/no-explicit-any */

import { apiClient } from "@/shared/api/api-client";
import { addToastError, addToastSuccess } from "@/shared/lib/toasts";
import { useUser } from "@/shared/providers/user-provider";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

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

      queryClient.invalidateQueries({ queryKey: ["getAllPosts"] });
      queryClient.invalidateQueries({ queryKey: ["getPostsByUserName"] });

      router.push(`/${user?.userName}`);
    },

    onError: (error: any) => {
      addToastError("Error deleting post", error);
    },
  });
};
