import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";
import { commentsKey } from "./comments-key";

export const useCommentsById = (id: string) =>
  useQuery({
    queryKey: commentsKey(id),
    queryFn: () => apiClient.comments.getCommentsByPostId({ id }),
    // Comments are moderately volatile; 30s keeps a thread stable across
    // re-renders/route revisits while the optimistic mutations + their
    // `onSettled` invalidation keep the data fresh after any write.
    staleTime: 30_000,
  });
