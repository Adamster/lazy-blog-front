"use client";

import { Label, Spinner, Sparkline } from "@/shared/ui";
import { formatScore } from "../model/leaderboard";
import { HISTORY_RECENT } from "../model/score-history";
import type { HistoryPoint, SnakeGameState } from "../model/types";
import { ScorePops } from "./score-pops";

interface StatDef {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
  /** The live SCORE cell — hosts the floating "+N" juice. */
  live?: boolean;
  /** Server-backed (BEST) — skeletoned while its query loads so it never flashes a misleading 0. */
  server?: boolean;
}

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

/** Column 3: score-per-game chart — the same {@link Sparkline} as the profile
 *  band; an empty log renders a flat line, not a "no data" message. */
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

/** Score / Best / Recent-runs as the canonical stats band — same treatment as the
 *  profile/home stat band; column 3 is the score-per-game {@link Sparkline}. */
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
          // `relative` so the live SCORE cell can anchor its "+N" pops without shifting the grid.
          <div key={s.label} className="relative">
            <Label>{s.label}</Label>
            {s.server && statsLoading ? (
              // Query not returned yet — spinner in the number's footprint (never a misleading 0).
              <div className="mt-2 flex h-[46px] items-center">
                <Spinner className="text-[26px] text-[var(--m-accent)]" />
              </div>
            ) : (
              // `relative inline-block` hugs the variable digit width so ScorePops
              // anchors to the number's RIGHT edge (`left-full`), zero layout shift.
              <div className="relative mt-2 inline-block">
                <div
                  className="font-display text-[46px] leading-none font-bold tracking-[-0.02em] tabular-nums"
                  style={{
                    color: s.accent ? "var(--m-accent)" : "var(--m-fg)",
                  }}
                >
                  {s.value}
                </div>
                {/* Mount ONLY while live so a new run re-seeds prevRef to 0 — no spurious −N on restart. */}
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
