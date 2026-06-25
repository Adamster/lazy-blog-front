import type { LeaderboardEntryResponse } from "@/shared/api/openapi";
import type { RankedRow } from "./types";

/**
 * Snake leaderboard — display helpers over the API board. The board itself comes
 * from `GET /arcade/leaderboard` (see `useSnakeLeaderboard`); this module only
 * shapes those server entries into the panel's ranked rows and keeps the
 * pad-to-{@link BOARD_SIZE} behaviour so the board never renders short.
 *
 * (The recent-runs sparkline still reads localStorage — see `score-history.ts` —
 * because the backend exposes best/games/rank but NO per-run history series.)
 */

/** How many rows we show (the backend `take`, and the pad-to length). */
export const BOARD_SIZE = 10;

const numberFmt = new Intl.NumberFormat("en-US");

export function formatScore(score: number): string {
  return numberFmt.format(score);
}

/**
 * Map the API leaderboard entries → display-ready ranked rows, flag the viewer's
 * own row (`you`, by handle match), and ALWAYS pad up to exactly
 * {@link BOARD_SIZE} rows — filling any unoccupied slot with a muted `··`
 * placeholder + 0 score (covers loading / empty / a board with fewer than 10
 * players). Entries arrive pre-sorted + pre-ranked from the server; we trust the
 * server `rank` (zero-padded for display) and the server order.
 *
 * `viewerHandle` is the current user's `userName` (no `@`); an entry's `userName`
 * matches it the same way. We only highlight when there's a real handle to match
 * (a logged-out / unresolved viewer highlights nothing).
 */
export function rankApiBoard(
  entries: readonly LeaderboardEntryResponse[],
  viewerHandle?: string
): RankedRow[] {
  const rows: RankedRow[] = entries.slice(0, BOARD_SIZE).map((entry) => ({
    name: `@${entry.userName}`,
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
