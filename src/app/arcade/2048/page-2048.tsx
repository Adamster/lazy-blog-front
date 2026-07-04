"use client";

import {
  Board2048,
  HISTORY_RECENT,
  Leaderboard2048,
  use2048Arcade,
} from "@/features/arcade/2048";
import {
  BOARD_GRID_RAIL,
  BoardSignInTeaser,
  StatsBand,
} from "@/features/arcade/shared";

// Public — signed-out play is local-only (the arcade hook gates submit/stats on auth).
export default function Page2048() {
  const { game, board, statsLoading, boardLoading, showBoard } =
    use2048Arcade();
  const { state } = game;

  return (
    <div
      className="mono-scope min-h-app mx-[calc(50%-50vw)] w-screen bg-[var(--m-bg)] text-[var(--m-fg)]"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      <main className="mx-auto max-w-[1240px] px-5 pb-10 sm:px-10">
        <StatsBand
          score={state.score}
          best={state.best}
          statsLoading={statsLoading}
          history={game.history}
          historyWindow={HISTORY_RECENT}
          gradientId="score2048SparkGrad"
        />

        <div className={BOARD_GRID_RAIL}>
          <div>
            <Board2048 api={game} canRank={showBoard} />
          </div>
          {showBoard ? (
            <Leaderboard2048 board={board} loading={boardLoading} />
          ) : (
            <BoardSignInTeaser />
          )}
        </div>
      </main>
    </div>
  );
}
