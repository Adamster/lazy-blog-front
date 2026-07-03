import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";
import type { LeaderboardEntryResponse } from "@/shared/api/openapi";

/** Podium slice shown on a hub card. */
export const TOP_TAKE = 3;

const numberFmt = new Intl.NumberFormat("en-US");

export interface TopPlayerRow {
  rank: string;
  name: string;
  /** Absent on `··` placeholder rows — those render as plain text, not a link. */
  userName?: string;
  scoreLabel: string;
  empty?: boolean;
}

/** Map the API board to display rows, always padded to {@link TOP_TAKE} so the
 *  card never changes height (mirrors the game features' `rankApiBoard`). */
export function rankTopPlayers(
  entries: readonly LeaderboardEntryResponse[]
): TopPlayerRow[] {
  const rows: TopPlayerRow[] = entries.slice(0, TOP_TAKE).map((entry) => ({
    rank: String(entry.rank).padStart(2, "0"),
    name: `@${entry.userName}`,
    userName: entry.userName,
    scoreLabel: numberFmt.format(entry.bestScore),
  }));

  while (rows.length < TOP_TAKE) {
    rows.push({
      rank: String(rows.length + 1).padStart(2, "0"),
      name: "··",
      scoreLabel: "0",
      empty: true,
    });
  }
  return rows;
}

/** Key shape matches the game features' `arcadeKeys.leaderboard(game, take)`.
 *  Pass `enabled=false` for a signed-out viewer — no leaderboard surfaces there. */
export function useGameLeaderboard(game: string, enabled = true) {
  return useQuery({
    queryKey: ["arcade", "leaderboard", game, TOP_TAKE] as const,
    queryFn: () => apiClient.arcade.getLeaderboard({ game, take: TOP_TAKE }),
    staleTime: 60_000,
    enabled,
  });
}
