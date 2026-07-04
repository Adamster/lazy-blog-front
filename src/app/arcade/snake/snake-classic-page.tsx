"use client";

import {
  HISTORY_RECENT,
  SnakeClassicBoard,
  SnakeClassicLeaderboard,
  useSnakeClassicArcade,
} from "@/features/arcade/snake-classic";
import {
  BOARD_GRID_RAIL,
  BoardUnsupported,
  BoardSignInTeaser,
  StatsBand,
} from "@/features/arcade/shared";

// Public — signed-out play is local-only (the arcade hook gates submit/stats on auth).
export default function SnakeClassicPage() {
  const { game, board, statsLoading, boardLoading, showBoard } =
    useSnakeClassicArcade();
  const { state } = game;

  return (
    <div
      className="mono-scope min-h-app mx-[calc(50%-50vw)] w-screen bg-[var(--m-bg)] text-[var(--m-fg)]"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      <main className="mx-auto max-w-[1240px] px-5 pb-10 sm:px-10">
        {/* The game (stats + board) is DESKTOP-ONLY (owner call): touch and
            small screens get the notice + the high-score rail instead. */}
        <div className="desktop-game-only">
          <StatsBand
            score={state.score}
            best={state.best}
            statsLoading={statsLoading}
            history={game.history}
            historyWindow={HISTORY_RECENT}
            gradientId="snakeClassicScoreSparkGrad"
          />
        </div>

        <div className={BOARD_GRID_RAIL}>
          <div>
            <div className="desktop-game-only">
              <SnakeClassicBoard api={game} canRank={showBoard} />
            </div>
            <BoardUnsupported />
          </div>
          {showBoard ? (
            <SnakeClassicLeaderboard board={board} loading={boardLoading} />
          ) : (
            <BoardSignInTeaser />
          )}
        </div>
      </main>
    </div>
  );
}
