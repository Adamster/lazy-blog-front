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

describe("SRS kicks", () => {
  it("wall-kicks a vertical I off the left wall (1>0 second offset, +2)", () => {
    const e = new TetrisEngine(() => 0.5);
    e.reset();
    e.debugSetPiece("I", 1, -2, 5); // occupied column = x+2 = 0, flush left
    step(e, 16, { rotateCCW: true }); // 1>0
    const p = e.debugPiece()!;
    expect(p.rot).toBe(0);
    expect(p.x).toBe(0); // kicked +2 off the wall
  });

  it("floor-kicks a T resting on the floor (0>1 offset (-1,+1) → up one row)", () => {
    const e = new TetrisEngine(() => 0.5);
    e.reset();
    e.debugSetPiece("T", 0, 3, 18); // bar row = 19 (floor)
    step(e, 16, { rotateCW: true }); // 0>1: rot1 needs rows y..y+2 → kicks
    const p = e.debugPiece()!;
    expect(p.rot).toBe(1);
    expect(p.y).toBe(17); // lifted one row (wiki dy +1 = our y-1)
    expect(p.x).toBe(2); // offset dx -1
  });

  it("rotation fails (piece unchanged) when no kick offset fits", () => {
    const e = new TetrisEngine(() => 0.5);
    e.reset();
    // Box the T in completely: full grid except the T's own cells.
    const grid = Array.from({ length: 20 }, () => Array(10).fill(1));
    // T rot0 at (3,17): nose (4,17), bar (3..5,18) — carve exactly those.
    grid[17][4] = 0;
    grid[18][3] = grid[18][4] = grid[18][5] = 0;
    e.debugSetGrid(grid);
    e.debugSetPiece("T", 0, 3, 17);
    step(e, 16, { rotateCW: true });
    const p = e.debugPiece()!;
    expect(p.rot).toBe(0);
    expect(p.x).toBe(3);
  });
});
