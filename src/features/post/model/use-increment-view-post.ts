import { apiClient } from "@/shared/api/api-client";
import { useUser } from "@/shared/providers/user-provider";
import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";

export const useIncrementViewPost = (postId: string, postAuthorId: string) => {
  const { user } = useUser();

  const mutation = useMutation({
    mutationFn: () => apiClient.posts.incrementViewCount({ id: postId }),
  });

  useEffect(() => {
    if (
      !postId ||
      !postAuthorId ||
      !user?.id ||
      postAuthorId === user?.id ||
      sessionStorage.getItem(`hasViewed-${postId}`)
    ) {
      return;
    }

    const timeout = setTimeout(() => {
      mutation.mutate();
      sessionStorage.setItem(`hasViewed-${postId}`, "true");
    }, 3000);

    return () => clearTimeout(timeout);
  }, [postId, postAuthorId, user?.id, mutation]);
};
