"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/entities/session";
import { useTheme } from "@/shared/providers/theme-providers";
import { GlitchText } from "@/shared/ui";
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
 * Easter egg: the white rabbit lives in the matrix — the ONLY proper way into
 * the arcade is the neo theme (that's the only theme the header rabbit shows in).
 * So if you're here in ANY other theme — whether you opened the URL directly OR
 * switched away from neo while playing — you're "not the One" and the page
 * glitches into the reject screen until you (re)enter neo. Returns whether to
 * show it.
 *
 * The verdict reads the `html.neo` class (set pre-paint, authoritative) alongside
 * the provider theme, and starts "unknown" (→ no reject), so a neo visitor never
 * flashes the reject screen during the provider's first-paint theme settle.
 */
function useRejectedFromMatrix(): boolean {
  const { theme } = useTheme();
  const [verdict, setVerdict] = useState<"unknown" | "in" | "out">("unknown");

  useEffect(() => {
    const inMatrix =
      theme === "neo" || document.documentElement.classList.contains("neo");
    // Defer the state flip out of the effect body (repo rule: no synchronous
    // setState inside an effect) — rAF settles it on the next frame.
    const id = requestAnimationFrame(() => setVerdict(inMatrix ? "in" : "out"));
    return () => cancelAnimationFrame(id);
  }, [theme]);

  return verdict === "out";
}

/**
 * The reject screen — a full-width glitch overlay shown when the player is on the
 * arcade in a non-neo theme. Sits BELOW the header (`top-[var(--m-header-h)]`) so
 * the header bar stays visible, and at a z UNDER the header's own stacking context
 * so the open burger DROPDOWN renders ON TOP of it (you can still flip back to
 * neo from the menu). The game stays mounted under it (the canvas never
 * re-attaches); switching back to neo clears it.
 */
function NotTheOne() {
  return (
    <div
      className="mono-scope fixed inset-x-0 top-[var(--m-header-h)] bottom-0 z-[calc(var(--m-z-header)_-_1)] flex flex-col justify-center overflow-y-auto bg-[var(--m-bg)] px-10 py-14 text-[var(--m-fg)]"
      style={{ fontFamily: "var(--font-mono)" }}
      role="alertdialog"
      aria-label="Access denied"
    >
      <div className="mx-auto w-full max-w-[640px]">
        <div className="mb-6 flex items-center gap-2.5 text-[11px] leading-none tracking-[0.12em] text-[var(--m-error)]">
          <span
            aria-hidden="true"
            className="inline-block size-2 bg-[var(--m-error)]"
          />
          ACCESS DENIED
        </div>

        <h1 className="font-display text-[32px] leading-[1.04] font-bold tracking-[-0.02em] text-[var(--m-fg)] md:text-[40px]">
          <GlitchText caret>You are not the One</GlitchText>
        </h1>

        <p className="mt-4 text-[14px] leading-[1.6] text-[var(--m-muted)]">
          {"The system doesn't recognize you. Honestly, neither do we."}
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className={`mono-cta mono-focus inline-flex h-9 items-center justify-center px-4 text-[14px] font-bold tracking-[0.06em]`}
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * The arcade itself: title block (eyebrow + title + full-width lead) → the stats
 * band (Score / Best / recent-runs chart in our profile/home stats-band format)
 * → the two-pane stage: the board on the LEFT, the `// HIGH SCORES` leaderboard
 * rail on the RIGHT, balanced on the 1240 grid. Being on the arcade in any
 * non-neo theme raises the {@link NotTheOne} reject overlay (easter egg).
 */
function SnakeArcade() {
  const rejected = useRejectedFromMatrix();
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

        {/* Stats band — full-bleed, matches the profile/home stats band. */}
        <div className="mt-10">
          <SnakeStatsBand
            state={game.state}
            history={game.history}
            statsLoading={statsLoading}
          />
        </div>

        {/* Stage — board (left, fills the column) + leaderboard (right), a clean
            40px gap (no trailing cap) between them. */}
        <div className="mt-10 grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <SnakeBoard api={game} />
          <SnakeLeaderboard board={board} loading={boardLoading} />
        </div>
      </main>

      {rejected && <NotTheOne />}
    </div>
  );
}
