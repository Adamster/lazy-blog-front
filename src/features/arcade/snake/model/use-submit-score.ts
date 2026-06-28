import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";
import { arcadeKeys, LEADERBOARD_TAKE, SNAKE_GAME } from "./arcade-keys";

/**
 * Submit a finished run's score; the POST returns the fresh stats, which we seed
 * into the my-stats cache and invalidate the leaderboard. Unlike the 204 vote
 * endpoint, `submitScore` returns a JSON body, so the non-`Raw` generated method
 * is correct here. A failed submit must not interrupt play (caller swallows it).
 */
export function useSubmitScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (score: number) =>
      apiClient.arcade.submitScore({
        submitScoreRequest: { score, game: SNAKE_GAME },
      }),

    onSuccess: (stats) => {
      // Seed the authoritative best/rank so the band updates without a refetch.
      queryClient.setQueryData(arcadeKeys.myStats(SNAKE_GAME), stats);
      queryClient.invalidateQueries({
        queryKey: arcadeKeys.leaderboard(SNAKE_GAME, LEADERBOARD_TAKE),
      });
      // Also mark my-stats stale in case the server clamps differently from what we wrote.
      queryClient.invalidateQueries({
        queryKey: arcadeKeys.myStats(SNAKE_GAME),
        refetchType: "none",
      });
    },
  });
}
