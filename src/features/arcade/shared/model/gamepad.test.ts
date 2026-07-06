import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createGamepadPoller } from "./gamepad";
import type { BindingMap } from "./key-bindings";

type Act =
  | "moveLeft"
  | "moveRight"
  | "softDrop"
  | "hardDrop"
  | "rotateCW"
  | "rotateCCW"
  | "hold"
  | "pause";

const BINDINGS: BindingMap<Act> = {
  moveLeft: ["Pad14"],
  moveRight: ["Pad15"],
  softDrop: ["Pad13"],
  hardDrop: ["Pad12"],
  rotateCW: ["Pad0"],
  rotateCCW: ["Pad1"],
  hold: ["Pad4", "Pad5"],
  pause: ["Pad9"],
};

function fakeGamepad(
  pressedIndices: number[],
  axes: readonly number[] = [0, 0]
): Gamepad {
  const buttons = Array.from({ length: 17 }, (_, i) => ({
    pressed: pressedIndices.includes(i),
    touched: pressedIndices.includes(i),
    value: pressedIndices.includes(i) ? 1 : 0,
  })) as GamepadButton[];
  return {
    id: "fake",
    index: 0,
    connected: true,
    timestamp: 0,
    mapping: "standard",
    buttons,
    axes,
    vibrationActuator: null,
  } as unknown as Gamepad;
}

afterEach(() => vi.unstubAllGlobals());

describe("createGamepadPoller", () => {
  beforeEach(() => {
    vi.stubGlobal("navigator", { getGamepads: () => [] });
  });

  it("returns all-idle with no gamepad connected", () => {
    const poll = createGamepadPoller(() => BINDINGS);
    const frame = poll();
    expect(frame.left).toBe(false);
    expect(frame.hardDrop).toBe(false);
    expect(frame.anyPress).toBe(false);
  });

  it("resolves a held direction from its bound button", () => {
    vi.stubGlobal("navigator", { getGamepads: () => [fakeGamepad([14])] });
    const poll = createGamepadPoller(() => BINDINGS);
    const frame = poll();
    expect(frame.left).toBe(true);
    expect(frame.right).toBe(false);
  });

  it("fires an edge action once, not on every held frame", () => {
    vi.stubGlobal("navigator", { getGamepads: () => [fakeGamepad([0])] });
    const poll = createGamepadPoller(() => BINDINGS);
    expect(poll().rotateCW).toBe(true);
    expect(poll().rotateCW).toBe(false);
  });

  it("the analog stick always drives movement regardless of button bindings", () => {
    vi.stubGlobal("navigator", {
      getGamepads: () => [fakeGamepad([], [-1, 0])],
    });
    const poll = createGamepadPoller(() => BINDINGS);
    expect(poll().left).toBe(true);
  });

  it("follows a rebind to a new button", () => {
    const rebound: BindingMap<Act> = { ...BINDINGS, hardDrop: ["Pad2"] };
    vi.stubGlobal("navigator", { getGamepads: () => [fakeGamepad([2])] });
    const poll = createGamepadPoller(() => rebound);
    expect(poll().hardDrop).toBe(true);
  });
});
