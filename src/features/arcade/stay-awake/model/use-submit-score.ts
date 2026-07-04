import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";
import { arcadeKeys, GAME_STAY_AWAKE, LEADERBOARD_TAKE } from "./arcade-keys";

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
        submitScoreRequest: { score, game: GAME_STAY_AWAKE },
      }),

    onSuccess: (stats) => {
      // Seed the authoritative best/rank so the band updates without a refetch.
      queryClient.setQueryData(arcadeKeys.myStats(GAME_STAY_AWAKE), stats);
      queryClient.invalidateQueries({
        queryKey: arcadeKeys.leaderboard(GAME_STAY_AWAKE, LEADERBOARD_TAKE),
      });
      // Also mark my-stats stale in case the server clamps differently from what we wrote.
      queryClient.invalidateQueries({
        queryKey: arcadeKeys.myStats(GAME_STAY_AWAKE),
        refetchType: "none",
      });
    },
  });
}
