/** Query-key factory; keys carry `game` so a future second arcade title gets its
 *  own cache without colliding (and `arcadeKeys.all` invalidates every arcade query). */
export const arcadeKeys = {
  all: ["arcade"] as const,
  leaderboard: (game: string, take: number) =>
    [...arcadeKeys.all, "leaderboard", game, take] as const,
  myStats: (game: string) => [...arcadeKeys.all, "my-stats", game] as const,
};

export const SNAKE_GAME = "snake";

/** Leaderboard rows requested — matches the board's pad-to-10. */
export const LEADERBOARD_TAKE = 10;
