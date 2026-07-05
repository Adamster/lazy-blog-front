import { describe, expect, it } from "vitest";
import { PIECE_TYPES, SevenBag, TetrisEngine } from "./engine";
import type { TetrisInput } from "./types";

export const input = (over: Partial<TetrisInput> = {}): TetrisInput => ({
  left: false,
  right: false,
  softDrop: false,
  rotateCW: false,
  rotateCCW: false,
  hardDrop: false,
  hold: false,
  ...over,
});

/** One sim tick (no clear-flash animation, fixed dt). */
export const step = (
  e: TetrisEngine,
  dt = 16,
  over: Partial<TetrisInput> = {}
) => e.update(dt, input(over), false);

describe("SevenBag", () => {
  it("deals every piece exactly once per window of 7", () => {
    const bag = new SevenBag(() => 0.42);
    for (let w = 0; w < 4; w++) {
      const window = Array.from({ length: 7 }, () => bag.next());
      expect([...window].sort()).toEqual([0, 1, 2, 3, 4, 5, 6]);
    }
  });

  it("shuffles by the injected rng (not the identity order)", () => {
    const a = new SevenBag(() => 0.1);
    const b = new SevenBag(() => 0.9);
    const seq = (bag: SevenBag) => Array.from({ length: 7 }, () => bag.next());
    expect(seq(a)).not.toEqual(seq(b));
  });
});

describe("TetrisEngine — reset", () => {
  it("starts a fresh game with a piece + next from the bag", () => {
    const e = new TetrisEngine(() => 0.5);
    e.reset();
    expect(e.debugPiece()).not.toBeNull();
    expect(PIECE_TYPES).toContain(e.debugInspect().nextType);
    expect(e.debugInspect().score).toBe(0);
  });
});
