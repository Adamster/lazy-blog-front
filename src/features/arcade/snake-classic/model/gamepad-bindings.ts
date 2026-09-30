import type { BindingMap } from "@/features/arcade/shared";

export type SnakeClassicAction =
  "moveUp" | "moveDown" | "moveLeft" | "moveRight" | "start" | "pause";

/** Ordered action list — the CONTROLS modal rows + the gamepad-poller action set. */
export const SNAKE_CLASSIC_ACTIONS: readonly {
  id: SnakeClassicAction;
  label: string;
}[] = [
  { id: "moveUp", label: "Move up" },
  { id: "moveDown", label: "Move down" },
  { id: "moveLeft", label: "Move left" },
  { id: "moveRight", label: "Move right" },
  { id: "start", label: "Start" },
  { id: "pause", label: "Pause" },
];

export const SNAKE_CLASSIC_ACTION_IDS = SNAKE_CLASSIC_ACTIONS.map((a) => a.id);

/** Standard-Gamepad defaults — freely rebindable via the CONTROLS modal. */
export const SNAKE_CLASSIC_DEFAULT_GAMEPAD_BINDINGS: BindingMap<SnakeClassicAction> =
  {
    moveUp: ["Pad12"],
    moveDown: ["Pad13"],
    moveLeft: ["Pad14"],
    moveRight: ["Pad15"],
    start: ["Pad0"],
    pause: ["Pad9"],
  };

export const SNAKE_CLASSIC_GAMEPAD_STORAGE = "arcade.snake-classic.pad.v1";

/** Informational only — mirrors the hook's actual hardcoded keyboard keys
 *  (`use-snake-classic-game.ts`'s `onKey` handler). NOT rebindable; this
 *  constant drives the CONTROLS modal's read-only keyboard column, nothing
 *  else. Keep in sync by hand if the hook's hardcoded keys ever change. */
export const SNAKE_CLASSIC_KEYBOARD_INFO: BindingMap<SnakeClassicAction> = {
  moveUp: ["ArrowUp", "KeyW"],
  moveDown: ["ArrowDown", "KeyS"],
  moveLeft: ["ArrowLeft", "KeyA"],
  moveRight: ["ArrowRight", "KeyD"],
  start: ["Enter", "Space"],
  pause: ["Space"],
};
