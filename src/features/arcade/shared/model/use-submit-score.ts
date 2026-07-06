import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";
import { FetchError } from "@/shared/api/openapi";
import { addToastError } from "@/shared/lib/toasts";

// Each submit INSERTS a new run row server-side (not an upsert) — see
// SubmitScoreCommandHandler. A retried request that actually reached the server
// would double-count the run, so we only retry a `FetchError` (the request never
// got a response at all); a `ResponseError` (401/400/...) is a definitive
// server verdict and is never retried.
const MAX_RETRIES = 2;

interface ArcadeKeys {
  leaderboard: (game: string, take: number) => readonly unknown[];
  myStats: (game: string) => readonly unknown[];
}

/**
 * Submit a finished run's score. The POST returns fresh stats, seeded into the
 * my-stats cache; the leaderboard is invalidated. A failed submit must not
 * interrupt play (the caller swallows it) — the player is notified via toast
 * instead.
 */
export function useSubmitArcadeScore(
  game: string,
  arcadeKeys: ArcadeKeys,
  leaderboardTake: number
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (score: number) =>
      apiClient.arcade.submitScore({
        submitScoreRequest: { score, game },
      }),

    retry: (failureCount, error) =>
      error instanceof FetchError && failureCount < MAX_RETRIES,

    onSuccess: (stats) => {
      queryClient.setQueryData(arcadeKeys.myStats(game), stats);
      queryClient.invalidateQueries({
        queryKey: arcadeKeys.leaderboard(game, leaderboardTake),
      });
      queryClient.invalidateQueries({
        queryKey: arcadeKeys.myStats(game),
        refetchType: "none",
      });
    },

    onError: (error) => {
      void addToastError("Your score couldn't be saved.", error);
    },
  });
}
