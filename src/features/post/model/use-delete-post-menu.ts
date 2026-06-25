import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { apiClient } from "@/shared/api/api-client";
import { DisplayPostResponse, UserPostItem } from "@/shared/api/openapi";
import { addToastError, addToastSuccess } from "@/shared/lib/toasts";
import { postKeys } from "./post-keys";

/** `useAllPosts` infinite-cache shape: each page is a flat post array. */
type AllPostsCache = {
  pages: DisplayPostResponse[][];
  pageParams: unknown[];
};

/** `usePostsByUserName` infinite-cache shape: each page wraps `postItems`. */
type UserPostsCache = {
  pages: { postItems: UserPostItem[]; [k: string]: unknown }[];
  pageParams: unknown[];
};

const removeFromAllPosts = (
  cache: AllPostsCache | undefined,
  postId: string
): AllPostsCache | undefined =>
  cache && {
    ...cache,
    pages: cache.pages.map((page) => page.filter((p) => p.id !== postId)),
  };

const removeFromUserPosts = (
  cache: UserPostsCache | undefined,
  postId: string
): UserPostsCache | undefined =>
  cache && {
    ...cache,
    pages: cache.pages.map((page) => ({
      ...page,
      postItems: page.postItems.filter((p) => p.id !== postId),
    })),
  };

/**
 * Delete a post from the owner kebab with an optimistic removal: the post drops
 * out of every loaded feed (`getAllPosts` + `getPostsByUserName`) immediately,
 * then navigates home. On error the snapshots are restored. Distinct from the
 * shared `useDeletePost` (edit page → author profile); this one returns to `/`.
 */
export const useDeletePostMenu = (postId: string) => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () => apiClient.posts.deletePost({ id: postId }),

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: postKeys.list() });
      await queryClient.cancelQueries({ queryKey: postKeys.byUser() });

      const allPostsSnapshots = queryClient.getQueriesData<AllPostsCache>({
        queryKey: postKeys.list(),
      });
      const userPostsSnapshots = queryClient.getQueriesData<UserPostsCache>({
        queryKey: postKeys.byUser(),
      });

      queryClient.setQueriesData<AllPostsCache>(
        { queryKey: postKeys.list() },
        (cache) => removeFromAllPosts(cache, postId)
      );
      queryClient.setQueriesData<UserPostsCache>(
        { queryKey: postKeys.byUser() },
        (cache) => removeFromUserPosts(cache, postId)
      );

      return { allPostsSnapshots, userPostsSnapshots };
    },

    onError: (error: unknown, _vars, context) => {
      context?.allPostsSnapshots.forEach(([key, data]) =>
        queryClient.setQueryData(key, data)
      );
      context?.userPostsSnapshots.forEach(([key, data]) =>
        queryClient.setQueryData(key, data)
      );
      addToastError("Error deleting post", error);
    },

    onSuccess: () => {
      addToastSuccess("Post has been deleted");
      router.push("/");
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.list() });
      queryClient.invalidateQueries({ queryKey: postKeys.byUser() });
    },
  });
};
