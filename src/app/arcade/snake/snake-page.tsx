"use client";

import { ProtectedRoute } from "@/entities/session";
import {
  ArcadeHeader,
  SnakeBoard,
  SnakeLeaderboard,
  SnakeStatsBand,
  useSnakeArcade,
} from "@/features/arcade/snake";

/**
 * Snake Arcade route — LOGIN-ONLY (scores persist per user + the global high
 * score is per-account), so the whole page sits behind {@link ProtectedRoute};
 * the game engine hook only mounts once the viewer is known authenticated.
 */
export default function SnakePage() {
  return (
    <ProtectedRoute>
      <SnakeArcade />
    </ProtectedRoute>
  );
}

/**
 * The arcade itself: title block (eyebrow + SNAKE + full-width lead) → the stats
 * band (Score / Best / recent-runs chart in our profile/home stats-band format)
 * → the two-pane stage: the board on the LEFT, the `// HIGH SCORES` leaderboard
 * rail on the RIGHT, balanced on the 1240 grid.
 */
function SnakeArcade() {
  const { game } = useSnakeArcade();

  return (
    <div
      className="mono-scope min-h-app mx-[calc(50%-50vw)] w-screen bg-[var(--m-bg)] text-[var(--m-fg)]"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      <main className="mx-auto max-w-[1240px] px-10 pb-10">
        <div className="pt-10">
          <ArcadeHeader />
        </div>

        {/* Stats band — full-bleed, matches the profile/home stats band. */}
        <div className="mt-10">
          <SnakeStatsBand state={game.state} history={game.history} />
        </div>

        {/* Stage — board (left, fills the column) + leaderboard (right), a clean
            40px gap (no trailing cap) between them. */}
        <div className="mt-10 grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <SnakeBoard api={game} />
          <SnakeLeaderboard board={game.board} />
        </div>
      </main>
    </div>
  );
}
