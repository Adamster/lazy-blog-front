/**
 * Query-key factory + game key for the Short Fuse arcade. Mirrors the
 * Snake/Tetris/2048 factory shape intentionally (kept local so the feature stays
 * self-contained — FSD: features don't import each other). Keys carry `game`, so
 * the `"short-fuse"` cache never collides with other games.
 */
export const arcadeKeys = {
  all: ["arcade"] as const,
  leaderboard: (game: string, take: number) =>
    [...arcadeKeys.all, "leaderboard", game, take] as const,
  myStats: (game: string) => [...arcadeKeys.all, "my-stats", game] as const,
};

/** The backend `game` key (a free string server-side — see `SubmitScoreRequest`). */
export const SHORT_FUSE_GAME = "short-fuse";

/** Leaderboard rows requested — matches the board's pad-to-10. */
export const LEADERBOARD_TAKE = 10;
