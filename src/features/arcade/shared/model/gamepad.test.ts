import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createGamepadPoller, readGamepadAxes } from "./gamepad";
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

const ACTION_IDS: readonly Act[] = [
  "moveLeft",
  "moveRight",
  "softDrop",
  "hardDrop",
  "rotateCW",
  "rotateCCW",
  "hold",
  "pause",
];

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

  it("returns anyPress=false and no action fields with no gamepad connected", () => {
    const poll = createGamepadPoller(ACTION_IDS, () => BINDINGS);
    const frame = poll();
    expect(frame.moveLeft).toBeUndefined();
    expect(frame.hardDrop).toBeUndefined();
    expect(frame.anyPress).toBe(false);
  });

  it("resolves a held action from its bound button", () => {
    vi.stubGlobal("navigator", { getGamepads: () => [fakeGamepad([14])] });
    const poll = createGamepadPoller(ACTION_IDS, () => BINDINGS);
    const frame = poll();
    expect(frame.moveLeft).toBe(true);
    expect(frame.moveRight).toBe(false);
  });

  it("keeps reporting a button as held across multiple polls (edge detection is the caller's job)", () => {
    vi.stubGlobal("navigator", { getGamepads: () => [fakeGamepad([0])] });
    const poll = createGamepadPoller(ACTION_IDS, () => BINDINGS);
    expect(poll().rotateCW).toBe(true);
    expect(poll().rotateCW).toBe(true);
  });

  it("does not resolve the analog stick — axis reading is the caller's job", () => {
    vi.stubGlobal("navigator", {
      getGamepads: () => [fakeGamepad([], [-1, 0])],
    });
    const poll = createGamepadPoller(ACTION_IDS, () => BINDINGS);
    expect(poll().moveLeft).toBe(false);
  });

  it("follows a rebind to a new button", () => {
    const rebound: BindingMap<Act> = { ...BINDINGS, hardDrop: ["Pad2"] };
    vi.stubGlobal("navigator", { getGamepads: () => [fakeGamepad([2])] });
    const poll = createGamepadPoller(ACTION_IDS, () => rebound);
    expect(poll().hardDrop).toBe(true);
  });

  it("resolves correctly for a DIFFERENT action set than the one above (proves genericism)", () => {
    type SnakeAct = "moveUp" | "moveDown" | "start" | "pause";
    const SNAKE_ACTION_IDS: readonly SnakeAct[] = [
      "moveUp",
      "moveDown",
      "start",
      "pause",
    ];
    const snakeBindings: BindingMap<SnakeAct> = {
      moveUp: ["Pad12"],
      moveDown: ["Pad13"],
      start: ["Pad0"],
      pause: ["Pad9"],
    };
    vi.stubGlobal("navigator", {
      getGamepads: () => [fakeGamepad([12, 9])],
    });
    const poll = createGamepadPoller(SNAKE_ACTION_IDS, () => snakeBindings);
    const frame = poll();
    expect(frame.moveUp).toBe(true);
    expect(frame.moveDown).toBe(false);
    expect(frame.pause).toBe(true);
    expect(frame.start).toBe(false);
  });

  it("anyPress is true whenever any button is pressed, independent of bindings", () => {
    vi.stubGlobal("navigator", { getGamepads: () => [fakeGamepad([16])] });
    const poll = createGamepadPoller(ACTION_IDS, () => BINDINGS);
    expect(poll().anyPress).toBe(true);
  });
});

describe("readGamepadAxes", () => {
  beforeEach(() => {
    vi.stubGlobal("navigator", { getGamepads: () => [] });
  });

  it("returns {x:0,y:0} with no gamepad connected", () => {
    expect(readGamepadAxes()).toEqual({ x: 0, y: 0 });
  });

  it("reads axes 0/1 from the first connected pad", () => {
    vi.stubGlobal("navigator", {
      getGamepads: () => [fakeGamepad([], [0.7, -0.3])],
    });
    expect(readGamepadAxes()).toEqual({ x: 0.7, y: -0.3 });
  });
});
