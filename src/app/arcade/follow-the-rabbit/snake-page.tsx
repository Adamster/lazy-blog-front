"use client";

import {
  HISTORY_RECENT,
  ScorePops,
  SnakeBoard,
  SnakeLeaderboard,
  useSnakeArcade,
} from "@/features/arcade/snake";
import {
  BOARD_GRID_RAIL,
  BoardUnsupported,
  StatsBand,
} from "@/features/arcade/shared";

// Public — signed-out play is local-only (the arcade hook gates submit/stats on auth).
export default function SnakePage() {
  const { game, board, statsLoading, boardLoading, showBoard } =
    useSnakeArcade();
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
            gradientId="snakeScoreSparkGrad"
            scoreExtra={
              state.screen === "playing" ? (
                <ScorePops score={state.score} />
              ) : null
            }
          />
        </div>

        <div className={BOARD_GRID_RAIL}>
          <div>
            <div className="desktop-game-only">
              <SnakeBoard api={game} canRank={showBoard} />
            </div>
            <BoardUnsupported />
          </div>
          <SnakeLeaderboard board={board} loading={boardLoading} />
        </div>
      </main>
    </div>
  );
}
