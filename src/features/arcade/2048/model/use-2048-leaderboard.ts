import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";
import { arcadeKeys, GAME_2048, LEADERBOARD_TAKE } from "./arcade-keys";

/** Global 2048 high-score board (top {@link LEADERBOARD_TAKE}, cross-user). Long
 *  `staleTime`; a finished run invalidates it (`useSubmitScore`).
 *  Pass `enabled=false` for a signed-out viewer — no leaderboard surfaces there. */
export function use2048Leaderboard(enabled = true) {
  return useQuery({
    queryKey: arcadeKeys.leaderboard(GAME_2048, LEADERBOARD_TAKE),
    queryFn: () =>
      apiClient.arcade.getLeaderboard({
        game: GAME_2048,
        take: LEADERBOARD_TAKE,
      }),
    staleTime: 60_000,
    enabled,
  });
}
