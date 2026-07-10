"use client";

import { useState } from "react";
import {
  BoardFullscreenButton,
  ControlsModal,
  CornerBrackets,
  FULLSCREEN_ROOT,
  GameOverOverlay,
  MenuOverlay,
  PauseOverlay,
  rankLine,
  useBoardFullscreen,
} from "@/features/arcade/shared";
import {
  SHORT_FUSE_ACTIONS,
  SHORT_FUSE_DEFAULT_GAMEPAD_BINDINGS,
  SHORT_FUSE_KEYBOARD_INFO,
} from "../model/gamepad-bindings";
import type { ShortFuseGameApi } from "../model/types";

/** The canvas play-field + its overlays (menu / pause / game-over). Pure
 *  presentation — the hook owns all logic; the board only renders `api`.
 *
 *  THEME-NATIVE (the Tetris pattern): NO forced `dark` scope — the board and
 *  overlays read the AMBIENT `--m-*` tokens, and the canvas palette is resolved
 *  from those same tokens in the hook. */
export function ShortFuseBoard({
  api,
  canRank = true,
}: {
  api: ShortFuseGameApi;
  /** False for a signed-out viewer — runs stay local, so no board/rank talk. */
  canRank?: boolean;
}) {
  const {
    state,
    canvasRef,
    start,
    padBindings,
    setPadBindings,
    setKeysSuspended,
  } = api;
  const {
    rootRef: fullscreenRootRef,
    isFullscreen,
    toggle: toggleFullscreen,
  } = useBoardFullscreen();

  const [controlsOpen, setControlsOpen] = useState(false);
  const openControls = () => {
    setControlsOpen(true);
    setKeysSuspended(true);
  };
  const closeControls = () => {
    setControlsOpen(false);
    setKeysSuspended(false);
  };

  const rankClause = rankLine(state.rank, canRank, "clear more levels");
  // Fullscreen toggle lives on the OVERLAY screens only (menu / pause — owner
  // call): never a floating control over live gameplay.
  const showFullscreenToggle =
    state.screen === "menu" || (state.screen === "playing" && state.paused);

  return (
    <div
      ref={fullscreenRootRef}
      className={`mono-scope relative flex aspect-[15/12] w-full items-center justify-center overflow-hidden bg-[var(--m-bg)] p-5 ${FULLSCREEN_ROOT}`}
    >
      {/* The canvas is JS-SIZED (inline px from the hook, contain-fit 5:4 (15:12, HUD row included) in
          the host's content box) — the CSS takes kept breaking (iOS % heights,
          then the absolute/aspect variant on desktop). The root just flex-
          centres whatever size the hook writes, fullscreen included. */}
      <canvas
        ref={canvasRef}
        aria-label="Short Fuse game board. Arrow keys or WASD to move, Space to drop a bomb, P to pause."
        role="img"
        className="block [image-rendering:pixelated]"
      />

      <CornerBrackets />

      {state.screen === "menu" && (
        <MenuOverlay
          title="Short Fuse"
          description="The lazy way through a wall is a bomb."
          onStart={start}
          extra={
            <>
              <div className="h-0.5 w-full bg-[var(--m-dim)]" aria-hidden />
              <button
                type="button"
                onClick={openControls}
                className="mono-focus text-[11px] leading-none font-medium tracking-[0.12em] text-[var(--m-muted2)] uppercase transition-colors hover:text-[var(--m-muted)]"
              >
                Controls
              </button>
            </>
          }
        />
      )}

      {state.screen === "playing" && state.paused && (
        <PauseOverlay hint="P to resume" />
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

      <ControlsModal
        isOpen={controlsOpen}
        onOpenChange={closeControls}
        actions={SHORT_FUSE_ACTIONS}
        keyboardValue={SHORT_FUSE_KEYBOARD_INFO}
        padValue={padBindings}
        padDefaults={SHORT_FUSE_DEFAULT_GAMEPAD_BINDINGS}
        onPadChange={setPadBindings}
      />
    </div>
  );
}
