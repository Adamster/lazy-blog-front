import type { BindingMap } from "@/features/arcade/shared";

export type Game2048Action =
  "moveUp" | "moveDown" | "moveLeft" | "moveRight" | "start" | "continueRun";

/** Ordered action list — the CONTROLS modal rows + the gamepad-poller action set.
 *  Up/Down/Left/Right order matches Snake's `SNAKE_CLASSIC_ACTIONS` — one
 *  consistent row order across every game's CONTROLS modal. */
export const GAME_2048_ACTIONS: readonly {
  id: Game2048Action;
  label: string;
}[] = [
  { id: "moveUp", label: "Move up" },
  { id: "moveDown", label: "Move down" },
  { id: "moveLeft", label: "Move left" },
  { id: "moveRight", label: "Move right" },
  { id: "start", label: "Start" },
  { id: "continueRun", label: "Continue" },
];

export const GAME_2048_ACTION_IDS = GAME_2048_ACTIONS.map((a) => a.id);

/** Standard-Gamepad defaults — freely rebindable via the CONTROLS modal. */
export const GAME_2048_DEFAULT_GAMEPAD_BINDINGS: BindingMap<Game2048Action> = {
  moveUp: ["Pad12"],
  moveDown: ["Pad13"],
  moveLeft: ["Pad14"],
  moveRight: ["Pad15"],
  start: ["Pad0"],
  continueRun: ["Pad0"],
};

export const GAME_2048_GAMEPAD_STORAGE = "arcade.2048.pad.v1";

/** Informational only — mirrors the hook's actual hardcoded keyboard keys
 *  (`use-2048-game.ts`'s `dirFor`/`isStart`). NOT rebindable; this constant
 *  drives the CONTROLS modal's read-only keyboard column, nothing else.
 *  Keep in sync by hand if the hook's hardcoded keys ever change. */
export const GAME_2048_KEYBOARD_INFO: BindingMap<Game2048Action> = {
  moveUp: ["ArrowUp", "KeyW"],
  moveDown: ["ArrowDown", "KeyS"],
  moveLeft: ["ArrowLeft", "KeyA"],
  moveRight: ["ArrowRight", "KeyD"],
  start: ["Enter", "Space"],
  continueRun: ["Enter", "Space"],
};
