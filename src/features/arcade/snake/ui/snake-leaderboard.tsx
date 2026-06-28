"use client";

import Link from "next/link";
import { Spinner } from "@/shared/ui";
import { BOARD_SIZE } from "../model/leaderboard";
import type { RankedRow } from "../model/types";

/** One leaderboard line. Viewer's row = accent plain text (the header already
 *  links to your profile); other players' `@handle`s link; `··` placeholders don't. */
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
    <div className="grid grid-cols-[28px_1fr_auto] items-center gap-3 py-3">
      <span className="text-[12px] tabular-nums" style={{ color: rankColor }}>
        {row.rank}
      </span>
      <span
        className="overflow-hidden text-[12px] text-ellipsis whitespace-nowrap"
        style={{ color: textColor }}
      >
        {row.userName && !row.you ? (
          <Link
            href={`/${row.userName}`}
            className="transition-colors hover:text-[var(--m-accent)]"
          >
            {row.name}
          </Link>
        ) : (
          row.name
        )}
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

/** High-score panel — header + ranked rows (padded to {@link BOARD_SIZE}). Spinner
 *  on first load instead of the 0/·· placeholders. */
export function SnakeLeaderboard({
  board,
  loading = false,
  className = "",
}: {
  board: RankedRow[];
  loading?: boolean;
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

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner className="text-[20px] text-[var(--m-accent)]" />
        </div>
      ) : (
        <div>
          {board.map((row) => (
            <BoardRow key={`${row.name}-${row.rank}`} row={row} />
          ))}
        </div>
      )}
    </div>
  );
}
