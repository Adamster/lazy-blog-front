"use client";

import {
  CornerBrackets,
  GameOverOverlay,
  MenuOverlay,
  PauseOverlay,
  rankLine,
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
  const { canvasRef, nextCanvasRef, panelRef, start, state } = api;

  const rankClause = rankLine(state.rank, canRank, "clear more lines");

  // The play surface is BARE (owner call: no `--m-card` band, no inner padding) —
  // the bordered well IS the stage, full height of the board footprint; the menu /
  // pause / over scrims carry their own `--m-card`/40 veil.
  return (
    <div className="mono-scope relative w-full overflow-hidden">
      {/* Well ↔ NEXT-panel gap = 40px (`gap-10`, owner pick after the label was
            dropped) — a layout-column separation on the 4px grid. */}
      {/* aspect-[30/18] = the snake boards' footprint, so every arcade board
            renders the same height at the same column width. */}
      {/* p-5 pulls the canvas in from the CornerBrackets (the frame reads as a
            stage around it) and centres the height-fit well in the footprint —
            40 read too far (the game shrank noticeably); 20 is the owner pick. */}
      <div className="flex aspect-[30/18] w-full items-stretch justify-center gap-10 p-5">
        {/* The well: JS-sized to an EXACT 10×20 cell multiple (no leftover strip);
              `h-full`/aspect are only the pre-hydration fallback — inline w/h override
              them. `self-center` centres it if the height-fit leaves side margin. */}
        <canvas
          ref={canvasRef}
          aria-label="Tetris well. Arrow keys or A/D to move, Up or X to rotate, Down to soft drop."
          role="img"
          className="block [aspect-ratio:1/2] h-full self-center border-2 border-[var(--m-dim)]"
        />

        {/* Beside the well only the gameplay-critical NEXT preview remains — run
            stats (Score/Lines/Level) live in the top stats band (owner call: no
            duplicated HUD next to the game). Unlabelled by owner call: the preview
            cube is self-explanatory, top-aligned with the well. Its cells track
            the well's at NEXT_CELL_SCALE — the hook sizes the canvas to
            NEXT_COLS·cell·scale; `size-16` is only the pre-hydration fallback,
            so the panel is width-auto. */}
        <div ref={panelRef} className="shrink-0">
          <canvas
            ref={nextCanvasRef}
            aria-label="Next piece"
            role="img"
            className="block size-16 border-2 border-[var(--m-dim)]"
          />
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
    </div>
  );
}
