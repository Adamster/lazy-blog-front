import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/api/api-client";
import { useAuth } from "@/providers/auth-provider";

const usePostIncrementView = (postId: string, postAuthorId: string) => {
  const { user } = useAuth();

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

export default usePostIncrementView;
