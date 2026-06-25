import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";
import { arcadeKeys, LEADERBOARD_TAKE, SNAKE_GAME } from "./arcade-keys";

/**
 * The global Snake high-score board (top {@link LEADERBOARD_TAKE}, cross-user).
 * Leaderboard data is low-volatility per viewer — a long `staleTime` keeps it
 * from refetching on every focus; a finished run invalidates it explicitly (see
 * `useSubmitScore`), so it refreshes exactly when it changes, not on a timer.
 */
export function useSnakeLeaderboard() {
  return useQuery({
    queryKey: arcadeKeys.leaderboard(SNAKE_GAME, LEADERBOARD_TAKE),
    queryFn: () =>
      apiClient.arcade.getLeaderboard({
        game: SNAKE_GAME,
        take: LEADERBOARD_TAKE,
      }),
    staleTime: 60_000,
  });
}
