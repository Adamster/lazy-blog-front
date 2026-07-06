/**
 * Gamepad input for the arcade — polled from a game's EXISTING rAF loop (no loop of
 * its own; the Gamepad API is poll-only). Button→action assignment is REMAPPABLE:
 * the caller supplies a live `BindingMap` (Tetris: `gamepad-bindings.ts`, edited via
 * the CONTROLS modal) and this module just resolves it each poll — it owns no
 * defaults itself. Standard-layout button INDICES are encoded as `"Pad<n>"` strings,
 * the same generic code format `key-bindings.ts` uses for keyboard codes. The left
 * stick (+ D-pad axes) is a fixed, NON-remappable bonus input for move/soft-drop only
 * (axes 0/1, ±0.5 deadzone) — always live alongside whatever buttons are bound to
 * those actions. Directions are HOLDS (feed the same DAS as the keyboard); the rest
 * are press EDGES computed against the previous frame's snapshot.
 */

import type { BindingMap } from "./key-bindings";

export interface PadFrame {
  left: boolean;
  right: boolean;
  softDrop: boolean;
  hardDrop: boolean;
  rotateCW: boolean;
  rotateCCW: boolean;
  hold: boolean;
  pause: boolean;
  anyPress: boolean;
}

const DEADZONE = 0.5;

const IDLE: PadFrame = {
  left: false,
  right: false,
  softDrop: false,
  hardDrop: false,
  rotateCW: false,
  rotateCCW: false,
  hold: false,
  pause: false,
  anyPress: false,
};

interface RawHeld {
  hard: boolean;
  cw: boolean;
  ccw: boolean;
  hold: boolean;
  pause: boolean;
  any: boolean;
}

const RAW_IDLE: RawHeld = {
  hard: false,
  cw: false,
  ccw: false,
  hold: false,
  pause: false,
  any: false,
};

/** `"Pad12"` → `12`; anything malformed resolves to -1 (never matches a real button). */
function padButtonIndex(code: string): number {
  if (!code.startsWith("Pad")) return -1;
  const n = Number(code.slice(3));
  return Number.isInteger(n) ? n : -1;
}

export function createGamepadPoller(
  getBindings: () => BindingMap<string>
): () => PadFrame {
  let prev = RAW_IDLE;
  return () => {
    const pads =
      typeof navigator !== "undefined" && navigator.getGamepads
        ? navigator.getGamepads()
        : [];
    const gp = Array.from(pads ?? []).find(
      (p): p is Gamepad => !!p && p.connected
    );
    if (!gp) {
      prev = RAW_IDLE;
      return IDLE;
    }
    const btn = (i: number) => !!gp.buttons[i]?.pressed;
    const bindings = getBindings();
    const pressed = (action: string) =>
      bindings[action].some((code) => btn(padButtonIndex(code)));
    const axisX = gp.axes[0] ?? 0;
    const axisY = gp.axes[1] ?? 0;
    const held: RawHeld = {
      hard: pressed("hardDrop"),
      cw: pressed("rotateCW"),
      ccw: pressed("rotateCCW"),
      hold: pressed("hold"),
      pause: pressed("pause"),
      any: gp.buttons.some((b) => b.pressed),
    };
    const frame: PadFrame = {
      left: pressed("moveLeft") || axisX < -DEADZONE,
      right: pressed("moveRight") || axisX > DEADZONE,
      softDrop: pressed("softDrop") || axisY > DEADZONE,
      hardDrop: held.hard && !prev.hard,
      rotateCW: held.cw && !prev.cw,
      rotateCCW: held.ccw && !prev.ccw,
      hold: held.hold && !prev.hold,
      pause: held.pause && !prev.pause,
      anyPress: held.any && !prev.any,
    };
    prev = held;
    return frame;
  };
}
