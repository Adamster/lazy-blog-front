/**
 * Query-key factory + game key for the Stay Awake arcade. Mirrors the other
 * arcade features' factory shape intentionally (kept local so the feature stays
 * self-contained — FSD: features don't import each other). Keys carry `game`,
 * so the `"stay-awake"` cache never collides with the other titles.
 */
export const arcadeKeys = {
  all: ["arcade"] as const,
  leaderboard: (game: string, take: number) =>
    [...arcadeKeys.all, "leaderboard", game, take] as const,
  myStats: (game: string) => [...arcadeKeys.all, "my-stats", game] as const,
};

/** The backend `game` key (a free string server-side). */
export const GAME_STAY_AWAKE = "stay-awake";

/** Leaderboard rows requested — matches the board's pad-to-10. */
export const LEADERBOARD_TAKE = 10;
