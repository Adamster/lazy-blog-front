# Short Fuse Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship "Short Fuse" — a canonical Bomberman-like PvE arcade game (smooth movement, bombs, cross blasts, enemies, endless procedural levels) at `/arcade/short-fuse`, mirroring the snake-classic feature anatomy.

**Architecture:** One feature folder `src/features/arcade/short-fuse/` (FSD): a headless stateful engine class (fixed-timestep `update(dt)`, injectable rng, canvas draw), a React game hook (rAF loop + input), a board component (overlays from the shared arcade kit), an arcade orchestrator hook (leaderboard/stats/submit via free-form game key `"short-fuse"` — ZERO backend changes), plus a route folder and hub/roster registration.

**Tech Stack:** React 19 client components, canvas 2D, TanStack Query (existing shared hooks), vitest for engine tests. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-07-10-short-fuse-design.md` — read it first.

## Global Constraints

- **NO backend changes.** Game key `"short-fuse"` is a free string accepted by existing `/arcade/*` endpoints.
- **NO commits.** Project rule: apply → run gates → STOP and ask the owner. Every "commit" moment in this plan is replaced by running gates. Gates: `npm run typecheck` && `npm run lint` && `npx vitest run src/features/arcade/short-fuse` — all 0 errors.
- **Design system:** Brutalist-Mono per CLAUDE.md. Canvas palette resolved from live `--m-*` tokens (snake pattern) — never hardcoded colors in components. Board chrome reuses shared arcade kit as-is.
- **Copy (locked, from creative-director):** title `Short Fuse` · menu description `"The lazy way through a wall is a bomb."` · menu hint via Start button + `Controls` link (same layout as snake). Mascot name: Fyze (walking bomb).
- **Repo lint rule:** NO synchronous `setState` inside an effect — defer with `requestAnimationFrame`.
- **`prefers-reduced-motion`:** flicker/blast animation degrades to static frames (engine gets a `reducedMotion` flag).
- **Arcade is desktop-only:** board wrapped in `.desktop-game-only`, `BoardUnsupported` for touch.
- Naming: feature dir `short-fuse`, engine class `ShortFuseEngine`, action type `ShortFuseAction`, storage keys `arcade.short-fuse.pad.v1` / `notlazy_short_fuse_history_v1`.

## Reference files (read before each task)

- Engine pattern: `src/features/arcade/snake-classic/model/engine.ts` (palette resolve, `drawSquare` device-pixel snapping at :328-347, offscreen sprite cache at :394-449, grid/frame draw at :299-321)
- Hook pattern: `src/features/arcade/snake-classic/model/use-snake-classic-game.ts` (rAF+fallback loop, resize, theme MutationObserver, gamepad poller, refs-mirror pattern)
- Board pattern: `src/features/arcade/snake-classic/ui/snake-classic-board.tsx`
- Orchestrator: `src/features/arcade/snake-classic/ui/use-snake-classic-arcade.ts`
- Test style: `src/features/arcade/snake-classic/model/engine.test.ts`

---

### Task 1: Model scaffolding (types, keys, bindings, history, leaderboard, data hooks)

**Files:**
- Create: `src/features/arcade/short-fuse/model/types.ts`
- Create: `src/features/arcade/short-fuse/model/arcade-keys.ts`
- Create: `src/features/arcade/short-fuse/model/gamepad-bindings.ts`
- Create: `src/features/arcade/short-fuse/model/score-history.ts`
- Create: `src/features/arcade/short-fuse/model/leaderboard.ts`
- Create: `src/features/arcade/short-fuse/model/use-short-fuse-leaderboard.ts`
- Create: `src/features/arcade/short-fuse/model/use-my-arcade-stats.ts`
- Create: `src/features/arcade/short-fuse/model/use-submit-score.ts`

**Interfaces:**
- Consumes: `@/features/arcade/shared` (`BindingMap`, `useSubmitArcadeScore`), `@/shared/api/api-client`, `@/shared/api/openapi` (`LeaderboardEntryResponse`).
- Produces: `ShortFuseAction`, `SHORT_FUSE_GAME`, `arcadeKeys`, `LEADERBOARD_TAKE`, `BOARD_SIZE`, `rankApiBoard`, `loadHistory/recordScore/recentSeries`, `HISTORY_RECENT`, `useShortFuseLeaderboard(enabled)`, `useMyArcadeStats(enabled)`, `useSubmitScore()`, plus the game state types below — Tasks 2–8 build on these exact names.

These are 1:1 mirrors of the snake-classic files with renames. Copy each listed snake-classic counterpart and apply the renames — do NOT restructure.

- [ ] **Step 1: `arcade-keys.ts`** — copy snake's, rename `SNAKE_CLASSIC_GAME` → `SHORT_FUSE_GAME = "short-fuse"`. Keep `arcadeKeys` factory and `LEADERBOARD_TAKE = 10` identical.

- [ ] **Step 2: `gamepad-bindings.ts`** — full content:

```ts
import type { BindingMap } from "@/features/arcade/shared";

export type ShortFuseAction =
  | "moveUp"
  | "moveDown"
  | "moveLeft"
  | "moveRight"
  | "bomb"
  | "start"
  | "pause";

/** Ordered action list — the CONTROLS modal rows + the gamepad-poller action set. */
export const SHORT_FUSE_ACTIONS: readonly {
  id: ShortFuseAction;
  label: string;
}[] = [
  { id: "moveUp", label: "Move up" },
  { id: "moveDown", label: "Move down" },
  { id: "moveLeft", label: "Move left" },
  { id: "moveRight", label: "Move right" },
  { id: "bomb", label: "Drop bomb" },
  { id: "start", label: "Start" },
  { id: "pause", label: "Pause" },
];

export const SHORT_FUSE_ACTION_IDS = SHORT_FUSE_ACTIONS.map((a) => a.id);

/** Standard-Gamepad defaults — freely rebindable via the CONTROLS modal. */
export const SHORT_FUSE_DEFAULT_GAMEPAD_BINDINGS: BindingMap<ShortFuseAction> =
  {
    moveUp: ["Pad12"],
    moveDown: ["Pad13"],
    moveLeft: ["Pad14"],
    moveRight: ["Pad15"],
    bomb: ["Pad0"],
    start: ["Pad9"],
    pause: ["Pad8"],
  };

export const SHORT_FUSE_GAMEPAD_STORAGE = "arcade.short-fuse.pad.v1";

/** Informational only — mirrors the hook's hardcoded keyboard keys. */
export const SHORT_FUSE_KEYBOARD_INFO: BindingMap<ShortFuseAction> = {
  moveUp: ["ArrowUp", "KeyW"],
  moveDown: ["ArrowDown", "KeyS"],
  moveLeft: ["ArrowLeft", "KeyA"],
  moveRight: ["ArrowRight", "KeyD"],
  bomb: ["Space"],
  start: ["Enter", "Space"],
  pause: ["KeyP"],
};
```

- [ ] **Step 3: `types.ts`** — full content (note: `Speed` is dropped — Short Fuse has no speed presets; `Cell`, `ScoreRow`, `RankedRow`, `HistoryPoint` copied verbatim from snake's types):

```ts
import type { BindingMap } from "@/features/arcade/shared";
import type { ShortFuseAction } from "./gamepad-bindings";

export type Screen = "menu" | "playing" | "over";

export interface Cell {
  x: number;
  y: number;
}

export interface ScoreRow {
  name: string;
  score: number;
  you?: boolean;
  userName?: string;
}

export interface HistoryPoint {
  label: string;
  count: number;
}

export interface RankedRow extends ScoreRow {
  rank: string;
  scoreLabel: string;
  empty?: boolean;
}

export interface ShortFuseGameState {
  screen: Screen;
  paused: boolean;
  score: number;
  best: number;
  /** Current level (1-based) — HUD + game-over detail. */
  level: number;
  lives: number;
  isNewBest: boolean;
  rank: number;
}

export interface ShortFuseGameApi {
  state: ShortFuseGameState;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  history: HistoryPoint[];
  start: () => void;
  togglePause: () => void;
  padBindings: BindingMap<ShortFuseAction>;
  setPadBindings: (next: BindingMap<ShortFuseAction>) => void;
  setKeysSuspended: (suspended: boolean) => void;
}

export interface UseShortFuseGameOptions {
  best?: number;
  onGameOver?: (score: number) => void;
  historyScope?: string;
}
```

- [ ] **Step 4: `score-history.ts`** — copy snake's verbatim, change only `KEY_HISTORY` → `"notlazy_short_fuse_history_v1"` (keep `HISTORY_CAP = 50`, `HISTORY_RECENT = 20`, all three functions byte-identical).

- [ ] **Step 5: `leaderboard.ts`** — copy snake's verbatim (`BOARD_SIZE = 10`, `formatScore`, `rankApiBoard`); only the doc comment mentions Short Fuse.

- [ ] **Step 6: `use-short-fuse-leaderboard.ts`, `use-my-arcade-stats.ts`, `use-submit-score.ts`** — copy snake's three data hooks, renaming imports to this feature's `arcade-keys` and the hook name to `useShortFuseLeaderboard`. Bodies identical.

- [ ] **Step 7: Gate** — `npm run typecheck` → 0 errors. (No tests yet — pure scaffolding.)

---

### Task 2: Engine core — constants, level generation, reset/inspect

**Files:**
- Create: `src/features/arcade/short-fuse/model/engine.ts`
- Test: `src/features/arcade/short-fuse/model/engine.test.ts`

**Interfaces:**
- Consumes: `Cell` from `./types`.
- Produces (later tasks + hook rely on these exact names):
  - Constants: `GRID_W = 15`, `GRID_H = 11`, `HUD_ROWS = 1`, `CANVAS_ROWS = GRID_H + HUD_ROWS` (12), `LEVEL_TIME_MS = 180_000`, `INITIAL_LIVES = 3`, `FUSE_MS = 2000`, `BLAST_MS = 400`, `SCORE_SOFT = 10`, `SCORE_PICKUP = 50`, `SCORE_LEVEL_CLEAR = 500`, `TIME_BONUS_PER_S = 5`, `DROP_RATE = 0.3`, `SKULL_SHARE = 0.25`, `DEBUFF_MS = 10_000`
  - Types: `TileKind` (`0 empty / 1 pillar / 2 soft` as `const enum`-style consts `TILE_EMPTY/TILE_PILLAR/TILE_SOFT`), `PowerupType = "bomb" | "range" | "speed" | "skull"`, `EnemyKind = "wanderer" | "chaser" | "skitter"`, `ShortFusePalette`, `UpdateResult`, `EngineSnapshot`
  - Class: `ShortFuseEngine` with `constructor(rng: () => number = Math.random)`, `reset()`, `inspect()`, and test hooks `debugGrid()`, `debugSetTile(x, y, kind)`, `debugPlacePlayer(x, y)`, `debugClearEnemies()`, `debugSpawnEnemy(kind, x, y)`

- [ ] **Step 1: Write failing tests for level generation** in `engine.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  GRID_H,
  GRID_W,
  INITIAL_LIVES,
  ShortFuseEngine,
  TILE_EMPTY,
  TILE_PILLAR,
  TILE_SOFT,
} from "./engine";

function fresh(rng: () => number = mulberry(42)) {
  const e = new ShortFuseEngine(rng);
  e.reset();
  return e;
}

/** Deterministic seeded rng for reproducible generation. */
function mulberry(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("ShortFuseEngine — level generation", () => {
  it("places pillars at every odd,odd cell and nowhere else", () => {
    const e = fresh();
    const s = e.inspect();
    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        const t = s.grid[y * GRID_W + x];
        if (x % 2 === 1 && y % 2 === 1) expect(t).toBe(TILE_PILLAR);
        else expect(t).not.toBe(TILE_PILLAR);
      }
    }
  });

  it("keeps the spawn pocket clear: (0,0) (1,0) (0,1) are empty", () => {
    const s = fresh().inspect();
    expect(s.grid[0]).toBe(TILE_EMPTY);
    expect(s.grid[1]).toBe(TILE_EMPTY);
    expect(s.grid[GRID_W]).toBe(TILE_EMPTY);
  });

  it("spawns the player at cell (0,0) with base stats and full lives", () => {
    const s = fresh().inspect();
    expect(Math.round(s.player.x)).toBe(0);
    expect(Math.round(s.player.y)).toBe(0);
    expect(s.lives).toBe(INITIAL_LIVES);
    expect(s.level).toBe(1);
    expect(s.score).toBe(0);
    expect(s.player.maxBombs).toBe(1);
    expect(s.player.range).toBe(1);
  });

  it("generates a reasonable soft-block count and hides the exit under one", () => {
    const s = fresh().inspect();
    const softs = s.grid.filter((t) => t === TILE_SOFT).length;
    expect(softs).toBeGreaterThanOrEqual(15);
    expect(s.grid[s.exitIndex]).toBe(TILE_SOFT);
    expect(s.exitRevealed).toBe(false);
  });

  it("spawns level-1 enemies on empty cells, all at distance ≥ 6 from spawn", () => {
    const s = fresh().inspect();
    expect(s.enemies.length).toBeGreaterThanOrEqual(3);
    for (const en of s.enemies) {
      const cx = Math.round(en.x);
      const cy = Math.round(en.y);
      expect(s.grid[cy * GRID_W + cx]).toBe(TILE_EMPTY);
      expect(cx + cy).toBeGreaterThanOrEqual(6);
    }
  });

  it("is deterministic under a seeded rng", () => {
    const a = new ShortFuseEngine(mulberry(7));
    const b = new ShortFuseEngine(mulberry(7));
    a.reset();
    b.reset();
    expect(a.inspect().grid).toEqual(b.inspect().grid);
  });
});
```

- [ ] **Step 2: Run tests** — `npx vitest run src/features/arcade/short-fuse` → FAIL (engine.ts missing).

- [ ] **Step 3: Implement engine core.** Structure (all in `engine.ts`):

```ts
import type { Cell } from "./types";

export const GRID_W = 15;
export const GRID_H = 11;
export const HUD_ROWS = 1;
export const CANVAS_ROWS = GRID_H + HUD_ROWS;

export const TILE_EMPTY = 0;
export const TILE_PILLAR = 1;
export const TILE_SOFT = 2;
export type Tile = typeof TILE_EMPTY | typeof TILE_PILLAR | typeof TILE_SOFT;

export type PowerupType = "bomb" | "range" | "speed" | "skull";
export type EnemyKind = "wanderer" | "chaser" | "skitter";

export const INITIAL_LIVES = 3;
export const LEVEL_TIME_MS = 180_000;
export const FUSE_MS = 2000;
export const BLAST_MS = 400;
export const DEBUFF_MS = 10_000;
export const DROP_RATE = 0.3;
export const SKULL_SHARE = 0.25;
export const SCORE_SOFT = 10;
export const SCORE_PICKUP = 50;
export const SCORE_LEVEL_CLEAR = 500;
export const TIME_BONUS_PER_S = 5;
export const SCORE_KILL: Record<EnemyKind, number> = {
  wanderer: 100,
  chaser: 200,
  skitter: 300,
};

/** Cells/second. */
const PLAYER_SPEED_BASE = 4.5;
const PLAYER_SPEED_STEP = 0.5;
const PLAYER_SPEED_CAP = 7;
const ENEMY_SPEED: Record<EnemyKind, number> = {
  wanderer: 2.2,
  chaser: 1.8,
  skitter: 3.2,
};

interface Bomb {
  x: number; // cell coords (int)
  y: number;
  fuseMs: number;
  range: number;
  /** Passable until the player leaves its cell, then solid. */
  walkable: boolean;
}

interface Blast {
  cells: number[]; // grid indexes
  ttlMs: number;
}

interface Enemy {
  kind: EnemyKind;
  x: number; // cell coords (float, center-based)
  y: number;
  dx: -1 | 0 | 1;
  dy: -1 | 0 | 1;
  speed: number;
}

interface PlayerState {
  x: number; // cell coords (float, center-based)
  y: number;
  maxBombs: number;
  range: number;
  speedLevel: number; // 0-based, speed = base + step*level capped
  debuff: { kind: "slow" | "shortRange"; ttlMs: number } | null;
}

export interface UpdateResult {
  gameOver: boolean;
  score: number;
  level: number;
  lives: number;
  timeLeftMs: number;
}

export interface EngineSnapshot {
  grid: Tile[];
  player: PlayerState;
  enemies: Enemy[];
  bombs: Bomb[];
  blasts: Blast[];
  powerups: { index: number; type: PowerupType }[];
  exitIndex: number;
  exitRevealed: boolean;
  score: number;
  level: number;
  lives: number;
  timeLeftMs: number;
}
```

Class skeleton for this task (movement/bombs/enemies arrive in Tasks 3–5):

```ts
export class ShortFuseEngine {
  private grid: Tile[] = [];
  private player: PlayerState = this.basePlayer();
  private enemies: Enemy[] = [];
  private bombs: Bomb[] = [];
  private blasts: Blast[] = [];
  private powerups = new Map<number, PowerupType>();
  private exitIndex = 0;
  private exitRevealed = false;
  private score = 0;
  private level = 1;
  private lives = INITIAL_LIVES;
  private timeLeftMs = LEVEL_TIME_MS;
  private moveX: -1 | 0 | 1 = 0;
  private moveY: -1 | 0 | 1 = 0;

  constructor(private rng: () => number = Math.random) {}

  private basePlayer(): PlayerState {
    return { x: 0, y: 0, maxBombs: 1, range: 1, speedLevel: 0, debuff: null };
  }

  /** Fresh RUN: level 1, base powerups, full lives, score 0. */
  reset() {
    this.score = 0;
    this.level = 1;
    this.lives = INITIAL_LIVES;
    this.player = this.basePlayer();
    this.generateLevel();
  }

  /** Rebuild the arena for the CURRENT level; player keeps powerups. */
  private generateLevel() {
    this.bombs = [];
    this.blasts = [];
    this.powerups.clear();
    this.exitRevealed = false;
    this.timeLeftMs = LEVEL_TIME_MS;
    this.player.x = 0;
    this.player.y = 0;
    this.player.debuff = null;
    this.moveX = 0;
    this.moveY = 0;
    // 1. pillars
    this.grid = Array.from({ length: GRID_W * GRID_H }, (_, i) => {
      const x = i % GRID_W;
      const y = (i / GRID_W) | 0;
      return x % 2 === 1 && y % 2 === 1 ? TILE_PILLAR : TILE_EMPTY;
    });
    // 2. soft blocks (skip spawn pocket)
    const density = Math.min(0.65, 0.45 + (this.level - 1) * 0.02);
    const spawnSafe = new Set([0, 1, GRID_W]);
    const softIndexes: number[] = [];
    for (let i = 0; i < this.grid.length; i++) {
      if (this.grid[i] !== TILE_EMPTY || spawnSafe.has(i)) continue;
      if (this.rng() < density) {
        this.grid[i] = TILE_SOFT;
        softIndexes.push(i);
      }
    }
    // ensure enough cover for the exit + drops (degenerate rng guard)
    // (with density ≥ 0.45 over ~100 candidate cells this only fires in tests)
    let guard = 0;
    while (softIndexes.length < 15 && guard++ < 200) {
      const i = (this.rng() * this.grid.length) | 0;
      if (this.grid[i] === TILE_EMPTY && !spawnSafe.has(i)) {
        this.grid[i] = TILE_SOFT;
        softIndexes.push(i);
      }
    }
    // 3. exit under a random soft block
    this.exitIndex = softIndexes[(this.rng() * softIndexes.length) | 0];
    // 4. enemies on far empty cells
    this.enemies = [];
    const roster = this.levelRoster();
    let spawnGuard = 0;
    while (this.enemies.length < roster.length && spawnGuard++ < 500) {
      const i = (this.rng() * this.grid.length) | 0;
      const x = i % GRID_W;
      const y = (i / GRID_W) | 0;
      if (this.grid[i] !== TILE_EMPTY) continue;
      if (x + y < 6) continue; // manhattan distance from (0,0)
      if (this.enemies.some((e) => Math.round(e.x) === x && Math.round(e.y) === y)) continue;
      const kind = roster[this.enemies.length];
      this.enemies.push({ kind, x, y, dx: 0, dy: 0, speed: this.enemySpeed(kind) });
    }
  }

  /** Enemy mix ramps with level: wanderers always; chasers from 2; skitters from 4. */
  private levelRoster(): EnemyKind[] {
    const count = Math.min(8, 3 + ((this.level - 1) / 2) | 0);
    const kinds: EnemyKind[] = [];
    for (let i = 0; i < count; i++) {
      if (this.level >= 4 && i % 3 === 2) kinds.push("skitter");
      else if (this.level >= 2 && i % 2 === 1) kinds.push("chaser");
      else kinds.push("wanderer");
    }
    return kinds;
  }

  private enemySpeed(kind: EnemyKind): number {
    // +4%/level, capped at +60%
    return ENEMY_SPEED[kind] * Math.min(1.6, 1 + (this.level - 1) * 0.04);
  }

  inspect(): EngineSnapshot { /* deep-copy all fields, powerups → array */ }

  // test hooks
  debugGrid(): Tile[] { return [...this.grid]; }
  debugSetTile(x: number, y: number, kind: Tile) { this.grid[y * GRID_W + x] = kind; }
  debugPlacePlayer(x: number, y: number) { this.player.x = x; this.player.y = y; }
  debugClearEnemies() { this.enemies = []; }
  debugSpawnEnemy(kind: EnemyKind, x: number, y: number) {
    this.enemies.push({ kind, x, y, dx: 0, dy: 0, speed: this.enemySpeed(kind) });
  }
}
```

Note the operator-precedence trap in `count`: write it as `Math.min(8, 3 + Math.floor((this.level - 1) / 2))` in the real code — the snippet's `|0` binding is wrong on purpose to force attention. Also implement `inspect()` fully (copies, never internal references — see snake `inspect()`).

- [ ] **Step 4: Run tests** — `npx vitest run src/features/arcade/short-fuse` → PASS.

- [ ] **Step 5: Gate** — typecheck + lint clean.

---

### Task 3: Engine — smooth player movement with corner assist

**Files:**
- Modify: `src/features/arcade/short-fuse/model/engine.ts`
- Test: `src/features/arcade/short-fuse/model/engine.test.ts` (append)

**Interfaces:**
- Produces: `setMove(dx: -1|0|1, dy: -1|0|1)` (held direction, one axis at a time — the hook resolves precedence), `update(dtMs: number): UpdateResult` (this task: movement + timer only; bombs/enemies extend it later), `PLAYER_RADIUS = 0.38` (exported for tests).

Movement model (Bomberman standard):
- Player position is a center-based float in cell units. Collision body = square of half-size `PLAYER_RADIUS`.
- Solid for the PLAYER: out-of-bounds, `TILE_PILLAR`, `TILE_SOFT`, and any bomb with `walkable === false`.
- Move along ONE axis per frame (the held axis). While moving along X, the Y coordinate eases toward `Math.round(y)` (lane centering) at the same speed — and vice versa. This is what makes grid movement feel smooth.
- **Corner assist:** when the forward cell is solid but the player's perpendicular offset from the lane center is ≤ `ASSIST = 0.45` AND the diagonal cell on the near side is free, convert the motion into perpendicular movement toward that lane instead of stopping dead.

- [ ] **Step 1: Write failing movement tests** (append to `engine.test.ts`):

```ts
describe("ShortFuseEngine — movement", () => {
  it("moves right at player speed on held input", () => {
    const e = fresh();
    e.debugClearEnemies();
    e.debugSetTile(1, 0, TILE_EMPTY);
    e.setMove(1, 0);
    e.update(1000); // 1s — but update clamps dt internally; call in 16ms slices
    // helper below drives N ms in 16ms frames:
    // advance(e, 1000)
  });

  it("stops at a soft block edge", () => {
    const e = fresh();
    e.debugClearEnemies();
    e.debugSetTile(1, 0, TILE_SOFT);
    e.setMove(1, 0);
    advance(e, 2000);
    const p = e.inspect().player;
    // blocked: can't cross into cell 1 — max x is 1 - 0.5 - PLAYER_RADIUS… player center stays < 0.5
    expect(p.x).toBeLessThan(0.2);
  });

  it("lane-centers the perpendicular axis while moving", () => {
    const e = fresh();
    e.debugClearEnemies();
    e.debugSetTile(1, 0, TILE_EMPTY);
    e.debugSetTile(2, 0, TILE_EMPTY);
    e.debugPlacePlayer(0, 0.3); // off lane center
    e.setMove(1, 0);
    advance(e, 600);
    expect(Math.abs(e.inspect().player.y)).toBeLessThan(0.05);
  });

  it("corner-assists around a blocking cell when nearly aligned with the open lane", () => {
    const e = fresh();
    e.debugClearEnemies();
    // moving right along y=0 into a soft block at (2,0), open lane below at (2,1)? — build explicit scenario
    // (see implementation notes; assert the player ends up moving on the perpendicular axis)
  });

  it("ticks the level timer down during update", () => {
    const e = fresh();
    e.debugClearEnemies();
    const before = e.inspect().timeLeftMs;
    advance(e, 500);
    expect(e.inspect().timeLeftMs).toBeLessThan(before);
  });
});
```

Add the shared test helper at the top of the file:

```ts
/** Drive the engine in 16ms frames (update clamps dt; big single calls are unreal). */
function advance(e: ShortFuseEngine, ms: number) {
  for (let t = 0; t < ms; t += 16) e.update(16);
}
```

Write the corner-assist scenario concretely once the collision helpers exist — the test must set up: player at `(0, 0.4)` (near lane y=0, drifted toward y=1), forward cell `(1,0)` solid, `(1,1)` free, held move `(1,0)` → after `advance(e, 500)` the player's `y` has INCREASED toward 1 (assist redirected motion), not frozen.

- [ ] **Step 2: Run tests** → FAIL (`setMove`/`update` missing).

- [ ] **Step 3: Implement.** Core code:

```ts
export const PLAYER_RADIUS = 0.38;
const ASSIST = 0.45;
const DT_CLAMP_MS = 50;

setMove(dx: -1 | 0 | 1, dy: -1 | 0 | 1) {
  this.moveX = dx;
  this.moveY = dy;
}

/** Solid FOR THE PLAYER at cell (cx,cy)? Bombs solidify after the player leaves. */
private solidForPlayer(cx: number, cy: number): boolean {
  if (cx < 0 || cy < 0 || cx >= GRID_W || cy >= GRID_H) return true;
  const t = this.grid[cy * GRID_W + cx];
  if (t !== TILE_EMPTY) return true;
  return this.bombs.some((b) => b.x === cx && b.y === cy && !b.walkable);
}

/** Move the player along one axis with lane-centering + corner assist. */
private stepPlayer(dtS: number) {
  const speedMul = this.player.debuff?.kind === "slow" ? 0.6 : 1;
  const speed =
    Math.min(
      PLAYER_SPEED_CAP,
      PLAYER_SPEED_BASE + this.player.speedLevel * PLAYER_SPEED_STEP
    ) * speedMul;
  const dist = speed * dtS;
  const p = this.player;
  const dx = this.moveX;
  const dy = this.moveX !== 0 ? 0 : this.moveY; // one axis; X wins ties (hook sends one anyway)
  if (dx === 0 && dy === 0) return;

  const axis = dx !== 0 ? "x" : "y";
  const dir = axis === "x" ? dx : dy;

  // 1. lane-center the perpendicular axis
  if (axis === "x") p.y = approach(p.y, Math.round(p.y), dist);
  else p.x = approach(p.x, Math.round(p.x), dist);

  // 2. forward motion with collision clamp
  const perp = axis === "x" ? p.y : p.x;
  const lane = Math.round(perp);
  const fwd = axis === "x" ? p.x : p.y;
  const next = fwd + dir * dist;
  // leading edge enters the next cell when |next - cellCenter| > 0.5 - RADIUS
  const targetCell = Math.round(fwd) + dir;
  const enters = dir > 0
    ? next + PLAYER_RADIUS > targetCell - 0.5
    : next - PLAYER_RADIUS < targetCell + 0.5;
  const blocked =
    enters &&
    (axis === "x"
      ? this.solidForPlayer(targetCell, lane)
      : this.solidForPlayer(lane, targetCell));

  if (!blocked) {
    if (axis === "x") p.x = next;
    else p.y = next;
    return;
  }

  // 3. clamp flush to the wall
  const flush = targetCell - dir * (0.5 + PLAYER_RADIUS) - (dir > 0 ? -0 : 0);
  const clamped = dir > 0 ? Math.min(next, targetCell - 0.5 - PLAYER_RADIUS + 0.5 - 0.5) : Math.max(next, targetCell + 0.5 + PLAYER_RADIUS - 0.5 + 0.5);
  // NOTE: simplify in real code — the wall face is at (targetCell - dir*0.5);
  // player center max = wallFace - dir*PLAYER_RADIUS. Write it that way:
  // const face = targetCell - dir * 0.5;
  // const limit = face - dir * PLAYER_RADIUS;
  // p[axis] = dir > 0 ? Math.min(next, limit) : Math.max(next, limit);

  // 4. corner assist: if drifted toward an open neighboring lane, slide that way
  const off = perp - lane;
  const side = off > 0 ? 1 : -1;
  if (Math.abs(off) > 0.01 && Math.abs(off) <= ASSIST) {
    const nLane = lane + side;
    const open =
      axis === "x"
        ? !this.solidForPlayer(targetCell, nLane)
        : !this.solidForPlayer(nLane, targetCell);
    if (open) {
      if (axis === "x") p.y = approach(p.y, nLane, dist);
      else p.x = approach(p.x, nLane, dist);
    }
  }
}
```

With the module-level helper:

```ts
function approach(v: number, target: number, maxDelta: number): number {
  if (v < target) return Math.min(target, v + maxDelta);
  if (v > target) return Math.max(target, v - maxDelta);
  return v;
}
```

Clean up the flush-clamp mess exactly as the inline NOTE says (`face`/`limit` form). `update(dtMs)` this task:

```ts
update(dtMs: number): UpdateResult {
  const dt = Math.min(dtMs, DT_CLAMP_MS);
  const dtS = dt / 1000;
  this.timeLeftMs = Math.max(0, this.timeLeftMs - dt);
  if (this.player.debuff) {
    this.player.debuff.ttlMs -= dt;
    if (this.player.debuff.ttlMs <= 0) this.player.debuff = null;
  }
  this.stepPlayer(dtS);
  // Tasks 4–5 add: bombs, blasts, enemies, deaths, exit, timer death
  return this.result(false);
}

private result(gameOver: boolean): UpdateResult {
  return {
    gameOver,
    score: this.score,
    level: this.level,
    lives: this.lives,
    timeLeftMs: this.timeLeftMs,
  };
}
```

- [ ] **Step 4: Run tests** → PASS. Fix the corner-assist test to the concrete scenario while implementing.

- [ ] **Step 5: Gate** — typecheck + lint + tests.

---

### Task 4: Engine — bombs, blasts, chains, destruction, powerups

**Files:**
- Modify: `src/features/arcade/short-fuse/model/engine.ts`
- Test: `src/features/arcade/short-fuse/model/engine.test.ts` (append)

**Interfaces:**
- Produces: `placeBomb(): void`, powerup pickup inside `update`, and test hooks `debugPlaceBomb(x, y, range?)`, `debugFuse(x, y, ms)` (set a bomb's remaining fuse), `debugPlacePowerup(x, y, type)`.

Rules (from spec):
- `placeBomb()`: at `(Math.round(p.x), Math.round(p.y))`; rejected if a bomb already sits there or active bombs ≥ `player.maxBombs`. New bomb `walkable: true`, `fuseMs: FUSE_MS`, `range: debuff shortRange ? 1 : player.range`.
- Each update: bombs whose cell no longer overlaps the player body flip `walkable = false` (overlap test: `Math.abs(p.x - b.x) < 0.5 + PLAYER_RADIUS && same for y`). Fuse counts down; ≤ 0 → detonate.
- Detonation (chain-safe, queue-based):

```ts
private detonate(first: Bomb) {
  const queue = [first];
  const exploded = new Set<Bomb>();
  const blastCells = new Set<number>();
  while (queue.length) {
    const bomb = queue.pop()!;
    if (exploded.has(bomb)) continue;
    exploded.add(bomb);
    blastCells.add(bomb.y * GRID_W + bomb.x);
    for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      for (let i = 1; i <= bomb.range; i++) {
        const cx = bomb.x + ax * i;
        const cy = bomb.y + ay * i;
        if (cx < 0 || cy < 0 || cx >= GRID_W || cy >= GRID_H) break;
        const idx = cy * GRID_W + cx;
        if (this.grid[idx] === TILE_PILLAR) break;
        const hitBomb = this.bombs.find(
          (b) => b.x === cx && b.y === cy && !exploded.has(b)
        );
        if (hitBomb) queue.push(hitBomb); // chain — its own cross resolves in-loop
        blastCells.add(idx);
        if (this.grid[idx] === TILE_SOFT) {
          this.destroySoft(idx);
          break; // the arm stops AT the block it broke
        }
        if (this.powerups.has(idx)) {
          this.powerups.delete(idx); // blasts burn exposed pickups
          break;
        }
      }
    }
  }
  this.bombs = this.bombs.filter((b) => !exploded.has(b));
  this.blasts.push({ cells: [...blastCells], ttlMs: BLAST_MS });
}

private destroySoft(idx: number) {
  this.grid[idx] = TILE_EMPTY;
  this.score += SCORE_SOFT;
  if (idx === this.exitIndex) {
    this.exitRevealed = true;
    return; // the exit cell never also drops a pickup
  }
  if (this.rng() < DROP_RATE) {
    const r = this.rng();
    const type: PowerupType =
      r < SKULL_SHARE ? "skull"
      : r < SKULL_SHARE + 0.25 ? "bomb"
      : r < SKULL_SHARE + 0.5 ? "range"
      : "speed";
    this.powerups.set(idx, type);
  }
}
```

- Blasts tick down in `update`; player standing on any blast cell (rounded) while `ttlMs > 0` → death (Task 5 wires the death flow; this task exposes `debugPlayerOnBlast(): boolean` or just leaves blasts data for Task 5).
- Pickup in `update`: if `powerups.has(playerCellIdx)` → apply and delete, `score += SCORE_PICKUP`. Apply: `bomb` → `maxBombs++` (cap 6); `range` → `range++` (cap 6); `speed` → `speedLevel++` (cap 5); `skull` → `debuff = { kind: rng() < 0.5 ? "slow" : "shortRange", ttlMs: DEBUFF_MS }` (no score for skull — it's a trap, still +0; keep `SCORE_PICKUP` for good three only).

- [ ] **Step 1: Write failing tests** (append; representative set — write all of these):

```ts
describe("ShortFuseEngine — bombs & blasts", () => {
  it("plants a bomb at the player's cell, capped by maxBombs", () => { /* place, inspect().bombs length 1; second placeBomb() rejected */ });
  it("bomb becomes solid after the player walks off it", () => { /* place at (0,0), move player to (2,0) via debugPlacePlayer + update; walkable false; solidForPlayer blocks re-entry (player can't move back onto it) */ });
  it("detonates after FUSE_MS and the cross stops at pillars", () => { /* debugPlaceBomb(2,0,3); advance FUSE_MS+16; blast covers (2,0),(3,0)…? pillars at odd,odd — pick a row where arm crosses a pillar and assert it stops */ });
  it("destroys the first soft block per arm and stops there", () => { /* soft at (4,0) and (5,0); bomb range 3 at (2,0); after detonation (4,0) empty, (5,0) still soft */ });
  it("chains other bombs in the blast", () => { /* two bombs in line, long fuse on second; detonate first via debugFuse; both gone, one merged blast */ });
  it("reveals the exit when its block is destroyed", () => { /* debugSetTile exit cell soft + point exitIndex there via generation OR blast the actual exitIndex cell; exitRevealed true */ });
  it("drops a powerup at DROP_RATE and burns exposed powerups in a later blast", () => { /* rng stub forcing drop; then second bomb over the pickup cell; powerups empty */ });
  it("applies pickups: bomb/range/speed increment, skull sets a timed debuff", () => { /* debugPlacePowerup under player; advance 16; assert stats; skull: debuff set, expires after DEBUFF_MS */ });
});
```

Use rng stubs (`() => 0.0` forces drop + skull; `() => 0.99` forces no drop) instead of seeded rng where a branch must be pinned.

- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** per the code above; wire `stepBombs(dt)` + `stepBlasts(dt)` + pickup into `update` between timer and `stepPlayer`.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Gate.**

---

### Task 5: Engine — enemies, deaths, lives, exit, level advance, game over

**Files:**
- Modify: `src/features/arcade/short-fuse/model/engine.ts`
- Test: `src/features/arcade/short-fuse/model/engine.test.ts` (append)

**Interfaces:**
- Produces: complete `update(dtMs)` (the final contract for the hook), kill scoring, `UpdateResult.gameOver` semantics: `true` exactly once, on the update where the last life is lost.

Enemy movement: same smooth model — an enemy moves toward the center of its current target cell; ON crossing a cell center it picks the next direction. Solid for enemies: bounds, pillars, soft blocks, ALL bombs (walkable or not), the exit cell while revealed-but-closed is passable (it's floor).

```ts
private stepEnemy(en: Enemy, dtS: number) {
  const cx = Math.round(en.x);
  const cy = Math.round(en.y);
  const atCenter =
    Math.abs(en.x - cx) < 0.02 && Math.abs(en.y - cy) < 0.02;
  if (atCenter || (en.dx === 0 && en.dy === 0)) {
    en.x = cx;
    en.y = cy;
    const options = ([[1, 0], [-1, 0], [0, 1], [0, -1]] as const).filter(
      ([dx, dy]) => !this.solidForEnemy(cx + dx, cy + dy)
    );
    if (options.length === 0) { en.dx = 0; en.dy = 0; return; }
    let pick: readonly [number, number];
    if (en.kind === "chaser") {
      // greedy: minimize manhattan distance to the player
      pick = options.reduce((best, o) =>
        this.manhattan(cx + o[0], cy + o[1]) < this.manhattan(cx + best[0], cy + best[1]) ? o : best
      );
    } else {
      const straight = options.find(([dx, dy]) => dx === en.dx && dy === en.dy);
      const turnChance = en.kind === "skitter" ? 0.4 : 0.15;
      pick =
        straight && this.rng() >= turnChance
          ? straight
          : options[(this.rng() * options.length) | 0];
    }
    en.dx = pick[0] as -1 | 0 | 1;
    en.dy = pick[1] as -1 | 0 | 1;
  }
  en.x += en.dx * en.speed * dtS;
  en.y += en.dy * en.speed * dtS;
  // overshoot snap: if passed the next center, clamp to it so the next frame re-decides
  const tx = Math.round(en.x - en.dx * 0.5) + en.dx * 0; // real code: track target cell explicitly
}
```

Real code: track `targetX/targetY` on the enemy (the cell it's walking toward) instead of the overshoot hack — set on decision, clamp position to it when reached, then re-decide next frame. Blast kills enemy when its rounded cell ∈ blast cells (`score += SCORE_KILL[kind]`). Enemy-player contact: `Math.abs(en.x - p.x) < 0.55 && Math.abs(en.y - p.y) < 0.55` → player death.

Death & lives flow:

```ts
private killPlayer(): boolean /* game over? */ {
  this.lives -= 1;
  if (this.lives <= 0) return true;
  this.generateLevel(); // same level number, fresh layout; powerups KEPT (spec)
  return false;
}
```

Timer expiry (`timeLeftMs === 0` after tick) = `killPlayer()` too. Exit: when `exitRevealed && enemies.length === 0` the exit is OPEN; player within 0.3 of the exit cell center → level advance:

```ts
private advanceLevel() {
  this.score +=
    SCORE_LEVEL_CLEAR + Math.floor(this.timeLeftMs / 1000) * TIME_BONUS_PER_S;
  this.level += 1;
  this.generateLevel();
}
```

`update` final order: dt clamp → timer tick (expiry → killPlayer) → debuff tick → bombs (solidify → fuse → detonate) → blasts ttl → stepPlayer → pickups → enemies step → deaths (blast-on-player, blast-on-enemy, contact) → exit check → build result. `gameOver: true` short-circuits the rest of the frame.

- [ ] **Step 1: Write failing tests** — cover: wanderer walks and never enters solids; chaser closes manhattan distance to a reachable player; blast kills enemy + scores by kind; contact kills player, lives drop, level regenerates, powerups persist, score persists; third death → `gameOver: true` exactly once; timer expiry costs a life; exit closed while enemies alive, open after, advancing bumps level + adds `SCORE_LEVEL_CLEAR` + time bonus. Use `debugClearEnemies`/`debugSpawnEnemy`/`debugSetTile`/`debugPlacePlayer` to build exact scenarios; seeded rng for wanderer determinism.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** per above (with the explicit `targetX/targetY` enemy fields).
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Gate.**

---

### Task 6: Engine — canvas rendering (palette, sprites, HUD, reduced motion)

**Files:**
- Modify: `src/features/arcade/short-fuse/model/engine.ts`

**Interfaces:**
- Produces: `ShortFusePalette` (exported), `setPalette(p)`, `setReducedMotion(flag: boolean)`, `drawGame(ctx, cssW, cssH, dpr)`, `drawIdle(ctx, cssW, cssH)`, plus exported sprite maps `FYZE_SPRITE`, `ENEMY_SPRITES`, and dark reference colors for the hub mark (`GLYPH_BODY`-equivalents).

No unit tests (visual) — verified in Task 9's live run. Rules:

- Canvas grid is `GRID_W × CANVAS_ROWS` (15×12): row 0 = HUD strip, rows 1–11 = arena (all cell math offsets `y + HUD_ROWS`). Board aspect = `15/12`.
- Palette interface + mapping (resolved by the hook from live tokens, snake pattern):

```ts
export interface ShortFusePalette {
  boardBg: string;   // --m-bg
  pillar: string;    // --m-fg lerped 0.75 toward bg (quiet solids)
  soft: string;      // --m-fg lerped 0.45 toward bg (breakable reads louder than pillar)
  player: string;    // --m-fg (Fyze body)
  accent: string;    // --m-accent (belly band, exit, blast core)
  spark: string;     // --m-error (wick spark, skull, blast rim, frame)
  gridLine: string;  // --m-fg low alpha (same formula as snake)
  frameLine: string; // --m-error
  hudText: string;   // --m-fg
  muted: string;     // --m-muted for HUD labels/timer
}
```

- Reuse snake's exact device-pixel-snapping `drawSquare` and the offscreen-sprite-canvas + `drawImage` pattern (engine.ts:328-449) — copy those two mechanisms, generalize the sprite cache to key on `(map, color)`.
- Sprite maps (string-array pixel maps like `RABBIT_PLAIN`; `"1"` = body color, `"2"` = accent, `"3"` = spark — the sprite cache renders multi-color):

```ts
/** Fyze — the walking bomb: round body, stub legs, wick + spark ("3"). */
export const FYZE_SPRITE: readonly string[] = [
  "....3....",
  "....1....",
  "..11111..",
  ".1111111.",
  ".1101011.",  // 0 = bg knockout eyes
  ".1111111.",
  ".2222222.",  // accent belly band
  ".1111111.",
  "..11111..",
  "..1...1..",
];
```

Design enemy sprites the same way, distinct silhouettes (wanderer = round blob w/ feet, chaser = pointed hood, skitter = spiky), body `"1"` colored per kind: wanderer `soft`-tone fg, chaser `player` fg full, skitter `spark`. Powerups: 7×7 icons — bomb (mini fyze), range (cross), speed (chevrons), skull (skull) — good ones drawn in `accent`, skull in `spark`. Exit: accent door outline; OPEN exit = filled accent doorway.
- Bomb on field: Fyze-shaped? No — planted bomb = plain round bomb sprite (body `"1"` fg + spark), PULSES by swapping spark pixel on/off every 250ms sim-time (`fuseMs` derived, not wall clock); under `reducedMotion` the spark is always on.
- Blast draw: for each blast cell, filled square `accent` at fill 0.86 + inner square `boardBg` at 0.4 → cross reads as hollow energy; rim cells (last of arm) same. Animate by ttl: full for first 250ms, shrink fill toward 0.4 over the last 150ms. Under `reducedMotion`: single static fill, no shrink.
- Player while debuffed: belly band drawn in `spark` instead of `accent` (the ONE state signal).
- HUD row 0 (drawn every frame, font `bold ${11 * (cell/20)}px var(--font-mono)` — scale with cell): left `♥×lives` as small Fyze-head icons (or filled squares) in `spark`, center `LVL {n}` in `muted`, right `{m:ss}` timer in `hudText`, turning `spark` under 30s. A 1px `gridLine` rule separates HUD from arena.
- `drawIdle` = boardBg fill + arena grid + frame (menu shows overlay on top) — mirror snake's.
- `drawGame` order: bg → grid → exit (if revealed) → powerups → soft → pillars → bombs → blasts → enemies → player → HUD → frame.

- [ ] **Step 1: Implement palette + sprite cache + all draw methods** per above.
- [ ] **Step 2: Gate** — typecheck + lint + existing tests still green.

---

### Task 7: Game hook — `use-short-fuse-game.ts`

**Files:**
- Create: `src/features/arcade/short-fuse/model/use-short-fuse-game.ts`

**Interfaces:**
- Consumes: `ShortFuseEngine` + palette/constants (Task 2–6), shared kit (`createGamepadPoller`, `readGamepadAxes`, `GAMEPAD_DEADZONE`, `loadBindings`, `saveBindings`, `GUEST_SCOPE`), bindings/history/types (Task 1).
- Produces: `useShortFuseGame(options?: UseShortFuseGameOptions): ShortFuseGameApi` — exactly the Task-1 `ShortFuseGameApi`.

Start from a copy of `use-snake-classic-game.ts` and change ONLY the deltas below (everything else — refs-mirror pattern, rAF+fallback loop, resize (swap `GRID_H`→`CANVAS_ROWS` in the aspect math), theme MutationObserver + `resolvePalette` (rewrite for `ShortFusePalette` fields per Task 6 mapping, reusing snake's `parseHexRgb`/grid-alpha trick and `lerpHex` imported from the engine), history hydration, pad-bindings persistence, `keysSuspendedRef` — stays):

1. **Held-direction input, not edge-steering.** Keyboard tracks a live set of pressed codes:

```ts
const heldRef = useRef<Set<string>>(new Set());
const dirOrderRef = useRef<string[]>([]); // most-recent-pressed last

// keydown (in addition to snake's guards): normalize arrows via e.key, WASD via e.code
// on movement key: heldRef.add(norm); push norm to dirOrderRef (dedup first)
// Space: menu → start(); playing → engine.placeBomb() (edge — keydown with e.repeat ignored)
// KeyP: togglePause()
// Enter: menu → start()
// keyup: delete from heldRef + dirOrderRef
```

Every rAF tick, resolve the active direction = the LAST movement key in `dirOrderRef` still held (map to `(dx,dy)`), merged with gamepad: D-pad held state (NOT edge) + analog axes past `GAMEPAD_DEADZONE`; gamepad `bomb` is edge-triggered (prev-frame compare, snake's `edge` pattern), `start`/`pause` edge too. Call `engine.setMove(dx, dy)` each tick (`(0,0)` when nothing held / not playing / paused). Also clear `heldRef`/`dirOrderRef` on window `blur` (stuck-key guard).

2. **Sim advance:** replace snake's `stepInterval` block with per-frame delta:

```ts
if (screen === "playing" && !pausedRef.current) {
  const dt = now - lastSim;
  lastSim = now;
  const result = engine.update(dt);
  if (result.gameOver) handleGameOver(result.score);
  else setState((s) =>
    s.score === result.score && s.level === result.level && s.lives === result.lives
      ? s
      : { ...s, score: result.score, level: result.level, lives: result.lives }
  );
  engine.drawGame(ctx, cssW, cssH, dpr);
} else { /* same as snake: over/paused → drawGame; menu → drawIdle */ }
```

Reset `lastSim = now` when (re)entering playing (pause/resume must not integrate the paused gap — set `lastSim` in `start()`-adjacent effect or guard `dt = Math.min(now - lastSim, 100)`; the engine clamps to 50ms anyway).

3. **`INITIAL_STATE`:** `{ screen: "menu", paused: false, score: 0, best: 0, level: 1, lives: INITIAL_LIVES, isNewBest: false, rank: 0 }`; `start()` resets those fields + `engine.reset()`.

4. **Reduced motion:** on mount, `engine.setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches)` + listen for changes; cleanup on unmount.

5. Rename every `SnakeClassic*` symbol to `ShortFuse*`; gamepad poller uses `SHORT_FUSE_ACTION_IDS`; storage constants from Task 1.

- [ ] **Step 1: Implement the hook** per deltas.
- [ ] **Step 2: Gate** — typecheck + lint (hook has no unit tests, matching the repo: no snake hook tests either).

---

### Task 8: Board component + arcade orchestrator + barrel

**Files:**
- Create: `src/features/arcade/short-fuse/ui/short-fuse-board.tsx`
- Create: `src/features/arcade/short-fuse/ui/use-short-fuse-arcade.ts`
- Create: `src/features/arcade/short-fuse/index.ts`

**Interfaces:**
- Consumes: everything above + shared kit overlays.
- Produces: `ShortFuseBoard({ api, canRank })`, `useShortFuseArcade(options?): ShortFuseArcadeApi`, barrel exports.

- [ ] **Step 1: `short-fuse-board.tsx`** — copy snake's board, apply:
  - aspect class `aspect-[15/12]` (CANVAS_ROWS), root otherwise identical.
  - `aria-label="Short Fuse game board. Arrow keys or WASD to move, Space to drop a bomb, P to pause."`
  - `MenuOverlay title="Short Fuse" description="The lazy way through a wall is a bomb."` + the same `Controls` extra block.
  - `PauseOverlay hint="P to resume"`.
  - `rankLine(state.rank, canRank, "clear more levels")` for the game-over detail.
  - `ControlsModal` fed `SHORT_FUSE_ACTIONS` / `SHORT_FUSE_KEYBOARD_INFO` / `padBindings` / `SHORT_FUSE_DEFAULT_GAMEPAD_BINDINGS`.

- [ ] **Step 2: `use-short-fuse-arcade.ts`** — copy snake's orchestrator verbatim with renames (`useShortFuseGame`, `useShortFuseLeaderboard`, error log prefix `"Short Fuse: score submit failed"`). Logic byte-identical (auth gating, localBest fallback, merged state, `rankApiBoard`).

- [ ] **Step 3: `index.ts`:**

```ts
export { useShortFuseArcade } from "./ui/use-short-fuse-arcade";
export type { ShortFuseArcadeApi } from "./ui/use-short-fuse-arcade";
export { ShortFuseBoard } from "./ui/short-fuse-board";
export { useShortFuseLeaderboard } from "./model/use-short-fuse-leaderboard";
export { BOARD_SIZE } from "./model/leaderboard";
export { FyzeMark } from "./ui/fyze-mark";
export { HISTORY_RECENT } from "./model/score-history";
```

(`FyzeMark` lands in Task 9 — create the file there before this barrel line compiles, or add the export line in Task 9. Prefer: add the line in Task 9.)

- [ ] **Step 4: Gate.**

---

### Task 9: Route, roster, hub mark, live verify

**Files:**
- Create: `src/app/arcade/short-fuse/page.tsx`
- Create: `src/app/arcade/short-fuse/short-fuse-page.tsx`
- Create: `src/features/arcade/short-fuse/ui/fyze-mark.tsx`
- Modify: `src/features/arcade/shared/model/arcade-games.ts` (roster entry)
- Modify: `src/features/arcade/hub/ui/arcade-page.tsx` (VISUALS entry + leaderboard hook wiring — mirror how `use2048Leaderboard` is consumed there)
- Modify: `src/features/arcade/short-fuse/index.ts` (add `FyzeMark` export)

- [ ] **Step 1: `page.tsx`** — copy snake's route page: `generateMeta({ title: "Short Fuse", noindex: true })`, render `ShortFusePage`.

- [ ] **Step 2: `short-fuse-page.tsx`** — copy `snake-classic-page.tsx` with renames; `gradientId="shortFuseScoreSparkGrad"`; board component `ShortFuseBoard`.

- [ ] **Step 3: `fyze-mark.tsx`** — theme-native SVG of Fyze rendered from `FYZE_SPRITE` (import the map from the engine so mark ↔ in-game sprite never drift, the SnakeMark principle): a `size`-prop SVG drawing the pixel map as `<rect>`s — `"1"` → `var(--m-fg)`-equivalent dark-card body color, `"2"` → accent, `"3"` → error spark (follow `snake-mark.tsx`'s color approach — it keys off the DARK reference constants exported from the engine).

- [ ] **Step 4: Roster** — in `ARCADE_GAMES` insert after the Snake entry:

```ts
{ game: "short-fuse", title: "Short Fuse", href: "/arcade/short-fuse" },
```

- [ ] **Step 5: Hub** — in `arcade-page.tsx` add to `VISUALS`:

```ts
"short-fuse": {
  mark: <FyzeMark size={CELL * 2} />,
  field: { cell: CELL, spanX: 3, spanY: 2 },
},
```

plus the import from `@/features/arcade/short-fuse` and the top-3 leaderboard wiring for the new card (mirror the existing per-game leaderboard usage in this file exactly).

- [ ] **Step 6: Full gates** — `npm run typecheck` && `npm run lint` && `npx vitest run` (whole suite) → 0 errors.

- [ ] **Step 7: Live verify** — `npm run dev`, then check: `/arcade` hub shows the Short Fuse card (mark on cell field, 3 leader rows); `/arcade/short-fuse` renders StatsBand + board + leaderboard rail; play a run — movement smooth w/ corner assist, bomb plant/blast/chain, enemy kill, powerup pickup, skull debuff tint, death → level regen with kept powerups, timer HUD, exit reveal → open → next level, game over → score submit (signed-in) + sparkline append; pause (P), fullscreen toggle, Controls modal rebind; theme flip (light/dark) recolors canvas; `prefers-reduced-motion` (emulate in devtools) → no flicker/pulse. Verify profile crowns still render (roster consumption).

- [ ] **Step 8: STOP.** Report results to the owner; ask for visual-approval + commit authorization (project rule — spacing/UI needs eyeball approval, commits need explicit yes).

---

## Self-review notes

- Spec coverage: identity/copy (T9, board T8), arena+movement (T2–3), bombs/chains (T4), enemies/lives/timer/exit (T5), powerups+skull (T4), scoring incl. time bonus (T4–5), rendering/HUD/reduced-motion (T6), controls incl. P-pause + gamepad (T7), route/roster/hub/crowns (T9), desktop-only gating (T9 via page copy), no-backend + localStorage keys (T1). Non-goals honored: no kick/remote, no PvP, no touch.
- Types consistent: `ShortFuseGameState` fields (`level`, `lives`) flow T1 → T7 → T8; `UpdateResult` T3 → T5 → T7; sprite maps T6 → T9 mark.
- The two deliberately-flagged code smells in snippets (Task 2 `count` precedence, Task 3 flush clamp) carry explicit correction notes — implementers must write the corrected forms.
