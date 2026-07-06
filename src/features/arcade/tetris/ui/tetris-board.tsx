"use client";

import { useState } from "react";
import {
  bindingLabel,
  BoardFullscreenButton,
  ControlsModal,
  CornerBrackets,
  FULLSCREEN_ROOT,
  FULLSCREEN_STAGE,
  GameOverOverlay,
  keyLabel,
  MenuOverlay,
  PanelLabel,
  PanelReadout,
  PauseOverlay,
  rankLine,
  useBoardFullscreen,
} from "@/features/arcade/shared";
import { TETRIS_ACTIONS, TETRIS_DEFAULT_BINDINGS } from "../model/bindings";
import { TETRIS_DEFAULT_GAMEPAD_BINDINGS } from "../model/gamepad-bindings";
import type { TetrisGameApi } from "../model/types";

/**
 * The CLASSIC TETRIS play surface — the DPR-crisp 10×20 well canvas (solid cells +
 * 1px grid), centered, with the compact HOLD preview to its left and the NEXT
 * preview beside it on the right + the DOM overlays (menu / pause / game-over).
 * Run stats (SCORE / LINES / LEVEL) live in the top stats band, not beside the
 * game. Pure presentation: the hook owns all logic and the engine draws all
 * three canvases imperatively; this only renders `api`.
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
  const { canvasRef, nextCanvasRef, holdCanvasRef, panelRef, start, state } =
    api;
  const {
    rootRef: fullscreenRootRef,
    isFullscreen,
    toggle: toggleFullscreen,
  } = useBoardFullscreen();

  const [controlsOpen, setControlsOpen] = useState(false);
  const openControls = () => {
    setControlsOpen(true);
    api.setKeysSuspended(true);
  };
  const closeControls = () => {
    setControlsOpen(false);
    api.setKeysSuspended(false);
  };

  const b = api.bindings;

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
      {/* Well ↔ side-panel gap = 40px (`gap-10`, owner pick after the label was
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
        {/* HOLD preview, left of the well (conventional Tetris layout — guideline
            games put HOLD left / NEXT right). DESKTOP-ONLY, matching the spacer it
            replaces: on a phone (esp. portrait fullscreen) there's no room for a
            left column. */}
        <div className="hidden w-20 shrink-0 flex-col items-center gap-2 self-center sm:flex">
          <PanelLabel>HOLD</PanelLabel>
          <canvas
            ref={holdCanvasRef}
            aria-label="Hold piece"
            role="img"
            className="block h-6 w-12"
          />
        </div>
        {/* The well: JS-sized to an EXACT 10×20 cell multiple (no leftover strip);
              `h-full`/aspect are only the pre-hydration fallback — inline w/h override
              them. `self-center` centres it if the height-fit leaves side margin. */}
        <canvas
          ref={canvasRef}
          aria-label={`Tetris well. ${bindingLabel(b.moveLeft)} and ${bindingLabel(
            b.moveRight
          )} to move, ${bindingLabel(b.rotateCW)} to rotate, ${bindingLabel(
            b.hardDrop
          )} to hard drop.`}
          role="img"
          className="block [aspect-ratio:1/2] h-full self-center border-2 border-[var(--m-dim)]"
        />

        {/* Beside the well: the NEXT preview + the run readouts (owner call
            2026-07-04 — Score/Lines/Level joined the board so FULLSCREEN shows
            them; the top stats band is outside the fullscreen element). NEXT
            kept its label and border-less look (owner call — it reads as one
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

      {/* Transient clear-event caption ("TETRIS", "B2B · T-SPIN DOUBLE") — a
          floating top-center toast over the stage (owner call: the bottom of
          the readout column read too faint). Absolutely positioned so it never
          reflows the panel; pointer-events-none, bg chip keeps it legible over
          the spawn rows. */}
      {state.eventLabel && (
        <div
          aria-live="polite"
          className="pointer-events-none absolute inset-x-0 top-5 z-[1] flex justify-center"
        >
          <span className="bg-[var(--m-bg)]/80 px-2 py-1 text-center text-[11px] leading-[1.2] font-medium tracking-[0.12em] text-[var(--m-accent)] uppercase">
            {state.eventLabel}
          </span>
        </div>
      )}

      <CornerBrackets />

      {state.screen === "menu" && (
        <MenuOverlay
          title="Tetris"
          onStart={start}
          extra={
            <>
              {/* Quiet 2px `--m-dim` rule (the codebase's one horizontal-rule
                  convention — composer/tab-nav connectors, auth `// OR`) that
                  spans the rail's content column, binding the Controls link into
                  a "secondary utility footer" instead of floating in empty space.
                  As direct rail children the rule + link inherit OverlayRail's own
                  16/24 rhythm — no re-spelled gap. */}
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
        <PauseOverlay hint={`${keyLabel(b.pause[0] ?? "KeyP")} to resume`} />
      )}

      {state.screen === "over" && (
        <GameOverOverlay
          isNewBest={state.isNewBest}
          score={state.score}
          detail={`${state.lines} lines · level ${state.level} · ${rankClause}`}
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
        actions={TETRIS_ACTIONS}
        value={api.bindings}
        defaults={TETRIS_DEFAULT_BINDINGS}
        onChange={api.setBindings}
        padValue={api.padBindings}
        padDefaults={TETRIS_DEFAULT_GAMEPAD_BINDINGS}
        onPadChange={api.setPadBindings}
      />
    </div>
  );
}
