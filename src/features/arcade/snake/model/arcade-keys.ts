/**
 * Typed query-key factory for the arcade resource. Single source of truth so the
 * leaderboard + my-stats queries and the submit mutation's invalidation all hit
 * the same hierarchical cache entries. Keys mirror the resource shape and carry
 * the `game` so a future second arcade title (a different `game`) gets its own
 * cache without colliding — and so `arcadeKeys.all` can invalidate every arcade
 * query at once if needed.
 */
export const arcadeKeys = {
  all: ["arcade"] as const,
  leaderboard: (game: string, take: number) =>
    [...arcadeKeys.all, "leaderboard", game, take] as const,
  myStats: (game: string) => [...arcadeKeys.all, "my-stats", game] as const,
};

/** The only arcade title today; passed as `game` everywhere. */
export const SNAKE_GAME = "snake";

/** How many leaderboard rows we request (matches the board's pad-to-10). */
export const LEADERBOARD_TAKE = 10;
