"use client";

import {
  BoardFullscreenButton,
  BoardPauseButton,
  CornerBrackets,
  FULLSCREEN_ROOT,
  FULLSCREEN_STAGE,
  GameOverOverlay,
  MenuOverlay,
  PanelLabel,
  PanelReadout,
  PauseOverlay,
  rankLine,
  useBoardFullscreen,
} from "@/features/arcade/shared";
import type { TetrisGameApi } from "../model/types";

/** Control reference — shown in the menu overlay (the classic "key-hint line"). */
const KEY_HINTS: [string, string][] = [
  ["MOVE", "← →  /  A D"],
  ["ROTATE", "↑ / X  ·  Z"],
  ["SOFT DROP", "↓ / S"],
  ["PAUSE", "SPACE"],
];

/**
 * The CLASSIC TETRIS play surface — the DPR-crisp 10×20 well canvas (solid cells +
 * 1px grid), centered, + the compact NEXT preview beside it + the DOM overlays
 * (menu / pause / game-over). Run stats (SCORE / LINES / LEVEL) live in the top
 * stats band, not beside the game. Pure presentation: the hook owns all logic and
 * the engine draws both canvases imperatively; this only renders `api`.
 *
 * THEME-NATIVE: NO forced `dark` scope — the board, HUD and overlays read the
 * AMBIENT `--m-*` tokens, and the canvas palette is resolved from those same
 * tokens in the hook.
 */
export function TetrisBoard({
  api,
  canRank = true,
}: {
  api: TetrisGameApi;
  /** False for a signed-out viewer — runs stay local, so no board/rank talk. */
  canRank?: boolean;
}) {
  const { canvasRef, nextCanvasRef, panelRef, start, state, togglePause } = api;
  const {
    rootRef: fullscreenRootRef,
    isFullscreen,
    toggle: toggleFullscreen,
  } = useBoardFullscreen();

  const rankClause = rankLine(state.rank, canRank, "clear more lines");
  // Fullscreen toggle lives on the OVERLAY screens only (menu / pause — owner
  // call): never a floating control over live gameplay.
  const showFullscreenToggle =
    state.screen === "menu" || (state.screen === "playing" && state.paused);

  // The play surface is BARE (owner call: no `--m-card` band, no inner padding) —
  // the bordered well IS the stage, full height of the board footprint; the menu /
  // pause / over scrims carry their own `--m-card`/40 veil.
  return (
    <div
      ref={fullscreenRootRef}
      className={`mono-scope relative w-full overflow-hidden ${FULLSCREEN_ROOT}`}
    >
      {/* Well ↔ NEXT-panel gap = 40px (`gap-10`, owner pick after the label was
            dropped) — a layout-column separation on the 4px grid. */}
      {/* aspect-[30/18] = the snake boards' footprint, so every arcade board
            renders the same height at the same column width. */}
      {/* p-5 pulls the canvas in from the CornerBrackets (the frame reads as a
            stage around it) and centres the height-fit well in the footprint —
            40 read too far (the game shrank noticeably); 20 is the owner pick. */}
      {/* min-h-0 is LOAD-BEARING for the fullscreen round-trip: aspect-ratio
            boxes get a content-based automatic minimum height, so after exiting
            fullscreen the still-large canvas would prop the stage open forever. */}
      <div
        className={`flex aspect-[30/18] min-h-0 w-full items-stretch justify-center gap-5 p-5 sm:gap-10 ${FULLSCREEN_STAGE}`}
      >
        {/* Invisible w-20 mirror of the readout panel (the Stay Awake pattern):
            with equal flanks the well sits dead-centre and the well→stats
            inset matches Stay Awake's. DESKTOP-ONLY — on a phone (esp.
            portrait fullscreen) it pushed the readout column off-screen. */}
        <div className="hidden w-20 shrink-0 sm:block" />
        {/* The well: JS-sized to an EXACT 10×20 cell multiple (no leftover strip);
              `h-full`/aspect are only the pre-hydration fallback — inline w/h override
              them. `self-center` centres it if the height-fit leaves side margin. */}
        <canvas
          ref={canvasRef}
          aria-label="Tetris well. Arrow keys or A/D to move, Up or X to rotate, Down to soft drop."
          role="img"
          className="block [aspect-ratio:1/2] h-full touch-none self-center border-2 border-[var(--m-dim)]"
        />

        {/* Beside the well: the NEXT preview + the run readouts (owner call
            2026-07-04 — Score/Lines/Level joined the board so FULLSCREEN shows
            them; the top stats band is outside the fullscreen element). NEXT
            gained its label and lost the border (owner call — it reads as one
            more readout in the column, not a boxed widget); its cells track
            the well's at NEXT_CELL_SCALE — the hook sizes the canvas to
            NEXT_COLS·cell·scale; `size-12` is only the pre-hydration fallback.
            Fixed w-20: growing score digits never change the panel width and
            re-size the well mid-run. */}
        <div
          ref={panelRef}
          className="flex w-20 shrink-0 flex-col items-center gap-6 self-center"
        >
          <div className="flex flex-col items-center gap-2">
            <PanelLabel>NEXT</PanelLabel>
            <canvas
              ref={nextCanvasRef}
              aria-label="Next piece"
              role="img"
              className="block h-6 w-12"
            />
          </div>
          <PanelReadout label="SCORE" value={state.score} />
          <PanelReadout label="LINES" value={state.lines} />
          <PanelReadout label="LEVEL" value={state.level} />
        </div>
      </div>

      <CornerBrackets />

      {state.screen === "menu" && (
        <MenuOverlay title="Tetris" onStart={start} hints={KEY_HINTS} />
      )}

      {state.screen === "playing" && state.paused && (
        <PauseOverlay hint="Space to resume" />
      )}

      {state.screen === "over" && (
        <GameOverOverlay
          isNewBest={state.isNewBest}
          score={state.score}
          detail={`${state.lines} lines · level ${state.level} · ${rankClause}`}
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
