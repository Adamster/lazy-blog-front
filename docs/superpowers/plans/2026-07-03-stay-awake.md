# Stay Awake Arcade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship "Stay Awake" — a Jumping Joe-style endless vertical climber (a sloth hops up a 13×20 tower away from a rising sleep wave; coffee fuels espresso rushes, a chamomile trap surges the wave) — as a new arcade title at `/arcade/stay-awake`, listed in the hub.

**Architecture:** New self-contained FSD feature slice `src/features/arcade/stay-awake/` mirroring the snake-classic/tetris/2048 template 1:1 — headless engine class (no React) + imperative canvas draw with pixel-bitmap sprites, a `useStayAwakeGame` hook owning the rAF loop / keyboard / tap zones / theme-palette resolution, TanStack Query data layer under the free backend `game: "stay-awake"` key, and a route page behind `ProtectedRoute`. No backend changes.

**Tech Stack:** React 19 client components, TanStack Query, HTML5 canvas, Vitest, Tailwind (`--m-*` tokens).

**Spec:** `docs/superpowers/specs/2026-07-03-stay-awake-design.md`

## Global Constraints

- **NO git commits.** Owner rule: apply changes → run gates → STOP and ask. Every "commit" step in the usual template is replaced by a gate run. Never commit or push.
- Design system: closed type scale (11/12/14/18/32/40/46), labels 11px/0.12em, 2px borders, square corners. Canvas-internal sizes (sprites, Z glyphs) are exempt (like SVG internals).
- Theme-native: NO forced `dark` scope anywhere in the new feature. All colours from live `--m-*` tokens; the engine never reads CSS — the hook resolves and injects a palette.
- Repo lint rule: NO synchronous `setState` inside an effect — defer via `requestAnimationFrame`.
- Every animation must degrade under `prefers-reduced-motion` (shared `prefersReducedMotion()` guard): wave edge steps discretely, hop lands instantly, Z glyphs static. Gameplay unaffected.
- FSD: features never import other features. The slice copies its key factory / leaderboard shaping / score history locally (exactly like Tetris/2048/snake-classic copied Snake's).
- Approved copy (owner, 2026-07-03): title **"Stay Awake"**, route `/arcade/stay-awake`, game id `"stay-awake"`, menu goal line "The floor is sleep. Keep hopping.", game-over lines "SAT ON A CACTUS." (cactus) / "CAUGHT NAPPING." (sleep wave).
- Gates after every task: `npm run typecheck` and `npm run lint` — both 0 errors.
- Tests: `npm run test:run -- src/features/arcade/stay-awake/model/engine.test.ts`.

---

### Task 1: Engine sim — types, row generator, StayAwakeEngine (TDD)

**Files:**

- Create: `src/features/arcade/stay-awake/model/types.ts`
- Create: `src/features/arcade/stay-awake/model/engine.ts` (sim only; draw comes in Task 2)
- Test: `src/features/arcade/stay-awake/model/engine.test.ts`

**Interfaces:**

- Produces (later tasks rely on these exact names):
  - `types.ts`: `HopDir`, `PhaseStayAwake`, `Screen`, `DeathCause`, `CellKind`, `StayAwakeInput { dir: HopDir | null }`, `StayAwakeStep`, `HistoryPoint`, `ScoreRow`, `RankedRow`, `StayAwakeState`, `StayAwakeGameApi`, `UseStayAwakeGameOptions`
  - `engine.ts`: `COLS = 13`, `ROWS = 20`, `PLAYER_ROW = 13`, `START_COL = 6`, `COFFEE_VALUE = 25`, `RUSH_EVERY = 3`, `RUSH_MS = 3000`, `SURGE_ROWS = 3`, `WAVE_MS_START = 1100`, `WAVE_MS_ACCEL = 10`, `WAVE_MS_FLOOR = 450`, `WAVE_START_GAP = 6`, `WAVE_MAX_GAP = 8`, `CELL_EMPTY/CELL_CACTUS/CELL_COFFEE/CELL_CHAMOMILE`, `hopTargets(c): [number, number]`, `generateRow(altitude, rng): CellKind[]`, `class StayAwakeEngine { constructor(rng?); reset(); update(dtMs, input, animate): StayAwakeStep; inspect(); debugSetRow(r, row); debugSetWaveRow(row); }`

- [ ] **Step 1: Write `types.ts`**

```ts
export type HopDir = "left" | "right";

/** Engine phase — the climber has no win state, only the run and its end. */
export type PhaseStayAwake = "playing" | "over";

/** UI screen — phase plus the pre-game menu. */
export type Screen = "menu" | "playing" | "over";

/** What ended the run: a cactus landing or the sleep wave. */
export type DeathCause = "cactus" | "sleep" | null;

/** One tower cell. 0 empty · 1 cactus (lethal) · 2 coffee (+25, rush fuel) ·
 *  3 chamomile (landable trap — wave surge). */
export type CellKind = 0 | 1 | 2 | 3;

/** One-shot hop edge the loop feeds the engine; consumed (nulled) per hop. */
export interface StayAwakeInput {
  dir: HopDir | null;
}

/** One sim-tick outcome, projected to React state on change. */
export interface StayAwakeStep {
  phase: PhaseStayAwake;
  cause: DeathCause;
  score: number;
  /** Rows climbed this run (also the +1/row score component). */
  altitude: number;
  coffees: number;
  /** Rows between the wave's top edge and the sloth. 0 = caught. */
  waveGap: number;
  /** Espresso rush remaining (ms); 0 = no rush. */
  rushMsLeft: number;
}

export interface HistoryPoint {
  label: string;
  count: number;
}

export interface ScoreRow {
  name: string;
  score: number;
  you?: boolean;
  userName?: string;
}

export interface RankedRow extends ScoreRow {
  /** Zero-padded position, e.g. "01". */
  rank: string;
  /** Locale-formatted score, e.g. "12,400". */
  scoreLabel: string;
  /** True for a padding placeholder slot. */
  empty?: boolean;
}

export interface StayAwakeState {
  screen: Screen;
  paused: boolean;
  score: number;
  altitude: number;
  coffees: number;
  cause: DeathCause;
  waveGap: number;
  /** Coarse rush flag (NOT the ms countdown — state must not change every frame). */
  rushActive: boolean;
  /** Viewer's server-truth personal best. */
  best: number;
  isNewBest: boolean;
  /** 1-based board rank; 0 = off the board. */
  rank: number;
}

export interface StayAwakeGameApi {
  state: StayAwakeState;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** The two side panels — measured so the well is sized to the leftover width. */
  leftPanelRef: React.RefObject<HTMLDivElement | null>;
  rightPanelRef: React.RefObject<HTMLDivElement | null>;
  history: HistoryPoint[];
  start: () => void;
  /** One hop (keyboard and the board's tap zones both call this). */
  hop: (dir: HopDir) => void;
}

export interface UseStayAwakeGameOptions {
  /** The viewer's server-truth best — for the new-best test on game over. */
  best?: number;
  /** Fired ONCE per finished run with its final score. */
  onGameOver?: (score: number) => void;
}
```

- [ ] **Step 2: Write the failing tests (`engine.test.ts`)**

```ts
import { describe, expect, it } from "vitest";
import {
  CELL_CACTUS,
  CELL_CHAMOMILE,
  CELL_COFFEE,
  CELL_EMPTY,
  COFFEE_VALUE,
  COLS,
  PLAYER_ROW,
  ROWS,
  RUSH_MS,
  START_COL,
  StayAwakeEngine,
  WAVE_MAX_GAP,
  WAVE_MS_FLOOR,
  WAVE_MS_START,
  WAVE_START_GAP,
  generateRow,
  hopTargets,
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
    expect(hopTargets(6)).toEqual([5, 7]);
  });

  it("wall bounce maps the blocked side to straight up", () => {
    expect(hopTargets(0)).toEqual([0, 1]);
    expect(hopTargets(COLS - 1)).toEqual([COLS - 2, COLS - 1]);
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
        const [l, r] = hopTargets(c);
        expect(row[l] === CELL_CACTUS && row[r] === CELL_CACTUS).toBe(false);
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

  it("wall bounce: hopping into the wall climbs straight up, same column", () => {
    const e = freshEngine();
    for (let i = 0; i < START_COL; i++) e.update(16, input("left"), false);
    expect(e.inspect().col).toBe(0);
    e.update(16, input("left"), false);
    const d = e.inspect();
    expect(d.col).toBe(0);
    expect(d.altitude).toBe(START_COL + 1);
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
      const target = hopTargets(e.inspect().col)[0];
      e.debugSetRow(PLAYER_ROW - 1, rowWith({ [target]: CELL_COFFEE }));
      const res = e.update(16, input("left"), false);
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
      const target = hopTargets(e.inspect().col)[0];
      e.debugSetRow(PLAYER_ROW - 1, rowWith({ [target]: CELL_COFFEE }));
      e.update(16, input("left"), false);
    }
    const waveRow = e.inspect().waveRow;
    for (let i = 0; i < 30; i++) e.update(100, input(), false); // 3000ms = the rush
    expect(e.inspect().waveRow).toBe(waveRow);
    // altitude 3 → cadence 1100 − 30 = 1070ms; 1100ms of idle → exactly one rise.
    for (let i = 0; i < 11; i++) e.update(100, input(), false);
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
    const target = hopTargets(e.inspect().col)[0];
    e.debugSetRow(PLAYER_ROW - 1, rowWith({ [target]: CELL_CHAMOMILE }));
    const res2 = e.update(16, input("left"), false);
    expect(res2.phase).toBe("over");
    expect(res2.cause).toBe("sleep");
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
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm run test:run -- src/features/arcade/stay-awake/model/engine.test.ts`
Expected: FAIL — cannot resolve `./engine`.

- [ ] **Step 4: Write `engine.ts` (sim only)**

```ts
import type {
  CellKind,
  DeathCause,
  HopDir,
  PhaseStayAwake,
  StayAwakeInput,
  StayAwakeStep,
} from "./types";

/**
 * Headless STAY AWAKE engine — an endless vertical climber: the sloth sits on a
 * fixed screen row and every hop (up-left / up-right, wall-bounce straight up)
 * scrolls the tower down one row while a SLEEP WAVE rises from below on a timer.
 * All state + the sim + the canvas draw, with NO React (the Tetris/2048 split:
 * `useStayAwakeGame` owns one instance and the rAF loop; draw is imperative).
 * RNG is injected for deterministic tests.
 *
 * The LOGICAL world commits instantly on every hop; the short world-slide is
 * purely visual replay (`animate=false` — reduced motion — lands instantly).
 */

/** Well: 13 wide × 20 tall visible cells (deliberately wider than Tetris's 10). */
export const COLS = 13;
export const ROWS = 20;
/** The sloth's fixed screen row (~2/3 down the well). */
export const PLAYER_ROW = 13;
export const START_COL = 6;

export const COFFEE_VALUE = 25;
/** Every RUSH_EVERY-th coffee freezes the wave for RUSH_MS. */
export const RUSH_EVERY = 3;
export const RUSH_MS = 3000;
/** Chamomile trap: the wave surges this many rows up. */
export const SURGE_ROWS = 3;

/** Wave cadence: one row per `waveMs`, accelerating with altitude. */
export const WAVE_MS_START = 1100;
export const WAVE_MS_ACCEL = 10;
export const WAVE_MS_FLOOR = 450;
/** The wave's top edge starts this many rows below the sloth… */
export const WAVE_START_GAP = 6;
/** …and hops can push it at most this far back (pressure never fully escapes). */
export const WAVE_MAX_GAP = 8;

export const CELL_EMPTY = 0 as CellKind;
export const CELL_CACTUS = 1 as CellKind;
export const CELL_COFFEE = 2 as CellKind;
export const CELL_CHAMOMILE = 3 as CellKind;

// Difficulty ramp — cactus probability per cell, by altitude.
const CACTUS_P_BASE = 0.1;
const CACTUS_P_PER_ROW = 0.004;
const CACTUS_P_MAX = 0.32;
/** Chance a generated row carries one coffee. */
const COFFEE_ROW_P = 0.3;
/** Chance a generated row carries the chamomile trap (~1 per 40 rows). */
const CHAMOMILE_ROW_P = 1 / 40;
/** The first rows of a run are hazard-free — a gentle opening. */
const SAFE_OPENING_ROWS = 4;

/** Cap a single sim advance (a backgrounded tab hands us a huge dt on resume). */
const MAX_DT = 100;

/** Visual world-slide length (ms) after a hop — replay only, never logic. */
const SLIDE_MS = 90;

/**
 * The two cells a hop from column `c` can land on: `[left, right]`. At a wall
 * the blocked side maps to `c` itself — the wall bounce (straight up).
 */
export function hopTargets(c: number): [number, number] {
  return [c > 0 ? c - 1 : c, c < COLS - 1 ? c + 1 : c];
}

/**
 * Generate one new top row for the given altitude. Fairness invariant (the
 * head-exclusion analog): after generation, EVERY column keeps at least one
 * non-cactus hop target in this row — a wall of cactus can never seal a lane.
 * Chamomile counts as landable (its cost is the surge, not death).
 */
export function generateRow(altitude: number, rng: () => number): CellKind[] {
  const row: CellKind[] = Array(COLS).fill(CELL_EMPTY);
  if (altitude < SAFE_OPENING_ROWS) return row;

  const p = Math.min(CACTUS_P_MAX, CACTUS_P_BASE + altitude * CACTUS_P_PER_ROW);
  for (let c = 0; c < COLS; c++) {
    if (rng() < p) row[c] = CELL_CACTUS;
  }
  // Fairness fix-up: clearing only ever REMOVES cactus, so one pass suffices.
  for (let c = 0; c < COLS; c++) {
    const [l, r] = hopTargets(c);
    if (row[l] === CELL_CACTUS && row[r] === CELL_CACTUS) {
      row[rng() < 0.5 ? l : r] = CELL_EMPTY;
    }
  }

  const free = () => {
    const cells: number[] = [];
    for (let c = 0; c < COLS; c++) {
      if (row[c] === CELL_EMPTY) cells.push(c);
    }
    return cells;
  };
  const coffeeCells = free();
  if (coffeeCells.length > 0 && rng() < COFFEE_ROW_P) {
    row[coffeeCells[(rng() * coffeeCells.length) | 0]] = CELL_COFFEE;
  }
  const trapCells = free();
  if (trapCells.length > 0 && rng() < CHAMOMILE_ROW_P) {
    row[trapCells[(rng() * trapCells.length) | 0]] = CELL_CHAMOMILE;
  }
  return row;
}

export class StayAwakeEngine {
  /** rows[0] = the TOP visible row. The sloth lives at rows[PLAYER_ROW][col]. */
  private rows: CellKind[][] = [];

  private col = START_COL;
  private altitude = 0;
  private score = 0;
  private coffees = 0;
  private phase: PhaseStayAwake = "playing";
  private cause: DeathCause = null;

  /** Screen row index of the wave's top edge (below the field until it rises in). */
  private waveRow = PLAYER_ROW + WAVE_START_GAP;
  private waveAcc = 0;
  private rushMsLeft = 0;

  /** Draw-only frame counter (Z-glyph drift). */
  private frame = 0;
  // Visual world-slide replay after a hop.
  private slideT = SLIDE_MS;
  private slideFromCol = START_COL;

  constructor(private rng: () => number = Math.random) {}

  /** Reset to a fresh run. Rows above the sloth generate at altitude 0 — i.e.
   *  hazard-free (the safe opening); rows below are cosmetic and stay empty. */
  reset() {
    this.rows = Array.from({ length: ROWS }, (_, r) =>
      r < PLAYER_ROW
        ? generateRow(0, this.rng)
        : (Array(COLS).fill(CELL_EMPTY) as CellKind[])
    );
    this.col = START_COL;
    this.altitude = 0;
    this.score = 0;
    this.coffees = 0;
    this.phase = "playing";
    this.cause = null;
    this.waveRow = PLAYER_ROW + WAVE_START_GAP;
    this.waveAcc = 0;
    this.rushMsLeft = 0;
    this.slideT = SLIDE_MS;
    this.slideFromCol = START_COL;
  }

  /** Current wave cadence (ms per row) — accelerates with altitude to a floor. */
  private waveMs(): number {
    return Math.max(
      WAVE_MS_FLOOR,
      WAVE_MS_START - this.altitude * WAVE_MS_ACCEL
    );
  }

  /**
   * Advance by `dtMs`. Consumes the input's one-shot hop edge, then advances the
   * wave timer (frozen while an espresso rush runs). `animate` gates only the
   * decorative world-slide replay.
   */
  update(dtMs: number, input: StayAwakeInput, animate: boolean): StayAwakeStep {
    const dt = Math.min(dtMs, MAX_DT);
    this.frame++;

    if (input.dir) {
      const dir = input.dir;
      input.dir = null;
      if (this.phase === "playing") this.hop(dir, animate);
    }

    if (this.phase === "playing") {
      if (this.rushMsLeft > 0) {
        this.rushMsLeft = Math.max(0, this.rushMsLeft - dt);
      } else {
        this.waveAcc += dt;
        while (this.waveAcc >= this.waveMs() && this.phase === "playing") {
          this.waveAcc -= this.waveMs();
          this.waveRow -= 1;
          if (this.waveRow <= PLAYER_ROW) this.die("sleep");
        }
      }
    }

    if (this.slideT < SLIDE_MS)
      this.slideT = Math.min(SLIDE_MS, this.slideT + dt);

    return this.snapshot();
  }

  /** One hop: resolve the landing cell, then scroll the world down one row. */
  private hop(dir: HopDir, animate: boolean) {
    const [l, r] = hopTargets(this.col);
    const target = dir === "left" ? l : r;
    const landing = this.rows[PLAYER_ROW - 1][target];

    if (landing === CELL_CACTUS) {
      this.die("cactus");
      return;
    }

    this.slideFromCol = this.col;
    this.col = target;
    this.altitude += 1;
    this.score += 1;
    this.rows.pop();
    this.rows.unshift(generateRow(this.altitude, this.rng));
    // The climb buys one row of distance (capped so pressure never fully escapes).
    this.waveRow = Math.min(this.waveRow + 1, PLAYER_ROW + WAVE_MAX_GAP);

    // The landed cell now sits at PLAYER_ROW (the world just scrolled).
    if (landing === CELL_COFFEE) {
      this.score += COFFEE_VALUE;
      this.coffees += 1;
      if (this.coffees % RUSH_EVERY === 0) this.rushMsLeft = RUSH_MS;
      this.rows[PLAYER_ROW][target] = CELL_EMPTY;
    } else if (landing === CELL_CHAMOMILE) {
      this.rows[PLAYER_ROW][target] = CELL_EMPTY;
      this.waveRow -= SURGE_ROWS;
      if (this.waveRow <= PLAYER_ROW) {
        this.die("sleep");
        return;
      }
    }

    this.slideT = animate ? 0 : SLIDE_MS;
  }

  private die(cause: Exclude<DeathCause, null>) {
    this.phase = "over";
    this.cause = cause;
  }

  private snapshot(): StayAwakeStep {
    return {
      phase: this.phase,
      cause: this.cause,
      score: this.score,
      altitude: this.altitude,
      coffees: this.coffees,
      waveGap: Math.max(0, this.waveRow - PLAYER_ROW),
      rushMsLeft: this.rushMsLeft,
    };
  }

  // ---------- test access ----------

  /** Deep-copied state for tests/debug. */
  inspect() {
    return {
      rows: this.rows.map((row) => [...row]),
      col: this.col,
      altitude: this.altitude,
      score: this.score,
      coffees: this.coffees,
      phase: this.phase,
      cause: this.cause,
      waveRow: this.waveRow,
      waveMs: this.waveMs(),
      rushMsLeft: this.rushMsLeft,
    };
  }

  /** Test seam: overwrite one visible row (e.g. plant a cactus on a hop target). */
  debugSetRow(r: number, row: CellKind[]) {
    this.rows[r] = [...row];
  }

  /** Test seam: pin the wave's top edge to a screen row. */
  debugSetWaveRow(row: number) {
    this.waveRow = row;
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm run test:run -- src/features/arcade/stay-awake/model/engine.test.ts`
Expected: PASS (all).

- [ ] **Step 6: Gates**

Run: `npm run typecheck && npm run lint`
Expected: 0 errors. Do NOT commit.

---

### Task 2: Engine draw — theme palette, pixel sprites, wave haze

**Files:**

- Modify: `src/features/arcade/stay-awake/model/engine.ts` (append palette + sprites + draw)

**Interfaces:**

- Produces: `StayAwakePalette` (exported interface), `StayAwakeEngine.setPalette(p)`, `StayAwakeEngine.draw(ctx, cssW, cssH, dpr, animate)`. Consumed by `use-stay-awake-game.ts` (Task 4).

- [ ] **Step 1: Add the palette + sprite bitmaps (above the class)**

```ts
// ---------- palette ----------
//
// THEME-NATIVE (the Tetris/snake-classic pattern): the 2D context can't read CSS
// vars, so the hook resolves concrete colours from the live `--m-*` tokens and
// calls {@link StayAwakeEngine.setPalette} on mount + on every theme change.

export interface StayAwakePalette {
  /** Field fill ← `--m-bg`. */
  boardBg: string;
  /** Sloth body + Z glyph base ← `--m-fg`. */
  fg: string;
  /** Coffee + chamomile petals (the trap MUST read pickup-friendly) ← `--m-accent`. */
  accent: string;
  /** Cactus ← `--m-error`. */
  error: string;
  /** Sleep-wave haze ← `--m-muted`. */
  muted: string;
  /** Steam / flower stem / dim details ← `--m-muted2`. */
  muted2: string;
  /** Faint cell grid ← `--m-fg` at a low alpha. */
  gridLine: string;
  /** Resolved `--font-mono` stack for the drifting Z glyphs. */
  monoFont: string;
}

/** Dark-theme defaults so the first paint / SSR looks right before the hook
 *  resolves the live tokens. */
const DEFAULT_PALETTE: StayAwakePalette = {
  boardBg: "#181818",
  fg: "#dcdcdc",
  accent: "#cdff48",
  error: "#ff5d5d",
  muted: "#9a9a9a",
  muted2: "#7a7a7a",
  gridLine: "rgba(220,220,220,0.05)",
  monoFont: '"JetBrains Mono", ui-monospace, monospace',
};

// ---------- sprites ----------
//
// Pixel bitmaps, rasterised with integer device-pixel blocks (the rabbit-snake
// discipline) so they stay crisp at any cell size. Char → colour is resolved
// per sprite; '.' = transparent. The bitmaps are AUTHORING SEEDS — tune pixels
// freely at playtest, keeping the char→colour mapping.

/** Sloth, sitting: '1' body ← fg, 'E' eye patch ← boardBg. */
const SLOTH_SIT = [
  "..1111..",
  ".111111.",
  "1E1111E1",
  "11111111",
  ".111111.",
  ".1.11.1.",
  "..1111..",
  ".1....1.",
] as const;

/** Sloth, mid-hop: arms up. */
const SLOTH_HOP = [
  "1..11..1",
  "1.1111.1",
  "1E1111E1",
  "11111111",
  ".111111.",
  "..1111..",
  ".1....1.",
  "1......1",
] as const;

/** Cactus: '1' ← error. */
const CACTUS_SPRITE = [
  "..111..",
  "..111..",
  "1.111.1",
  "1.111.1",
  "1111111",
  "..111..",
  "..111..",
  "..111..",
] as const;

/** Coffee cup: '1' cup ← accent, 'S' steam ← muted2. */
const COFFEE_SPRITE = [
  ".S..S..",
  "..S..S.",
  ".......",
  "111111.",
  "1111111",
  "111111.",
  ".11111.",
] as const;

/** Chamomile: 'P' petals ← accent (the trap reads as a pickup), 'C' core ← fg,
 *  'S' stem ← muted2. */
const CHAMOMILE_SPRITE = [
  "..P.P..",
  ".P.P.P.",
  "..PCP..",
  ".P.P.P.",
  "..P.P..",
  "...S...",
  "...S...",
] as const;

/** Figure box as a fraction of the cell. */
const SPRITE_FILL = 0.86;
/** Sleep-haze fill alpha over the field. */
const WAVE_HAZE_ALPHA = 0.32;
/** Drifting Z glyphs above the wave edge. */
const WAVE_GLYPHS = 3;
```

- [ ] **Step 2: Add palette state + `setPalette` to the class**

Inside `StayAwakeEngine`, next to the visual fields:

```ts
  /** Live theme palette; dark defaults until the hook resolves the tokens. */
  private palette: StayAwakePalette = DEFAULT_PALETTE;
```

And the method (next to `reset`):

```ts
  /** Swap the draw palette — the hook calls this on mount AND on every theme
   *  change (the rAF loop repaints every frame, so the next frame picks it up). */
  setPalette(palette: StayAwakePalette) {
    this.palette = palette;
  }
```

- [ ] **Step 3: Add the draw methods (inside the class)**

```ts
  // ---------- canvas draw ----------
  //
  // DPR-aware crisp rendering: the hook sizes the backing store = CSS size × dpr
  // and pre-scales the ctx, so we reason in CSS px; sprite blocks are computed in
  // device px and converted back (÷dpr) so every bit lands on whole device pixels.

  /** Faint interior cell grid (the outer frame is the canvas's 2px CSS border). */
  private drawGrid(ctx: CanvasRenderingContext2D, cssW: number, cssH: number) {
    const cell = cssW / COLS;
    ctx.strokeStyle = this.palette.gridLine;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < COLS; i++) {
      const p = Math.round(i * cell) + 0.5;
      ctx.moveTo(p, 0);
      ctx.lineTo(p, cssH);
    }
    for (let i = 1; i < ROWS; i++) {
      const p = Math.round(i * cell) + 0.5;
      ctx.moveTo(0, p);
      ctx.lineTo(cssW, p);
    }
    ctx.stroke();
  }

  /**
   * One pixel-bitmap sprite centred in cell (x, y) — integer device-pixel block
   * per bit (≥1) so the figure is always crisp and never rounds away. `x`/`y`
   * accept fractions (the hop/world-slide interpolation).
   */
  private drawSprite(
    ctx: CanvasRenderingContext2D,
    cell: number,
    dpr: number,
    x: number,
    y: number,
    sprite: readonly string[],
    resolve: (ch: string) => string | null
  ) {
    const sw = sprite[0].length;
    const sh = sprite.length;
    const boxDev = cell * SPRITE_FILL * dpr;
    const block = Math.max(1, Math.floor(boxDev / Math.max(sw, sh)));
    const cellDev = cell * dpr;
    const leftDev = Math.round(x * cellDev + (cellDev - block * sw) / 2);
    const topDev = Math.round(y * cellDev + (cellDev - block * sh) / 2);
    ctx.imageSmoothingEnabled = false;
    for (let r = 0; r < sh; r++) {
      for (let c = 0; c < sw; c++) {
        const color = resolve(sprite[r][c]);
        if (!color) continue;
        ctx.fillStyle = color;
        ctx.fillRect(
          (leftDev + c * block) / dpr,
          (topDev + r * block) / dpr,
          block / dpr,
          block / dpr
        );
      }
    }
  }

  private cellResolver(kind: CellKind): {
    sprite: readonly string[];
    resolve: (ch: string) => string | null;
  } | null {
    const p = this.palette;
    if (kind === CELL_CACTUS) {
      return {
        sprite: CACTUS_SPRITE,
        resolve: (ch) => (ch === "1" ? p.error : null),
      };
    }
    if (kind === CELL_COFFEE) {
      return {
        sprite: COFFEE_SPRITE,
        resolve: (ch) => (ch === "1" ? p.accent : ch === "S" ? p.muted2 : null),
      };
    }
    if (kind === CELL_CHAMOMILE) {
      return {
        sprite: CHAMOMILE_SPRITE,
        resolve: (ch) =>
          ch === "P" ? p.accent : ch === "C" ? p.fg : ch === "S" ? p.muted2 : null,
      };
    }
    return null;
  }

  /** The sleep wave: a translucent haze from its (sub-row interpolated) edge to
   *  the bottom, plus drifting Z glyphs above the edge. Rush = accent edge. */
  private drawWave(
    ctx: CanvasRenderingContext2D,
    cell: number,
    cssW: number,
    cssH: number,
    worldOff: number,
    animate: boolean
  ) {
    const p = this.palette;
    // Smooth rise between ticks with animation; discrete steps without.
    const progress =
      animate && this.rushMsLeft === 0 ? this.waveAcc / this.waveMs() : 0;
    const edgeY = (this.waveRow - progress) * cell + worldOff;
    if (edgeY >= cssH) return;

    const top = Math.max(0, edgeY);
    ctx.globalAlpha = WAVE_HAZE_ALPHA;
    ctx.fillStyle = p.muted;
    ctx.fillRect(0, top, cssW, cssH - top);
    ctx.globalAlpha = 1;

    // The edge line — accent while an espresso rush freezes the wave.
    ctx.fillStyle = this.rushMsLeft > 0 ? p.accent : p.muted;
    ctx.fillRect(0, Math.round(top), cssW, 2);

    // Z glyphs drifting up from the haze (frozen mid-drift under reduced motion).
    ctx.font = `700 ${Math.round(cell * 0.9)}px ${p.monoFont}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = p.muted;
    for (let i = 0; i < WAVE_GLYPHS; i++) {
      const drift = animate ? ((this.frame * 0.5 + i * 40) % 80) / 80 : 0.5;
      const gx = cssW * ((i + 0.5) / WAVE_GLYPHS);
      const gy = top - drift * cell * 1.6 - 4;
      ctx.globalAlpha = 0.7 * (1 - drift * 0.6);
      if (gy > 0) ctx.fillText("Z", gx, gy);
    }
    ctx.globalAlpha = 1;
  }

  /** Paint the board: field → grid → cells → sloth → wave haze. */
  draw(
    ctx: CanvasRenderingContext2D,
    cssW: number,
    cssH: number,
    dpr: number,
    animate: boolean
  ) {
    const cell = cssW / COLS; // === cssH / ROWS (square cells, pinned aspect)
    const p = this.palette;
    ctx.fillStyle = p.boardBg;
    ctx.fillRect(0, 0, cssW, cssH);
    this.drawGrid(ctx, cssW, cssH);

    // World-slide replay: rows (and the wave) settle DOWN into place; the sloth
    // eases across from its previous column with a small hop bob.
    const t = this.slideT >= SLIDE_MS ? 1 : this.slideT / SLIDE_MS;
    const ease = 1 - (1 - t) ** 3;
    const worldOff = -(1 - ease) * cell;

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const drawn = this.cellResolver(this.rows[r][c]);
        if (!drawn) continue;
        this.drawSprite(
          ctx,
          cell,
          dpr,
          c,
          r + worldOff / cell,
          drawn.sprite,
          drawn.resolve
        );
      }
    }

    const slothX = this.slideFromCol + (this.col - this.slideFromCol) * ease;
    const bob = t < 1 ? -0.22 * Math.sin(Math.PI * ease) : 0;
    const pose = t < 1 ? SLOTH_HOP : SLOTH_SIT;
    this.drawSprite(ctx, cell, dpr, slothX, PLAYER_ROW + bob, pose, (ch) =>
      ch === "1" ? p.fg : ch === "E" ? p.boardBg : null
    );

    this.drawWave(ctx, cell, cssW, cssH, worldOff, animate);
  }
```

- [ ] **Step 4: Re-run engine tests + gates**

Run: `npm run test:run -- src/features/arcade/stay-awake/model/engine.test.ts && npm run typecheck && npm run lint`
Expected: tests PASS, 0 errors. Do NOT commit.

---

### Task 3: Data layer — keys, leaderboard shaping, score history, query hooks

**Files:**

- Create: `src/features/arcade/stay-awake/model/arcade-keys.ts`
- Create: `src/features/arcade/stay-awake/model/leaderboard.ts`
- Create: `src/features/arcade/stay-awake/model/score-history.ts`
- Create: `src/features/arcade/stay-awake/model/use-stay-awake-leaderboard.ts`
- Create: `src/features/arcade/stay-awake/model/use-submit-score.ts`
- Create: `src/features/arcade/stay-awake/model/use-my-arcade-stats.ts`

**Interfaces:**

- Consumes: `apiClient.arcade.*` from `@/shared/api/api-client`; `RankedRow`, `HistoryPoint` from `./types` (Task 1).
- Produces: `GAME_STAY_AWAKE = "stay-awake"`, `LEADERBOARD_TAKE = 10`, `arcadeKeys`, `rankApiBoard(entries, viewerHandle?)`, `HISTORY_RECENT`, `loadHistory()`, `recordScore(prev, score)`, `recentSeries(history)`, `useStayAwakeLeaderboard()`, `useSubmitScore()`, `useMyArcadeStats()`.

These are the snake-classic files with the game key + storage key + doc references swapped. Deliberate near-duplicates — FSD keeps each arcade slice self-contained (every title has done the same).

- [ ] **Step 1: `arcade-keys.ts`**

```ts
/**
 * Query-key factory + game key for the Stay Awake arcade. Mirrors the other
 * arcade features' factory shape intentionally (kept local so the feature stays
 * self-contained — FSD: features don't import each other). Keys carry `game`,
 * so the `"stay-awake"` cache never collides with the other titles.
 */
export const arcadeKeys = {
  all: ["arcade"] as const,
  leaderboard: (game: string, take: number) =>
    [...arcadeKeys.all, "leaderboard", game, take] as const,
  myStats: (game: string) => [...arcadeKeys.all, "my-stats", game] as const,
};

/** The backend `game` key (a free string server-side). */
export const GAME_STAY_AWAKE = "stay-awake";

/** Leaderboard rows requested — matches the board's pad-to-10. */
export const LEADERBOARD_TAKE = 10;
```

- [ ] **Step 2: `leaderboard.ts`**

Copy `src/features/arcade/snake-classic/model/leaderboard.ts` VERBATIM (whole file), changing only doc references: `?game=snake-classic` → `?game=stay-awake`, and any "Snake (classic)" wording → "Stay Awake". The code (`BOARD_SIZE`, `rankApiBoard` incl. viewer flag + pad-to-10) is identical. (`formatScore` lives in `@/features/arcade/shared` — keep whatever import shape the snake-classic file uses.)

- [ ] **Step 3: `score-history.ts`**

Copy `src/features/arcade/snake-classic/model/score-history.ts` VERBATIM, changing only:

- the header doc: "Classic Snake score history" → "Stay Awake score history"
- `const KEY_HISTORY = "notlazy_snake_classic_history_v1";` → `const KEY_HISTORY = "notlazy_stay_awake_history_v1";`

- [ ] **Step 4: the three query hooks**

`use-stay-awake-leaderboard.ts`:

```ts
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";
import { arcadeKeys, GAME_STAY_AWAKE, LEADERBOARD_TAKE } from "./arcade-keys";

/** Global Stay Awake high-score board (top {@link LEADERBOARD_TAKE}, cross-user).
 *  Long `staleTime`; a finished run invalidates it (`useSubmitScore`). */
export function useStayAwakeLeaderboard() {
  return useQuery({
    queryKey: arcadeKeys.leaderboard(GAME_STAY_AWAKE, LEADERBOARD_TAKE),
    queryFn: () =>
      apiClient.arcade.getLeaderboard({
        game: GAME_STAY_AWAKE,
        take: LEADERBOARD_TAKE,
      }),
    staleTime: 60_000,
  });
}
```

`use-submit-score.ts`:

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";
import { arcadeKeys, GAME_STAY_AWAKE, LEADERBOARD_TAKE } from "./arcade-keys";

/**
 * Submit a run's score under `game: "stay-awake"` (the backend keys on the free
 * `game` string, so the same endpoint serves every arcade title). The POST
 * returns fresh stats, seeded into the my-stats cache; the leaderboard is
 * invalidated. A failed submit must not interrupt play (the caller swallows it).
 */
export function useSubmitScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (score: number) =>
      apiClient.arcade.submitScore({
        submitScoreRequest: { score, game: GAME_STAY_AWAKE },
      }),

    onSuccess: (stats) => {
      queryClient.setQueryData(arcadeKeys.myStats(GAME_STAY_AWAKE), stats);
      queryClient.invalidateQueries({
        queryKey: arcadeKeys.leaderboard(GAME_STAY_AWAKE, LEADERBOARD_TAKE),
      });
      queryClient.invalidateQueries({
        queryKey: arcadeKeys.myStats(GAME_STAY_AWAKE),
        refetchType: "none",
      });
    },
  });
}
```

`use-my-arcade-stats.ts`:

```ts
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";
import { arcadeKeys, GAME_STAY_AWAKE } from "./arcade-keys";

/** Viewer's Stay Awake stats (`bestScore`/`gamesPlayed`/`rank`; `rank` is null
 *  until the first run). Long `staleTime` — refreshed by the submit invalidation. */
export function useMyArcadeStats() {
  return useQuery({
    queryKey: arcadeKeys.myStats(GAME_STAY_AWAKE),
    queryFn: () => apiClient.arcade.getMyArcadeStats({ game: GAME_STAY_AWAKE }),
    staleTime: 60_000,
  });
}
```

Before finishing: open `src/features/arcade/snake-classic/model/use-submit-score.ts` and diff against the block above — if the repo version's option names/shape differ, follow the REPO version (swapping the game key). The repo is the source of truth for the apiClient call shape.

- [ ] **Step 5: Gates**

Run: `npm run typecheck && npm run lint`
Expected: 0 errors. Do NOT commit.

---

### Task 4: `useStayAwakeGame` hook — rAF loop, palette, keyboard, hop API

**Files:**

- Create: `src/features/arcade/stay-awake/model/use-stay-awake-game.ts`

**Interfaces:**

- Consumes: `StayAwakeEngine`, `COLS`, `ROWS`, `StayAwakePalette` (Tasks 1-2); `loadHistory`/`recordScore`/`recentSeries` (Task 3); types (Task 1).
- Produces: `useStayAwakeGame(options?: UseStayAwakeGameOptions): StayAwakeGameApi` — consumed by `use-stay-awake-arcade.ts` (Task 5).

- [ ] **Step 1: Write the hook**

```ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/shared/lib/prefers-reduced-motion";
import {
  COLS,
  ROWS,
  StayAwakeEngine,
  WAVE_START_GAP,
  type StayAwakePalette,
} from "./engine";
import { loadHistory, recentSeries, recordScore } from "./score-history";
import type {
  HistoryPoint,
  HopDir,
  StayAwakeGameApi,
  StayAwakeInput,
  StayAwakeState,
  UseStayAwakeGameOptions,
} from "./types";

/** rAF is throttled in background tabs; this ticker keeps the wave honest. */
const FALLBACK_MS = 120;
const FALLBACK_GAP = 180;

const INITIAL_STATE: StayAwakeState = {
  screen: "menu",
  paused: false,
  score: 0,
  altitude: 0,
  coffees: 0,
  cause: null,
  waveGap: WAVE_START_GAP,
  rushActive: false,
  best: 0,
  isNewBest: false,
  rank: 0,
};

/** Parse `#rgb` / `#rrggbb` → `[r,g,b]`; falls back to a light gray. */
function parseHexRgb(hex: string): [number, number, number] {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  if (h.length !== 6 || Number.isNaN(n)) return [220, 220, 220];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Resolve the theme-native draw palette from the live `--m-*` tokens (custom
 *  props inherit, so reading the canvas works). Same grid-alpha trick as the
 *  other boards: a hair more alpha when fg is dark (light theme). */
function resolvePalette(el: Element): StayAwakePalette {
  const cs = getComputedStyle(el);
  const read = (name: string, fallback: string) =>
    cs.getPropertyValue(name).trim() || fallback;
  const [r, g, b] = parseHexRgb(read("--m-fg", "#dcdcdc"));
  const alpha = r + g + b < 384 ? 0.07 : 0.05;
  return {
    boardBg: read("--m-bg", "#181818"),
    fg: read("--m-fg", "#dcdcdc"),
    accent: read("--m-accent", "#cdff48"),
    error: read("--m-error", "#ff5d5d"),
    muted: read("--m-muted", "#9a9a9a"),
    muted2: read("--m-muted2", "#7a7a7a"),
    gridLine: `rgba(${r},${g},${b},${alpha})`,
    monoFont: read("--font-mono", '"JetBrains Mono", ui-monospace, monospace'),
  };
}

/** Map a key event to a hop, or null. WASD via `e.code` (layout-proof). */
function hopFor(code: string, key: string): HopDir | null {
  if (code === "KeyA" || key === "ArrowLeft") return "left";
  if (code === "KeyD" || key === "ArrowRight") return "right";
  return null;
}

/**
 * STAY AWAKE as a React hook. Owns one {@link StayAwakeEngine}, drives it with a
 * wall-clock delta over rAF (+ a throttled-tab fallback), wires keyboard (one-shot
 * hop edges, Space pause) and exposes `hop()` for the board's tap zones, resolves
 * the theme palette, draws imperatively, and projects engine outcomes onto React
 * state ONLY on discrete changes (never per frame — rushMsLeft is coarsened to a
 * boolean). Full teardown. Mirrors the Tetris/2048 lifecycle discipline.
 */
export function useStayAwakeGame({
  best = 0,
  onGameOver,
}: UseStayAwakeGameOptions = {}): StayAwakeGameApi {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const leftPanelRef = useRef<HTMLDivElement | null>(null);
  const rightPanelRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<StayAwakeEngine | null>(null);
  const getEngine = () => {
    engineRef.current ??= new StayAwakeEngine();
    return engineRef.current;
  };

  const [state, setState] = useState<StayAwakeState>(INITIAL_STATE);
  const [history, setHistory] = useState<HistoryPoint[]>(() =>
    recentSeries([])
  );

  // Mutable mirrors so the loop / key handler read fresh values without re-subscribing.
  const screenRef = useRef(state.screen);
  const pausedRef = useRef(state.paused);
  const bestRef = useRef(best);
  const onGameOverRef = useRef(onGameOver);
  const historyRef = useRef<number[]>([]);
  /** One-shot guard: the engine reports `over` every frame until React commits. */
  const endedRef = useRef(false);

  useEffect(() => {
    screenRef.current = state.screen;
    pausedRef.current = state.paused;
  }, [state.screen, state.paused]);

  useEffect(() => {
    bestRef.current = best;
    onGameOverRef.current = onGameOver;
  }, [best, onGameOver]);

  // Reflect the incoming server best into state. Deferred via rAF — repo lint
  // rule: no synchronous setState inside an effect.
  useEffect(() => {
    const raf = requestAnimationFrame(() =>
      setState((s) => (s.best === best ? s : { ...s, best }))
    );
    return () => cancelAnimationFrame(raf);
  }, [best]);

  // Hydrate the sparkline log from localStorage on mount (deferred via rAF).
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const log = loadHistory();
      historyRef.current = log;
      setHistory(recentSeries(log));
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  // One-shot hop edge the loop feeds the engine (consumed there).
  const inputRef = useRef<StayAwakeInput>({ dir: null });

  const start = useCallback(() => {
    getEngine().reset();
    inputRef.current.dir = null;
    endedRef.current = false;
    setState((s) => ({
      ...s,
      screen: "playing",
      paused: false,
      score: 0,
      altitude: 0,
      coffees: 0,
      cause: null,
      waveGap: WAVE_START_GAP,
      rushActive: false,
      isNewBest: false,
      rank: 0,
    }));
  }, []);

  const hop = useCallback((dir: HopDir) => {
    if (screenRef.current !== "playing" || pausedRef.current) return;
    inputRef.current.dir = dir;
  }, []);

  const togglePause = useCallback(() => {
    if (screenRef.current !== "playing") return;
    setState((s) => ({ ...s, paused: !s.paused }));
  }, []);

  // Fires exactly ONCE per run (see endedRef).
  const handleGameOver = useCallback((score: number) => {
    const log = recordScore(historyRef.current, score);
    historyRef.current = log;
    setHistory(recentSeries(log));
    onGameOverRef.current?.(score);
    setState((s) => ({
      ...s,
      screen: "over",
      isNewBest: score > 0 && score > bestRef.current,
    }));
  }, []);

  // ---------- the loop ----------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const engine = getEngine();

    // DPR-aware backing store; the well is JS-sized to an EXACT 13×20 multiple
    // of a square cell (the Tetris discipline). Measured from the flex ROW minus
    // its padding, the two column gaps and both side panels' widths.
    let cssW = 0;
    let cssH = 0;
    let dpr = 1;

    const host = canvas.parentElement;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      let availH = 480;
      let availW = Infinity;
      if (host) {
        const cs = getComputedStyle(host);
        const padX =
          parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) || 0;
        const padY =
          parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) || 0;
        const gap = parseFloat(cs.columnGap || cs.gap || "0") || 0;
        const panelsW =
          (leftPanelRef.current?.offsetWidth ?? 0) +
          (rightPanelRef.current?.offsetWidth ?? 0);
        availH = Math.max(0, host.clientHeight - padY);
        availW = Math.max(0, host.clientWidth - padX - gap * 2 - panelsW);
      }
      const hLimit = availH > 0 ? availH / ROWS : Infinity;
      const wLimit = availW > 0 ? availW / COLS : Infinity;
      let cell = Math.min(hLimit, wLimit);
      if (!Number.isFinite(cell) || cell <= 0) cell = 24;
      cssW = cell * COLS;
      cssH = cell * ROWS;
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    // THEME-NATIVE palette: resolve from the live tokens, re-resolve when `.dark`
    // flips on <html>; the rAF loop repaints every frame so no forced redraw needed.
    engine.setPalette(resolvePalette(canvas));
    const themeObserver = new MutationObserver(() => {
      engine.setPalette(resolvePalette(canvas));
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const ro = new ResizeObserver(() => resize());
    if (host) ro.observe(host);

    let last = performance.now();
    let lastFrame = last;
    let rafId = 0;

    const tick = (now: number) => {
      lastFrame = now;
      const dt = now - last;
      last = now;
      const animate = !prefersReducedMotion();

      if (
        screenRef.current === "playing" &&
        !pausedRef.current &&
        !endedRef.current
      ) {
        const res = engine.update(dt, inputRef.current, animate);
        if (res.phase === "over") {
          endedRef.current = true;
          setState((s) => ({
            ...s,
            score: res.score,
            altitude: res.altitude,
            coffees: res.coffees,
            cause: res.cause,
            waveGap: res.waveGap,
            rushActive: false,
          }));
          handleGameOver(res.score);
        } else {
          const rushActive = res.rushMsLeft > 0;
          setState((s) =>
            s.score === res.score &&
            s.altitude === res.altitude &&
            s.coffees === res.coffees &&
            s.waveGap === res.waveGap &&
            s.rushActive === rushActive
              ? s
              : {
                  ...s,
                  score: res.score,
                  altitude: res.altitude,
                  coffees: res.coffees,
                  waveGap: res.waveGap,
                  rushActive,
                }
          );
        }
      }
      // Always repaint (menu / over draw the static field too).
      engine.draw(ctx, cssW, cssH, dpr, animate);
    };

    const loop = (now: number) => {
      rafId = requestAnimationFrame(loop);
      tick(now);
    };
    rafId = requestAnimationFrame(loop);

    const fallback = window.setInterval(() => {
      const now = performance.now();
      if (now - lastFrame > FALLBACK_GAP) tick(now);
    }, FALLBACK_MS);

    return () => {
      cancelAnimationFrame(rafId);
      window.clearInterval(fallback);
      ro.disconnect();
      themeObserver.disconnect();
    };
  }, [handleGameOver]);

  // ---------- keyboard ----------
  useEffect(() => {
    const isStart = (c: string, k: string) =>
      c === "Enter" || c === "Space" || k === " ";

    const onKeyDown = (e: KeyboardEvent) => {
      // Never hijack typing in a field (defensive — no inputs on the page).
      const el = e.target as HTMLElement | null;
      if (
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.isContentEditable)
      ) {
        return;
      }
      const dir = hopFor(e.code, e.key);
      if (dir || e.key === " ") e.preventDefault();

      const screen = screenRef.current;
      if (screen === "menu" || screen === "over") {
        if (isStart(e.code, e.key)) start();
        return;
      }
      if (isStart(e.code, e.key)) {
        togglePause();
        return;
      }
      if (dir) hop(dir);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [start, hop, togglePause]);

  return {
    state,
    canvasRef,
    leftPanelRef,
    rightPanelRef,
    history,
    start,
    hop,
  };
}
```

- [ ] **Step 2: Gates**

Run: `npm run typecheck && npm run lint`
Expected: 0 errors. Do NOT commit.

---

### Task 5: Board UI — well + side panels + overlays; leaderboard; orchestrator; barrel

**Files:**

- Create: `src/features/arcade/stay-awake/ui/stay-awake-board.tsx`
- Create: `src/features/arcade/stay-awake/ui/stay-awake-leaderboard.tsx`
- Create: `src/features/arcade/stay-awake/ui/use-stay-awake-arcade.ts`
- Create: `src/features/arcade/stay-awake/index.ts`

**Interfaces:**

- Consumes: `StayAwakeGameApi` (Task 1 types), `WAVE_MAX_GAP`/`RUSH_EVERY` (Task 1 engine), shared overlay kit from `@/features/arcade/shared`, query hooks (Task 3), `useStayAwakeGame` (Task 4).
- Produces: `StayAwakeBoard({ api })`, `StayAwakeLeaderboard({ board, loading })`, `useStayAwakeArcade(options?): StayAwakeArcadeApi`, barrel exports (consumed by the route page, Task 6).

- [ ] **Step 1: Write `stay-awake-board.tsx`**

```tsx
"use client";

import type { PointerEvent } from "react";
import {
  CornerBrackets,
  GameOverOverlay,
  MenuOverlay,
  PauseOverlay,
} from "@/features/arcade/shared";
import { RUSH_EVERY, WAVE_MAX_GAP } from "../model/engine";
import type { StayAwakeGameApi, StayAwakeState } from "../model/types";

/** Control reference — shown in the menu overlay. The GOAL row doubles as the
 *  approved menu subtitle (owner copy). */
const KEY_HINTS: [string, string][] = [
  ["GOAL", "The floor is sleep. Keep hopping."],
  ["HOP", "← →  /  A D  ·  tap a side"],
  ["PAUSE", "SPACE"],
];

/** Approved game-over lines (owner copy, 2026-07-03). */
const CAUSE_LINES = {
  cactus: "SAT ON A CACTUS.",
  sleep: "CAUGHT NAPPING.",
} as const;

/** Side-panel label — the 11px/0.12em data-label tier (muted2, like the field
 *  labels and every stat-block label). */
function PanelLabel({ children }: { children: string }) {
  return (
    <div className="text-[11px] uppercase leading-[1.2] tracking-[0.12em] text-[var(--m-muted2)]">
      {children}
    </div>
  );
}

/** Left panel: coffee pips — fill toward the next espresso rush; all-accent
 *  while a rush runs. */
function CoffeePips({ state }: { state: StayAwakeState }) {
  const filled = state.rushActive ? RUSH_EVERY : state.coffees % RUSH_EVERY;
  return (
    <div className="flex flex-col items-center gap-2">
      <PanelLabel>{state.rushActive ? "RUSH" : "FUEL"}</PanelLabel>
      <div className="flex flex-col gap-2">
        {Array.from({ length: RUSH_EVERY }, (_, i) => (
          <span
            key={i}
            className={`block size-4 border-2 ${
              i < filled
                ? "border-[var(--m-accent)] bg-[var(--m-accent)]"
                : "border-[var(--m-dim)]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/** Right panel: sleep-wave proximity meter — fills as the wave closes in;
 *  error when it's 2 rows out, accent while a rush freezes it. */
function WaveMeter({ state }: { state: StayAwakeState }) {
  const closeness = Math.min(1, Math.max(0, 1 - state.waveGap / WAVE_MAX_GAP));
  const fill = state.rushActive
    ? "bg-[var(--m-accent)]"
    : state.waveGap <= 2
      ? "bg-[var(--m-error)]"
      : "bg-[var(--m-muted2)]";
  return (
    <div className="flex h-full flex-col items-center gap-2 py-5">
      <PanelLabel>ZZZ</PanelLabel>
      <div className="relative w-4 flex-1 border-2 border-[var(--m-dim)]">
        <div
          className={`absolute bottom-0 left-0 right-0 ${fill}`}
          style={{ height: `${Math.round(closeness * 100)}%` }}
        />
      </div>
    </div>
  );
}

/**
 * The STAY AWAKE play surface — the DPR-crisp 13×20 well canvas centred in the
 * shared aspect-[30/18] board footprint, flanked by the coffee pips (left) and
 * the sleep-wave meter (right), + the DOM overlays. Tap zones: pointer-down on
 * either half of the board = a hop that way (tap, not swipe — zero gesture
 * latency). Pure presentation: the hook owns all logic.
 *
 * THEME-NATIVE: NO forced `dark` scope — board, panels and overlays read the
 * AMBIENT `--m-*` tokens; the canvas palette is resolved in the hook.
 */
export function StayAwakeBoard({ api }: { api: StayAwakeGameApi }) {
  const { state, canvasRef, leftPanelRef, rightPanelRef, start, hop } = api;

  const rankLine =
    state.rank > 0
      ? `Ranked #${state.rank} on the board`
      : "Off the board — climb higher";
  const causeLine = state.cause ? CAUSE_LINES[state.cause] : "";

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (state.screen !== "playing" || state.paused) return;
    const rect = e.currentTarget.getBoundingClientRect();
    hop(e.clientX - rect.left < rect.width / 2 ? "left" : "right");
  };

  return (
    <div className="mono-scope relative w-full overflow-hidden">
      {/* aspect-[30/18] = the shared arcade board footprint; p-5 stages the well
          inside the CornerBrackets; gap-10 = the Tetris panel separation. */}
      <div
        className="flex aspect-[30/18] w-full touch-none items-stretch justify-center gap-10 p-5"
        onPointerDown={onPointerDown}
      >
        <div ref={leftPanelRef} className="shrink-0 self-center">
          <CoffeePips state={state} />
        </div>

        {/* The well: JS-sized to an EXACT 13×20 cell multiple; aspect/h-full are
            only the pre-hydration fallback — inline w/h override them. */}
        <canvas
          ref={canvasRef}
          aria-label="Stay Awake board. Left and Right arrows or A/D to hop; on touch, tap either side. Space to pause. Don't let the sleep wave catch the sloth."
          role="img"
          className="block h-full self-center border-2 border-[var(--m-dim)] [aspect-ratio:13/20]"
        />

        <div ref={rightPanelRef} className="shrink-0 self-stretch">
          <WaveMeter state={state} />
        </div>
      </div>

      <CornerBrackets />

      {state.screen === "menu" && (
        <MenuOverlay title="Stay Awake" onStart={start} hints={KEY_HINTS} />
      )}

      {state.screen === "playing" && state.paused && (
        <PauseOverlay hint="Space to resume — the wave waits, this once" />
      )}

      {state.screen === "over" && (
        <GameOverOverlay
          isNewBest={state.isNewBest}
          score={state.score}
          detail={`${causeLine} ${state.altitude} rows · ${rankLine}`}
          onRestart={start}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: `stay-awake-leaderboard.tsx`**

Copy `src/features/arcade/snake-classic/ui/snake-classic-leaderboard.tsx` VERBATIM, with exactly these changes:

- component `SnakeClassicLeaderboard` → `StayAwakeLeaderboard`
- any "Snake"/"snake" wording in docs/aria strings → "Stay Awake"
- keep every class string, layout and skeleton row byte-identical (one leaderboard language across the arcade).

- [ ] **Step 3: `use-stay-awake-arcade.ts`**

```ts
"use client";

import { useCallback, useMemo } from "react";
import { useUser } from "@/entities/session";
import { useStayAwakeGame } from "../model/use-stay-awake-game";
import { rankApiBoard } from "../model/leaderboard";
import { useStayAwakeLeaderboard } from "../model/use-stay-awake-leaderboard";
import { useMyArcadeStats } from "../model/use-my-arcade-stats";
import { useSubmitScore } from "../model/use-submit-score";
import type {
  RankedRow,
  StayAwakeGameApi,
  UseStayAwakeGameOptions,
} from "../model/types";

export interface StayAwakeArcadeApi {
  /** The engine hook — but with server-truth `best` + `rank` merged into state. */
  game: StayAwakeGameApi;
  /** The ranked, padded leaderboard board (server entries + viewer highlight). */
  board: RankedRow[];
  /** The viewer's best/rank query is on its FIRST load — show a skeleton, not 0. */
  statsLoading: boolean;
  /** The leaderboard query is on its FIRST load — show skeleton rows. */
  boardLoading: boolean;
}

/**
 * Page orchestrator + data layer: wraps the engine hook and wires it to the
 * backend (leaderboard, my-stats, submit-score). A failed submit is swallowed so
 * the game never stalls.
 */
export function useStayAwakeArcade(
  options?: UseStayAwakeGameOptions
): StayAwakeArcadeApi {
  const { user } = useUser();
  const viewerHandle = user?.userName;

  const leaderboard = useStayAwakeLeaderboard();
  const myStats = useMyArcadeStats();
  const submitScore = useSubmitScore();

  const best = myStats.data?.bestScore ?? 0;
  // `rank` is null until the first run; the board treats 0 as "off the board".
  const rank = myStats.data?.rank ?? 0;

  const onGameOver = useCallback(
    (score: number) => {
      submitScore.mutate(score, {
        onError: (error) => {
          console.error("Stay Awake: score submit failed", error);
        },
      });
    },
    [submitScore]
  );

  const game = useStayAwakeGame({ ...options, best, onGameOver });

  const mergedGame = useMemo<StayAwakeGameApi>(
    () => ({ ...game, state: { ...game.state, best, rank } }),
    [game, best, rank]
  );

  const board = useMemo(
    () => rankApiBoard(leaderboard.data?.entries ?? [], viewerHandle),
    [leaderboard.data, viewerHandle]
  );

  return {
    game: mergedGame,
    board,
    // Gate on `data === undefined`, NOT `isLoading` (idle/errored queries report
    // isLoading=false while holding no data → would flash a misleading 0).
    statsLoading: myStats.data === undefined,
    boardLoading: leaderboard.data === undefined,
  };
}
```

- [ ] **Step 4: barrel `index.ts`**

```ts
export { useStayAwakeArcade } from "./ui/use-stay-awake-arcade";
export type { StayAwakeArcadeApi } from "./ui/use-stay-awake-arcade";
export { StayAwakeBoard } from "./ui/stay-awake-board";
export { StayAwakeLeaderboard } from "./ui/stay-awake-leaderboard";
export { SlothMark } from "./ui/sloth-mark";
export { HISTORY_RECENT } from "./model/score-history";
```

(`sloth-mark.tsx` lands in Task 6 — the barrel line is written now so the file compiles once Task 6 adds it; if running tasks strictly in order and the gate complains, add the `SlothMark` line in Task 6 instead.)

- [ ] **Step 5: Gates**

Run: `npm run typecheck && npm run lint`
Expected: 0 errors (see the barrel note above if `sloth-mark` is not yet created — move that one export line to Task 6). Do NOT commit.

---

### Task 6: Hub mark, route pages, hub registration

**Files:**

- Create: `src/features/arcade/stay-awake/ui/sloth-mark.tsx`
- Create: `src/app/arcade/stay-awake/page.tsx`
- Create: `src/app/arcade/stay-awake/stay-awake-page.tsx`
- Modify: `src/features/arcade/hub/ui/arcade-page.tsx` (add the `GAMES` entry)

**Interfaces:**

- Consumes: barrel exports (Task 5), `BoardEyebrow`/`StatsBand` from `@/features/arcade/shared`, hub `GameEntry` shape.
- Produces: the live `/arcade/stay-awake` route + hub card.

- [ ] **Step 1: `sloth-mark.tsx`**

```tsx
/**
 * The hub-card mark = a CROP OF REAL GAMEPLAY on the shared cell grid: a cactus
 * cell, the sloth (fg body + bg eye-patch pixels, the engine's palette mapping),
 * and a coffee cell ahead — the climb, one glance. Theme-native like the game.
 */

/** Mirrors of the engine's draw constants. */
const SPRITE_INSET = 0.14;
const COFFEE_FILL = 0.62;

const COLS = 5;
const ROWS = 2;

export function SlothMark({
  size = 16,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={(size * COLS) / ROWS}
      height={size}
      viewBox={`0 0 ${COLS} ${ROWS}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={className}
      style={{ display: "block" }}
    >
      {/* cactus @ [0,1] */}
      <rect
        x={0 + SPRITE_INSET}
        y={1 + SPRITE_INSET}
        width={1 - 2 * SPRITE_INSET}
        height={1 - 2 * SPRITE_INSET}
        style={{ fill: "var(--m-error)" }}
      />
      {/* sloth @ [2,1] — body + two eye-patch pixels */}
      <rect
        x={2 + SPRITE_INSET}
        y={1 + SPRITE_INSET}
        width={1 - 2 * SPRITE_INSET}
        height={1 - 2 * SPRITE_INSET}
        style={{ fill: "var(--m-fg)" }}
      />
      <rect
        x={2.28}
        y={1.34}
        width={0.14}
        height={0.14}
        style={{ fill: "var(--m-bg)" }}
      />
      <rect
        x={2.58}
        y={1.34}
        width={0.14}
        height={0.14}
        style={{ fill: "var(--m-bg)" }}
      />
      {/* coffee @ [4,0] — one hop up and ahead */}
      <rect
        x={4 + (1 - COFFEE_FILL) / 2}
        y={0 + (1 - COFFEE_FILL) / 2}
        width={COFFEE_FILL}
        height={COFFEE_FILL}
        style={{ fill: "var(--m-accent)" }}
      />
    </svg>
  );
}
```

If the `SlothMark` barrel export was deferred from Task 5, add it to `index.ts` now.

- [ ] **Step 2: `src/app/arcade/stay-awake/page.tsx`**

```tsx
import { Metadata } from "next";
import { generateMeta } from "@/shared/lib/head/meta-data";
import StayAwakePage from "./stay-awake-page";

export const metadata: Metadata = generateMeta({
  title: "Stay Awake",
  noindex: true,
});

export default function Page() {
  return <StayAwakePage />;
}
```

- [ ] **Step 3: `src/app/arcade/stay-awake/stay-awake-page.tsx`**

```tsx
"use client";

import { ProtectedRoute } from "@/entities/session";
import {
  HISTORY_RECENT,
  StayAwakeBoard,
  StayAwakeLeaderboard,
  useStayAwakeArcade,
} from "@/features/arcade/stay-awake";
import { BoardEyebrow, StatsBand } from "@/features/arcade/shared";

// Login-only — scores persist per user, so the whole page sits behind ProtectedRoute.
export default function StayAwakePage() {
  return (
    <ProtectedRoute>
      <StayAwakeArcade />
    </ProtectedRoute>
  );
}

function StayAwakeArcade() {
  const { game, board, statsLoading, boardLoading } = useStayAwakeArcade();
  const { state } = game;

  return (
    <div
      className="mono-scope min-h-app mx-[calc(50%-50vw)] w-screen bg-[var(--m-bg)] text-[var(--m-fg)]"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      <main className="mx-auto max-w-[1240px] px-10 pb-10">
        <StatsBand
          score={state.score}
          best={state.best}
          statsLoading={statsLoading}
          history={game.history}
          historyWindow={HISTORY_RECENT}
          gradientId="stayAwakeScoreSparkGrad"
        />

        <div className="mt-10 grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <BoardEyebrow
              stats={[
                { label: "Alt", value: state.altitude },
                { label: "Coffee", value: state.coffees },
              ]}
            />
            <StayAwakeBoard api={game} />
          </div>
          <StayAwakeLeaderboard board={board} loading={boardLoading} />
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Hub registration**

In `src/features/arcade/hub/ui/arcade-page.tsx`:

Add the import next to the other feature marks:

```tsx
import { SlothMark } from "@/features/arcade/stay-awake";
```

Append to the `GAMES` array (after the 2048 entry):

```tsx
  {
    game: "stay-awake",
    href: "/arcade/stay-awake",
    title: "Stay Awake",
    mark: <SlothMark size={CELL * 2} />,
    field: { cell: CELL, spanX: 5, spanY: 2 },
  },
```

- [ ] **Step 5: Gates**

Run: `npm run typecheck && npm run lint`
Expected: 0 errors. Do NOT commit.

---

### Task 7: Full verification + playtest

**Files:** none new.

- [ ] **Step 1: Full test + gates run**

Run: `npm run test:run -- src/features/arcade/stay-awake/model/engine.test.ts && npm run typecheck && npm run lint`
Expected: all tests PASS, 0 type errors, 0 lint errors.

- [ ] **Step 2: Playtest the real flow**

Run `npm run dev`, open `/arcade/stay-awake` (logged in), and verify each:

1. Hub card renders (mark on the cell field, top players) and links to the game.
2. Menu overlay: "Stay Awake" title, GOAL/HOP/PAUSE hints; Start / Enter / Space begins a run.
3. Hops: ← → and A/D climb + move; at a wall the sloth climbs straight up.
4. Tap zones: clicking/tapping the left/right half of the board hops that way (and does nothing on the menu/over screens).
5. The sleep wave rises when idle; the right meter fills and turns error-red near the top; standing still ends the run with "CAUGHT NAPPING.".
6. Landing on a cactus ends the run with "SAT ON A CACTUS.".
7. Coffee bumps SCORE by +26 total (climb +1, coffee +25) and fills a pip; the 3rd coffee turns the pips accent (RUSH) and visibly freezes the wave; the wave edge draws accent during the rush.
8. Chamomile: the wave visibly jumps 3 rows closer.
9. Game over submits the score (leaderboard updates after a run), the sparkline gains a point, BEST reflects the server best; new best shows "New record".
10. Theme flip (light/dark) recolours the canvas live, mid-run.
11. Emulate reduced motion (DevTools → Rendering → prefers-reduced-motion): hops land instantly, wave edge steps discretely, Z glyphs static — gameplay unaffected.
12. Space pauses/resumes; keyboard input in the header search (if any input exists on screen) is not hijacked.
13. Narrow viewport: the board scales, panels stay legible; tap zones still work.

- [ ] **Step 3: STOP**

Report results to the owner. Do NOT commit — commits happen only on an explicit owner "yes" (spacing/visual changes additionally need per-change eyeball approval).
