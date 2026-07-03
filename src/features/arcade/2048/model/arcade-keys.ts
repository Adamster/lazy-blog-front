/**
 * Query-key factory + game key for the 2048 arcade. Mirrors the Tetris feature's
 * factory shape intentionally (kept local so the feature stays self-contained — FSD:
 * features don't import each other). Keys carry `game`, so the `"2048"` cache never
 * collides with `"tetris"`/`"snake"` even though all use `["arcade", ...]`.
 */
export const arcadeKeys = {
  all: ["arcade"] as const,
  leaderboard: (game: string, take: number) =>
    [...arcadeKeys.all, "leaderboard", game, take] as const,
  myStats: (game: string) => [...arcadeKeys.all, "my-stats", game] as const,
};

/** The backend `game` key (a free string server-side — see `SubmitScoreRequest`). */
export const GAME_2048 = "2048";

/** Leaderboard rows requested — matches the board's pad-to-10. */
export const LEADERBOARD_TAKE = 10;
