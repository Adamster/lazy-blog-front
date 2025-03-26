import { apiClient } from "@/shared/api/api-client";
import { useQuery } from "@tanstack/react-query";

export const usePostBySlug = (slug: string) =>
  useQuery({
    queryKey: ["getPostBySlug", slug],
    queryFn: () => apiClient.posts.getPostBySlug({ slug }),
  });
