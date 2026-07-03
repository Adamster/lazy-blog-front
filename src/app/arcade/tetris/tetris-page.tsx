"use client";

import { ProtectedRoute } from "@/entities/session";
import {
  HISTORY_RECENT,
  TetrisBoard,
  TetrisLeaderboard,
  useTetrisArcade,
} from "@/features/arcade/tetris";
import { BoardEyebrow, StatsBand } from "@/features/arcade/shared";

// Login-only — scores persist per user, so the whole page sits behind ProtectedRoute
// (same as the Snake arcade).
export default function TetrisPage() {
  return (
    <ProtectedRoute>
      <TetrisArcade />
    </ProtectedRoute>
  );
}

function TetrisArcade() {
  const { game, board, statsLoading, boardLoading } = useTetrisArcade();
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
          gradientId="tetrisScoreSparkGrad"
        />

        <div className="mt-10 grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <BoardEyebrow
              stats={[
                { label: "Lines", value: state.lines },
                { label: "Level", value: state.level },
              ]}
            />
            <TetrisBoard api={game} />
          </div>
          <TetrisLeaderboard board={board} loading={boardLoading} />
        </div>
      </main>
    </div>
  );
}
