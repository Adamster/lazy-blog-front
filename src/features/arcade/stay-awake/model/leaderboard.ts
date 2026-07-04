import type { LeaderboardEntryResponse } from "@/shared/api/openapi";
import type { RankedRow } from "./types";

/**
 * Stay Awake leaderboard — display helpers over the API board. The board comes
 * from `GET /arcade/leaderboard` (see `useStayAwakeLeaderboard`); this module
 * only shapes those server entries into the panel's ranked rows and keeps the
 * pad-to-{@link BOARD_SIZE} behaviour so the board never renders short.
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
 * placeholder + 0 score. Entries arrive pre-sorted + pre-ranked from the server.
 */
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
