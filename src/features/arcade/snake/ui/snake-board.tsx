"use client";

import {
  BoardFullscreenButton,
  BoardPauseButton,
  CornerBrackets,
  FULLSCREEN_ROOT,
  GameOverOverlay,
  MenuOverlay,
  PauseOverlay,
  rankLine,
  useBoardFullscreen,
} from "@/features/arcade/shared";
import { prefersReducedMotion } from "@/shared/lib/prefers-reduced-motion";
import { useTheme } from "@/shared/ui/theme";
import type { SnakeGameApi } from "../model/types";
import { Confetti } from "./confetti";

/** Control reference — shown in the menu overlay. */
const KEY_HINTS: [string, string][] = [
  ["STEER", "↑ ↓ ← →  ·  W A S D"],
  ["SWIPE", "swipe the board to steer"],
  ["PAUSE", "SPACE"],
];

/** The canvas play-field + its overlays (menu / pause / game-over). Pure
 *  presentation — the hook owns all logic; the board only renders `api`.
 *
 *  THEME-NATIVE (the classic-Snake/Tetris pattern): NO forced `dark` scope — the
 *  board and overlays read the AMBIENT `--m-*` tokens, and the canvas palette is
 *  resolved from those same tokens in the hook. */
export function SnakeBoard({
  api,
  canRank = true,
}: {
  api: SnakeGameApi;
  /** False for a signed-out viewer — runs stay local, so no board/rank talk. */
  canRank?: boolean;
}) {
  const { state, canvasRef, start, togglePause } = api;
  const {
    rootRef: fullscreenRootRef,
    isFullscreen,
    toggle: toggleFullscreen,
  } = useBoardFullscreen();
  const reduce = prefersReducedMotion();
  // Fullscreen toggle lives on the OVERLAY screens only (menu / pause — owner
  // call): never a floating control over live gameplay.
  const showFullscreenToggle =
    state.screen === "menu" || (state.screen === "playing" && state.paused);
  // The prize rabbit is `--m-fg`-tinted — white on the dark field, ink on light —
  // so the menu title names the rabbit the player actually sees.
  const { isDarkTheme } = useTheme();
  const menuTitle = isDarkTheme
    ? "Follow the White Rabbit"
    : "Follow the Black Rabbit";

  const rankClause = rankLine(state.rank, canRank, "eat more, grow longer");

  return (
    <div
      ref={fullscreenRootRef}
      className={`mono-scope relative flex aspect-[18/30] w-full items-center justify-center overflow-hidden bg-[var(--m-bg)] p-5 sm:aspect-[30/18] ${FULLSCREEN_ROOT}`}
    >
      {/* The canvas is JS-SIZED (inline px from the hook, contain-fit 5:3 in
          the host's content box) — the CSS takes kept breaking (iOS % heights,
          then the absolute/aspect variant on desktop). The root just flex-
          centres whatever size the hook writes, fullscreen included. */}
      {/* border-2 --m-error: ALL four walls are lethal (the stay-awake wall
          language) — the tunnel-wrap was cut, so the frame reads as danger. */}
      <canvas
        ref={canvasRef}
        aria-label="Snake game board. Use the arrow keys to steer, Space to pause. Walls are lethal."
        role="img"
        className="block touch-none border-2 border-[var(--m-error)] [image-rendering:pixelated]"
      />

      <CornerBrackets />

      {state.screen === "menu" && (
        <MenuOverlay title={menuTitle} onStart={start} hints={KEY_HINTS} />
      )}

      {state.screen === "playing" && state.paused && (
        <PauseOverlay hint="Space to resume" />
      )}

      {state.screen === "over" && state.isNewBest && !reduce && <Confetti />}

      {state.screen === "over" && (
        <GameOverOverlay
          isNewBest={state.isNewBest}
          score={state.score}
          detail={rankClause}
          onRestart={start}
        />
      )}

      {state.screen === "playing" && (
        <BoardPauseButton paused={state.paused} onToggle={togglePause} />
      )}

      {showFullscreenToggle && (
        <BoardFullscreenButton
          isFullscreen={isFullscreen}
          onToggle={toggleFullscreen}
        />
      )}
    </div>
  );
}
