"use client";

import {
  HISTORY_RECENT,
  StayAwakeBoard,
  StayAwakeLeaderboard,
  useStayAwakeArcade,
} from "@/features/arcade/stay-awake";
import {
  BOARD_GRID_RAIL,
  BoardEyebrow,
  BoardSignInTeaser,
  StatsBand,
} from "@/features/arcade/shared";

// Public — signed-out play is local-only (the arcade hook gates submit/stats on auth).
export default function StayAwakePage() {
  const { game, board, statsLoading, boardLoading, showBoard } =
    useStayAwakeArcade();
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
          gradientId="stayAwakeScoreSparkGrad"
        />

        <div className={BOARD_GRID_RAIL}>
          <div>
            <BoardEyebrow
              stats={[
                { label: "Alt", value: state.altitude },
                { label: "Coffee", value: state.coffees },
              ]}
            />
            <StayAwakeBoard api={game} canRank={showBoard} />
          </div>
          {showBoard ? (
            <StayAwakeLeaderboard board={board} loading={boardLoading} />
          ) : (
            <BoardSignInTeaser />
          )}
        </div>
      </main>
    </div>
  );
}
