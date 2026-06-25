import { apiClient } from "@/shared/api/api-client";
import { useQuery } from "@tanstack/react-query";
import { postKeys } from "./post-keys";

/**
 * A post's rating history — total `upVotes` / `downVotes` and the cumulative
 * rating `series` over time. Public (GET), so it resolves for any reader; the
 * vote mutation invalidates this key so the counts + chart refresh after a vote.
 */
export const usePostRatingHistory = (slug: string) =>
  useQuery({
    queryKey: postKeys.ratingHistory(slug),
    queryFn: () => apiClient.posts.getPostRatingHistory({ slug }),
    // Match the detail query so an incidental refetch can't repaint a server
    // value mid-vote (the optimistic write already mirrors the backend).
    staleTime: 60_000,
  });
