# Tetris Modern Guideline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the arcade Tetris from NES-classic rules to a modern guideline ruleset (SRS kicks, hard drop + ghost, hold, 500ms move-reset lock delay, 133/25 DAS, 7-bag, T-spins + guideline scoring) and add a reusable input layer (key remapping + gamepad) in `features/arcade/shared`, wired to Tetris.

**Architecture:** Extend the existing headless `TetrisEngine` in place (same class, same leaderboard). The React hook `useTetrisGame` keeps owning the rAF loop and canvases; new input edges (`hardDrop`, `hold`) flow through the same `TetrisInput` object the engine consumes. Bindings + gamepad live in `features/arcade/shared` as game-agnostic modules; Tetris defines its own action set.

**Tech Stack:** TypeScript, React 19, canvas 2D, Vitest (jsdom, `npm test` = `vitest`), Gamepad API.

**Spec:** `docs/superpowers/specs/2026-07-05-tetris-modern-guideline-design.md` (approved).

## Global Constraints

- Execute in a fresh worktree branched from `origin/main` (`c3ecc39`); copy this plan + the spec into it (they are untracked).
- CLAUDE.md design system applies to all UI: closed type set (11px/0.12em labels, 14px body), 36px controls (`h-9`), 2px borders, `gap-3` action pairs, `.mono-focus`, z-index tokens.
- Repo lint rule: NO synchronous `setState` inside an effect (defer via `requestAnimationFrame` or event-driven callbacks).
- `src/features/arcade/shared` must stay framework-portable client React (no `next/*`).
- Run `npm run typecheck` && `npm run lint` after every task; keep both at 0.
- Commits: per-task on the isolated worktree branch, no co-authorship trailer, NEVER push/merge without owner approval.
- Test command: `npx vitest run src/features/arcade/tetris/model/engine.test.ts` (and the shared test file where noted).

---

### Task 1: Injectable RNG + 7-bag randomizer + engine debug surface

**Files:**

- Modify: `src/features/arcade/tetris/model/engine.ts`
- Modify: `src/features/arcade/tetris/model/types.ts` (TetrisInput gains `hardDrop`/`hold`)
- Modify: `src/features/arcade/tetris/model/use-tetris-game.ts` (inputRef/resetInput gain the two fields)
- Create: `src/features/arcade/tetris/model/engine.test.ts`

**Interfaces:**

- Produces: `class SevenBag { constructor(rng?: () => number); next(): number; reset(): void }` (exported from engine.ts); `TetrisEngine` constructor `constructor(rng: () => number = Math.random)`; debug helpers `debugSetGrid(grid: number[][])`, `debugSetPiece(type: PieceType, rot: number, x: number, y: number)`, `debugPiece(): { type; rot; x; y } | null`, `debugGrid(): number[][]`, `debugInspect(): { score: number; lines: number; level: number; holdType: PieceType | null; holdUsed: boolean; nextType: PieceType }`; `TetrisInput` now has `hardDrop: boolean; hold: boolean`.

- [ ] **Step 1: Write the failing tests**

Create `src/features/arcade/tetris/model/engine.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/features/arcade/tetris/model/engine.test.ts`
Expected: FAIL — `SevenBag` is not exported.

- [ ] **Step 3: Implement**

In `engine.ts`:

3a. Add the `SevenBag` class (after the `ROTATIONS` block) and remove the NES reroll:

```ts
/** 7-bag randomizer: shuffle all seven piece indices, deal in order, refill when
 *  empty — the guideline randomizer (no droughts, no floods). RNG is injectable
 *  for tests (mirrors Engine2048). */
export class SevenBag {
  private bag: number[] = [];

  constructor(private rng: () => number = Math.random) {}

  next(): number {
    if (this.bag.length === 0) this.refill();
    return this.bag.pop()!;
  }

  reset() {
    this.bag = [];
  }

  private refill() {
    const b = PIECE_TYPES.map((_, i) => i);
    for (let i = b.length - 1; i > 0; i--) {
      const j = (this.rng() * (i + 1)) | 0;
      [b[i], b[j]] = [b[j], b[i]];
    }
    this.bag = b;
  }
}
```

3b. In `TetrisEngine`: delete `prevPieceIndex` and the whole `rollType()` method; add a constructor param and a bag field:

```ts
  private bag: SevenBag;

  constructor(rng: () => number = Math.random) {
    this.grid = TetrisEngine.emptyGrid();
    this.bag = new SevenBag(rng);
  }
```

In `reset()`: replace `this.prevPieceIndex = -1;` with `this.bag.reset();` and the two `this.rollType()` calls with `this.bag.next()`. In `spawnNext()`: `this.nextIndex = this.bag.next();`.

3c. Add the debug surface at the end of the class (test-only, mirrors `Engine2048`):

```ts
  // ---------- test-only debug surface ----------

  debugSetGrid(grid: number[][]) {
    this.grid = grid.map((r) => [...r]);
  }

  debugSetPiece(type: PieceType, rot: number, x: number, y: number) {
    this.piece = { type, rot, x, y };
    this.phase = "falling";
    this.dropTimer = 0;
    this.lockTimer = 0;
  }

  debugPiece() {
    return this.piece ? { ...this.piece } : null;
  }

  debugGrid(): number[][] {
    return this.grid.map((r) => [...r]);
  }

  debugInspect() {
    return {
      score: this.score,
      lines: this.lines,
      level: this.level,
      holdType: null as PieceType | null, // real value lands with hold (Task 5)
      holdUsed: false,
      nextType: PIECE_TYPES[this.nextIndex],
    };
  }
```

3d. In `types.ts`, extend `TetrisInput` (doc comment: `hardDrop`/`hold` are one-shot edges like the rotates):

```ts
export interface TetrisInput {
  left: boolean;
  right: boolean;
  softDrop: boolean;
  rotateCW: boolean;
  rotateCCW: boolean;
  hardDrop: boolean;
  hold: boolean;
}
```

3e. In `use-tetris-game.ts`, add the two fields to the `inputRef` initializer and to `resetInput` (`input.hardDrop = input.hold = false` joins the chain). The engine ignores them until Tasks 4–5 — that's fine.

- [ ] **Step 4: Run tests + gates**

Run: `npx vitest run src/features/arcade/tetris/model/engine.test.ts && npm run typecheck && npm run lint`
Expected: PASS / 0 / 0.

- [ ] **Step 5: Commit**

```bash
git add src/features/arcade/tetris/model/
git commit -m "feat(tetris): 7-bag randomizer with injectable rng + engine debug surface"
```

---

### Task 2: SRS rotation with full wall/floor kicks

**Files:**

- Modify: `src/features/arcade/tetris/model/engine.ts`
- Test: `src/features/arcade/tetris/model/engine.test.ts`

**Interfaces:**

- Produces: private engine fields `lastAction: "none" | "move" | "rotate" | "drop"`, `lastKickIndex: number` (index into the kick table of the applied offset, −1 none) — consumed by T-spin detection (Task 6); private `noteShift(action)` — reused by lock-delay reset (Task 3).

- [ ] **Step 1: Write the failing tests**

Append to `engine.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/features/arcade/tetris/model/engine.test.ts`
Expected: the two kick tests FAIL (current no-kick rotation leaves rot/position unchanged in test 1 and 2).

- [ ] **Step 3: Implement**

In `engine.ts`, add after the `ROTATIONS` block:

```ts
// ---------- SRS kick tables ----------
//
// tetris.wiki/Super_Rotation_System tables VERBATIM: offsets are (x, y) with +y UP,
// applied as `x + dx, y - dy` (our grid's +y is down). Rotation states: 0 spawn,
// 1 = R (one CW), 2 = two rotations, 3 = L (one CCW). Key = "from>to". First
// offset that fits wins. O never kicks (its rotation is the identity).

type Kick = readonly [number, number];

const kickKey = (from: number, to: number) => `${from}>${to}`;

const JLSTZ_KICKS: Record<string, readonly Kick[]> = {
  "0>1": [
    [0, 0],
    [-1, 0],
    [-1, 1],
    [0, -2],
    [-1, -2],
  ],
  "1>0": [
    [0, 0],
    [1, 0],
    [1, -1],
    [0, 2],
    [1, 2],
  ],
  "1>2": [
    [0, 0],
    [1, 0],
    [1, -1],
    [0, 2],
    [1, 2],
  ],
  "2>1": [
    [0, 0],
    [-1, 0],
    [-1, 1],
    [0, -2],
    [-1, -2],
  ],
  "2>3": [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, -2],
    [1, -2],
  ],
  "3>2": [
    [0, 0],
    [-1, 0],
    [-1, -1],
    [0, 2],
    [-1, 2],
  ],
  "3>0": [
    [0, 0],
    [-1, 0],
    [-1, -1],
    [0, 2],
    [-1, 2],
  ],
  "0>3": [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, -2],
    [1, -2],
  ],
};

const I_KICKS: Record<string, readonly Kick[]> = {
  "0>1": [
    [0, 0],
    [-2, 0],
    [1, 0],
    [-2, -1],
    [1, 2],
  ],
  "1>0": [
    [0, 0],
    [2, 0],
    [-1, 0],
    [2, 1],
    [-1, -2],
  ],
  "1>2": [
    [0, 0],
    [-1, 0],
    [2, 0],
    [-1, 2],
    [2, -1],
  ],
  "2>1": [
    [0, 0],
    [1, 0],
    [-2, 0],
    [1, -2],
    [-2, 1],
  ],
  "2>3": [
    [0, 0],
    [2, 0],
    [-1, 0],
    [2, 1],
    [-1, -2],
  ],
  "3>2": [
    [0, 0],
    [-2, 0],
    [1, 0],
    [-2, -1],
    [1, 2],
  ],
  "3>0": [
    [0, 0],
    [1, 0],
    [-2, 0],
    [1, -2],
    [-2, 1],
  ],
  "0>3": [
    [0, 0],
    [-1, 0],
    [2, 0],
    [-1, 2],
    [2, -1],
  ],
};
```

Add the tracking fields next to the other timers:

```ts
  /** Last successful action — T-spin detection needs "was the final maneuver a rotate". */
  private lastAction: "none" | "move" | "rotate" | "drop" = "none";
  /** Kick-table index of the applied rotation offset (−1 = none) — the 5th (index 4)
   *  upgrades a mini T-spin to full. */
  private lastKickIndex = -1;
```

Reset both in `reset()` and in `spawn()` (`this.lastAction = "none"; this.lastKickIndex = -1;`).

Add `noteShift` (the lock-delay budget arrives in Task 3 — for now it only records the action):

```ts
  /** Record a successful move/rotate: it becomes the "last action" (T-spin detection). */
  private noteShift(action: "move" | "rotate") {
    this.lastAction = action;
  }
```

Call `this.noteShift("move")` inside `tryMove` on success. Replace `tryRotate` entirely:

```ts
  /** SRS rotation: try the target state at each kick offset from the wiki tables
   *  (first fit wins — includes wall AND floor kicks). `dir` +1 = CW, −1 = CCW. */
  private tryRotate(dir: number): boolean {
    const p = this.piece;
    if (!p || p.type === "O") return false;
    const to = (p.rot + dir + 4) % 4;
    const kicks = (p.type === "I" ? I_KICKS : JLSTZ_KICKS)[kickKey(p.rot, to)];
    for (let i = 0; i < kicks.length; i++) {
      const [dx, dy] = kicks[i];
      const nx = p.x + dx;
      const ny = p.y - dy; // wiki +y is up; our +y is down
      if (this.fits(p.type, to, nx, ny)) {
        p.rot = to;
        p.x = nx;
        p.y = ny;
        this.lastKickIndex = i;
        this.noteShift("rotate");
        return true;
      }
    }
    return false;
  }
```

In the gravity loop, mark falls: after `this.piece!.y += 1;` add `this.lastAction = "drop";`.

- [ ] **Step 4: Run tests + gates**

Run: `npx vitest run src/features/arcade/tetris/model/engine.test.ts && npm run typecheck && npm run lint`
Expected: PASS / 0 / 0.

- [ ] **Step 5: Commit**

```bash
git add src/features/arcade/tetris/model/engine.ts src/features/arcade/tetris/model/engine.test.ts
git commit -m "feat(tetris): SRS rotation with full wall/floor kick tables"
```

---

### Task 3: Lock delay rework (500ms, move-reset, 15 cap) + DAS retune

**Files:**

- Modify: `src/features/arcade/tetris/model/engine.ts`
- Test: `src/features/arcade/tetris/model/engine.test.ts`

**Interfaces:**

- Consumes: `noteShift` from Task 2.
- Produces: constants `LOCK_DELAY = 500`, `LOCK_RESETS_MAX = 15`, `DAS_DELAY = 133`, `DAS_REPEAT = 25`; private `lockResets` counter.

- [ ] **Step 1: Write the failing tests**

Append to `engine.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/features/arcade/tetris/model/engine.test.ts`
Expected: lock tests FAIL (current `LOCK_DELAY` 120, no reset); DAS test FAIL (170/50 cadence).

- [ ] **Step 3: Implement**

In `engine.ts`:

3a. Retune the constants (update their doc comments to match):

```ts
/** DAS (Delayed Auto-Shift): first held-move fires immediately, then auto-repeat
 *  waits {@link DAS_DELAY} and repeats every {@link DAS_REPEAT} — modern-tuned. */
const DAS_DELAY = 133;
const DAS_REPEAT = 25;

/** Lock delay (guideline move-reset): a landed piece locks after this grace, but a
 *  successful move/rotate restarts the timer — at most {@link LOCK_RESETS_MAX}
 *  times per piece, so there's no infinite stalling. */
const LOCK_DELAY = 500;
const LOCK_RESETS_MAX = 15;
```

3b. Add the budget field next to `lockTimer`:

```ts
  private lockResets = 0;
```

Reset it in `reset()` and in `spawn()` (`this.lockResets = 0;`).

3c. Extend `noteShift` to spend the budget:

```ts
  /** Record a successful move/rotate: it becomes the "last action" (T-spin detection)
   *  and, if the piece is inside its lock-delay grace, restarts the timer — at most
   *  {@link LOCK_RESETS_MAX} times per piece (guideline move-reset). */
  private noteShift(action: "move" | "rotate") {
    this.lastAction = action;
    if (this.lockTimer > 0 && this.lockResets < LOCK_RESETS_MAX) {
      this.lockTimer = 0;
      this.lockResets += 1;
    }
  }
```

3d. Update the lock-delay block comment in `update()` (the logic is unchanged — the reset now happens via `noteShift`):

```ts
// Lock delay — guideline move-reset: the timer runs from landing; a successful
// move/rotate restarts it via noteShift (≤ LOCK_RESETS_MAX per piece). If the
// piece can fall again (moved over a gap) the timer clears and it keeps dropping.
```

- [ ] **Step 4: Run tests + gates**

Run: `npx vitest run src/features/arcade/tetris/model/engine.test.ts && npm run typecheck && npm run lint`
Expected: PASS / 0 / 0.

- [ ] **Step 5: Commit**

```bash
git add src/features/arcade/tetris/model/engine.ts src/features/arcade/tetris/model/engine.test.ts
git commit -m "feat(tetris): 500ms move-reset lock delay (15 cap) + 133/25 DAS"
```

---

### Task 4: Hard drop + ghost piece

**Files:**

- Modify: `src/features/arcade/tetris/model/engine.ts`
- Modify: `src/features/arcade/tetris/model/use-tetris-game.ts` (palette `ghostFill`)
- Test: `src/features/arcade/tetris/model/engine.test.ts`

**Interfaces:**

- Consumes: `TetrisInput.hardDrop` (Task 1).
- Produces: private `dropDistance(): number`; `TetrisPalette.ghostFill: string`.

- [ ] **Step 1: Write the failing tests**

Append to `engine.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/features/arcade/tetris/model/engine.test.ts`
Expected: FAIL — hard drop not handled, piece doesn't lock.

- [ ] **Step 3: Implement**

3a. Add `dropDistance` next to `canMoveDown`:

```ts
  /** How many rows the piece can fall before resting — the ghost/hard-drop distance. */
  private dropDistance(): number {
    const p = this.piece!;
    let d = 0;
    while (this.fits(p.type, p.rot, p.x, p.y + d + 1)) d++;
    return d;
  }
```

3b. In `update()`, after the rotation block and before the gravity block:

```ts
// Hard drop (one-shot edge): teleport to the drop position and lock NOW — zero
// frames, no lock-delay grace. +2 points per cell. A drop of 0 keeps the last
// action (a rotate stays a T-spin); any fall overwrites it.
if (input.hardDrop) {
  input.hardDrop = false;
  const d = this.dropDistance();
  if (d > 0) {
    this.piece!.y += d;
    this.score += d * 2;
    this.lastAction = "drop";
  }
  return this.lockPiece();
}
```

3c. Ghost: add to `TetrisPalette`:

```ts
/** Ghost (drop-preview) silhouette ← `--m-accent` at low alpha. */
ghostFill: string;
```

`DEFAULT_PALETTE` gains `ghostFill: "rgba(205,255,72,0.28)",`. In `drawWell`, inside the falling-piece branch, draw the ghost BEFORE the piece:

```ts
    if (this.piece && this.phase !== "clearing") {
      const m = ROTATIONS[this.piece.type][this.piece.rot];
      // Ghost silhouette at the drop position (skipped when resting on it).
      const ghostD = this.dropDistance();
      if (ghostD > 0) {
        for (let r = 0; r < m.length; r++) {
          for (let c = 0; c < m.length; c++) {
            if (!m[r][c]) continue;
            const gy = this.piece.y + r + ghostD;
            if (gy < 0) continue;
            this.fillCell(ctx, cell, dpr, this.piece.x + c, gy, this.palette.ghostFill);
          }
        }
      }
      // …existing falling-piece draw stays below…
```

3d. In `use-tetris-game.ts` `resolvePalette`, derive the ghost from the accent (reuse `parseHexRgb`):

```ts
const [ar, ag, ab] = parseHexRgb(accent);
return {
  boardBg: read("--m-bg", "#181818"),
  pieceFill: accent,
  flashAccent: accent,
  ghostFill: `rgba(${ar},${ag},${ab},0.28)`,
  lockedFill: read("--m-muted2", "#7a7a7a"),
  gridLine: `rgba(${r},${g},${b},${alpha})`,
};
```

- [ ] **Step 4: Run tests + gates**

Run: `npx vitest run src/features/arcade/tetris/model/engine.test.ts && npm run typecheck && npm run lint`
Expected: PASS / 0 / 0.

- [ ] **Step 5: Commit**

```bash
git add src/features/arcade/tetris/model/
git commit -m "feat(tetris): hard drop (instant lock, 2pts/cell) + ghost piece"
```

---

### Task 5: Hold piece (engine + preview draw generalisation)

**Files:**

- Modify: `src/features/arcade/tetris/model/engine.ts`
- Test: `src/features/arcade/tetris/model/engine.test.ts`

**Interfaces:**

- Consumes: `TetrisInput.hold` (Task 1).
- Produces: `drawHold(ctx, cssW, cssH, dpr)` (public, same signature as `drawNext`); `debugInspect().holdType/holdUsed` become real.

- [ ] **Step 1: Write the failing tests**

Append to `engine.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/features/arcade/tetris/model/engine.test.ts`
Expected: FAIL — `holdType` stays null.

- [ ] **Step 3: Implement**

3a. Fields (next to `nextIndex`):

```ts
  /** Held piece index (−1 = empty box) + the one-swap-per-piece latch. */
  private holdIndex = -1;
  private holdUsed = false;
```

Reset both in `reset()`. Re-arm in `lockPiece()`: add `this.holdUsed = false;` right after the full-rows scan (before either branch).

3b. In `update()`, FIRST thing after the `clearing` branch (before DAS):

```ts
// Hold (one-shot edge): swap the falling piece with the box, once per piece.
if (input.hold) {
  input.hold = false;
  if (!this.holdUsed && this.piece) {
    const cur = PIECE_TYPES.indexOf(this.piece.type);
    const stored = this.holdIndex;
    this.holdIndex = cur;
    this.holdUsed = true;
    const alive = stored >= 0 ? this.spawn(stored) : this.spawnNext();
    if (!alive) return this.snapshot(true);
  }
}
```

3c. Generalise the preview draw: rename the body of `drawNext` into a private
`drawPreviewCanvas(ctx, type, fill, cssW, cssH, dpr)` (same bounding-box centring code,
but `type: PieceType | null` — bg-fill then early-return when null — and the cell
colour comes from the `fill` param instead of hardcoded `pieceFill`). Then:

```ts
  /** Paint the ONE next piece, centred in the preview canvas. */
  drawNext(ctx: CanvasRenderingContext2D, cssW: number, cssH: number, dpr: number) {
    this.drawPreviewCanvas(ctx, PIECE_TYPES[this.nextIndex], this.palette.pieceFill, cssW, cssH, dpr);
  }

  /** Paint the HOLD box: empty bg when nothing held; dimmed once used this piece. */
  drawHold(ctx: CanvasRenderingContext2D, cssW: number, cssH: number, dpr: number) {
    const type = this.holdIndex >= 0 ? PIECE_TYPES[this.holdIndex] : null;
    const fill = this.holdUsed ? this.palette.lockedFill : this.palette.pieceFill;
    this.drawPreviewCanvas(ctx, type, fill, cssW, cssH, dpr);
  }
```

3d. Make `debugInspect` report the real values:

```ts
      holdType: this.holdIndex >= 0 ? PIECE_TYPES[this.holdIndex] : null,
      holdUsed: this.holdUsed,
```

- [ ] **Step 4: Run tests + gates**

Run: `npx vitest run src/features/arcade/tetris/model/engine.test.ts && npm run typecheck && npm run lint`
Expected: PASS / 0 / 0.

- [ ] **Step 5: Commit**

```bash
git add src/features/arcade/tetris/model/
git commit -m "feat(tetris): hold piece (one swap per piece) + preview draw generalised"
```

---

### Task 6: T-spin detection + guideline scoring + clear events + engine passport

**Files:**

- Modify: `src/features/arcade/tetris/model/engine.ts`
- Modify: `src/features/arcade/tetris/model/types.ts`
- Test: `src/features/arcade/tetris/model/engine.test.ts`

**Interfaces:**

- Consumes: `lastAction`/`lastKickIndex` (Task 2).
- Produces (types.ts):

```ts
export type ClearKind =
  "single" | "double" | "triple" | "tetris" | "tspin" | "tspin-mini";

/** Reported once, on the lock tick that cleared lines or scored a T-spin. */
export interface ClearEvent {
  kind: ClearKind;
  lines: number;
  b2b: boolean;
  /** Combo count (≥1 means a combo bonus was paid). */
  combo: number;
}

export interface TetrisStep {
  dead: boolean;
  score: number;
  lines: number;
  level: number;
  event: ClearEvent | null;
}
```

- [ ] **Step 1: Write the failing tests**

Append to `engine.test.ts` (the T-slot geometry is explained inline — positions were hand-verified against the 3×3 T matrices):

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/features/arcade/tetris/model/engine.test.ts`
Expected: FAIL — classic scoring pays 100×? no: current classic pays `LINE_SCORES[2]*(0+1)` = 300 for the double, 40-based values elsewhere.

- [ ] **Step 3: Implement**

3a. `types.ts`: add `ClearKind`/`ClearEvent`, extend `TetrisStep` with `event` (code in Interfaces above).

3b. Scoring constants (replace the classic `LINE_SCORES` block):

```ts
// ---------- scoring (guideline) ----------

/** Guideline line-clear base points by lines cleared (× (level + 1)). */
const LINE_SCORES = [0, 100, 300, 500, 800];
/** T-spin base points by lines cleared (0 = the no-line spin itself). */
const TSPIN_SCORES = [400, 800, 1200, 1600];
/** Mini T-spin base points by lines cleared. */
const TSPIN_MINI_SCORES = [100, 200, 400];
/** Back-to-back bonus on "difficult" clears (Tetris / any T-spin clear). */
const B2B_MULT = 1.5;
/** Per-combo-step bonus (× combo count × (level + 1)). */
const COMBO_POINTS = 50;
```

3c. Chain state fields (reset both in `reset()`):

```ts
  /** Combo counter: −1 idle; each consecutive clearing lock increments (bonus from 1). */
  private combo = -1;
  /** Last clearing lock was "difficult" (Tetris / T-spin) — arms the B2B bonus. */
  private b2bArmed = false;
```

3d. T-spin detection (next to `lockPiece`):

```ts
  /** 3-corner T-spin test at lock time: T piece, last action a rotate, ≥3 of the
   *  piece box's diagonal corners occupied (walls/floor count). Mini when the two
   *  FRONT corners (the side the nose points to) aren't both filled — unless the
   *  rotation used the 5th kick offset, which upgrades to a full T-spin. */
  private tSpinKind(): "none" | "mini" | "full" {
    const p = this.piece!;
    if (p.type !== "T" || this.lastAction !== "rotate") return "none";
    const occupied = (gx: number, gy: number) =>
      gx < 0 || gx >= COLS || gy >= ROWS || (gy >= 0 && this.grid[gy][gx] !== 0);
    const corners = [
      occupied(p.x, p.y), // 0 top-left
      occupied(p.x + 2, p.y), // 1 top-right
      occupied(p.x, p.y + 2), // 2 bottom-left
      occupied(p.x + 2, p.y + 2), // 3 bottom-right
    ];
    if (corners.filter(Boolean).length < 3) return "none";
    // Front corner pair by rotation state (0 nose-up, 1 right, 2 down, 3 left).
    const FRONT = [
      [0, 1],
      [1, 3],
      [2, 3],
      [0, 2],
    ][p.rot];
    if (corners[FRONT[0]] && corners[FRONT[1]]) return "full";
    return this.lastKickIndex === 4 ? "full" : "mini";
  }
```

3e. Rewrite `lockPiece` (T-spin test BEFORE merging — the corners must not read the piece's own cells; merge loop and collapse stay as today):

```ts
  private lockPiece(): TetrisStep {
    const p = this.piece!;
    const tspin = this.tSpinKind();
    const m = ROTATIONS[p.type][p.rot];
    const typeVal = PIECE_TYPES.indexOf(p.type) + 1;
    for (let r = 0; r < m.length; r++) {
      for (let c = 0; c < m.length; c++) {
        if (!m[r][c]) continue;
        const gy = p.y + r;
        const gx = p.x + c;
        if (gy >= 0 && gy < ROWS && gx >= 0 && gx < COLS) {
          this.grid[gy][gx] = typeVal;
        }
      }
    }

    const full: number[] = [];
    for (let r = 0; r < ROWS; r++) {
      if (this.grid[r].every((v) => v !== 0)) full.push(r);
    }
    const n = full.length;

    // Guideline scoring at the CURRENT level; lines/level advance after.
    const base =
      tspin === "full"
        ? TSPIN_SCORES[n]
        : tspin === "mini"
          ? TSPIN_MINI_SCORES[n]
          : LINE_SCORES[n];
    const difficult = n > 0 && (tspin !== "none" || n === 4);
    const b2b = difficult && this.b2bArmed;
    let pts = base * (this.level + 1);
    if (b2b) pts = Math.floor(pts * B2B_MULT);
    if (n > 0) {
      this.combo += 1;
      if (this.combo >= 1) pts += COMBO_POINTS * this.combo * (this.level + 1);
      this.b2bArmed = difficult; // a non-difficult clear breaks the chain
    } else {
      this.combo = -1; // a dry lock breaks the combo (B2B survives)
    }
    this.score += pts;

    let event: ClearEvent | null = null;
    if (n > 0 || tspin !== "none") {
      const kind: ClearKind =
        tspin === "full"
          ? "tspin"
          : tspin === "mini"
            ? "tspin-mini"
            : (["single", "double", "triple", "tetris"] as const)[n - 1];
      event = { kind, lines: n, b2b, combo: Math.max(this.combo, 0) };
    }

    this.holdUsed = false;

    if (n > 0) {
      this.lines += n;
      const newLevel = Math.floor(this.lines / 10);
      if (newLevel !== this.level) {
        this.level = newLevel;
        this.gravityMs = this.gravityMsFor(this.level);
      }
      this.piece = null;
      this.clearingRows = full;
      this.clearTimer = 0;
      this.phase = "clearing";
      return this.snapshot(false, event);
    }

    this.piece = null;
    const alive = this.spawnNext();
    return this.snapshot(!alive, event);
  }
```

(Imports: add `ClearEvent`, `ClearKind` to the type import from `./types`.)

3f. `snapshot` gains the event param:

```ts
  private snapshot(dead: boolean, event: ClearEvent | null = null): TetrisStep {
    return { dead, score: this.score, lines: this.lines, level: this.level, event };
  }
```

3g. Rewrite the engine's top-of-file passport comment — the ruleset paragraph becomes:

```ts
/**
 * Headless MODERN-GUIDELINE TETRIS engine — all mutable state + the fixed-timestep
 * sim (gravity / DAS / lock / line-clear) + the imperative canvas draw, with NO React
 * (mirrors the Snake/Hollow-Sloth split: `useTetrisGame` owns one instance and the
 * rAF loop; state flows out only on discrete changes).
 *
 * Ruleset is the MODERN GUIDELINE (spec: docs/superpowers/specs/
 * 2026-07-05-tetris-modern-guideline-design.md): 10×20 well, SRS rotation with the
 * full tetris.wiki kick tables, 7-bag randomizer, hard drop (instant lock) + ghost,
 * hold (one swap per piece), 500ms move-reset lock delay (15-reset cap), 133/25 DAS,
 * T-spins (3-corner rule, mini + 5th-kick upgrade), guideline scoring (100/300/500/
 * 800, T-spin 400–1600, B2B ×1.5, combos, 1/2 pts per soft/hard-drop cell) — on the
 * web-tuned NES gravity curve (50ms floor). ONE next preview.
 */
```

- [ ] **Step 4: Run tests + gates**

Run: `npx vitest run src/features/arcade/tetris/model/engine.test.ts && npm run typecheck && npm run lint`
Expected: PASS / 0 / 0.

- [ ] **Step 5: Commit**

```bash
git add src/features/arcade/tetris/model/
git commit -m "feat(tetris): T-spins (3-corner + 5th-kick upgrade) and full guideline scoring"
```

---

### Task 7: Shared key-bindings module

**Files:**

- Create: `src/features/arcade/shared/model/key-bindings.ts`
- Create: `src/features/arcade/shared/model/key-bindings.test.ts`
- Modify: `src/features/arcade/shared/index.ts` (barrel)

**Interfaces:**

- Produces:

```ts
export type BindingMap<A extends string> = Record<A, readonly string[]>;
export function loadBindings<A extends string>(
  storageKey: string,
  defaults: BindingMap<A>
): BindingMap<A>;
export function saveBindings<A extends string>(
  storageKey: string,
  map: BindingMap<A>
): void;
export function rebind<A extends string>(
  map: BindingMap<A>,
  action: A,
  code: string
): BindingMap<A>;
export function keyLabel(code: string): string;
export function bindingLabel(codes: readonly string[]): string;
```

- [ ] **Step 1: Write the failing tests**

Create `src/features/arcade/shared/model/key-bindings.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import {
  bindingLabel,
  keyLabel,
  loadBindings,
  rebind,
  saveBindings,
  type BindingMap,
} from "./key-bindings";

type Act = "left" | "right" | "fire";
const DEFAULTS: BindingMap<Act> = {
  left: ["ArrowLeft", "KeyA"],
  right: ["ArrowRight", "KeyD"],
  fire: ["Space"],
};
const KEY = "test.keys.v1";

beforeEach(() => window.localStorage.clear());

describe("rebind", () => {
  it("assigns the code as the action's ONLY key", () => {
    const next = rebind(DEFAULTS, "fire", "KeyF");
    expect(next.fire).toEqual(["KeyF"]);
  });

  it("steals the code from any other action holding it", () => {
    const next = rebind(DEFAULTS, "fire", "KeyA");
    expect(next.fire).toEqual(["KeyA"]);
    expect(next.left).toEqual(["ArrowLeft"]);
  });
});

describe("load/save", () => {
  it("round-trips through localStorage", () => {
    saveBindings(KEY, rebind(DEFAULTS, "fire", "KeyF"));
    expect(loadBindings(KEY, DEFAULTS).fire).toEqual(["KeyF"]);
  });

  it("falls back to defaults on corrupt storage", () => {
    window.localStorage.setItem(KEY, "{not json");
    expect(loadBindings(KEY, DEFAULTS)).toEqual(DEFAULTS);
  });

  it("ignores unknown actions and non-string junk in stored data", () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ fire: ["KeyF"], bogus: ["KeyB"], left: [1, 2] })
    );
    const map = loadBindings(KEY, DEFAULTS);
    expect(map.fire).toEqual(["KeyF"]);
    expect(map.left).toEqual(DEFAULTS.left); // junk list rejected
  });
});

describe("labels", () => {
  it("maps arrows/space to glyphs and Key*/Digit* to bare characters", () => {
    expect(keyLabel("ArrowLeft")).toBe("←");
    expect(keyLabel("Space")).toBe("SPACE");
    expect(keyLabel("KeyA")).toBe("A");
    expect(keyLabel("Digit1")).toBe("1");
  });

  it("joins a binding list and renders an empty one as an em-dash", () => {
    expect(bindingLabel(["ArrowUp", "KeyX"])).toBe("↑ / X");
    expect(bindingLabel([])).toBe("—");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/features/arcade/shared/model/key-bindings.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement**

Create `src/features/arcade/shared/model/key-bindings.ts`:

```ts
/**
 * Game-agnostic remappable-keys store for the arcade: an action→codes map
 * (`KeyboardEvent.code` values), persisted per game in localStorage. A game
 * defines its own action union + defaults + storage key (see the Tetris
 * `bindings.ts`) and reads the live map in its key handler. Rebinding assigns
 * a SINGLE key to the action and steals that key from any other action.
 */

export type BindingMap<A extends string> = Record<A, readonly string[]>;

/** Stored map merged over `defaults`; corrupt/missing storage → defaults. */
export function loadBindings<A extends string>(
  storageKey: string,
  defaults: BindingMap<A>
): BindingMap<A> {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return defaults;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return defaults;
    const out = { ...defaults };
    for (const action of Object.keys(defaults) as A[]) {
      const v = (parsed as Record<string, unknown>)[action];
      if (
        Array.isArray(v) &&
        v.length > 0 &&
        v.every((k) => typeof k === "string")
      ) {
        out[action] = v as string[];
      }
    }
    return out;
  } catch {
    return defaults;
  }
}

export function saveBindings<A extends string>(
  storageKey: string,
  map: BindingMap<A>
) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(map));
  } catch {
    // quota / private mode — the session map still works, it just won't persist
  }
}

/** Assign `code` as THE key of `action`, removing it from every other action.
 *  (An action can end up key-less — the UI renders it as "—".) */
export function rebind<A extends string>(
  map: BindingMap<A>,
  action: A,
  code: string
): BindingMap<A> {
  const out = {} as Record<A, readonly string[]>;
  for (const a of Object.keys(map) as A[]) {
    out[a] = map[a].filter((c) => c !== code);
  }
  out[action] = [code];
  return out;
}

/** Human label for one `KeyboardEvent.code` (hint rows, modal chips). */
const KEY_LABELS: Record<string, string> = {
  ArrowLeft: "←",
  ArrowRight: "→",
  ArrowUp: "↑",
  ArrowDown: "↓",
  Space: "SPACE",
  Enter: "ENTER",
  ShiftLeft: "SHIFT",
  ShiftRight: "R-SHIFT",
  ControlLeft: "CTRL",
  ControlRight: "R-CTRL",
  AltLeft: "ALT",
  AltRight: "R-ALT",
};

export function keyLabel(code: string): string {
  if (KEY_LABELS[code]) return KEY_LABELS[code];
  if (code.startsWith("Key")) return code.slice(3);
  if (code.startsWith("Digit")) return code.slice(5);
  return code.toUpperCase();
}

/** " / "-joined labels of an action's keys; an unbound action reads "—". */
export function bindingLabel(codes: readonly string[]): string {
  return codes.map(keyLabel).join(" / ") || "—";
}
```

Add to `src/features/arcade/shared/index.ts`:

```ts
export {
  bindingLabel,
  keyLabel,
  loadBindings,
  rebind,
  saveBindings,
} from "./model/key-bindings";
export type { BindingMap } from "./model/key-bindings";
```

- [ ] **Step 4: Run tests + gates**

Run: `npx vitest run src/features/arcade/shared/model/key-bindings.test.ts && npm run typecheck && npm run lint`
Expected: PASS / 0 / 0.

- [ ] **Step 5: Commit**

```bash
git add src/features/arcade/shared/
git commit -m "feat(arcade): shared remappable key-bindings module"
```

---

### Task 8: Tetris bindings + bindings-driven keyboard + event-label projection

**Files:**

- Create: `src/features/arcade/tetris/model/bindings.ts`
- Modify: `src/features/arcade/tetris/model/types.ts`
- Modify: `src/features/arcade/tetris/model/use-tetris-game.ts`

**Interfaces:**

- Consumes: `BindingMap`, `loadBindings`, `saveBindings` (Task 7); `ClearEvent` (Task 6).
- Produces (`bindings.ts`):

```ts
export type TetrisAction =
  | "moveLeft"
  | "moveRight"
  | "softDrop"
  | "hardDrop"
  | "rotateCW"
  | "rotateCCW"
  | "hold"
  | "pause";
export const TETRIS_ACTIONS: readonly { id: TetrisAction; label: string }[];
export const TETRIS_ACTION_IDS: readonly TetrisAction[];
export const TETRIS_DEFAULT_BINDINGS: BindingMap<TetrisAction>;
export const TETRIS_KEYS_STORAGE = "arcade.tetris.keys.v1";
```

- Produces (API additions):

```ts
// TetrisGameState gains:
eventLabel: string | null;
// TetrisGameApi gains:
holdCanvasRef: React.RefObject<HTMLCanvasElement | null>;
bindings: BindingMap<TetrisAction>;
setBindings: (next: BindingMap<TetrisAction>) => void;
setKeysSuspended: (suspended: boolean) => void;
```

- [ ] **Step 1: Create `bindings.ts`**

```ts
import type { BindingMap } from "@/features/arcade/shared";

export type TetrisAction =
  | "moveLeft"
  | "moveRight"
  | "softDrop"
  | "hardDrop"
  | "rotateCW"
  | "rotateCCW"
  | "hold"
  | "pause";

/** Ordered action list — the CONTROLS modal rows + the code→action lookup. */
export const TETRIS_ACTIONS: readonly { id: TetrisAction; label: string }[] = [
  { id: "moveLeft", label: "Move left" },
  { id: "moveRight", label: "Move right" },
  { id: "softDrop", label: "Soft drop" },
  { id: "hardDrop", label: "Hard drop" },
  { id: "rotateCW", label: "Rotate cw" },
  { id: "rotateCCW", label: "Rotate ccw" },
  { id: "hold", label: "Hold" },
  { id: "pause", label: "Pause" },
];

export const TETRIS_ACTION_IDS = TETRIS_ACTIONS.map((a) => a.id);

/** Guideline defaults. Space = HARD DROP (genre muscle memory), so pause — the
 *  arcade-wide Space parity — moves to P here (deliberate, spec §2). */
export const TETRIS_DEFAULT_BINDINGS: BindingMap<TetrisAction> = {
  moveLeft: ["ArrowLeft", "KeyA"],
  moveRight: ["ArrowRight", "KeyD"],
  softDrop: ["ArrowDown", "KeyS"],
  hardDrop: ["Space"],
  rotateCW: ["ArrowUp", "KeyX"],
  rotateCCW: ["KeyZ"],
  hold: ["KeyC", "ShiftLeft", "ShiftRight"],
  pause: ["KeyP"],
};

export const TETRIS_KEYS_STORAGE = "arcade.tetris.keys.v1";
```

- [ ] **Step 2: Extend `types.ts`**

`TetrisGameState` gains `eventLabel: string | null;` (doc: transient clear-event caption). `TetrisGameApi` gains the four members from Interfaces above (import `BindingMap` from `@/features/arcade/shared`, `TetrisAction` from `./bindings`).

- [ ] **Step 3: Rework `use-tetris-game.ts`**

3a. Imports:

```ts
import {
  GUEST_SCOPE,
  loadBindings,
  saveBindings,
  type BindingMap,
} from "@/features/arcade/shared";
import {
  TETRIS_ACTION_IDS,
  TETRIS_DEFAULT_BINDINGS,
  TETRIS_KEYS_STORAGE,
  type TetrisAction,
} from "./bindings";
import type { ClearEvent, ... } from "./types";
```

3b. `INITIAL_STATE` gains `eventLabel: null,`. Add the event-label composer above the hook:

```ts
/** How long the clear-event caption stays up. */
const EVENT_LABEL_MS = 1600;

/** Caption for a noteworthy lock outcome (plain clears stay silent). */
function clearEventLabel(e: ClearEvent): string | null {
  const noteworthy =
    e.kind === "tetris" || e.kind.startsWith("tspin") || e.b2b || e.combo >= 1;
  if (!noteworthy) return null;
  const KIND: Record<ClearEvent["kind"], string> = {
    single: "SINGLE",
    double: "DOUBLE",
    triple: "TRIPLE",
    tetris: "TETRIS",
    tspin: "T-SPIN",
    "tspin-mini": "T-SPIN MINI",
  };
  const name =
    e.kind.startsWith("tspin") && e.lines > 0
      ? `${KIND[e.kind]} ${["", "SINGLE", "DOUBLE", "TRIPLE"][e.lines]}`
      : KIND[e.kind];
  return [e.b2b ? "B2B" : null, name, e.combo >= 1 ? `COMBO ×${e.combo}` : null]
    .filter(Boolean)
    .join(" · ");
}
```

3c. New refs + bindings state inside the hook:

```ts
const holdCanvasRef = useRef<HTMLCanvasElement | null>(null);

const [bindings, setBindingsState] = useState<BindingMap<TetrisAction>>(
  TETRIS_DEFAULT_BINDINGS
);
const bindingsRef = useRef(bindings);
useEffect(() => {
  bindingsRef.current = bindings;
}, [bindings]);
// Hydrate persisted bindings on mount; rAF-deferred (lint rule).
useEffect(() => {
  const raf = requestAnimationFrame(() =>
    setBindingsState(loadBindings(TETRIS_KEYS_STORAGE, TETRIS_DEFAULT_BINDINGS))
  );
  return () => cancelAnimationFrame(raf);
}, []);
const setBindings = useCallback((next: BindingMap<TetrisAction>) => {
  setBindingsState(next);
  saveBindings(TETRIS_KEYS_STORAGE, next);
}, []);

/** True while the CONTROLS modal owns the keyboard — game keys go inert. */
const keysSuspendedRef = useRef(false);
```

3d. Split keyboard HOLDS from the engine input (the engine consumes edges in
place; holds get re-composed every tick so the gamepad can merge in later):

```ts
// Engine input (edges are consumed/cleared by the engine each tick).
const inputRef = useRef<TetrisInput>({
  left: false,
  right: false,
  softDrop: false,
  rotateCW: false,
  rotateCCW: false,
  hardDrop: false,
  hold: false,
});
// Keyboard HELD directions — composed into inputRef each tick (gamepad ORs in).
const kbHeldRef = useRef({ left: false, right: false, softDrop: false });
const heldRef = useRef<Set<string>>(new Set());

const resetInput = () => {
  const input = inputRef.current;
  input.left =
    input.right =
    input.softDrop =
    input.rotateCW =
    input.rotateCCW =
    input.hardDrop =
    input.hold =
      false;
  const kb = kbHeldRef.current;
  kb.left = kb.right = kb.softDrop = false;
  heldRef.current.clear();
};

const setKeysSuspended = useCallback((suspended: boolean) => {
  keysSuspendedRef.current = suspended;
  resetInput();
}, []);
```

3e. In `start()`, also reset `eventLabel: null` in the state update. In the loop's
tick, before `engine.update`, compose holds; after, project the event:

```ts
if (screen === "playing" && !pausedRef.current && !endedRef.current) {
  const input = inputRef.current;
  const kb = kbHeldRef.current;
  input.left = kb.left;
  input.right = kb.right;
  input.softDrop = kb.softDrop;
  const res = engine.update(dt, input, animate);
  if (res.dead) {
    endedRef.current = true;
    handleGameOver(res.score);
  } else {
    if (res.event) {
      const label = clearEventLabel(res.event);
      if (label) {
        window.clearTimeout(eventTimerRef.current);
        eventTimerRef.current = window.setTimeout(
          () =>
            setState((s) =>
              s.eventLabel === label ? { ...s, eventLabel: null } : s
            ),
          EVENT_LABEL_MS
        );
        setState((s) => ({ ...s, eventLabel: label }));
      }
    }
    setState((s) =>
      s.score === res.score && s.lines === res.lines && s.level === res.level
        ? s
        : { ...s, score: res.score, lines: res.lines, level: res.level }
    );
  }
}
```

with `const eventTimerRef = useRef(0);` beside the other refs and
`window.clearTimeout(eventTimerRef.current);` added to the loop-effect cleanup.

3f. Hold canvas: in `resize()`, size BOTH preview canvases identically (replace the
single `nc` block with a loop):

```ts
const nCell = Math.min(cell * NEXT_CELL_SCALE, NEXT_CELL_MAX);
const nw = nCell * NEXT_COLS;
const nh = nCell * NEXT_ROWS;
for (const nc of [nextCanvasRef.current, holdCanvasRef.current]) {
  const nctx = nc?.getContext("2d");
  if (!nc || !nctx) continue;
  nc.style.width = `${nw}px`;
  nc.style.height = `${nh}px`;
  nc.width = Math.round(nw * dpr);
  nc.height = Math.round(nh * dpr);
  nctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
nCssW = nw;
nCssH = nh;
```

and `paint()` draws both (`const holdCtx = holdCanvasRef.current?.getContext("2d") ?? null;` beside `nextCtx`):

```ts
const paint = () => {
  engine.drawWell(ctx, cssW, cssH, dpr);
  if (nextCtx) engine.drawNext(nextCtx, nCssW, nCssH, dpr);
  if (holdCtx) engine.drawHold(holdCtx, nCssW, nCssH, dpr);
};
```

3g. Replace the keyboard effect's predicates with the live bindings map:

```ts
useEffect(() => {
  const actionOf = (code: string): TetrisAction | null => {
    const map = bindingsRef.current;
    for (const a of TETRIS_ACTION_IDS) {
      if (map[a].includes(code)) return a;
    }
    return null;
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const el = e.target as HTMLElement | null;
    if (
      el &&
      (el.tagName === "INPUT" ||
        el.tagName === "TEXTAREA" ||
        el.isContentEditable)
    ) {
      return;
    }
    if (keysSuspendedRef.current) return; // CONTROLS modal owns the keyboard
    const c = e.code;
    const action = actionOf(c);
    // Any bound key + Space (page scroll) get swallowed while the board is up.
    if (action || c === "Space") e.preventDefault();

    // Menu / over → start (fixed keys, independent of the bindings).
    if (screenRef.current !== "playing") {
      if (c === "Enter" || c === "Space") start();
      return;
    }
    if (action === "pause") {
      togglePause();
      return;
    }
    if (pausedRef.current) return;

    const fresh = !heldRef.current.has(c);
    heldRef.current.add(c);
    const kb = kbHeldRef.current;
    const input = inputRef.current;
    switch (action) {
      case "moveLeft":
        kb.left = true;
        break;
      case "moveRight":
        kb.right = true;
        break;
      case "softDrop":
        kb.softDrop = true;
        break;
      // One-shot edges — one per physical press (native repeat suppressed).
      case "rotateCW":
        if (fresh) input.rotateCW = true;
        break;
      case "rotateCCW":
        if (fresh) input.rotateCCW = true;
        break;
      case "hardDrop":
        if (fresh) input.hardDrop = true;
        break;
      case "hold":
        if (fresh) input.hold = true;
        break;
    }
  };

  const onKeyUp = (e: KeyboardEvent) => {
    heldRef.current.delete(e.code);
    const action = actionOf(e.code);
    const kb = kbHeldRef.current;
    if (action === "moveLeft") kb.left = false;
    if (action === "moveRight") kb.right = false;
    if (action === "softDrop") kb.softDrop = false;
  };

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  return () => {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
  };
}, [start, togglePause]);
```

3h. Return the new API members:

```ts
return {
  state,
  canvasRef,
  nextCanvasRef,
  holdCanvasRef,
  panelRef,
  history,
  start,
  togglePause,
  bindings,
  setBindings,
  setKeysSuspended,
};
```

- [ ] **Step 4: Run gates + full test suite**

Run: `npx vitest run src/features/arcade && npm run typecheck && npm run lint`
Expected: PASS / 0 / 0.

- [ ] **Step 5: Commit**

```bash
git add src/features/arcade/tetris/
git commit -m "feat(tetris): remappable bindings drive the keyboard; clear-event caption; hold canvas plumbing"
```

---

### Task 9: Gamepad poller + loop merge

**Files:**

- Create: `src/features/arcade/shared/model/gamepad.ts`
- Modify: `src/features/arcade/shared/index.ts`
- Modify: `src/features/arcade/tetris/model/use-tetris-game.ts`

**Interfaces:**

- Produces:

```ts
export interface PadFrame {
  left: boolean;
  right: boolean;
  softDrop: boolean; // holds
  hardDrop: boolean;
  rotateCW: boolean;
  rotateCCW: boolean;
  hold: boolean;
  pause: boolean;
  anyPress: boolean; // edges
}
export function createGamepadPoller(): () => PadFrame;
```

- [ ] **Step 1: Implement the poller**

Create `src/features/arcade/shared/model/gamepad.ts`:

```ts
/**
 * Gamepad input for the arcade — polled from a game's EXISTING rAF loop (no loop
 * of its own; the Gamepad API is poll-only). Standard-layout mapping, fixed v1:
 * D-pad (14/15/13/12) + left stick (axes 0/1, ±0.5 deadzone) = move / soft drop /
 * hard drop · A (0) = rotate CW · B (1) = rotate CCW · LB/RB (4/5) = hold ·
 * Start (9) = pause. Directions are HOLDS (feed the same DAS as the keyboard);
 * the rest are press EDGES computed against the previous frame's snapshot.
 */

export interface PadFrame {
  left: boolean;
  right: boolean;
  softDrop: boolean;
  hardDrop: boolean;
  rotateCW: boolean;
  rotateCCW: boolean;
  hold: boolean;
  pause: boolean;
  anyPress: boolean;
}

const DEADZONE = 0.5;

const IDLE: PadFrame = {
  left: false,
  right: false,
  softDrop: false,
  hardDrop: false,
  rotateCW: false,
  rotateCCW: false,
  hold: false,
  pause: false,
  anyPress: false,
};

interface RawHeld {
  hard: boolean;
  cw: boolean;
  ccw: boolean;
  hold: boolean;
  pause: boolean;
  any: boolean;
}

const RAW_IDLE: RawHeld = {
  hard: false,
  cw: false,
  ccw: false,
  hold: false,
  pause: false,
  any: false,
};

export function createGamepadPoller(): () => PadFrame {
  let prev = RAW_IDLE;
  return () => {
    const pads =
      typeof navigator !== "undefined" && navigator.getGamepads
        ? navigator.getGamepads()
        : [];
    const gp = Array.from(pads ?? []).find(
      (p): p is Gamepad => !!p && p.connected
    );
    if (!gp) {
      prev = RAW_IDLE;
      return IDLE;
    }
    const btn = (i: number) => !!gp.buttons[i]?.pressed;
    const axisX = gp.axes[0] ?? 0;
    const axisY = gp.axes[1] ?? 0;
    const held: RawHeld = {
      hard: btn(12),
      cw: btn(0),
      ccw: btn(1),
      hold: btn(4) || btn(5),
      pause: btn(9),
      any: gp.buttons.some((b) => b.pressed),
    };
    const frame: PadFrame = {
      left: btn(14) || axisX < -DEADZONE,
      right: btn(15) || axisX > DEADZONE,
      softDrop: btn(13) || axisY > DEADZONE,
      hardDrop: held.hard && !prev.hard,
      rotateCW: held.cw && !prev.cw,
      rotateCCW: held.ccw && !prev.ccw,
      hold: held.hold && !prev.hold,
      pause: held.pause && !prev.pause,
      anyPress: held.any && !prev.any,
    };
    prev = held;
    return frame;
  };
}
```

Barrel (`shared/index.ts`):

```ts
export { createGamepadPoller } from "./model/gamepad";
export type { PadFrame } from "./model/gamepad";
```

- [ ] **Step 2: Merge into the Tetris loop**

In `use-tetris-game.ts`: import `createGamepadPoller`; inside the hook add
`const pollPadRef = useRef(createGamepadPoller());`. In `tick()` (top, before the
screen branch):

```ts
const pad = pollPadRef.current();
if (!keysSuspendedRef.current) {
  if (screenRef.current !== "playing") {
    if (pad.anyPress) start();
  } else if (pad.pause) {
    togglePause();
  }
}
```

and extend the hold/edge composition in the playing branch:

```ts
input.left = kb.left || pad.left;
input.right = kb.right || pad.right;
input.softDrop = kb.softDrop || pad.softDrop;
if (pad.rotateCW) input.rotateCW = true;
if (pad.rotateCCW) input.rotateCCW = true;
if (pad.hardDrop) input.hardDrop = true;
if (pad.hold) input.hold = true;
```

Add `start` and `togglePause` to the loop effect's dependency array
(`[handleGameOver, start, togglePause]` — both are stable `useCallback([])`).

- [ ] **Step 3: Run gates**

Run: `npx vitest run src/features/arcade && npm run typecheck && npm run lint`
Expected: PASS / 0 / 0.

- [ ] **Step 4: Commit**

```bash
git add src/features/arcade/
git commit -m "feat(arcade): gamepad poller (standard mapping) wired into the tetris loop"
```

---

### Task 10: Board UI — HOLD box, event caption, dynamic hints/aria/pause

**Files:**

- Modify: `src/features/arcade/tetris/ui/tetris-board.tsx`

**Interfaces:**

- Consumes: `api.holdCanvasRef`, `api.bindings`, `state.eventLabel` (Task 8); `bindingLabel`, `keyLabel` (Task 7).

- [ ] **Step 1: Implement**

1a. Delete the static `KEY_HINTS` constant. In the component body derive everything
from the live map:

```tsx
const b = api.bindings;
const hints: [string, string][] = [
  ["MOVE", `${bindingLabel(b.moveLeft)} · ${bindingLabel(b.moveRight)}`],
  ["ROTATE", `${bindingLabel(b.rotateCW)} · ${bindingLabel(b.rotateCCW)}`],
  ["SOFT DROP", bindingLabel(b.softDrop)],
  ["HARD DROP", bindingLabel(b.hardDrop)],
  ["HOLD", bindingLabel(b.hold)],
  ["PAUSE", bindingLabel(b.pause)],
];
```

(`import { bindingLabel, keyLabel } from "@/features/arcade/shared";` joins the
existing shared import.)

1b. Well canvas `aria-label` becomes binding-driven:

```tsx
          aria-label={`Tetris well. ${bindingLabel(b.moveLeft)} and ${bindingLabel(
            b.moveRight
          )} to move, ${bindingLabel(b.rotateCW)} to rotate, ${bindingLabel(
            b.hardDrop
          )} to hard drop.`}
```

1c. HOLD box — first child of the readout panel, above NEXT (same pattern):

```tsx
<div className="flex flex-col items-center gap-2">
  <PanelLabel>HOLD</PanelLabel>
  <canvas
    ref={holdCanvasRef}
    aria-label="Hold piece"
    role="img"
    className="block h-6 w-12"
  />
</div>
```

(destructure `holdCanvasRef` from `api` beside `nextCanvasRef`.)

1d. Event caption — after the LEVEL readout inside the panel column:

```tsx
{
  state.eventLabel && (
    <div
      aria-live="polite"
      className="text-center text-[11px] font-medium uppercase leading-[1.2] tracking-[0.12em] text-[var(--m-accent)]"
    >
      {state.eventLabel}
    </div>
  );
}
```

1e. Pause hint follows the binding: `<PauseOverlay hint={`${keyLabel(b.pause[0] ?? "KeyP")} to resume`} />` and the menu passes the derived `hints` (same prop as before).

- [ ] **Step 2: Run gates**

Run: `npm run typecheck && npm run lint`
Expected: 0 / 0.

- [ ] **Step 3: Commit**

```bash
git add src/features/arcade/tetris/ui/tetris-board.tsx
git commit -m "feat(tetris): HOLD box, clear-event caption, binding-driven hints/aria/pause"
```

---

### Task 11: CONTROLS modal + MenuOverlay extension point + wiring

**Files:**

- Create: `src/features/arcade/shared/ui/controls-modal.tsx`
- Modify: `src/features/arcade/shared/ui/board-overlay.tsx` (MenuOverlay `extra`)
- Modify: `src/features/arcade/shared/index.ts`
- Modify: `src/features/arcade/tetris/ui/tetris-board.tsx`

**Interfaces:**

- Consumes: `Modal`/`ModalHeader` (`@/shared/ui`), `bindingLabel`/`rebind`/`BindingMap` (Task 7), `TETRIS_ACTIONS`/`TETRIS_DEFAULT_BINDINGS` (Task 8), `api.setBindings`/`api.setKeysSuspended` (Task 8).
- Produces: `ControlsModal` (generic over the action union); `MenuOverlay` gains `extra?: React.ReactNode`.

- [ ] **Step 1: MenuOverlay extension point**

In `board-overlay.tsx`, add the prop and render it after the hints:

```tsx
export function MenuOverlay({
  title,
  onStart,
  hints,
  startLabel = "Start game",
  extra,
}: {
  title: string;
  onStart: () => void;
  hints: readonly (readonly [string, string])[];
  startLabel?: string;
  /** Optional slot under the key hints (e.g. the Tetris CONTROLS opener). */
  extra?: React.ReactNode;
}) {
  return (
    <div className={overlayBase}>
      <OverlayRail>
        <OverlayTitle>{title}</OverlayTitle>
        <ArcadeButton onClick={onStart}>{startLabel}</ArcadeButton>
        <KeyHints hints={hints} />
        {extra}
      </OverlayRail>
    </div>
  );
}
```

- [ ] **Step 2: ControlsModal**

Create `src/features/arcade/shared/ui/controls-modal.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { Modal, ModalHeader } from "@/shared/ui";
import { bindingLabel, rebind, type BindingMap } from "../model/key-bindings";

/**
 * Key-remapping modal for an arcade game: one row per action; click a row to arm
 * capture ("PRESS KEY…"), the next keydown binds that key (stealing it from any
 * other action); Escape cancels the capture. The capture listener runs in the
 * WINDOW capture phase with stopPropagation, so neither the game's key handler
 * nor the Modal's own document-level Escape-close sees the press. The host must
 * suspend its game keys while the modal is open (Tetris: `setKeysSuspended`).
 */
export function ControlsModal<A extends string>({
  isOpen,
  onOpenChange,
  actions,
  value,
  defaults,
  onChange,
}: {
  isOpen: boolean;
  onOpenChange: () => void;
  actions: readonly { id: A; label: string }[];
  value: BindingMap<A>;
  defaults: BindingMap<A>;
  onChange: (next: BindingMap<A>) => void;
}) {
  const [capturing, setCapturing] = useState<A | null>(null);

  useEffect(() => {
    if (!capturing) return;
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.code !== "Escape") onChange(rebind(value, capturing, e.code));
      setCapturing(null);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [capturing, value, onChange]);

  const close = () => {
    setCapturing(null);
    onOpenChange();
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={close}
      width="md"
      labelledBy="arcade-controls-title"
    >
      {(closeModal) => (
        <>
          <ModalHeader
            eyebrow="// ARCADE"
            title="Controls"
            titleId="arcade-controls-title"
            subtitle="Click an action, then press its new key. Esc cancels."
            onClose={closeModal}
          />
          <div className="flex flex-col gap-4">
            {actions.map(({ id, label }) => {
              const active = capturing === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setCapturing(active ? null : id)}
                  className={`mono-focus flex h-9 w-full items-center justify-between border-2 px-4 ${
                    active
                      ? "border-[var(--m-accent)]"
                      : "border-[var(--m-dim)]"
                  }`}
                >
                  <span className="text-[11px] font-medium uppercase leading-none tracking-[0.12em] text-[var(--m-muted2)]">
                    {label}
                  </span>
                  <span
                    className={`text-[11px] uppercase leading-none tracking-[0.12em] ${
                      active ? "text-[var(--m-accent)]" : "text-[var(--m-fg)]"
                    }`}
                  >
                    {active ? "PRESS KEY…" : bindingLabel(value[id])}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setCapturing(null);
                onChange(defaults);
              }}
              className="mono-btn-outline flex h-9 items-center px-4"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={closeModal}
              className="mono-cta flex h-9 items-center px-4"
            >
              Done
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
```

(Before styling the two footer buttons, grep an existing `mono-btn-outline` /
`mono-cta` call site and mirror its exact class recipe — don't invent a new one.)

Barrel: `export { ControlsModal } from "./ui/controls-modal";`

- [ ] **Step 3: Wire into the Tetris board**

In `tetris-board.tsx`:

```tsx
const [controlsOpen, setControlsOpen] = useState(false);
const openControls = () => {
  setControlsOpen(true);
  api.setKeysSuspended(true);
};
const closeControls = () => {
  setControlsOpen(false);
  api.setKeysSuspended(false);
};
```

Menu overlay gains the opener (link-style nav treatment — muted2 → muted hover,
no box, per the arrows/cancel rule):

```tsx
{
  state.screen === "menu" && (
    <MenuOverlay
      title="Tetris"
      onStart={start}
      hints={hints}
      extra={
        <button
          type="button"
          onClick={openControls}
          className="mono-focus text-[11px] font-medium uppercase leading-none tracking-[0.12em] text-[var(--m-muted2)] transition-colors hover:text-[var(--m-muted)]"
        >
          Controls
        </button>
      }
    />
  );
}
```

And after the fullscreen button, the modal:

```tsx
<ControlsModal
  isOpen={controlsOpen}
  onOpenChange={closeControls}
  actions={TETRIS_ACTIONS}
  value={api.bindings}
  defaults={TETRIS_DEFAULT_BINDINGS}
  onChange={api.setBindings}
/>
```

(imports: `ControlsModal` from `@/features/arcade/shared`; `TETRIS_ACTIONS`,
`TETRIS_DEFAULT_BINDINGS` from `../model/bindings`; `useState` from react.)

- [ ] **Step 4: Run gates**

Run: `npx vitest run src/features/arcade && npm run typecheck && npm run lint`
Expected: PASS / 0 / 0.

- [ ] **Step 5: Commit**

```bash
git add src/features/arcade/
git commit -m "feat(arcade): CONTROLS remapping modal + menu-overlay extension, wired to tetris"
```

---

### Task 12: Full gates + manual verification

**Files:** none (verification only).

- [ ] **Step 1: Full automated gates**

Run: `npx vitest run && npm run typecheck && npm run lint`
Expected: all suites PASS, 0 type errors, 0 lint errors.

- [ ] **Step 2: Manual pass (dev server, `/arcade/tetris`)**

- Hard drop (Space): instant lock, +2/cell visible in SCORE; ghost silhouette tracks the piece.
- Rotation: `↑`/`X` CW, `Z` CCW; wall-kick off both walls; floor-kick a T on the stack.
- Lock delay: piece rests ~half a second; wiggling extends but stops extending after ~15 nudges.
- Hold (`C`/`Shift`): swaps; HOLD preview dims until the next lock; empty box before first use.
- T-spin: rotate a T into a slot → "T-SPIN …" caption + bonus score; Tetris → "TETRIS"; consecutive → "B2B".
- CONTROLS: rebind a key (it steals from the old action), hints update, persists across reload (`arcade.tetris.keys.v1`), RESET restores, Esc cancels capture, rebinding can't start the game.
- Pause on `P`; Space on the menu still starts.
- Gamepad (if available): stick/D-pad move + soft drop, D-pad-up hard drop, A/B rotate, LB/RB hold, Start pauses, any button starts.
- Theme flip: ghost + previews recolour; reduced-motion: line clears collapse instantly; fullscreen round-trip intact.

- [ ] **Step 3: STOP — report results to the owner**

Per the repo rule: no push, no merge, no PR without an explicit yes. Spacing/UI changes (HOLD box, event caption, modal) need the owner's visual approval.
