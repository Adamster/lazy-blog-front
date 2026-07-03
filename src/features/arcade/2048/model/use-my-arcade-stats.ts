import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";
import { arcadeKeys, GAME_2048 } from "./arcade-keys";

/** Viewer's 2048 stats (`bestScore`/`gamesPlayed`/`rank`; `rank` is null until the
 *  first run). Long `staleTime` — refreshed by the submit invalidation, not on focus. */
export function useMyArcadeStats() {
  return useQuery({
    queryKey: arcadeKeys.myStats(GAME_2048),
    queryFn: () => apiClient.arcade.getMyArcadeStats({ game: GAME_2048 }),
    staleTime: 60_000,
  });
}
