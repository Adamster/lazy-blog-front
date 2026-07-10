"use client";

import Link from "next/link";
import { Label, Spinner } from "@/shared/ui";
import { userHref } from "@/shared/lib/routes";

export interface LeaderboardRow {
  name: string;
  scoreLabel: string;
  /** Zero-padded position, e.g. "01". */
  rank: string;
  you?: boolean;
  /** Raw handle (no `@`); absent on padding placeholders. */
  userName?: string;
  /** True for a padding placeholder slot. */
  empty?: boolean;
}

/** One leaderboard line. Viewer's row = accent plain text; other players' `@handle`s
 *  link to their profile. A padding placeholder (no score yet — signed-out play
 *  renders every row this way too, no auth-teaser rain) collapses to a dim ░
 *  fill instead of name/score text, matching the arcade hub card's empty rows. */
function BoardRow({ row }: { row: LeaderboardRow }) {
  if (row.empty) {
    return (
      <div className="grid grid-cols-[28px_1fr] items-center gap-3 py-2.5">
        <span
          className="text-[12px] tabular-nums"
          style={{ color: "var(--m-muted2)" }}
        >
          {row.rank}
        </span>
        <span
          className="overflow-hidden text-clip whitespace-nowrap text-[var(--m-dim)]"
          role="img"
          aria-label="No score yet"
        >
          ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
        </span>
      </div>
    );
  }

  const accent = !!row.you;
  const rankColor = accent ? "var(--m-accent)" : "var(--m-muted2)";
  const textColor = accent ? "var(--m-accent)" : "var(--m-fg)";
  return (
    <div className="grid grid-cols-[28px_1fr_auto] items-center gap-3 py-2.5">
      <span className="text-[12px] tabular-nums" style={{ color: rankColor }}>
        {row.rank}
      </span>
      <span
        className="overflow-hidden text-[12px] text-ellipsis whitespace-nowrap"
        style={{ color: textColor }}
      >
        {row.userName && !row.you ? (
          <Link
            href={userHref(row.userName)}
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

export interface LeaderboardProps {
  board: LeaderboardRow[];
  /** The board's padded row count (each game's own `BOARD_SIZE`), for the "Top N" label. */
  boardSize: number;
  loading?: boolean;
  className?: string;
}

/** High-score panel — header + ranked rows (padded to `boardSize`). Spinner on
 *  first load instead of the 0/·· placeholders. Shared across every arcade game. */
export function Leaderboard({
  board,
  boardSize,
  loading = false,
  className = "",
}: LeaderboardProps) {
  return (
    <div className={`flex flex-col self-stretch ${className}`}>
      <div className="flex items-center justify-between pb-4">
        <Label uppercase>High scores</Label>
        <span className="text-[11px] tracking-[0.06em] text-[var(--m-muted2)] uppercase">
          {`Top ${boardSize}`}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner className="text-[20px] text-[var(--m-accent)]" />
        </div>
      ) : (
        <div className="flex flex-1 flex-col justify-between">
          {board.map((row) => (
            <BoardRow key={`${row.name}-${row.rank}`} row={row} />
          ))}
        </div>
      )}
    </div>
  );
}
