import type { BindingMap } from "@/features/arcade/shared";

export type TetrisAction =
  | "moveLeft"
  | "moveRight"
  | "softDrop"
  | "hardDrop"
  | "rotateCW"
  | "rotateCCW"
  | "hold"
  | "pause";

/** Ordered action list — the CONTROLS modal rows + the code→action lookup. */
export const TETRIS_ACTIONS: readonly { id: TetrisAction; label: string }[] = [
  { id: "moveLeft", label: "Move left" },
  { id: "moveRight", label: "Move right" },
  { id: "softDrop", label: "Soft drop" },
  { id: "hardDrop", label: "Hard drop" },
  { id: "rotateCW", label: "Rotate cw" },
  { id: "rotateCCW", label: "Rotate ccw" },
  { id: "hold", label: "Hold" },
  { id: "pause", label: "Pause" },
];

export const TETRIS_ACTION_IDS = TETRIS_ACTIONS.map((a) => a.id);

/** Guideline defaults. Space = HARD DROP (genre muscle memory), so pause — the
 *  arcade-wide Space parity — moves to P here (deliberate, spec §2). */
export const TETRIS_DEFAULT_BINDINGS: BindingMap<TetrisAction> = {
  moveLeft: ["ArrowLeft", "KeyA"],
  moveRight: ["ArrowRight", "KeyD"],
  softDrop: ["ArrowDown", "KeyS"],
  hardDrop: ["Space"],
  rotateCW: ["ArrowUp", "KeyX"],
  rotateCCW: ["KeyZ"],
  hold: ["KeyC", "ShiftLeft", "ShiftRight"],
  pause: ["KeyP"],
};
