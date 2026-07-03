"use client";

import { ProtectedRoute } from "@/entities/session";
import {
  HISTORY_RECENT,
  ScorePops,
  SnakeBoard,
  SnakeLeaderboard,
  useSnakeArcade,
} from "@/features/arcade/snake";
import { BoardEyebrow, StatsBand } from "@/features/arcade/shared";

// Login-only — scores persist per user, so the whole page sits behind ProtectedRoute.
export default function SnakePage() {
  return (
    <ProtectedRoute>
      <SnakeArcade />
    </ProtectedRoute>
  );
}

function SnakeArcade() {
  const { game, board, statsLoading, boardLoading } = useSnakeArcade();
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
          gradientId="snakeScoreSparkGrad"
          scoreExtra={
            state.screen === "playing" ? (
              <ScorePops score={state.score} />
            ) : null
          }
        />

        <div className="mt-10 grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <BoardEyebrow
              stats={[
                { label: "Caught", value: state.eatenPositive },
                { label: "Penalties", value: state.eatenNegative },
              ]}
            />
            <SnakeBoard api={game} />
          </div>
          <SnakeLeaderboard board={board} loading={boardLoading} />
        </div>
      </main>
    </div>
  );
}
