"use client";

import { BOARD_SIZE } from "../model/leaderboard";
import type { RankedRow } from "../model/types";

/** One leaderboard line. YOU rows read in accent (no wash); empty padding slots
 *  are fully muted. */
function BoardRow({ row }: { row: RankedRow }) {
  const accent = !!row.you;
  const empty = !!row.empty;
  const rankColor = accent ? "var(--m-accent)" : "var(--m-muted2)";
  const textColor = accent
    ? "var(--m-accent)"
    : empty
      ? "var(--m-muted2)"
      : "var(--m-fg)";
  return (
    <div className="grid grid-cols-[28px_1fr_auto] items-center gap-3 py-[11px]">
      <span className="text-[12px] tabular-nums" style={{ color: rankColor }}>
        {row.rank}
      </span>
      <span
        className="overflow-hidden text-[12px] text-ellipsis whitespace-nowrap"
        style={{ color: textColor }}
      >
        {row.you ? "YOU" : row.name}
      </span>
      <span
        className="font-display text-[14px] font-bold tabular-nums"
        style={{ color: textColor }}
      >
        {row.scoreLabel}
      </span>
    </div>
  );
}

/**
 * The high-score panel — a `// HIGH SCORES` header + `TOP N` count + the ranked
 * rows, borderless and flush to the rail edge. Scores are local for now; a
 * cross-user backend board is a follow-up.
 */
export function SnakeLeaderboard({
  board,
  className = "",
}: {
  board: RankedRow[];
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="flex items-center justify-between pb-3.5">
        <span className="text-[11px] tracking-[0.12em] text-[var(--m-accent)] uppercase">
          {"// High scores"}
        </span>
        <span className="text-[11px] tracking-[0.06em] text-[var(--m-muted2)] uppercase">
          {`Top ${BOARD_SIZE}`}
        </span>
      </div>

      <div>
        {board.map((row) => (
          <BoardRow key={`${row.name}-${row.rank}`} row={row} />
        ))}
      </div>
    </div>
  );
}
