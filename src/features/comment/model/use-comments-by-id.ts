import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";
import { commentKeys } from "./comment-keys";

export const useCommentsById = (id: string) =>
  useQuery({
    queryKey: commentKeys.byPost(id),
    queryFn: () => apiClient.comments.getCommentsByPostId({ id }),
    // 30s — optimistic mutations + their onSettled invalidation keep data fresh after writes.
    staleTime: 30_000,
  });
