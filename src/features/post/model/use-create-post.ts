/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from "@/shared/api/api-client";
import { UpdatePostRequest } from "@/shared/api/openapi";
import { addToastError, addToastSuccess } from "@/shared/lib/toasts";
import { useUser } from "@/shared/providers/user-provider";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export const useCreatePost = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: (data: UpdatePostRequest) =>
      apiClient.posts.createPost({
        createPostRequest: { userId: user?.id || "", ...data },
      }),
    onSuccess: (data, variables) => {
      addToastSuccess("Post has been created");

      queryClient.invalidateQueries({ queryKey: ["getAllPosts"] });
      queryClient.invalidateQueries({ queryKey: ["getPostsByUserName"] });

      if (variables.isPublished) {
        router.push(`/${user?.userName}/${data.slug}`);
      } else {
        router.push(`/${user?.userName}/${data.slug}/edit`);
      }
    },
    onError: (error: any) => {
      addToastError("Error adding post", error);
    },
  });
};
