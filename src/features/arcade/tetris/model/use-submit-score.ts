import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";
import { arcadeKeys, LEADERBOARD_TAKE, TETRIS_GAME } from "./arcade-keys";

/**
 * Submit a finished run's score under `game: "tetris"` (the backend keys on the free
 * `game` string, so the same endpoint serves every arcade title). The POST returns
 * fresh stats, seeded into the my-stats cache; the leaderboard is invalidated. A
 * failed submit must not interrupt play (the caller swallows it).
 */
export function useSubmitScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (score: number) =>
      apiClient.arcade.submitScore({
        submitScoreRequest: { score, game: TETRIS_GAME },
      }),

    onSuccess: (stats) => {
      queryClient.setQueryData(arcadeKeys.myStats(TETRIS_GAME), stats);
      queryClient.invalidateQueries({
        queryKey: arcadeKeys.leaderboard(TETRIS_GAME, LEADERBOARD_TAKE),
      });
      queryClient.invalidateQueries({
        queryKey: arcadeKeys.myStats(TETRIS_GAME),
        refetchType: "none",
      });
    },
  });
}
