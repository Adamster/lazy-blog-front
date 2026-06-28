"use client";

import { ProtectedRoute } from "@/entities/session";
import {
  ArcadeHeader,
  SnakeBoard,
  SnakeLeaderboard,
  SnakeStatsBand,
  useSnakeArcade,
} from "@/features/arcade/snake";

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

  return (
    <div
      className="mono-scope min-h-app mx-[calc(50%-50vw)] w-screen bg-[var(--m-bg)] text-[var(--m-fg)]"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      <main className="mx-auto max-w-[1240px] px-10 pb-10">
        <div className="pt-10">
          <ArcadeHeader />
        </div>

        <div className="mt-10">
          <SnakeStatsBand
            state={game.state}
            history={game.history}
            statsLoading={statsLoading}
          />
        </div>

        <div className="mt-10 grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <SnakeBoard api={game} />
          <SnakeLeaderboard board={board} loading={boardLoading} />
        </div>
      </main>
    </div>
  );
}
