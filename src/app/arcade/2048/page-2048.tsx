"use client";

import { ProtectedRoute } from "@/entities/session";
import {
  Board2048,
  HISTORY_RECENT,
  Leaderboard2048,
  use2048Arcade,
} from "@/features/arcade/2048";
import { BoardEyebrow, StatsBand } from "@/features/arcade/shared";

// Login-only — scores persist per user, so the whole page sits behind ProtectedRoute
// (same as the Tetris arcade).
export default function Page2048() {
  return (
    <ProtectedRoute>
      <Arcade2048 />
    </ProtectedRoute>
  );
}

function Arcade2048() {
  const { game, board, statsLoading, boardLoading } = use2048Arcade();
  const { state } = game;

  return (
    <div
      className="mono-scope min-h-app mx-[calc(50%-50vw)] w-screen bg-[var(--m-bg)] text-[var(--m-fg)]"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      <main className="mx-auto max-w-[1240px] px-10 pb-10">
        <StatsBand
          score={state.score}
          best={state.best}
          statsLoading={statsLoading}
          history={game.history}
          historyWindow={HISTORY_RECENT}
          gradientId="score2048SparkGrad"
        />

        <div className="mt-10 grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <BoardEyebrow stats={[{ label: "Moves", value: state.moves }]} />
            <Board2048 api={game} />
          </div>
          <Leaderboard2048 board={board} loading={boardLoading} />
        </div>
      </main>
    </div>
  );
}
