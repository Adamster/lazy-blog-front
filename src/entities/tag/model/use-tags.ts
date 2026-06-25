import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";
import { tagKeys } from "./tag-keys";

export const useTags = () =>
  useQuery({
    queryKey: tagKeys.all(),
    queryFn: () => apiClient.tags.getTags(),
  });
