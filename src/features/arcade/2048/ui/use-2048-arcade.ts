"use client";

import { useCallback, useMemo } from "react";
import { useUser } from "@/entities/session";
import { use2048Game } from "../model/use-2048-game";
import { rankApiBoard } from "../model/leaderboard";
import { use2048Leaderboard } from "../model/use-2048-leaderboard";
import { useMyArcadeStats } from "../model/use-my-arcade-stats";
import { useSubmitScore } from "../model/use-submit-score";
import type {
  Game2048Api,
  RankedRow,
  Use2048GameOptions,
} from "../model/types";

export interface Arcade2048Api {
  /** The engine hook — with server-truth `best` + `rank` merged into state. */
  game: Game2048Api;
  /** The ranked, padded leaderboard (server entries + viewer highlight). */
  board: RankedRow[];
  /** The viewer's best/rank query is on its FIRST load — show a skeleton, not 0. */
  statsLoading: boolean;
  /** The leaderboard query is on its FIRST load — show skeleton rows, not 0/··. */
  boardLoading: boolean;
}

/**
 * Page orchestrator + data layer: wraps the engine hook and wires it to the backend
 * (leaderboard, my-stats, submit-score) under `game: "2048"`. Scores submit BOTH at
 * the first 2048 (onWin — a winner who walks away still lands on the board) and at
 * game over. A failed submit is swallowed.
 */
export function use2048Arcade(options?: Use2048GameOptions): Arcade2048Api {
  const { user } = useUser();
  const viewerHandle = user?.userName;

  const leaderboard = use2048Leaderboard();
  const myStats = useMyArcadeStats();
  const submitScore = useSubmitScore();

  const best = myStats.data?.bestScore ?? 0;
  const rank = myStats.data?.rank ?? 0;

  const submit = useCallback(
    (score: number) => {
      submitScore.mutate(score, {
        onError: (error) => {
          console.error("2048: score submit failed", error);
        },
      });
    },
    [submitScore]
  );

  const game = use2048Game({
    ...options,
    best,
    onGameOver: submit,
    onWin: submit,
  });

  const mergedGame = useMemo<Game2048Api>(
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
