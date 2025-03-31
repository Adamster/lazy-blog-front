import { apiClient } from "@/shared/api/api-client";
import { PAGE_SIZE } from "@/shared/types";
import { useInfiniteQuery } from "@tanstack/react-query";

export const usePostsByUserName = (userName: string) =>
  useInfiniteQuery({
    queryKey: ["getPostsByUserName", userName],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await apiClient.posts.getPostsByUserName({
        userName,
        offset: pageParam,
      });
      return response;
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.postItems.length === PAGE_SIZE
        ? pages.length * PAGE_SIZE
        : undefined,
    initialPageParam: 0,
  });
