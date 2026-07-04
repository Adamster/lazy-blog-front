import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";
import { arcadeKeys, SNAKE_CLASSIC_GAME } from "./arcade-keys";

/** Viewer's classic-Snake stats (`bestScore`/`gamesPlayed`/`rank`; `rank` is null
 *  until the first run). Long `staleTime` — refreshed by the submit invalidation.
 *  Pass `enabled=false` for a signed-out viewer (the endpoint is auth-only). */
export function useMyArcadeStats(enabled = true) {
  return useQuery({
    queryKey: arcadeKeys.myStats(SNAKE_CLASSIC_GAME),
    queryFn: () =>
      apiClient.arcade.getMyArcadeStats({ game: SNAKE_CLASSIC_GAME }),
    staleTime: 60_000,
    enabled,
  });
}
