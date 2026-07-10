/**
 * Gamepad input for the arcade — polled from a game's EXISTING rAF loop (no loop of
 * its own; the Gamepad API is poll-only). Button→action assignment is REMAPPABLE:
 * the caller supplies a live `BindingMap` (per-game `gamepad-bindings.ts`, edited via
 * the CONTROLS modal) and this module just resolves it each poll — it owns no
 * defaults itself. Standard-layout button INDICES are encoded as `"Pad<n>"` strings,
 * the same generic code format `key-bindings.ts` uses for keyboard codes.
 *
 * This module reports RAW HELD state only — for any action id in the caller's own
 * set, "is its bound button down right now." It does not compute press-edges and
 * does not read the analog stick/D-pad axes: both are the CALLER's responsibility,
 * since a generic action set can't assume which (if any) of its actions represent
 * directional movement, and different games want different held-vs-edge semantics
 * for the same shape of action (Tetris holds `moveLeft`/`moveRight` for DAS; Snake/
 * 2048 want a single edge per press). Use {@link readGamepadAxes} for the stick/
 * D-pad reading and {@link GAMEPAD_DEADZONE} for the threshold.
 */

import type { BindingMap } from "./key-bindings";

/** Deadzone for the left stick / D-pad axes (`readGamepadAxes`) — every game in
 *  this arcade uses ±0.5. */
export const GAMEPAD_DEADZONE = 0.5;

function firstConnectedPad(): Gamepad | null {
  const pads =
    typeof navigator !== "undefined" && navigator.getGamepads
      ? navigator.getGamepads()
      : [];
  return (
    Array.from(pads ?? []).find((p): p is Gamepad => !!p && p.connected) ?? null
  );
}

/** Raw left-stick / D-pad-axis reading (axes 0/1), unresolved against any
 *  deadzone or action — `{ x: 0, y: 0 }` when no pad is connected. */
export function readGamepadAxes(): { x: number; y: number } {
  const gp = firstConnectedPad();
  return { x: gp?.axes[0] ?? 0, y: gp?.axes[1] ?? 0 };
}

/** `"Pad12"` → `12`; anything malformed resolves to -1 (never matches a real button). */
function padButtonIndex(code: string): number {
  if (!code.startsWith("Pad")) return -1;
  const n = Number(code.slice(3));
  return Number.isInteger(n) ? n : -1;
}

/**
 * Build a poller reporting, for each of `actionIds`, whether ANY of its bound
 * `"Pad<n>"` codes is currently held down — plus `anyPress` (any button on the pad
 * pressed at all, regardless of bindings). Returns `{ anyPress: false }` (no action
 * fields set) when no gamepad is connected. Callers own edge-detection (diff
 * against their own previous frame) and axis fallback (via {@link readGamepadAxes}).
 */
export function createGamepadPoller<A extends string>(
  actionIds: readonly A[],
  getBindings: () => BindingMap<A>
): () => Partial<Record<A, boolean>> & { anyPress: boolean } {
  return () => {
    const gp = firstConnectedPad();
    const frame = { anyPress: false } as Partial<Record<A, boolean>> & {
      anyPress: boolean;
    };
    if (!gp) return frame;
    const btn = (i: number) => !!gp.buttons[i]?.pressed;
    const bindings = getBindings();
    for (const id of actionIds) {
      (frame as Record<A, boolean>)[id] = bindings[id].some((code) =>
        btn(padButtonIndex(code))
      );
    }
    frame.anyPress = gp.buttons.some((b) => b.pressed);
    return frame;
  };
}
