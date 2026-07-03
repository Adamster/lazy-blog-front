"use client";

import { useCallback, useMemo } from "react";
import { useAuth, useUser } from "@/entities/session";
import { identityScope, useLocalBest } from "@/features/arcade/shared";
import { useSnakeClassicGame } from "../model/use-snake-classic-game";
import { rankApiBoard } from "../model/leaderboard";
import { useSnakeClassicLeaderboard } from "../model/use-snake-classic-leaderboard";
import { useMyArcadeStats } from "../model/use-my-arcade-stats";
import { loadHistory } from "../model/score-history";
import { useSubmitScore } from "../model/use-submit-score";
import type {
  RankedRow,
  SnakeClassicGameApi,
  UseSnakeClassicGameOptions,
} from "../model/types";

export interface SnakeClassicArcadeApi {
  /** The engine hook — but with server-truth `best` + `rank` merged into state. */
  game: SnakeClassicGameApi;
  /** The ranked, padded leaderboard board (server entries + viewer highlight). */
  board: RankedRow[];
  /** The viewer's best/rank query is on its FIRST load — show a skeleton, not 0. */
  statsLoading: boolean;
  /** The leaderboard query is on its FIRST load — show skeleton rows, not 0/··. */
  boardLoading: boolean;
  /** Signed-in only — the leaderboard surfaces (rail, rank clause) render only then. */
  showBoard: boolean;
}

/**
 * Page orchestrator + data layer: wraps the engine hook and wires it to the
 * backend (leaderboard, my-stats, submit-score). The engine stays pure (live run
 * + localStorage sparkline); we feed it the server `best` and merge server
 * `best`/`rank` onto `game.state` so consumers read them straight off it. A failed
 * submit is swallowed so the game never stalls.
 *
 * SIGNED-OUT play is fully local: the my-stats + leaderboard queries are disabled
 * (the endpoints are auth-only; no leaderboard surfaces render), nothing submits,
 * and `best` falls back to the localStorage run log.
 */
export function useSnakeClassicArcade(
  options?: UseSnakeClassicGameOptions
): SnakeClassicArcadeApi {
  const { isAuthenticated } = useAuth();
  const { user } = useUser();
  const viewerHandle = user?.userName;

  const leaderboard = useSnakeClassicLeaderboard(isAuthenticated);
  const myStats = useMyArcadeStats(isAuthenticated);
  const submitScore = useSubmitScore();
  // ONE log per identity: the localStorage history keys on the username (or
  // the guest bucket), so logout / another login never inherits these stats.
  const historyScope = identityScope(user?.userName);
  const loadScopedHistory = useCallback(
    () => loadHistory(historyScope),
    [historyScope]
  );
  const { localBest, recordLocalScore } = useLocalBest(loadScopedHistory);

  const best = isAuthenticated ? (myStats.data?.bestScore ?? 0) : localBest;
  // `rank` is null until the first run; the board treats 0 as "off the board".
  const rank = isAuthenticated ? (myStats.data?.rank ?? 0) : 0;

  // Swallow submit failures (board/stats just don't move) — log for diagnosis.
  const onGameOver = useCallback(
    (score: number) => {
      recordLocalScore(score);
      if (!isAuthenticated) return;
      submitScore.mutate(score, {
        onError: (error) => {
          console.error("Snake (classic): score submit failed", error);
        },
      });
    },
    [recordLocalScore, isAuthenticated, submitScore]
  );

  const game = useSnakeClassicGame({
    ...options,
    best,
    onGameOver,
    historyScope,
  });

  const mergedGame = useMemo<SnakeClassicGameApi>(
    () => ({ ...game, state: { ...game.state, best, rank } }),
    [game, best, rank]
  );

  const board = useMemo(
    () => rankApiBoard(leaderboard.data?.entries ?? [], viewerHandle),
    [leaderboard.data, viewerHandle]
  );

  return {
    game: mergedGame,
    board,
    // Gate on `data === undefined`, NOT `isLoading`: an idle/disabled/errored query
    // reports `isLoading === false` while holding no data → would flash a misleading 0.
    // Signed out the query is disabled and `best` is local → never loading.
    statsLoading: isAuthenticated && myStats.data === undefined,
    boardLoading: isAuthenticated && leaderboard.data === undefined,
    showBoard: isAuthenticated,
  };
}
