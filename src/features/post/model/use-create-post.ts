import { apiClient } from "@/shared/api/api-client";
import { UpdatePostRequest } from "@/shared/api/openapi";
import { addToastError, addToastSuccess } from "@/shared/lib/toasts";
import { useUser } from "@/entities/session";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { postHref, postEditHref } from "@/shared/lib/routes";
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

      const userName = user?.userName ?? "";
      if (variables.isPublished) {
        router.push(postHref(userName, data.slug));
      } else {
        router.push(postEditHref(userName, data.slug));
      }
    },
    onError: (error: unknown) => {
      addToastError("Error adding post", error);
    },
  });
};
