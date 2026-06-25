import { apiClient } from "@/shared/api/api-client";
import { useQuery } from "@tanstack/react-query";
import { postKeys } from "./post-keys";

export const usePostBySlug = (slug: string) =>
  useQuery({
    queryKey: postKeys.detail(slug),
    queryFn: () => apiClient.posts.getPostBySlug({ slug }),
  });
