import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";
import { arcadeKeys, GAME_STAY_AWAKE, LEADERBOARD_TAKE } from "./arcade-keys";

/** Global Stay Awake high-score board (top {@link LEADERBOARD_TAKE}, cross-user).
 *  Long `staleTime`; a finished run invalidates it (`useSubmitScore`) — refreshes
 *  when it changes, not on a timer. */
export function useStayAwakeLeaderboard(enabled = true) {
  return useQuery({
    queryKey: arcadeKeys.leaderboard(GAME_STAY_AWAKE, LEADERBOARD_TAKE),
    queryFn: () =>
      apiClient.arcade.getLeaderboard({
        game: GAME_STAY_AWAKE,
        take: LEADERBOARD_TAKE,
      }),
    staleTime: 60_000,
    enabled,
  });
}
