import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";
import { arcadeKeys, LEADERBOARD_TAKE, SNAKE_GAME } from "./arcade-keys";

/**
 * Submit a finished run's score. The POST returns the viewer's fresh
 * {@link ArcadeStatsResponse} (best / gamesPlayed / rank) — we write it straight
 * into the my-stats cache (no refetch race) and invalidate the leaderboard so
 * the board reflects the new standing on the next paint.
 *
 * Unlike the 204 vote endpoint, `submitScore` returns a JSON body, so the
 * non-`Raw` generated method is correct here (it parses the body we want).
 *
 * A failed submit must NOT interrupt play: the caller swallows the rejection
 * (logs it) and keeps the game alive — the board/stats simply don't move.
 */
export function useSubmitScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (score: number) =>
      apiClient.arcade.submitScore({
        submitScoreRequest: { score, game: SNAKE_GAME },
      }),

    onSuccess: (stats) => {
      // The server just told us the authoritative best/rank — seed the cache so
      // the band updates without waiting on a refetch.
      queryClient.setQueryData(arcadeKeys.myStats(SNAKE_GAME), stats);
      // The board may have shifted; let it reconcile (refetch if mounted).
      queryClient.invalidateQueries({
        queryKey: arcadeKeys.leaderboard(SNAKE_GAME, LEADERBOARD_TAKE),
      });
      // Belt-and-braces: also mark my-stats stale in case the server clamps the
      // value differently from what we wrote.
      queryClient.invalidateQueries({
        queryKey: arcadeKeys.myStats(SNAKE_GAME),
        refetchType: "none",
      });
    },
  });
}
