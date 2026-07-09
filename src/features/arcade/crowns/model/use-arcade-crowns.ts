"use client";

import { useQueries } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";

/** The hub-listed games a profile can hold the CURRENT #1 spot in — kept 1:1
 *  with the hub's own visible roster (`src/features/arcade/hub/ui/arcade-page.tsx`'s
 *  non-hidden `GAMES`): a crown that links back to a delisted game contradicts
 *  the hub's own delisting call. Rabbit + Stay Awake dropped 2026-07-09 when
 *  they were delisted from the hub (`hidden: true`) — re-add a game's crown
 *  here the same moment it's relisted there. `title` feeds the hover label
 *  (`TOP 1 · <title>`); `href` = the game page the crown links to. */
export const CROWN_GAMES = [
  { game: "tetris", title: "TETRIS", href: "/arcade/tetris" },
  { game: "2048", title: "2048", href: "/arcade/2048" },
  { game: "snake-classic", title: "SNAKE", href: "/arcade/snake" },
] as const;

export type CrownGame = (typeof CROWN_GAMES)[number];

/** Mirrors every game feature's LEADERBOARD_TAKE, so these queries dedupe
 *  into the same cache entries the game pages already fill. */
const LEADERBOARD_TAKE = 10;

/**
 * Profile crowns, Variant A (frontend-composed — owner call 2026-07-04): read
 * each game's leaderboard and keep the games whose CURRENT #1 is `userName`.
 * The GET is auth-only, so signed-out viewers simply see no crowns; Variant B
 * (a public backend endpoint) is parked for the backend pass. Losing the top
 * spot loses the crown — these are standings, not achievements.
 */
export function useArcadeCrowns(
  userName: string | undefined,
  enabled: boolean
): CrownGame[] {
  return useQueries({
    queries: CROWN_GAMES.map(({ game }) => ({
      queryKey: ["arcade", "leaderboard", game, LEADERBOARD_TAKE] as const,
      queryFn: () =>
        apiClient.arcade.getLeaderboard({ game, take: LEADERBOARD_TAKE }),
      staleTime: 60_000,
      enabled: enabled && !!userName,
    })),
    combine: (results) =>
      CROWN_GAMES.filter((_, i) => {
        const top = results[i].data?.entries?.[0];
        return (
          !!top?.userName &&
          !!userName &&
          top.userName.toLowerCase() === userName.toLowerCase()
        );
      }),
  });
}
