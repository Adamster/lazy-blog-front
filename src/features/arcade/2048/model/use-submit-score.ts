import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";
import { arcadeKeys, GAME_2048, LEADERBOARD_TAKE } from "./arcade-keys";

/**
 * Submit a run's score under `game: "2048"` (the backend keys on the free `game`
 * string, so the same endpoint serves every arcade title). The POST returns fresh
 * stats, seeded into the my-stats cache; the leaderboard is invalidated. A failed
 * submit must not interrupt play (the caller swallows it).
 */
export function useSubmitScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (score: number) =>
      apiClient.arcade.submitScore({
        submitScoreRequest: { score, game: GAME_2048 },
      }),

    onSuccess: (stats) => {
      queryClient.setQueryData(arcadeKeys.myStats(GAME_2048), stats);
      queryClient.invalidateQueries({
        queryKey: arcadeKeys.leaderboard(GAME_2048, LEADERBOARD_TAKE),
      });
      queryClient.invalidateQueries({
        queryKey: arcadeKeys.myStats(GAME_2048),
        refetchType: "none",
      });
    },
  });
}
