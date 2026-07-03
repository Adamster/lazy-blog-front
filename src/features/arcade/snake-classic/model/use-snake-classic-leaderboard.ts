import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";
import {
  arcadeKeys,
  LEADERBOARD_TAKE,
  SNAKE_CLASSIC_GAME,
} from "./arcade-keys";

/** Global classic-Snake high-score board (top {@link LEADERBOARD_TAKE}, cross-user).
 *  Long `staleTime`; a finished run invalidates it (`useSubmitScore`) — refreshes
 *  when it changes, not on a timer. */
export function useSnakeClassicLeaderboard() {
  return useQuery({
    queryKey: arcadeKeys.leaderboard(SNAKE_CLASSIC_GAME, LEADERBOARD_TAKE),
    queryFn: () =>
      apiClient.arcade.getLeaderboard({
        game: SNAKE_CLASSIC_GAME,
        take: LEADERBOARD_TAKE,
      }),
    staleTime: 60_000,
  });
}
