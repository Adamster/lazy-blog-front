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
 * Page orchestrator + data layer: wraps the engine hook and wires it to the
 * backend (leaderboard, my-stats, submit-score). The engine stays pure (live run
 * + localStorage sparkline); we feed it the server `best` and merge server
 * `best`/`rank` onto `game.state` so consumers read them straight off it. A failed
 * submit is swallowed so the game never stalls.
 */
export function useSnakeArcade(options?: UseSnakeGameOptions): SnakeArcadeApi {
  const { user } = useUser();
  const viewerHandle = user?.userName;

  const leaderboard = useSnakeLeaderboard();
  const myStats = useMyArcadeStats();
  const submitScore = useSubmitScore();

  const best = myStats.data?.bestScore ?? 0;
  // `rank` is null until the first run; the board treats 0 as "off the board".
  const rank = myStats.data?.rank ?? 0;

  // Swallow submit failures (board/stats just don't move) — log for diagnosis.
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
    // Gate on `data === undefined`, NOT `isLoading`: an idle/disabled/errored query
    // reports `isLoading === false` while holding no data → would flash a misleading 0.
    statsLoading: myStats.data === undefined,
    boardLoading: leaderboard.data === undefined,
  };
}
