import { useInfiniteQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";
import { PAGE_SIZE } from "@/shared/consts";

export const usePostsByTag = (tag?: string) =>
  useInfiniteQuery({
    queryKey: ["getPostsByTag", tag],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await apiClient.posts.getPostsByTag({
        tag: tag?.replace(/_/g, " ") ?? "",
        offset: pageParam,
      });
      return response;
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.flat().length : undefined,
    initialPageParam: 0,
    enabled: !!tag,
  });
