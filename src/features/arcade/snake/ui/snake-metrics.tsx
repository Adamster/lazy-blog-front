"use client";

import { Label, Spinner } from "@/shared/ui";
import { Sparkline } from "@/shared/ui/sparkline";
import { formatScore } from "../model/leaderboard";
import { HISTORY_RECENT } from "../model/score-history";
import type { HistoryPoint, SnakeGameState } from "../model/types";
import { ScorePops } from "./score-pops";

interface StatDef {
  /** Stable key + display label. */
  label: string;
  value: string;
  /** Small muted sub-label under the big number. */
  sub: string;
  accent?: boolean;
  /** True for the live SCORE cell — hosts the floating "+N" juice. */
  live?: boolean;
  /** True for a SERVER-backed number (BEST) — skeletoned while its query loads
   *  so it never flashes a misleading 0. */
  server?: boolean;
}

/** Columns 1–2: the big 46/700 numbers (Score, Best). */
function statsFor(state: SnakeGameState): StatDef[] {
  return [
    {
      label: "SCORE",
      value: formatScore(state.score),
      sub: "current run",
      accent: true,
      live: true,
    },
    {
      label: "BEST",
      value: formatScore(state.best),
      sub: "personal best",
      server: true,
    },
  ];
}

/**
 * Column 3: the score-per-game chart — the SAME {@link Sparkline} the profile
 * activity band uses, so the two bands read identically. x = the last
 * {@link HISTORY_RECENT} runs in play order, y = each run's final score; an
 * empty log renders a flat line (not a "no data" message), mirroring the
 * profile's empty-activity behaviour.
 *
 * Future expansion: this column is a self-contained boundary — wrapping it in a
 * button that opens an all-time-stats / bigger-chart view is a drop-in (the
 * series + cap already live in the store), no band restructuring needed.
 */
function ScoreHistoryChart({ history }: { history: HistoryPoint[] }) {
  return (
    <div>
      <Label>{`SCORES · LAST ${HISTORY_RECENT}`}</Label>
      <div className="mt-2">
        <Sparkline
          series={history}
          gradientId="snakeScoreSparkGrad"
          ariaLabel={`Score by game: ${history
            .map((h) => `${h.label} ${h.count}`)
            .join(", ")}`}
          showLabels={false}
        />
      </div>
    </div>
  );
}

/**
 * Score / Best / Recent-runs chart as our canonical stats band — identical
 * treatment to the profile + home `// KARMA / // TOTAL VIEWS / // ACTIVITY`
 * band (`src/app/[user]/user-page.tsx`): a full-bleed `--m-card` band, the
 * `mx-auto max-w-[1240px] gap-10 px-10 py-10 sm:grid-cols-3` grid, a `// EYEBROW`
 * {@link Label}, the documented 46/700 stat number (Space Grotesk, tabular-nums,
 * accent for the current run) and a small muted sub-label beneath. The 3rd
 * column drops Length for the score-per-game {@link Sparkline}.
 */
export function SnakeStatsBand({
  state,
  history,
  statsLoading = false,
}: {
  state: SnakeGameState;
  history: HistoryPoint[];
  /** Server best/rank still on first load → skeleton the BEST number (not 0). */
  statsLoading?: boolean;
}) {
  return (
    <section className="mx-[calc(50%-50vw)] w-screen bg-[var(--m-card)]">
      <div className="mx-auto grid max-w-[1240px] gap-10 px-10 py-10 sm:grid-cols-3">
        {statsFor(state).map((s) => (
          // `relative` so the live SCORE cell can anchor its floating "+N" pops
          // to the number without shifting the grid.
          <div key={s.label} className="relative">
            <Label>{s.label}</Label>
            {s.server && statsLoading ? (
              // The number's query hasn't returned its first value yet — show the
              // app's standard spinner (never a misleading 0) in the number's
              // footprint so the row doesn't jump.
              <div className="mt-2 flex h-[46px] items-center">
                <Spinner className="text-[26px] text-[var(--m-accent)]" />
              </div>
            ) : (
              // `relative inline-block` so it hugs the digits' VARIABLE width and
              // the live SCORE cell can anchor its "+N" pops to the number's RIGHT
              // edge (via `left-full` inside ScorePops) regardless of digit count,
              // with zero layout shift.
              <div className="relative mt-2 inline-block">
                <div
                  className="font-display text-[46px] leading-none font-bold tracking-[-0.02em] tabular-nums"
                  style={{
                    color: s.accent ? "var(--m-accent)" : "var(--m-fg)",
                  }}
                >
                  {s.value}
                </div>
                {/* Pops sit just RIGHT of the number, vertically centred on it.
                    Mount ONLY while a run is live: leaving "playing" unmounts it,
                    so a new run mounts a FRESH instance with `prevRef` re-seeded
                    to 0 — the restart's N→0 score reset never spawns a spurious
                    −N float, while in-play penalties (laugher/ears) still do. */}
                {s.live && state.screen === "playing" && (
                  <ScorePops score={state.score} />
                )}
              </div>
            )}
            <div className="mt-2 text-[12px] leading-none text-[var(--m-muted2)]">
              {s.sub}
            </div>
          </div>
        ))}
        <ScoreHistoryChart history={history} />
      </div>
    </section>
  );
}
