"use client";

import {
  CornerBrackets,
  GameOverOverlay,
  MenuOverlay,
  PauseOverlay,
} from "@/features/arcade/shared";
import type { SnakeClassicGameApi } from "../model/types";

/** Control reference — shown in the menu overlay. */
const KEY_HINTS: [string, string][] = [
  ["STEER", "↑ ↓ ← →  ·  W A S D"],
  ["PAUSE", "SPACE"],
];

/** The canvas play-field + its overlays (menu / pause / game-over). Pure
 *  presentation — the hook owns all logic; the board only renders `api`.
 *
 *  THEME-NATIVE (the Tetris pattern): NO forced `dark` scope — the board and
 *  overlays read the AMBIENT `--m-*` tokens, and the canvas palette is resolved
 *  from those same tokens in the hook. */
export function SnakeClassicBoard({ api }: { api: SnakeClassicGameApi }) {
  const { state, canvasRef, start } = api;

  const rankLine =
    state.rank > 0
      ? `Ranked #${state.rank} on the board`
      : "Off the board — eat more, grow longer";

  return (
    <div className="mono-scope relative aspect-[30/18] w-full bg-[var(--m-bg)]">
      <canvas
        ref={canvasRef}
        aria-label="Classic Snake game board. Use the arrow keys to steer, Space to pause. Walls are lethal."
        role="img"
        className="block size-full [image-rendering:pixelated]"
      />

      <CornerBrackets />

      {state.screen === "menu" && (
        <MenuOverlay title="Snake" onStart={start} hints={KEY_HINTS} />
      )}

      {state.screen === "playing" && state.paused && (
        <PauseOverlay hint="Space to resume" />
      )}

      {state.screen === "over" && (
        <GameOverOverlay
          isNewBest={state.isNewBest}
          score={state.score}
          detail={rankLine}
          onRestart={start}
        />
      )}
    </div>
  );
}
