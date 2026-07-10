import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";
import { arcadeKeys, LEADERBOARD_TAKE, SHORT_FUSE_GAME } from "./arcade-keys";

/** Global Short Fuse high-score board (top {@link LEADERBOARD_TAKE}, cross-user).
 *  Long `staleTime`; a finished run invalidates it (`useSubmitScore`) — refreshes
 *  when it changes, not on a timer. */
export function useShortFuseLeaderboard(enabled = true) {
  return useQuery({
    queryKey: arcadeKeys.leaderboard(SHORT_FUSE_GAME, LEADERBOARD_TAKE),
    queryFn: () =>
      apiClient.arcade.getLeaderboard({
        game: SHORT_FUSE_GAME,
        take: LEADERBOARD_TAKE,
      }),
    staleTime: 60_000,
    enabled,
  });
}
