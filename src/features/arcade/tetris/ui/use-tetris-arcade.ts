"use client";

import { useCallback, useMemo } from "react";
import { useUser } from "@/entities/session";
import { useTetrisGame } from "../model/use-tetris-game";
import { rankApiBoard } from "../model/leaderboard";
import { useTetrisLeaderboard } from "../model/use-tetris-leaderboard";
import { useMyArcadeStats } from "../model/use-my-arcade-stats";
import { useSubmitScore } from "../model/use-submit-score";
import type {
  RankedRow,
  TetrisGameApi,
  UseTetrisGameOptions,
} from "../model/types";

export interface TetrisArcadeApi {
  /** The engine hook — with server-truth `best` + `rank` merged into state. */
  game: TetrisGameApi;
  /** The ranked, padded leaderboard (server entries + viewer highlight). */
  board: RankedRow[];
  /** The viewer's best/rank query is on its FIRST load — show a skeleton, not 0. */
  statsLoading: boolean;
  /** The leaderboard query is on its FIRST load — show skeleton rows, not 0/··. */
  boardLoading: boolean;
}

/**
 * Page orchestrator + data layer: wraps the engine hook and wires it to the backend
 * (leaderboard, my-stats, submit-score) under `game: "tetris"`. The engine stays pure
 * (live run + localStorage sparkline); we feed it the server `best` and merge server
 * `best`/`rank` onto `game.state`. A failed submit is swallowed so the game never stalls.
 */
export function useTetrisArcade(
  options?: UseTetrisGameOptions
): TetrisArcadeApi {
  const { user } = useUser();
  const viewerHandle = user?.userName;

  const leaderboard = useTetrisLeaderboard();
  const myStats = useMyArcadeStats();
  const submitScore = useSubmitScore();

  const best = myStats.data?.bestScore ?? 0;
  const rank = myStats.data?.rank ?? 0;

  const onGameOver = useCallback(
    (score: number) => {
      submitScore.mutate(score, {
        onError: (error) => {
          console.error("Tetris: score submit failed", error);
        },
      });
    },
    [submitScore]
  );

  const game = useTetrisGame({ ...options, best, onGameOver });

  const mergedGame = useMemo<TetrisGameApi>(
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
    // Gate on `data === undefined`, NOT `isLoading` (an idle/errored query reports
    // isLoading=false while holding no data → would flash a misleading 0).
    statsLoading: myStats.data === undefined,
    boardLoading: leaderboard.data === undefined,
  };
}
