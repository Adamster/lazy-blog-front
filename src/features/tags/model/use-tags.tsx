import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";

export const useTags = () =>
  useQuery({
    queryKey: ["getTags"],
    queryFn: () => apiClient.tags.getTags(),
  });
