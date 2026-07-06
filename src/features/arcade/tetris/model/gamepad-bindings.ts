import type { BindingMap } from "@/features/arcade/shared";
import type { TetrisAction } from "./bindings";

/** Same layout the poller hardcoded before rebinding existed — rebinding only adds
 *  the ABILITY to change these, the out-of-the-box feel is unchanged. */
export const TETRIS_DEFAULT_GAMEPAD_BINDINGS: BindingMap<TetrisAction> = {
  moveLeft: ["Pad14"],
  moveRight: ["Pad15"],
  softDrop: ["Pad13"],
  hardDrop: ["Pad12"],
  rotateCW: ["Pad0"],
  rotateCCW: ["Pad1"],
  hold: ["Pad4", "Pad5"],
  pause: ["Pad9"],
};

export const TETRIS_GAMEPAD_STORAGE = "arcade.tetris.pad.v1";
