import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";
import { arcadeKeys, SNAKE_GAME } from "./arcade-keys";

/**
 * The viewer's own Snake stats — `bestScore` / `gamesPlayed` / `rank` (the band's
 * Best, and the run's standing). `rank` is `null` until the first run lands.
 * Same volatility profile as the board: long `staleTime`, refreshed by the
 * submit mutation's invalidation rather than on focus.
 */
export function useMyArcadeStats() {
  return useQuery({
    queryKey: arcadeKeys.myStats(SNAKE_GAME),
    queryFn: () => apiClient.arcade.getMyArcadeStats({ game: SNAKE_GAME }),
    staleTime: 60_000,
  });
}
