import { useInfiniteQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";
import { PAGE_SIZE } from "@/shared/types";
import { postKeys } from "./post-keys";

export const useAllPosts = () =>
  useInfiniteQuery({
    queryKey: postKeys.list(),
    queryFn: ({ pageParam = 0 }) =>
      apiClient.posts.getAllPosts({ offset: pageParam }) ?? [],
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.flat().length : undefined,
    initialPageParam: 0,
  });
