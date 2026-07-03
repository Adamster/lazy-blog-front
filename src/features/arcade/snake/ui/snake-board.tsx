"use client";

import {
  CornerBrackets,
  GameOverOverlay,
  MenuOverlay,
  PauseOverlay,
} from "@/features/arcade/shared";
import { prefersReducedMotion } from "@/shared/lib/prefers-reduced-motion";
import { useTheme } from "@/shared/ui/theme";
import type { SnakeGameApi } from "../model/types";
import { Confetti } from "./confetti";

/** Control reference — shown in the menu overlay. */
const KEY_HINTS: [string, string][] = [
  ["STEER", "↑ ↓ ← →  ·  W A S D"],
  ["PAUSE", "SPACE"],
];

/** The canvas play-field + its overlays (menu / pause / game-over). Pure
 *  presentation — the hook owns all logic; the board only renders `api`.
 *
 *  THEME-NATIVE (the classic-Snake/Tetris pattern): NO forced `dark` scope — the
 *  board and overlays read the AMBIENT `--m-*` tokens, and the canvas palette is
 *  resolved from those same tokens in the hook. */
export function SnakeBoard({ api }: { api: SnakeGameApi }) {
  const { state, canvasRef, start } = api;
  const reduce = prefersReducedMotion();
  // The prize rabbit is `--m-fg`-tinted — white on the dark field, ink on light —
  // so the menu title names the rabbit the player actually sees.
  const { isDarkTheme } = useTheme();
  const menuTitle = isDarkTheme
    ? "Follow the White Rabbit"
    : "Follow the Black Rabbit";

  const rankLine =
    state.rank > 0
      ? `Ranked #${state.rank} on the board`
      : "Off the board — eat more, grow longer";

  return (
    <div className="mono-scope relative aspect-[30/18] w-full bg-[var(--m-bg)]">
      <canvas
        ref={canvasRef}
        aria-label="Snake game board. Use the arrow keys to steer, Space to pause."
        role="img"
        className="block size-full [image-rendering:pixelated]"
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
          detail={rankLine}
          onRestart={start}
        />
      )}
    </div>
  );
}
