# Arcade cleanup: remove "The Rabbit" + "Hollow Sloth", port rabbit food sprite into classic Snake — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Delete the "The Rabbit" and "Hollow Sloth" arcade games from the
frontend, and port the rabbit pixel-sprite (currently The Rabbit's food
pickup) into the surviving classic Snake game as its new food sprite,
replacing the plain pulsing square.

**Architecture:** Pure deletion + one localized canvas-draw change. No shared
infra changes, no backend changes. The rabbit bitmap is copied as a static
literal (not imported) into `snake-classic/model/engine.ts` before the
source folder is deleted, so the two halves of this work have no runtime
dependency on each other's order — but they're still sequenced sprite-first
so the diff reads as "add the feature, then delete the old home for it."

**Tech Stack:** Next.js 16 (webpack), React 19, TypeScript, Vitest, Canvas 2D.

## Global Constraints

- `npm run typecheck` and `npm run lint` must stay at 0 errors after every
  task (per project CLAUDE.md).
- No code comments explaining WHAT code does — only WHY, when non-obvious
  (per project CLAUDE.md).
- Don't commit unless asked (this plan's steps show `git commit` for
  structure; the executing skill/session owner decides whether to actually
  run them — see the plan's execution handoff).
- Frontend-only change — no backend coordination in this plan (orphaned
  `"snake"`-keyed leaderboard rows are a separate, out-of-scope backend
  concern).

---

## Task 1: Port the rabbit sprite into classic Snake's food draw

**Files:**

- Modify: `src/features/arcade/snake-classic/model/engine.ts`
- Test: `src/features/arcade/snake-classic/model/engine.test.ts` (existing —
  confirms no regression to engine state/logic; no new test needed for the
  draw method itself — the codebase has no canvas-pixel-output test harness,
  and `engine.test.ts` only covers state logic, not `draw*` methods, so this
  stays consistent with the existing pattern)

**Interfaces:**

- Consumes: nothing from other tasks (this file is self-contained; the
  bitmap is a literal, not imported from `snake/`).
- Produces: nothing later tasks depend on — Task 2 deletes the source game
  this bitmap was copied from, but that deletion doesn't reference this
  file.

- [ ] **Step 1: Add the rabbit bitmap constant**

  In `src/features/arcade/snake-classic/model/engine.ts`, insert this constant
  right after the existing `FOOD_PULSE_FREQ` line (currently line 73):

  ```ts
  const FOOD_FILL = 0.62;
  const FOOD_PULSE_AMP = 0.12;
  const FOOD_PULSE_FREQ = 0.1;

  /** Food sprite — the rabbit pickup ported from the retired "Follow the
   *  Rabbit" game (`RABBIT_PLAIN`, positive/+10 variant only — classic
   *  Snake has one food type, no striped penalty rabbit). `"1"` = body
   *  pixel, anything else = transparent. */
  const RABBIT_PLAIN: readonly string[] = [
    ".11.11.",
    ".11.11.",
    ".11.11.",
    ".11.11.",
    ".11.11.",
    ".11.11.",
    ".11.11.",
    "1111111",
    "1011101",
    "1110111",
    "1111111",
    "0111110",
    "0100010",
  ];
  ```

  (The first three lines already exist — only the `RABBIT_PLAIN` block
  after them is new.)

- [ ] **Step 2: Replace `drawFood`'s square with the sprite, add `drawFoodSprite`**

  Find the existing `drawFood` method (currently lines 364–383):

  ```ts
  /** The food — a white square with a slow "eat me" size pulse (base size under
   *  reduced motion; colour alone then says "chase me"). */
  private drawFood(
    ctx: CanvasRenderingContext2D,
    cell: number,
    dpr: number,
    animate: boolean
  ) {
    const pulse = animate
      ? 1 + FOOD_PULSE_AMP * Math.sin(this.frame * FOOD_PULSE_FREQ)
      : 1;
    this.drawSquare(
      ctx,
      cell,
      dpr,
      this.food,
      this.palette.food,
      FOOD_FILL * pulse
    );
  }
  ```

  Replace it with:

  ```ts
  /** The food — a rabbit pixel-sprite with a slow "eat me" size pulse (base
   *  size under reduced motion; colour alone then says "chase me"). */
  private drawFood(
    ctx: CanvasRenderingContext2D,
    cell: number,
    dpr: number,
    animate: boolean
  ) {
    const pulse = animate
      ? 1 + FOOD_PULSE_AMP * Math.sin(this.frame * FOOD_PULSE_FREQ)
      : 1;
    this.drawFoodSprite(ctx, cell, dpr, this.food, FOOD_FILL * pulse);
  }

  /**
   * Paint the food as the {@link RABBIT_PLAIN} pixel-sprite, scaled so its
   * bounding box fills `fill` fraction of the cell. `fillRect` is already
   * device-pixel-crisp per block — no `imageSmoothingEnabled` toggle needed
   * (that flag only affects `drawImage`, not `fillRect`).
   */
  private drawFoodSprite(
    ctx: CanvasRenderingContext2D,
    cell: number,
    dpr: number,
    at: Cell,
    fill: number
  ) {
    const sw = RABBIT_PLAIN[0].length;
    const sh = RABBIT_PLAIN.length;
    const cellDev = cell * dpr;
    const boxDev = cellDev * fill;
    const fitDim = Math.max(sw, sh);
    const block = Math.max(1, Math.floor(boxDev / fitDim));
    const spriteWdev = block * sw;
    const spriteHdev = block * sh;
    const leftDev = Math.round(at.x * cellDev + (cellDev - spriteWdev) / 2);
    const topDev = Math.round(at.y * cellDev + (cellDev - spriteHdev) / 2);
    ctx.fillStyle = this.palette.food;
    for (let y = 0; y < sh; y++) {
      const row = RABBIT_PLAIN[y];
      for (let x = 0; x < sw; x++) {
        if (row[x] !== "1") continue;
        const size = block / dpr;
        ctx.fillRect(
          (leftDev + x * block) / dpr,
          (topDev + y * block) / dpr,
          size,
          size
        );
      }
    }
  }
  ```

  `Cell` is already imported at the top of the file
  (`import type { Cell, Speed } from "./types";`) — no new import needed.
  `drawSquare` stays in the file unchanged (still used by `drawSnake`).

- [ ] **Step 3: Run typecheck and the existing engine test**

  Run: `npm run typecheck`
  Expected: 0 errors.

  Run: `npx vitest run src/features/arcade/snake-classic/model/engine.test.ts`
  Expected: all existing tests PASS unchanged (this task touches only draw
  code, not state/step logic).

- [ ] **Step 4: Manual visual check**

  Run: `npm run dev`, open `/arcade/snake`, start a run.
  Expected: the food pickup renders as a small rabbit silhouette (not a
  square), pulses gently, recolors correctly when toggling light/dark theme
  (color follows `--m-fg` via `palette.food` — same token the square used).

- [ ] **Step 5: Commit**

  ```bash
  git add src/features/arcade/snake-classic/model/engine.ts
  git commit -m "feat(arcade): draw classic Snake's food as the rabbit sprite"
  ```

---

## Task 2: Delete "The Rabbit" game and its hub wiring

**Files:**

- Delete: `src/app/arcade/follow-the-rabbit/page.tsx`
- Delete: `src/app/arcade/follow-the-rabbit/snake-page.tsx`
- Delete: `src/features/arcade/snake/` (entire directory — `index.ts`,
  `model/arcade-keys.ts`, `model/engine.ts`, `model/leaderboard.ts`,
  `model/score-history.ts`, `model/types.ts`,
  `model/use-my-arcade-stats.ts`, `model/use-snake-game.ts`,
  `model/use-snake-leaderboard.ts`, `model/use-submit-score.ts`,
  `ui/confetti.tsx`, `ui/rabbit-mark.tsx`, `ui/score-pops.tsx`,
  `ui/snake-board.tsx`, `ui/use-snake-arcade.ts`)
- Delete: `src/features/arcade/hub/ui/rabbit-chase-mark.tsx`
- Modify: `src/features/arcade/shared/model/arcade-games.ts`
- Modify: `src/features/arcade/hub/ui/arcade-page.tsx`

**Interfaces:**

- Consumes: nothing (Task 1 already copied the only piece this deletion
  would otherwise orphan — the rabbit bitmap).
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Delete the route folder**

  ```bash
  git rm -r src/app/arcade/follow-the-rabbit
  ```

- [ ] **Step 2: Delete the feature folder**

  ```bash
  git rm -r src/features/arcade/snake
  ```

- [ ] **Step 3: Delete the now-orphaned hub visual**

  ```bash
  git rm src/features/arcade/hub/ui/rabbit-chase-mark.tsx
  ```

- [ ] **Step 4: Remove the roster entry and fix the stale comment**

  In `src/features/arcade/shared/model/arcade-games.ts`, the current file is:

  ```ts
  export interface ArcadeGameEntry {
    /** Backend leaderboard key — does NOT always match `title`/`href` (e.g.
     *  the "Snake" card is the classic-Snake feature, backend key
     *  `snake-classic`; the backend key `snake` belongs to "The Rabbit"). */
    game: string;
    title: string;
    href: string;
    /** Temporarily delisted from the hub (owner call) — the route stays live,
     *  but it's excluded from the hub grid AND from profile crowns (a crown
     *  linking to a delisted game would contradict the hub's own delisting
     *  call). Drop the flag to relist everywhere at once. */
    hidden?: boolean;
  }

  /**
   * The canonical arcade roster — the ONE list both the `/arcade` hub grid and
   * the profile "// ARCADE ACHIEVEMENTS" crowns derive from, so a roster change
   * (delist, relist, rename) only needs editing here instead of two
   * hand-duplicated lists staying in sync by comment discipline alone (which
   * already caused one manual double-edit, 2026-07-09 Stay Awake/Rabbit
   * delisting).
   */
  export const ARCADE_GAMES: readonly ArcadeGameEntry[] = [
    { game: "tetris", title: "Tetris", href: "/arcade/tetris" },
    { game: "2048", title: "2048", href: "/arcade/2048" },
    { game: "snake-classic", title: "Snake", href: "/arcade/snake" },
    {
      game: "stay-awake",
      title: "Stay Awake",
      href: "/arcade/stay-awake",
      hidden: true,
    },
    {
      game: "snake",
      title: "The Rabbit",
      href: "/arcade/follow-the-rabbit",
      hidden: true,
    },
  ];
  ```

  Replace the whole file with:

  ```ts
  export interface ArcadeGameEntry {
    /** Backend leaderboard key — does NOT always match `title`/`href` (e.g.
     *  the "Snake" card is the classic-Snake feature, backend key
     *  `snake-classic`). */
    game: string;
    title: string;
    href: string;
    /** Temporarily delisted from the hub (owner call) — the route stays live,
     *  but it's excluded from the hub grid AND from profile crowns (a crown
     *  linking to a delisted game would contradict the hub's own delisting
     *  call). Drop the flag to relist everywhere at once. */
    hidden?: boolean;
  }

  /**
   * The canonical arcade roster — the ONE list both the `/arcade` hub grid and
   * the profile "// ARCADE ACHIEVEMENTS" crowns derive from, so a roster change
   * (delist, relist, rename) only needs editing here instead of two
   * hand-duplicated lists staying in sync by comment discipline alone (which
   * already caused one manual double-edit, 2026-07-09 Stay Awake/Rabbit
   * delisting).
   */
  export const ARCADE_GAMES: readonly ArcadeGameEntry[] = [
    { game: "tetris", title: "Tetris", href: "/arcade/tetris" },
    { game: "2048", title: "2048", href: "/arcade/2048" },
    { game: "snake-classic", title: "Snake", href: "/arcade/snake" },
    {
      game: "stay-awake",
      title: "Stay Awake",
      href: "/arcade/stay-awake",
      hidden: true,
    },
  ];
  ```

- [ ] **Step 5: Remove the hub page's Rabbit import and VISUALS entry**

  In `src/features/arcade/hub/ui/arcade-page.tsx`, remove this line
  (currently line 14):

  ```ts
  import { RabbitChaseMark } from "./rabbit-chase-mark";
  ```

  Then find the `VISUALS` map (currently lines 36–58):

  ```ts
  const VISUALS: Record<string, { mark: ReactNode; field: GameEntry["field"] }> =
    {
      tetris: {
        mark: <TetrominoMark size={CELL * 2} />,
        field: { cell: CELL, spanX: 3, spanY: 2 },
      },
      "2048": {
        mark: <Mark2048 size={CELL * 2} />,
        field: { cell: CELL, spanX: 2, spanY: 2 },
      },
      "snake-classic": {
        mark: <SnakeMark size={CELL * 2} />,
        field: { cell: CELL, spanX: 5, spanY: 2 },
      },
      "stay-awake": {
        mark: <SlothMark size={CELL * 4} />,
        field: { cell: CELL, spanX: 5, spanY: 4 },
      },
      snake: {
        mark: <RabbitChaseMark size={CELL * 2} />,
        field: { cell: CELL, spanX: 5, spanY: 2 },
      },
    };
  ```

  Remove the trailing `snake: { ... }` entry so it reads:

  ```ts
  const VISUALS: Record<string, { mark: ReactNode; field: GameEntry["field"] }> =
    {
      tetris: {
        mark: <TetrominoMark size={CELL * 2} />,
        field: { cell: CELL, spanX: 3, spanY: 2 },
      },
      "2048": {
        mark: <Mark2048 size={CELL * 2} />,
        field: { cell: CELL, spanX: 2, spanY: 2 },
      },
      "snake-classic": {
        mark: <SnakeMark size={CELL * 2} />,
        field: { cell: CELL, spanX: 5, spanY: 2 },
      },
      "stay-awake": {
        mark: <SlothMark size={CELL * 4} />,
        field: { cell: CELL, spanX: 5, spanY: 4 },
      },
    };
  ```

- [ ] **Step 6: Run typecheck and lint**

  Run: `npm run typecheck && npm run lint`
  Expected: 0 errors — confirms no file anywhere still imports from
  `@/features/arcade/snake` or `./rabbit-chase-mark`.

- [ ] **Step 7: Manual check**

  Run: `npm run dev`, open `/arcade`.
  Expected: hub grid shows Tetris, 2048, Snake only (Stay Awake stays
  hidden, as before). Visiting `/arcade/follow-the-rabbit` 404s.

- [ ] **Step 8: Commit**

  ```bash
  git add -A -- src/app/arcade/follow-the-rabbit src/features/arcade/snake \
    src/features/arcade/hub/ui/rabbit-chase-mark.tsx \
    src/features/arcade/shared/model/arcade-games.ts \
    src/features/arcade/hub/ui/arcade-page.tsx
  git commit -m "chore(arcade): remove The Rabbit game"
  ```

---

## Task 3: Delete "Hollow Sloth"

**Files:**

- Delete: `src/app/arcade/hollow-sloth/page.tsx`
- Delete: `src/features/arcade/hollow-sloth/` (entire directory —
  `index.ts`, `model/engine.ts`, `model/rooms.ts`, `model/sprites.ts`,
  `model/types.ts`, `ui/hollow-sloth-board.tsx`, `ui/hollow-sloth-page.tsx`,
  `ui/use-hollow-sloth-game.ts`)

**Interfaces:**

- Consumes: nothing.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Delete the route folder**

  ```bash
  git rm -r src/app/arcade/hollow-sloth
  ```

- [ ] **Step 2: Delete the feature folder**

  ```bash
  git rm -r src/features/arcade/hollow-sloth
  ```

- [ ] **Step 3: Run typecheck and lint**

  Run: `npm run typecheck && npm run lint`
  Expected: 0 errors — Hollow Sloth was never imported from the hub roster
  or anywhere else, so this should be a clean, isolated deletion.

- [ ] **Step 4: Manual check**

  Run: `npm run dev`, visit `/arcade/hollow-sloth`.
  Expected: 404.

- [ ] **Step 5: Commit**

  ```bash
  git add -A -- src/app/arcade/hollow-sloth src/features/arcade/hollow-sloth
  git commit -m "chore(arcade): remove Hollow Sloth prototype"
  ```

---

## Task 4: Full-repo verification

**Files:** none (verification only).

**Interfaces:** none.

- [ ] **Step 1: Full typecheck, lint, and test suite**

  Run: `npm run typecheck && npm run lint && npx vitest run`
  Expected: 0 errors, all tests pass.

- [ ] **Step 2: Grep for dangling references**

  Run:

  ```bash
  grep -rln "arcade/snake\"" src --include=*.ts --include=*.tsx | grep -v "arcade/snake-classic"
  grep -rln "hollow-sloth\|HollowSloth\|RabbitChaseMark\|follow-the-rabbit" src
  ```

  Expected: both commands return nothing (empty output) — no file imports
  from the deleted `@/features/arcade/snake` module, and no filename/symbol
  match for the removed games survives outside historical
  `docs/superpowers/**` records (which are intentionally left as-is).

- [ ] **Step 3: Full manual pass**

  Run: `npm run dev`.
  - `/arcade` — hub grid: Tetris, 2048, Snake tiles only.
  - `/arcade/snake` — plays normally; food renders as the rabbit sprite,
    pulses, snake body still square segments; check both light and dark
    theme.
  - `/arcade/follow-the-rabbit` — 404.
  - `/arcade/hollow-sloth` — 404.
  - Profile page arcade crowns section — no crown for a now-deleted game.

  This step has no exit code to check — confirm each bullet visually and
  report back.
