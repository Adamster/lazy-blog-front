import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";
import { arcadeKeys, TETRIS_GAME } from "./arcade-keys";

/** Viewer's Tetris stats (`bestScore`/`gamesPlayed`/`rank`; `rank` is null until the
 *  first run). Long `staleTime` — refreshed by the submit invalidation, not on focus. */
export function useMyArcadeStats() {
  return useQuery({
    queryKey: arcadeKeys.myStats(TETRIS_GAME),
    queryFn: () => apiClient.arcade.getMyArcadeStats({ game: TETRIS_GAME }),
    staleTime: 60_000,
  });
}
