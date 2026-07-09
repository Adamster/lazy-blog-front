"use client";

import { Leaderboard } from "@/features/arcade/shared";
import { BOARD_SIZE } from "../model/leaderboard";
import type { RankedRow } from "../model/types";

export function SnakeClassicLeaderboard({
  board,
  loading = false,
  className = "",
}: {
  board: RankedRow[];
  loading?: boolean;
  className?: string;
}) {
  return (
    <Leaderboard
      board={board}
      boardSize={BOARD_SIZE}
      loading={loading}
      className={className}
    />
  );
}
