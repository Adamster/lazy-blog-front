import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";
import { arcadeKeys, LEADERBOARD_TAKE, TETRIS_GAME } from "./arcade-keys";

/** Global Tetris high-score board (top {@link LEADERBOARD_TAKE}, cross-user). Long
 *  `staleTime`; a finished run invalidates it (`useSubmitScore`). */
export function useTetrisLeaderboard() {
  return useQuery({
    queryKey: arcadeKeys.leaderboard(TETRIS_GAME, LEADERBOARD_TAKE),
    queryFn: () =>
      apiClient.arcade.getLeaderboard({
        game: TETRIS_GAME,
        take: LEADERBOARD_TAKE,
      }),
    staleTime: 60_000,
  });
}
