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
  BoardEyebrow,
  BoardSignInTeaser,
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

        <div className={BOARD_GRID_RAIL}>
          <div>
            <BoardEyebrow
              stats={[
                { label: "Caught", value: state.eatenPositive },
                { label: "Penalties", value: state.eatenNegative },
              ]}
            />
            <SnakeBoard api={game} canRank={showBoard} />
          </div>
          {showBoard ? (
            <SnakeLeaderboard board={board} loading={boardLoading} />
          ) : (
            <BoardSignInTeaser />
          )}
        </div>
      </main>
    </div>
  );
}
