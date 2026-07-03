"use client";

import {
  HISTORY_RECENT,
  SnakeClassicBoard,
  SnakeClassicLeaderboard,
  useSnakeClassicArcade,
} from "@/features/arcade/snake-classic";
import {
  BOARD_GRID_RAIL,
  BoardEyebrow,
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
      <main className="mx-auto max-w-[1240px] px-10 pb-10">
        <StatsBand
          score={state.score}
          best={state.best}
          statsLoading={statsLoading}
          history={game.history}
          historyWindow={HISTORY_RECENT}
          gradientId="snakeClassicScoreSparkGrad"
        />

        <div className={BOARD_GRID_RAIL}>
          <div>
            <BoardEyebrow stats={[{ label: "Eaten", value: state.eaten }]} />
            <SnakeClassicBoard api={game} canRank={showBoard} />
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
