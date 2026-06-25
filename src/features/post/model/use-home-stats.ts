import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";
import { postKeys } from "./post-keys";

/**
 * Aggregate home stats — most-active user, top post and posts-per-month.
 * Public (GET), so it resolves for any visitor. The numbers move slowly
 * (recomputed server-side per UTC month), so we keep it fresh for a minute to
 * avoid a refetch on every home revisit while the feed paginates.
 */
export const useHomeStats = () =>
  useQuery({
    queryKey: postKeys.homeStats(),
    queryFn: () => apiClient.stats.getHomeStats(),
    staleTime: 60_000,
  });
