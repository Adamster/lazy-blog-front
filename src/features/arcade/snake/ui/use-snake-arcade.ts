"use client";

import { useCallback, useMemo } from "react";
import { useUser } from "@/entities/session";
import { useSnakeGame } from "../model/use-snake-game";
import { rankApiBoard } from "../model/leaderboard";
import { useSnakeLeaderboard } from "../model/use-snake-leaderboard";
import { useMyArcadeStats } from "../model/use-my-arcade-stats";
import { useSubmitScore } from "../model/use-submit-score";
import type {
  RankedRow,
  SnakeGameApi,
  UseSnakeGameOptions,
} from "../model/types";

export interface SnakeArcadeApi {
  /** The engine hook — but with server-truth `best` + `rank` merged into state. */
  game: SnakeGameApi;
  /** The ranked, padded leaderboard board (server entries + viewer highlight). */
  board: RankedRow[];
  /** The viewer's best/rank query is on its FIRST load — show a skeleton, not 0. */
  statsLoading: boolean;
  /** The leaderboard query is on its FIRST load — show skeleton rows, not 0/··. */
  boardLoading: boolean;
}

/**
 * Page-level orchestrator + the arcade's DATA LAYER. Wraps the engine hook and
 * wires it to the backend:
 *
 *  - `useSnakeLeaderboard` → the cross-user board (mapped + viewer-highlighted).
 *  - `useMyArcadeStats`    → the viewer's `bestScore` / `rank` (the band's Best).
 *  - `useSubmitScore`      → POSTs each finished run; on success it seeds my-stats
 *                            and invalidates the board, so Best/rank/board refresh
 *                            with no manual refetch race.
 *
 * The engine stays pure-engine: it owns the live run + the localStorage
 * recent-runs sparkline (the one store with no backend endpoint), takes the
 * server `best` for its new-best test, and calls back on game over. We MERGE the
 * server `best`/`rank` onto the returned `state` so the board + stats band read
 * them straight off `game.state` (consumers unchanged). A failed submit is
 * swallowed (logged) so the game never stalls on the network.
 */
export function useSnakeArcade(options?: UseSnakeGameOptions): SnakeArcadeApi {
  const { user } = useUser();
  const viewerHandle = user?.userName;

  const leaderboard = useSnakeLeaderboard();
  const myStats = useMyArcadeStats();
  const submitScore = useSubmitScore();

  const best = myStats.data?.bestScore ?? 0;
  // `rank` is null until the first run; the board overlay treats 0 as "off the
  // board", so null collapses to 0 cleanly.
  const rank = myStats.data?.rank ?? 0;

  // Fired once per run by the engine. Swallow failures (don't crash the game) —
  // the board/stats just don't move; the mutation already toasts nothing on its
  // own, so we log for diagnosis.
  const onGameOver = useCallback(
    (score: number) => {
      submitScore.mutate(score, {
        onError: (error) => {
          console.error("Snake: score submit failed", error);
        },
      });
    },
    [submitScore]
  );

  const game = useSnakeGame({ ...options, best, onGameOver });

  // Merge server-truth best + rank onto the engine state so the board overlay and
  // the stats band read them straight off `game.state` (no extra props threaded).
  const mergedGame = useMemo<SnakeGameApi>(
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
    // Spinner until REAL data lands — gate on `data === undefined`, NOT
    // `isLoading`. A query that's idle/disabled or has errored reports
    // `isLoading === false` while still holding no data, which would flash a
    // misleading 0. "No value yet" holds the loader; a refetch keeps the prior
    // data, so it never re-flashes once loaded.
    statsLoading: myStats.data === undefined,
    boardLoading: leaderboard.data === undefined,
  };
}
