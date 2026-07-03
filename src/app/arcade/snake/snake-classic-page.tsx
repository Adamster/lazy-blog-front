"use client";

import { ProtectedRoute } from "@/entities/session";
import {
  HISTORY_RECENT,
  SnakeClassicBoard,
  SnakeClassicLeaderboard,
  useSnakeClassicArcade,
} from "@/features/arcade/snake-classic";
import { BoardEyebrow, StatsBand } from "@/features/arcade/shared";

// Login-only — scores persist per user, so the whole page sits behind ProtectedRoute.
export default function SnakeClassicPage() {
  return (
    <ProtectedRoute>
      <SnakeClassicArcade />
    </ProtectedRoute>
  );
}

function SnakeClassicArcade() {
  const { game, board, statsLoading, boardLoading } = useSnakeClassicArcade();
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
          gradientId="snakeClassicScoreSparkGrad"
        />

        <div className="mt-10 grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <BoardEyebrow stats={[{ label: "Eaten", value: state.eaten }]} />
            <SnakeClassicBoard api={game} />
          </div>
          <SnakeClassicLeaderboard board={board} loading={boardLoading} />
        </div>
      </main>
    </div>
  );
}
