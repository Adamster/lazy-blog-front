import type { BindingMap } from "@/features/arcade/shared";

export type ShortFuseAction =
  | "moveUp"
  | "moveDown"
  | "moveLeft"
  | "moveRight"
  | "bomb"
  | "start"
  | "pause";

/** Ordered action list — the CONTROLS modal rows + the gamepad-poller action set. */
export const SHORT_FUSE_ACTIONS: readonly {
  id: ShortFuseAction;
  label: string;
}[] = [
  { id: "moveUp", label: "Move up" },
  { id: "moveDown", label: "Move down" },
  { id: "moveLeft", label: "Move left" },
  { id: "moveRight", label: "Move right" },
  { id: "bomb", label: "Drop bomb" },
  { id: "start", label: "Start" },
  { id: "pause", label: "Pause" },
];

export const SHORT_FUSE_ACTION_IDS = SHORT_FUSE_ACTIONS.map((a) => a.id);

/** Standard-Gamepad defaults — freely rebindable via the CONTROLS modal. */
export const SHORT_FUSE_DEFAULT_GAMEPAD_BINDINGS: BindingMap<ShortFuseAction> =
  {
    moveUp: ["Pad12"],
    moveDown: ["Pad13"],
    moveLeft: ["Pad14"],
    moveRight: ["Pad15"],
    bomb: ["Pad0"],
    start: ["Pad9"],
    pause: ["Pad8"],
  };

export const SHORT_FUSE_GAMEPAD_STORAGE = "arcade.short-fuse.pad.v1";

/** Informational only — mirrors the hook's hardcoded keyboard keys. */
export const SHORT_FUSE_KEYBOARD_INFO: BindingMap<ShortFuseAction> = {
  moveUp: ["ArrowUp", "KeyW"],
  moveDown: ["ArrowDown", "KeyS"],
  moveLeft: ["ArrowLeft", "KeyA"],
  moveRight: ["ArrowRight", "KeyD"],
  bomb: ["Space"],
  start: ["Enter", "Space"],
  pause: ["KeyP"],
};
