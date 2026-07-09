"use client";

import {
  BoardFullscreenButton,
  CornerBrackets,
  FULLSCREEN_ROOT,
  GameOverOverlay,
  MenuOverlay,
  PauseOverlay,
  rankLine,
  useBoardFullscreen,
} from "@/features/arcade/shared";
import type { SnakeClassicGameApi } from "../model/types";

/** The canvas play-field + its overlays (menu / pause / game-over). Pure
 *  presentation — the hook owns all logic; the board only renders `api`.
 *
 *  THEME-NATIVE (the Tetris pattern): NO forced `dark` scope — the board and
 *  overlays read the AMBIENT `--m-*` tokens, and the canvas palette is resolved
 *  from those same tokens in the hook. */
export function SnakeClassicBoard({
  api,
  canRank = true,
}: {
  api: SnakeClassicGameApi;
  /** False for a signed-out viewer — runs stay local, so no board/rank talk. */
  canRank?: boolean;
}) {
  const { state, canvasRef, start } = api;
  const {
    rootRef: fullscreenRootRef,
    isFullscreen,
    toggle: toggleFullscreen,
  } = useBoardFullscreen();

  const rankClause = rankLine(state.rank, canRank, "eat more, grow longer");
  // Fullscreen toggle lives on the OVERLAY screens only (menu / pause — owner
  // call): never a floating control over live gameplay.
  const showFullscreenToggle =
    state.screen === "menu" || (state.screen === "playing" && state.paused);

  return (
    <div
      ref={fullscreenRootRef}
      className={`mono-scope relative flex aspect-[30/18] w-full items-center justify-center overflow-hidden bg-[var(--m-bg)] p-5 ${FULLSCREEN_ROOT}`}
    >
      {/* The canvas is JS-SIZED (inline px from the hook, contain-fit 5:3 in
          the host's content box) — the CSS takes kept breaking (iOS % heights,
          then the absolute/aspect variant on desktop). The root just flex-
          centres whatever size the hook writes, fullscreen included. */}
      <canvas
        ref={canvasRef}
        aria-label="Classic Snake game board. Use the arrow keys to steer, Space to pause. Walls are lethal."
        role="img"
        className="block [image-rendering:pixelated]"
      />

      <CornerBrackets />

      {state.screen === "menu" && (
        <MenuOverlay
          title="Snake"
          description="The classic. You, your tail, and bad decisions."
          onStart={start}
        />
      )}

      {state.screen === "playing" && state.paused && (
        <PauseOverlay hint="Space to resume" />
      )}

      {state.screen === "over" && (
        <GameOverOverlay
          isNewBest={state.isNewBest}
          score={state.score}
          detail={rankClause}
          onRestart={start}
        />
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
