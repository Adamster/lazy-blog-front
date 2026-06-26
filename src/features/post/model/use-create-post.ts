import { apiClient } from "@/shared/api/api-client";
import { UpdatePostRequest } from "@/shared/api/openapi";
import { addToastError, addToastSuccess } from "@/shared/lib/toasts";
import { useUser } from "@/entities/session";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { postKeys } from "./post-keys";

export const useCreatePost = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: (data: UpdatePostRequest) =>
      apiClient.posts.createPost({ createPostRequest: data }),
    onSuccess: (data, variables) => {
      addToastSuccess("Post has been created");

      queryClient.invalidateQueries({ queryKey: postKeys.list() });
      queryClient.invalidateQueries({ queryKey: postKeys.byUser() });

      if (variables.isPublished) {
        router.push(`/${user?.userName}/${data.slug}`);
      } else {
        router.push(`/${user?.userName}/${data.slug}/edit`);
      }
    },
    onError: (error: unknown) => {
      addToastError("Error adding post", error);
    },
  });
};
