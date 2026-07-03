import { describe, expect, it } from "vitest";
import { Engine2048, GRID, slideLine } from "./engine";
import type { Input2048 } from "./types";

const input = (dir: Input2048["dir"] = null): Input2048 => ({ dir });

/** Engine seeded to a known grid (reset first so phase/score are clean). */
function engineWith(grid: number[][], rng: () => number = () => 0.5) {
  const e = new Engine2048(rng);
  e.reset();
  e.debugSetGrid(grid);
  return e;
}

const tileCount = (grid: number[][]) => grid.flat().filter((v) => v > 0).length;

describe("slideLine", () => {
  it("compacts toward index 0", () => {
    expect(slideLine([0, 2, 0, 4]).values).toEqual([2, 4, 0, 0]);
  });

  it("merges one equal pair and scores the merged value", () => {
    const r = slideLine([2, 2, 0, 0]);
    expect(r.values).toEqual([4, 0, 0, 0]);
    expect(r.gained).toBe(4);
  });

  it("a fresh merge result never merges again this move (2 2 4 → 4 4, not 8)", () => {
    expect(slideLine([2, 2, 4, 0]).values).toEqual([4, 4, 0, 0]);
  });

  it("merges the pair nearest the target edge first (2 2 2 → 4 2)", () => {
    const r = slideLine([2, 2, 2, 0]);
    expect(r.values).toEqual([4, 2, 0, 0]);
    expect(r.gained).toBe(4);
  });

  it("a double pair merges both (2 2 2 2 → 4 4, +8)", () => {
    const r = slideLine([2, 2, 2, 2]);
    expect(r.values).toEqual([4, 4, 0, 0]);
    expect(r.gained).toBe(8);
  });

  it("reports moved=false for a settled line", () => {
    expect(slideLine([2, 4, 2, 0]).moved).toBe(false);
  });

  it("maps each source tile to its destination index (for the slide animation)", () => {
    expect(slideLine([0, 2, 0, 2]).dest).toEqual([null, 0, null, 0]);
  });
});

describe("Engine2048 — sim", () => {
  it("reset spawns exactly two tiles at score 0, phase playing", () => {
    const e = new Engine2048(() => 0.5);
    e.reset();
    const d = e.inspect();
    expect(tileCount(d.grid)).toBe(2);
    expect(d.score).toBe(0);
    expect(d.moves).toBe(0);
    expect(d.phase).toBe("playing");
  });

  it("a move slides, merges, scores and spawns exactly one tile", () => {
    const e = engineWith([
      [2, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    e.update(16, input("left"), false);
    const d = e.inspect();
    expect(d.grid[0][0]).toBe(4);
    expect(tileCount(d.grid)).toBe(2); // the merged 4 + one spawn
    expect(d.score).toBe(4);
    expect(d.moves).toBe(1);
  });

  it("merges accumulate across lines in one move", () => {
    const e = engineWith([
      [2, 2, 4, 4],
      [8, 8, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    e.update(16, input("left"), false);
    const d = e.inspect();
    expect(d.grid[0][0]).toBe(4);
    expect(d.grid[0][1]).toBe(8);
    expect(d.grid[1][0]).toBe(16);
    expect(d.score).toBe(4 + 8 + 16);
  });

  it("vertical moves slide columns (up)", () => {
    const e = engineWith([
      [0, 0, 0, 0],
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [2, 0, 0, 0],
    ]);
    e.update(16, input("up"), false);
    expect(e.inspect().grid[0][0]).toBe(4);
  });

  it("a no-op move changes nothing, spawns nothing, counts nothing", () => {
    const e = engineWith([
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    e.update(16, input("left"), false);
    const d = e.inspect();
    expect(tileCount(d.grid)).toBe(1);
    expect(d.moves).toBe(0);
  });

  it("the input edge is consumed (held key ≠ repeat moves)", () => {
    const e = engineWith([
      [0, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const inp = input("left");
    e.update(16, inp, false);
    expect(inp.dir).toBeNull();
    const moves1 = e.inspect().moves;
    e.update(16, inp, false); // same object, edge already consumed
    expect(e.inspect().moves).toBe(moves1);
  });

  it("reaching 2048 flips phase to won; continueRun resumes; won never re-fires", () => {
    const e = engineWith([
      [1024, 1024, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    e.update(16, input("left"), false);
    expect(e.inspect().phase).toBe("won");
    // input is ignored while won
    e.update(16, input("left"), false);
    expect(e.inspect().phase).toBe("won");
    e.continueRun();
    expect(e.inspect().phase).toBe("playing");
    // a second 2048 does NOT re-enter won (endless)
    e.debugSetGrid([
      [1024, 1024, 0, 0],
      [2048, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    e.update(16, input("left"), false);
    expect(e.inspect().phase).toBe("playing");
  });

  it("a spawn that fills the last hole with no merges left ends the game", () => {
    // rng 0.99 → spawn picks the single empty cell, value 2 (0.99 ≥ 0.1 four-chance).
    const e = engineWith(
      [
        [2, 4, 2, 4],
        [4, 2, 4, 2],
        [2, 4, 2, 4],
        [0, 4, 2, 4],
      ],
      () => 0.99
    );
    e.update(16, input("left"), false);
    expect(e.inspect().phase).toBe("over");
  });

  it("a full board with a possible merge is NOT over", () => {
    const e = engineWith(
      [
        [2, 4, 2, 4],
        [4, 2, 4, 2],
        [2, 4, 2, 4],
        [0, 4, 4, 2],
      ],
      () => 0.99
    );
    e.update(16, input("left"), false); // row 3 merges 4+4 → board has room + merges
    expect(e.inspect().phase).toBe("playing");
  });

  it("continueRun on a board dead-locked by the winning move goes to over, not playing", () => {
    // Left-merge makes 2048 in row 0; rng 0.99 spawns a 2 in the only hole (r0,c3),
    // leaving a full board with no adjacent equals anywhere.
    const e = engineWith(
      [
        [1024, 1024, 2, 4],
        [4, 8, 2, 8],
        [2, 4, 8, 4],
        [4, 8, 2, 8],
      ],
      () => 0.99
    );
    e.update(16, input("left"), false);
    expect(e.inspect().phase).toBe("won");
    e.continueRun();
    expect(e.inspect().phase).toBe("over");
  });

  it("right merges resolve at the right edge", () => {
    const e = engineWith([
      [0, 2, 2, 4],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    e.update(16, input("right"), false);
    const d = e.inspect();
    expect(d.grid[0][3]).toBe(4);
    expect(d.grid[0][2]).toBe(4);
    expect(d.score).toBe(4);
  });

  it("down merges the pair nearest the bottom edge first", () => {
    const e = engineWith([
      [2, 0, 0, 0],
      [2, 0, 0, 0],
      [2, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    e.update(16, input("down"), false);
    const d = e.inspect();
    expect(d.grid[3][0]).toBe(4);
    expect(d.grid[2][0]).toBe(2);
  });

  it("grid stays 4×4 with only power-of-two (or zero) values after many moves", () => {
    const e = new Engine2048(() => 0.42);
    e.reset();
    const dirs: Input2048["dir"][] = ["left", "up", "right", "down"];
    for (let i = 0; i < 200 && e.inspect().phase === "playing"; i++) {
      e.update(16, input(dirs[i % 4]), false);
    }
    const d = e.inspect();
    expect(d.grid).toHaveLength(GRID);
    for (const row of d.grid) {
      expect(row).toHaveLength(GRID);
      for (const v of row) {
        expect(v === 0 || Number.isInteger(Math.log2(v))).toBe(true);
      }
    }
  });
});
