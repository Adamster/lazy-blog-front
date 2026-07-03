import { describe, expect, it } from "vitest";
import {
  CELL_CACTUS,
  CELL_CHAMOMILE,
  CELL_COFFEE,
  CELL_EMPTY,
  CELL_SHOT,
  COFFEE_VALUE,
  COLS,
  PLAYER_ROW,
  ROWS,
  START_COL,
  StayAwakeEngine,
  WAVE_MAX_GAP,
  WAVE_MS_FLOOR,
  WAVE_MS_START,
  WAVE_START_GAP,
  generateRow,
  hopTargets,
  landableTargets,
} from "./engine";
import type { CellKind, StayAwakeInput } from "./types";

const input = (dir: StayAwakeInput["dir"] = null): StayAwakeInput => ({ dir });

/** rng 0.99 → no cactus (max p 0.32), no coffee (row p 0.3), no chamomile. */
const calmRng = () => 0.99;

function freshEngine(rng: () => number = calmRng) {
  const e = new StayAwakeEngine(rng);
  e.reset();
  return e;
}

const emptyRow = (): CellKind[] => Array(COLS).fill(CELL_EMPTY) as CellKind[];

const rowWith = (cells: Record<number, CellKind>): CellKind[] => {
  const row = emptyRow();
  for (const [i, kind] of Object.entries(cells)) row[Number(i)] = kind;
  return row;
};

describe("hopTargets", () => {
  it("an interior column targets both diagonals", () => {
    expect(hopTargets(START_COL)).toEqual([START_COL - 1, START_COL + 1]);
  });

  it("wall-side targets fall off the board (walls are lethal — no bounce)", () => {
    expect(hopTargets(0)).toEqual([-1, 1]);
    expect(hopTargets(COLS - 1)).toEqual([COLS - 2, COLS]);
  });

  it("landableTargets keeps only the cells that exist", () => {
    expect(landableTargets(0)).toEqual([1]);
    expect(landableTargets(COLS - 1)).toEqual([COLS - 2]);
    expect(landableTargets(START_COL)).toEqual([START_COL - 1, START_COL + 1]);
  });
});

describe("generateRow", () => {
  it("fairness invariant: every column keeps a non-cactus hop target, at every altitude", () => {
    // Deterministic LCG so the bulk run is reproducible.
    let seed = 1;
    const rng = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let alt = 0; alt < 600; alt++) {
      const row = generateRow(alt, rng);
      for (let c = 0; c < COLS; c++) {
        // In-bounds targets only — the wall itself is lethal, so the invariant
        // is "at least one EXISTING landing cell is not a cactus".
        const survivable = landableTargets(c).some(
          (t) => row[t] !== CELL_CACTUS
        );
        expect(survivable).toBe(true);
      }
    }
  });

  it("the opening altitudes are hazard-free (gentle start)", () => {
    expect(generateRow(0, () => 0).every((k) => k === CELL_EMPTY)).toBe(true);
  });
});

describe("StayAwakeEngine — hops", () => {
  it("reset: centre column, zero score, wave 6 rows below", () => {
    const d = freshEngine().inspect();
    expect(d.col).toBe(START_COL);
    expect(d.score).toBe(0);
    expect(d.altitude).toBe(0);
    expect(d.waveRow).toBe(PLAYER_ROW + WAVE_START_GAP);
    expect(d.rows).toHaveLength(ROWS);
  });

  it("draw is safe on a freshly constructed engine (the menu paints before start)", () => {
    const noop = () => {};
    const ctx = new Proxy(
      {},
      { get: () => noop, set: () => true }
    ) as unknown as CanvasRenderingContext2D;
    const e = new StayAwakeEngine(calmRng);
    expect(() => e.draw(ctx, 260, 400, 1, false)).not.toThrow();
  });

  it("a hop climbs one row (+1 score) and moves one column", () => {
    const e = freshEngine();
    e.update(16, input("left"), false);
    let d = e.inspect();
    expect(d.col).toBe(START_COL - 1);
    expect(d.altitude).toBe(1);
    expect(d.score).toBe(1);
    e.update(16, input("right"), false);
    d = e.inspect();
    expect(d.col).toBe(START_COL);
    expect(d.altitude).toBe(2);
  });

  it("the input edge is consumed (one hop per press)", () => {
    const e = freshEngine();
    const inp = input("left");
    e.update(16, inp, false);
    expect(inp.dir).toBeNull();
    e.update(16, inp, false);
    expect(e.inspect().altitude).toBe(1);
  });

  it("hopping into the wall ends the run (cause wall — no bounce)", () => {
    const e = freshEngine();
    for (let i = 0; i < START_COL; i++) e.update(16, input("left"), false);
    expect(e.inspect().col).toBe(0);
    const res = e.update(16, input("left"), false);
    expect(res.phase).toBe("over");
    expect(res.cause).toBe("wall");
    expect(e.inspect().altitude).toBe(START_COL); // the fatal hop climbs nothing
  });

  it("each hop pushes the wave back one row, capped at WAVE_MAX_GAP", () => {
    const e = freshEngine();
    for (let i = 0; i < 5; i++) {
      e.update(16, input(i % 2 ? "right" : "left"), false);
    }
    expect(e.inspect().waveRow).toBe(PLAYER_ROW + WAVE_MAX_GAP);
  });

  it("hops are ignored after the run ends", () => {
    const e = freshEngine();
    e.debugSetRow(PLAYER_ROW - 1, rowWith({ [START_COL - 1]: CELL_CACTUS }));
    e.update(16, input("left"), false);
    const alt = e.inspect().altitude;
    e.update(16, input("right"), false);
    expect(e.inspect().altitude).toBe(alt);
  });
});

describe("StayAwakeEngine — cells & wave", () => {
  it("landing on a cactus ends the run (cause cactus)", () => {
    const e = freshEngine();
    e.debugSetRow(PLAYER_ROW - 1, rowWith({ [START_COL - 1]: CELL_CACTUS }));
    const res = e.update(16, input("left"), false);
    expect(res.phase).toBe("over");
    expect(res.cause).toBe("cactus");
  });

  it("coffee scores +25 on top of the climb point; every 3rd starts a rush", () => {
    const e = freshEngine();
    for (const n of [1, 2, 3]) {
      // Alternate hop direction so the sloth never reaches the lethal walls.
      const dir = n % 2 ? "left" : "right";
      const col = e.inspect().col;
      const target = dir === "left" ? col - 1 : col + 1;
      e.debugSetRow(PLAYER_ROW - 1, rowWith({ [target]: CELL_COFFEE }));
      const res = e.update(16, input(dir), false);
      expect(res.coffees).toBe(n);
      // The same tick already burns its dt from the fresh rush, so compare >0,
      // not === RUSH_MS.
      expect(res.rushMsLeft > 0).toBe(n === 3);
    }
    expect(e.inspect().score).toBe(3 + 3 * COFFEE_VALUE);
  });

  it("during a rush the wave is frozen; it resumes after", () => {
    const e = freshEngine();
    for (let i = 0; i < 3; i++) {
      // Alternate hop direction so the sloth never reaches the lethal walls.
      const dir = i % 2 ? "right" : "left";
      const col = e.inspect().col;
      const target = dir === "left" ? col - 1 : col + 1;
      e.debugSetRow(PLAYER_ROW - 1, rowWith({ [target]: CELL_COFFEE }));
      e.update(16, input(dir), false);
    }
    const waveRow = e.inspect().waveRow;
    for (let i = 0; i < 30; i++) e.update(100, input(), false); // 3000ms = the rush
    expect(e.inspect().waveRow).toBe(waveRow);
    // altitude 3 → cadence 1300 − 24 = 1276ms; 1300ms of idle → exactly one rise.
    for (let i = 0; i < 13; i++) e.update(100, input(), false);
    expect(e.inspect().waveRow).toBe(waveRow - 1);
  });

  it("the idle wave catches the sloth (cause sleep)", () => {
    const e = freshEngine();
    let over = false;
    for (let i = 0; i < 80 && !over; i++) {
      over = e.update(100, input(), false).phase === "over";
    }
    expect(over).toBe(true);
    expect(e.inspect().cause).toBe("sleep");
  });

  it("chamomile surges the wave (net −2 after the hop's +1) and can kill", () => {
    const e = freshEngine();
    e.debugSetRow(PLAYER_ROW - 1, rowWith({ [START_COL - 1]: CELL_CHAMOMILE }));
    const before = e.inspect().waveRow;
    const res = e.update(16, input("left"), false);
    expect(e.inspect().waveRow).toBe(before - 2);
    expect(res.phase).toBe("playing");

    e.debugSetWaveRow(PLAYER_ROW + 2);
    // After the first left hop the sloth sits one column off-centre — hop RIGHT
    // so the second chamomile is planted on an in-bounds cell.
    const target = e.inspect().col + 1;
    e.debugSetRow(PLAYER_ROW - 1, rowWith({ [target]: CELL_CHAMOMILE }));
    const res2 = e.update(16, input("right"), false);
    expect(res2.phase).toBe("over");
    expect(res2.cause).toBe("sleep");
  });

  it("chamomile cancels an active espresso rush", () => {
    const e = freshEngine();
    for (let i = 0; i < 3; i++) {
      // Alternate hop direction so the sloth never reaches the lethal walls.
      const dir = i % 2 ? "right" : "left";
      const col = e.inspect().col;
      const target = dir === "left" ? col - 1 : col + 1;
      e.debugSetRow(PLAYER_ROW - 1, rowWith({ [target]: CELL_COFFEE }));
      e.update(16, input(dir), false);
    }
    expect(e.inspect().rushMsLeft).toBeGreaterThan(0);

    const target = e.inspect().col + 1;
    e.debugSetRow(PLAYER_ROW - 1, rowWith({ [target]: CELL_CHAMOMILE }));
    const res = e.update(16, input("right"), false);
    expect(res.phase).toBe("playing");
    expect(res.rushMsLeft).toBe(0);
  });

  it("a tequila shot arms cactus-proofing: the next cactus is crushed, not lethal", () => {
    const e = freshEngine();
    e.debugSetRow(PLAYER_ROW - 1, rowWith({ [START_COL - 1]: CELL_SHOT }));
    let res = e.update(16, input("left"), false);
    expect(res.shotMsLeft).toBeGreaterThan(0);
    expect(e.inspect().rows[PLAYER_ROW][START_COL - 1]).toBe(CELL_EMPTY);

    const target = e.inspect().col + 1;
    e.debugSetRow(PLAYER_ROW - 1, rowWith({ [target]: CELL_CACTUS }));
    res = e.update(16, input("right"), false);
    expect(res.phase).toBe("playing");
    expect(e.inspect().rows[PLAYER_ROW][target]).toBe(CELL_EMPTY);
  });

  it("the shot expires after 3s — cacti are lethal again", () => {
    const e = freshEngine();
    e.debugSetRow(PLAYER_ROW - 1, rowWith({ [START_COL - 1]: CELL_SHOT }));
    e.update(16, input("left"), false);
    for (let i = 0; i < 30; i++) e.update(100, input(), false); // 3000ms
    expect(e.inspect().shotMsLeft).toBe(0);

    const target = e.inspect().col + 1;
    e.debugSetRow(PLAYER_ROW - 1, rowWith({ [target]: CELL_CACTUS }));
    const res = e.update(16, input("right"), false);
    expect(res.phase).toBe("over");
    expect(res.cause).toBe("cactus");
  });

  it("the wave cadence accelerates with altitude down to the floor", () => {
    const e = freshEngine();
    expect(e.inspect().waveMs).toBe(WAVE_MS_START);
    for (let i = 0; i < 200; i++) {
      e.update(16, input(i % 2 ? "right" : "left"), false);
    }
    expect(e.inspect().waveMs).toBe(WAVE_MS_FLOOR);
  });
});
