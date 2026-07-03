import type { LeaderboardEntryResponse } from "@/shared/api/openapi";
import type { RankedRow } from "./types";

/**
 * Tetris leaderboard display helpers over the API board (`GET /arcade/leaderboard?game=tetris`,
 * see `useTetrisLeaderboard`). Mirrors the Snake feature's shaping (kept local so the
 * feature is self-contained): map server entries → ranked rows, flag the viewer, and
 * always pad up to {@link BOARD_SIZE} so the panel never renders short.
 */

export const BOARD_SIZE = 10;

const numberFmt = new Intl.NumberFormat("en-US");

export function formatScore(score: number): string {
  return numberFmt.format(score);
}

export function rankApiBoard(
  entries: readonly LeaderboardEntryResponse[],
  viewerHandle?: string
): RankedRow[] {
  const rows: RankedRow[] = entries.slice(0, BOARD_SIZE).map((entry) => ({
    name: `@${entry.userName}`,
    userName: entry.userName,
    score: entry.bestScore,
    you: !!viewerHandle && entry.userName === viewerHandle,
    rank: String(entry.rank).padStart(2, "0"),
    scoreLabel: numberFmt.format(entry.bestScore),
  }));

  while (rows.length < BOARD_SIZE) {
    const i = rows.length;
    rows.push({
      name: "··",
      score: 0,
      rank: String(i + 1).padStart(2, "0"),
      scoreLabel: "0",
      empty: true,
    });
  }
  return rows;
}

/** An all-placeholder board — the loading / empty fallback (never renders short). */
export function emptyBoard(): RankedRow[] {
  return rankApiBoard([]);
}
