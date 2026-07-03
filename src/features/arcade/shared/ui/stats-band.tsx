"use client";

import type { ReactNode } from "react";
import { Label, Sparkline, Stat } from "@/shared/ui";
import { formatScore } from "../model/format-score";
import type { HistoryPoint } from "../model/types";

export interface StatsBandProps {
  score: number;
  best: number;
  /** Server best still on first load → skeleton the BEST number (not 0). */
  statsLoading?: boolean;
  history: HistoryPoint[];
  /** The "LAST N" window size shown in the chart's label (each game's own HISTORY_RECENT). */
  historyWindow: number;
  /** Unique per page — forwarded to the Sparkline gradient defs id (two gradients with the same id collide in the DOM). */
  gradientId: string;
  /** Extra content anchored to the SCORE cell's value — e.g. the rabbit snake's floating ScorePops "+N" juice. */
  scoreExtra?: ReactNode;
}

/** Last column: score-per-game chart — the same {@link Sparkline} as every arcade
 *  game's band; an empty log renders a flat muted line, not a "no data" message. */
function ScoreHistoryChart({
  history,
  historyWindow,
  gradientId,
}: {
  history: HistoryPoint[];
  historyWindow: number;
  gradientId: string;
}) {
  return (
    <div>
      <Label tone="muted">{`SCORES · LAST ${historyWindow}`}</Label>
      <div className="mt-4">
        <Sparkline
          series={history}
          gradientId={gradientId}
          ariaLabel={`Score by game: ${history
            .map((h) => `${h.label} ${h.count}`)
            .join(", ")}`}
          showLabels={false}
        />
      </div>
    </div>
  );
}

/** Score / Best / recent-runs — the canonical 3-column stats band shared by every
 *  arcade game. Per-game overflow stats (Moves, Lines+Level, Eaten) live in the
 *  BoardEyebrow above the board instead of here. */
export function StatsBand({
  score,
  best,
  statsLoading = false,
  history,
  historyWindow,
  gradientId,
  scoreExtra,
}: StatsBandProps) {
  return (
    <section className="mx-[calc(50%-50vw)] w-screen bg-[var(--m-card)]">
      <div className="mx-auto grid max-w-[1240px] gap-10 px-10 py-10 sm:grid-cols-3">
        <Stat
          label="SCORE"
          value={formatScore(score)}
          signOf={score}
          sub="current run"
          valueExtra={scoreExtra}
        />
        <Stat
          label="BEST"
          value={formatScore(best)}
          signOf={best}
          sub="personal best"
          loading={statsLoading}
        />
        <ScoreHistoryChart
          history={history}
          historyWindow={historyWindow}
          gradientId={gradientId}
        />
      </div>
    </section>
  );
}
