import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";

export const useCommentsById = (id: string) =>
  useQuery({
    queryKey: ["getCommentsByPostId", id],
    queryFn: () => apiClient.comments.getCommentsByPostId({ id }),
  });
