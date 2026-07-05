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

const filledCells = (e: TetrisEngine) =>
  e
    .debugGrid()
    .flat()
    .filter((v) => v !== 0).length;

describe("lock delay (guideline move-reset)", () => {
  // NOTE: a single update() is capped at MAX_DT=100ms — timing tests must step
  // in ≤100ms ticks, never one big dt.
  it("a resting piece locks after 500ms", () => {
    const e = new TetrisEngine(() => 0.5);
    e.reset();
    e.debugSetPiece("O", 0, 4, 18); // resting on the floor
    for (let i = 0; i < 4; i++) step(e, 100); // 400ms — still in grace
    expect(filledCells(e)).toBe(0);
    step(e, 100); // 500ms — locks
    expect(filledCells(e)).toBe(4);
  });

  it("a successful move resets the timer; after 15 resets it locks anyway", () => {
    const e = new TetrisEngine(() => 0.5);
    e.reset();
    e.debugSetPiece("O", 0, 4, 18);
    // Alternating wiggle: each direction flip is a fresh immediate DAS move that
    // resets the lock timer (≤ 15 times), so the piece far outlives 500ms.
    for (let i = 0; i < 16; i++) {
      step(e, 100, i % 2 === 0 ? { left: true } : { right: true });
    }
    expect(filledCells(e)).toBe(0); // >1.5s alive — resets clearly worked
    // Budget exhausted: keep wiggling, the timer now runs through → locks.
    for (let i = 0; i < 5; i++) {
      step(e, 100, i % 2 === 0 ? { left: true } : { right: true });
    }
    expect(filledCells(e)).toBe(4);
  });
});

describe("DAS", () => {
  it("moves once on press, then repeats after 133ms every 25ms", () => {
    const e = new TetrisEngine(() => 0.5);
    e.reset();
    e.debugSetPiece("O", 0, 4, 0);
    step(e, 1, { right: true });
    expect(e.debugPiece()!.x).toBe(5); // fresh press moves immediately
    for (let i = 0; i < 4; i++) step(e, 33, { right: true }); // 132ms held
    expect(e.debugPiece()!.x).toBe(5); // DAS delay (133) not elapsed
    step(e, 2, { right: true });
    expect(e.debugPiece()!.x).toBe(6); // first auto-repeat
    step(e, 25, { right: true });
    expect(e.debugPiece()!.x).toBe(7); // repeat cadence
  });
});

describe("hard drop", () => {
  it("locks instantly at the drop position and scores 2/cell", () => {
    const e = new TetrisEngine(() => 0.5);
    e.reset();
    e.debugSetPiece("O", 0, 4, 0);
    step(e, 16, { hardDrop: true });
    // O at y=0 occupies rows 0-1; floor rest y=18 → distance 18.
    expect(filledCells(e)).toBe(4);
    expect(e.debugGrid()[19].filter((v) => v !== 0).length).toBe(2);
    expect(e.debugInspect().score).toBe(36);
  });

  it("a hard drop from rest (distance 0) still locks immediately", () => {
    const e = new TetrisEngine(() => 0.5);
    e.reset();
    e.debugSetPiece("O", 0, 4, 18);
    step(e, 1, { hardDrop: true });
    expect(filledCells(e)).toBe(4);
    expect(e.debugInspect().score).toBe(0);
  });
});

describe("hold", () => {
  it("first hold stores the piece and spawns the NEXT one", () => {
    const e = new TetrisEngine(() => 0.5);
    e.reset();
    const current = e.debugPiece()!.type;
    const next = e.debugInspect().nextType;
    step(e, 1, { hold: true });
    expect(e.debugInspect().holdType).toBe(current);
    expect(e.debugInspect().holdUsed).toBe(true);
    expect(e.debugPiece()!.type).toBe(next);
  });

  it("a second hold before locking is refused; after lock it swaps back", () => {
    const e = new TetrisEngine(() => 0.5);
    e.reset();
    const first = e.debugPiece()!.type;
    step(e, 1, { hold: true });
    const second = e.debugPiece()!.type;
    step(e, 1, { hold: true }); // refused — holdUsed
    expect(e.debugPiece()!.type).toBe(second);
    step(e, 1, { hardDrop: true }); // lock → hold re-arms
    step(e, 1, { hold: true }); // swaps with the stored piece
    expect(e.debugPiece()!.type).toBe(first);
    expect(e.debugInspect().holdUsed).toBe(true);
  });
});

/** Empty 20×10 grid to hand-fill. */
const emptyGrid = () => Array.from({ length: 20 }, () => Array(10).fill(0));

describe("guideline scoring", () => {
  it("scores a T-spin double 1200 (rotate in place, then hard drop from rest)", () => {
    const e = new TetrisEngine(() => 0.5);
    e.reset();
    const grid = emptyGrid();
    // Slot: row 18 full except cols 3,4,5 (the T bar); row 19 full except col 4
    // (the nose); plus a block at (3,17) → 3 occupied corners of the box at (3,17).
    for (let c = 0; c < 10; c++) if (c < 3 || c > 5) grid[18][c] = 1;
    for (let c = 0; c < 10; c++) if (c !== 4) grid[19][c] = 1;
    grid[17][3] = 1;
    e.debugSetGrid(grid);
    // T rot1 fits at (3,17); CW to rot2 fits in place → lastAction = rotate.
    e.debugSetPiece("T", 1, 3, 17);
    step(e, 1, { rotateCW: true });
    step(e, 1, { hardDrop: true }); // distance 0 → the rotate survives as last action
    // T-spin double: 1200 × (level 0 + 1); combo 0 pays nothing; no B2B armed yet.
    expect(e.debugInspect().score).toBe(1200);
    expect(e.debugInspect().lines).toBe(2);
  });

  it("scores a mini T-spin (no lines) 100 when the front corners aren't both filled", () => {
    const e = new TetrisEngine(() => 0.5);
    e.reset();
    const grid = emptyGrid();
    grid[19][0] = grid[19][2] = 1; // both back (bottom) corners
    grid[17][0] = 1; // ONE front (top) corner → mini
    e.debugSetGrid(grid);
    // T rot3 fits at (0,17); CW to rot0 fits in place.
    e.debugSetPiece("T", 3, 0, 17);
    step(e, 1, { rotateCW: true });
    step(e, 1, { hardDrop: true });
    expect(e.debugInspect().score).toBe(100);
  });

  it("pays back-to-back ×1.5 and combo on consecutive Tetrises", () => {
    const e = new TetrisEngine(() => 0.5);
    e.reset();
    const tetrisSetup = () => {
      const grid = emptyGrid();
      for (let r = 16; r < 20; r++) for (let c = 0; c < 9; c++) grid[r][c] = 1; // col 9 open
      e.debugSetGrid(grid);
      e.debugSetPiece("I", 1, 7, 16); // vertical I occupying col 9, rows 16-19
    };
    tetrisSetup();
    step(e, 1, { hardDrop: true });
    step(e, 1); // flash disabled (animate=false) → collapse + respawn
    expect(e.debugInspect().score).toBe(800); // first Tetris, no B2B, combo 0
    tetrisSetup();
    step(e, 1, { hardDrop: true });
    // 800 × 1.5 (B2B) + 50 × combo 1 = 1250; running total 2050.
    expect(e.debugInspect().score).toBe(2050);
  });

  it("a lock without a clear resets the combo but not the B2B chain", () => {
    const e = new TetrisEngine(() => 0.5);
    e.reset();
    e.debugSetPiece("O", 0, 0, 18);
    step(e, 1, { hardDrop: true });
    expect(e.debugInspect().score).toBe(0); // no clear, no points, combo reset
  });
});
