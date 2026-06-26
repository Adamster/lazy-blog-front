import { apiClient } from "@/shared/api/api-client";
import { useUser } from "@/entities/session";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { PostDetailedResponse } from "@/shared/api/openapi";
import { postKeys } from "./post-keys";

export const useIncrementViewPost = (
  postId: string,
  postAuthorId: string,
  postSlug: string
) => {
  const { user } = useUser();
  const queryClient = useQueryClient();

  const { mutate } = useMutation({
    mutationFn: () => apiClient.posts.incrementViewCount({ id: postId }),
    onSuccess: () => {
      // Reflect THIS view on the open post page right away...
      queryClient.setQueryData<PostDetailedResponse>(
        postKeys.detail(postSlug),
        (old) => (old ? { ...old, views: old.views + 1 } : old)
      );
      // ...and mark the feeds stale so the home / profile lists refetch the
      // fresh count when the reader navigates back (they're inactive now, so
      // this only flags them — no refetch fires here).
      queryClient.invalidateQueries({ queryKey: postKeys.list() });
      queryClient.invalidateQueries({ queryKey: postKeys.byUser() });
    },
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
      mutate();
      sessionStorage.setItem(`hasViewed-${postId}`, "true");
    }, 3000);

    return () => clearTimeout(timeout);
    // `mutate` is referentially stable across renders (React Query), so the 3s
    // timer is no longer reset on every re-render the way the whole `mutation`
    // object would have forced.
  }, [postId, postAuthorId, user?.id, mutate]);
};
