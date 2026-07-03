import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";
import {
  arcadeKeys,
  LEADERBOARD_TAKE,
  SNAKE_CLASSIC_GAME,
} from "./arcade-keys";

/**
 * Submit a finished run's score; the POST returns the fresh stats, which we seed
 * into the my-stats cache and invalidate the leaderboard. A failed submit must
 * not interrupt play (caller swallows it).
 */
export function useSubmitScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (score: number) =>
      apiClient.arcade.submitScore({
        submitScoreRequest: { score, game: SNAKE_CLASSIC_GAME },
      }),

    onSuccess: (stats) => {
      // Seed the authoritative best/rank so the band updates without a refetch.
      queryClient.setQueryData(arcadeKeys.myStats(SNAKE_CLASSIC_GAME), stats);
      queryClient.invalidateQueries({
        queryKey: arcadeKeys.leaderboard(SNAKE_CLASSIC_GAME, LEADERBOARD_TAKE),
      });
      // Also mark my-stats stale in case the server clamps differently from what we wrote.
      queryClient.invalidateQueries({
        queryKey: arcadeKeys.myStats(SNAKE_CLASSIC_GAME),
        refetchType: "none",
      });
    },
  });
}
