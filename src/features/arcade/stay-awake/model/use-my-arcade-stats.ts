import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";
import { arcadeKeys, GAME_STAY_AWAKE } from "./arcade-keys";

/** Viewer's Stay Awake stats (`bestScore`/`gamesPlayed`/`rank`; `rank` is null
 *  until the first run). Long `staleTime` — refreshed by the submit invalidation.
 *  Pass `enabled=false` for a signed-out viewer (the endpoint is auth-only). */
export function useMyArcadeStats(enabled = true) {
  return useQuery({
    queryKey: arcadeKeys.myStats(GAME_STAY_AWAKE),
    queryFn: () => apiClient.arcade.getMyArcadeStats({ game: GAME_STAY_AWAKE }),
    staleTime: 60_000,
    enabled,
  });
}
