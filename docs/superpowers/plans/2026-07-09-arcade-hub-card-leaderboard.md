# Arcade Hub Card Leaderboard Row Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a leaderboard-leader meta row (top-1 username + score, or a
muted placeholder) to the bottom of the 3 visible `/arcade` hub cards, and
delist Stay Awake + Follow the Rabbit from the hub without touching their
routes/features.

**Architecture:** `ArcadePage` (`src/features/arcade/hub/ui/arcade-page.tsx`)
calls the 3 games' existing typed leaderboard hooks directly (no new hook),
gated by `useAuth()`. Each `GameCard`'s right column becomes a flex column so
a new bottom row (modeled 1:1 on `PostCard`'s `CardMeta`) can be pinned with
`mt-auto`. The row is ALWAYS rendered — real leader or one static muted
placeholder line — so there's no "filled vs empty" layout mismatch (the
reason this was cut once before, per the code's own comment).

**Tech Stack:** Next.js (App Router) + React + TanStack Query (existing
hooks, no new query) + Tailwind + Vitest/React Testing Library.

## Global Constraints

- Read `CLAUDE.md` at repo root before editing — Brutalist Mono design
  system: closed type scale (11/12/14/18/32/40/46px), closed spacing scale
  (4/8/10/20/24/28/40px, i.e. `p-1/p-2/p-2.5/p-5/p-6/p-7/p-10` + gap
  equivalents), 2px borders/square corners, reuse `src/shared/ui` primitives
  and `.mono-*` classes — never hand-roll an equivalent that already exists.
- Run `npm run typecheck` and `npm run lint` after every task; both must
  stay at 0 errors.
- Don't commit unless this plan's steps say to (they do, per task, per
  `superpowers:executing-plans`/`subagent-driven-development` convention).
- Backend `game` keys do **not** match hub card titles 1:1 — see the table
  in Task 2. Getting this wrong silently fetches the wrong game's
  leaderboard for a card.
- The 3 leaderboard hooks used here (`useTetrisLeaderboard`,
  `useSnakeClassicLeaderboard`, `use2048Leaderboard`) already exist, already
  fetch top-10, and already accept an `enabled: boolean` param (default
  `true`) — do not write new query logic; only add barrel exports for them.

---

## Current state (read before starting)

`src/features/arcade/hub/ui/arcade-page.tsx` today:

```tsx
interface GameEntry {
  href: string;
  title: string;
  description: string;
  mark: ReactNode;
  field: { cell: number; spanX: number; spanY: number };
  hidden?: boolean;
}

const GAMES: GameEntry[] = [
  {
    href: "/arcade/tetris",
    title: "Tetris",
    description: "Blocks fall. Lines clear. Gravity always wins.",
    mark: <TetrominoMark size={CELL * 2} />,
    field: { cell: CELL, spanX: 3, spanY: 2 },
  },
  {
    href: "/arcade/snake",
    title: "Snake",
    description: "The classic. You, your tail, and bad decisions.",
    mark: <SnakeMark size={CELL * 2} />,
    field: { cell: CELL, spanX: 5, spanY: 2 },
  },
  {
    href: "/arcade/2048",
    title: "2048",
    description: "Double the numbers until the board disagrees.",
    mark: <Mark2048 size={CELL_2048 * 2} />,
    field: { cell: CELL_2048, spanX: 2, spanY: 2 },
  },
  {
    href: "/arcade/stay-awake",
    title: "Stay Awake",
    description: "The floor is sleep. Keep hopping.",
    mark: <SlothMark size={CELL * 4} />,
    field: { cell: CELL, spanX: 5, spanY: 4 },
  },
  {
    href: "/arcade/follow-the-rabbit",
    title: "The Rabbit",
    description: "Follow the rabbit. The striped ones bite.",
    mark: <RabbitChaseMark size={CELL * 2} />,
    field: { cell: CELL, spanX: 5, spanY: 2 },
  },
];

function ScreenCard({ children }: { children: ReactNode }) {
  return (
    <article className="mono-scope group relative grid h-full min-h-36 grid-cols-3 border-2 border-[var(--m-line)] bg-[var(--m-bg)] text-[var(--m-fg)] transition-colors hover:border-[var(--m-accent)]">
      {children}
    </article>
  );
}

function GameCard({ game }: { game: GameEntry }) {
  return (
    <ScreenCard>
      <CellField field={game.field}>{game.mark}</CellField>
      <div className="col-span-2 p-5">
        <h2 className="mono-title transition-colors group-hover:text-[var(--m-accent)]">
          <Link
            href={game.href}
            className="mono-focus after:absolute after:inset-0"
          >
            {game.title}
          </Link>
        </h2>
        <p className="mt-4 text-[14px] leading-[1.6] text-[var(--m-muted)]">
          {game.description}
        </p>
      </div>
    </ScreenCard>
  );
}

export function ArcadePage() {
  return (
    <div
      className="mono-scope min-h-app mx-[calc(50%-50vw)] w-screen bg-[var(--m-bg)] text-[var(--m-fg)]"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      <main className="mx-auto max-w-[1240px] px-5 pb-10 sm:px-10">
        <div className="flex items-center pb-6 pt-10">
          <Label>ARCADE</Label>
        </div>
        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {GAMES.filter((game) => !game.hidden).map((game) => (
            <GameCard key={game.href} game={game} />
          ))}
        </div>
      </main>
    </div>
  );
}
```

`PostCard`'s meta row this design mirrors
(`src/features/post/ui/post-card.tsx`):

```tsx
<div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-6 text-[12px] text-[var(--m-muted)]">
  <Link
    href={userHref(authorHandle)}
    className="relative z-[var(--m-z-content)] truncate text-[var(--m-muted)] transition-colors hover:text-[var(--m-accent)]"
  >
    @{authorHandle}
  </Link>
  <span className="ml-auto flex items-center gap-4">
    <Metric kind="comments" value={post.comments} />
  </span>
</div>
```

`useAuth()` (`src/entities/session/model/use-auth.ts`) returns
`{ isAuthenticated: boolean, ... }` — same hook `ArcadeCrowns` uses.

`useTetrisLeaderboard(enabled = true)` /
`useSnakeClassicLeaderboard(enabled = true)` / `use2048Leaderboard(enabled =
true)` each return a TanStack Query `UseQueryResult` whose `.data` (when
loaded) is a `LeaderboardResponse`: `{ entries: LeaderboardEntryResponse[] }`,
and `LeaderboardEntryResponse` is `{ rank: number, userName: string,
avatarUrl: string | null, bestScore: number, gamesPlayed: number }`.

`fmt` (number formatter, `12400` → `"12,400"`) is exported from
`@/shared/ui` (`src/shared/ui/data-display/metric.tsx`). `userHref` is
exported from `@/shared/lib/routes`.

---

### Task 1: Export the 3 leaderboard hooks from their feature barrels

**Files:**

- Modify: `src/features/arcade/tetris/index.ts`
- Modify: `src/features/arcade/snake-classic/index.ts`
- Modify: `src/features/arcade/2048/index.ts`

**Interfaces:**

- Consumes: nothing new (the hooks already exist at
  `src/features/arcade/tetris/model/use-tetris-leaderboard.ts`,
  `src/features/arcade/snake-classic/model/use-snake-classic-leaderboard.ts`,
  `src/features/arcade/2048/model/use-2048-leaderboard.ts`).
- Produces: `useTetrisLeaderboard`, `useSnakeClassicLeaderboard`,
  `use2048Leaderboard` importable from each feature's barrel — Task 3 needs
  these.

- [ ] **Step 1: Read the 3 barrel files to confirm current exports**

```bash
cat src/features/arcade/tetris/index.ts
cat src/features/arcade/snake-classic/index.ts
cat src/features/arcade/2048/index.ts
```

Expected: each currently exports only its `*Leaderboard` UI component (e.g.
`export { TetrisLeaderboard } from "./ui/tetris-leaderboard";`) and does not
yet export the hook.

- [ ] **Step 2: Add the hook export to each barrel**

In `src/features/arcade/tetris/index.ts`, add:

```ts
export { useTetrisLeaderboard } from "./model/use-tetris-leaderboard";
```

In `src/features/arcade/snake-classic/index.ts`, add:

```ts
export { useSnakeClassicLeaderboard } from "./model/use-snake-classic-leaderboard";
```

In `src/features/arcade/2048/index.ts`, add:

```ts
export { use2048Leaderboard } from "./model/use-2048-leaderboard";
```

Place each new line next to the file's existing `Leaderboard`-related
export (don't reorder unrelated exports).

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/features/arcade/tetris/index.ts src/features/arcade/snake-classic/index.ts src/features/arcade/2048/index.ts
git commit -m "feat(arcade): export leaderboard hooks from tetris/snake-classic/2048 barrels"
```

---

### Task 2: Delist Stay Awake + Follow the Rabbit, add `game` key to `GameEntry`

**Files:**

- Modify: `src/features/arcade/hub/ui/arcade-page.tsx`

**Interfaces:**

- Consumes: nothing new.
- Produces: `GameEntry.game: string` (the backend leaderboard key) —
  Task 3 reads this field to call the right hook for the right card.

- [ ] **Step 1: Add the `game` field to the `GameEntry` interface**

In `src/features/arcade/hub/ui/arcade-page.tsx`, change:

```tsx
interface GameEntry {
  href: string;
  title: string;
  /** One deadpan muted line under the title — the SAME card for signed-in and
   *  signed-out (the leaderboard block was cut: filled vs empty read uneven). */
  description: string;
  mark: ReactNode;
  /** The mark's own pixel grid — cell size (px) + the cells the mark spans.
   *  Drives the CellField so the figure sits ON the field like a real render. */
  field: { cell: number; spanX: number; spanY: number };
  /** Temporarily delisted from the hub (owner call) — the route stays live;
   *  drop the flag to relist. */
  hidden?: boolean;
}
```

to:

```tsx
interface GameEntry {
  href: string;
  title: string;
  /** One deadpan muted line under the title. */
  description: string;
  mark: ReactNode;
  /** The mark's own pixel grid — cell size (px) + the cells the mark spans.
   *  Drives the CellField so the figure sits ON the field like a real render. */
  field: { cell: number; spanX: number; spanY: number };
  /** The backend `game` key for this card's leaderboard query — does NOT
   *  always match `title`/`href` (e.g. the hub's "Snake" card is the
   *  classic-Snake feature, backend key `snake-classic`; the backend key
   *  `snake` belongs to the hub's "The Rabbit" card). Get this from each
   *  feature's own `arcade-keys.ts` (`TETRIS_GAME`/`SNAKE_CLASSIC_GAME`/
   *  `GAME_2048`/`SNAKE_GAME`/`GAME_STAY_AWAKE`), never guess it from the title. */
  game: string;
  /** Temporarily delisted from the hub (owner call) — the route stays live;
   *  drop the flag to relist. */
  hidden?: boolean;
}
```

(The "filled vs empty read uneven" comment moves — see Step 3 below, it now
describes the leader row instead of being a reason the row doesn't exist.)

- [ ] **Step 2: Set `game` on every entry, and `hidden: true` on Stay Awake + Follow the Rabbit**

Change the `GAMES` array to:

```tsx
const GAMES: GameEntry[] = [
  {
    href: "/arcade/tetris",
    title: "Tetris",
    description: "Blocks fall. Lines clear. Gravity always wins.",
    mark: <TetrominoMark size={CELL * 2} />,
    field: { cell: CELL, spanX: 3, spanY: 2 },
    game: "tetris",
  },
  {
    href: "/arcade/snake",
    title: "Snake",
    description: "The classic. You, your tail, and bad decisions.",
    mark: <SnakeMark size={CELL * 2} />,
    field: { cell: CELL, spanX: 5, spanY: 2 },
    game: "snake-classic",
  },
  {
    href: "/arcade/2048",
    title: "2048",
    description: "Double the numbers until the board disagrees.",
    mark: <Mark2048 size={CELL_2048 * 2} />,
    field: { cell: CELL_2048, spanX: 2, spanY: 2 },
    game: "2048",
  },
  {
    href: "/arcade/stay-awake",
    title: "Stay Awake",
    description: "The floor is sleep. Keep hopping.",
    mark: <SlothMark size={CELL * 4} />,
    field: { cell: CELL, spanX: 5, spanY: 4 },
    game: "stay-awake",
    // Needs a redesign (owner call, 2026-07-09) — route stays live.
    hidden: true,
  },
  {
    href: "/arcade/follow-the-rabbit",
    title: "The Rabbit",
    description: "Follow the rabbit. The striped ones bite.",
    mark: <RabbitChaseMark size={CELL * 2} />,
    field: { cell: CELL, spanX: 5, spanY: 2 },
    game: "snake",
    // Near-duplicate of Snake (owner call, 2026-07-09) — route stays live.
    hidden: true,
  },
];
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: 0 errors (the `game` field is required on `GameEntry`, so a
missing one on any entry would fail here first).

- [ ] **Step 4: Visually verify only 3 cards render**

Run: `npm run dev` (skip if already running), open `http://localhost:3000/arcade`.
Expected: exactly 3 cards — Tetris, Snake, 2048. Stay Awake and The Rabbit
are gone from the grid. Confirm `/arcade/stay-awake` and
`/arcade/follow-the-rabbit` still load directly (routes untouched).

- [ ] **Step 5: Commit**

```bash
git add src/features/arcade/hub/ui/arcade-page.tsx
git commit -m "feat(arcade): delist Stay Awake + Follow the Rabbit from the hub"
```

---

### Task 3: Add the leaderboard-leader row to each visible card

**Files:**

- Modify: `src/features/arcade/hub/ui/arcade-page.tsx`
- Test: `src/features/arcade/hub/ui/arcade-page.test.tsx` (new)

**Interfaces:**

- Consumes: `useTetrisLeaderboard`, `useSnakeClassicLeaderboard`,
  `use2048Leaderboard` (Task 1), `GameEntry.game` (Task 2), `useAuth` from
  `@/entities/session`, `userHref` from `@/shared/lib/routes`, `fmt` from
  `@/shared/ui`.
- Produces: `GameCard` now renders a `leader` row; no new exports (this is
  the leaf feature).

- [ ] **Step 1: Write the failing test file**

Create `src/features/arcade/hub/ui/arcade-page.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mockUseAuth = vi.fn();
vi.mock("@/entities/session", () => ({
  useAuth: () => mockUseAuth(),
}));

const mockUseTetrisLeaderboard = vi.fn();
vi.mock("@/features/arcade/tetris", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/arcade/tetris")
  >("@/features/arcade/tetris");
  return {
    ...actual,
    useTetrisLeaderboard: () => mockUseTetrisLeaderboard(),
  };
});

const mockUseSnakeClassicLeaderboard = vi.fn();
vi.mock("@/features/arcade/snake-classic", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/arcade/snake-classic")
  >("@/features/arcade/snake-classic");
  return {
    ...actual,
    useSnakeClassicLeaderboard: () => mockUseSnakeClassicLeaderboard(),
  };
});

const mockUse2048Leaderboard = vi.fn();
vi.mock("@/features/arcade/2048", async () => {
  const actual = await vi.importActual<typeof import("@/features/arcade/2048")>(
    "@/features/arcade/2048"
  );
  return {
    ...actual,
    use2048Leaderboard: () => mockUse2048Leaderboard(),
  };
});

import { ArcadePage } from "./arcade-page";

const NO_DATA = { data: undefined, isLoading: false } as const;

describe("ArcadePage leaderboard row", () => {
  it("shows the placeholder when signed out", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false });
    mockUseTetrisLeaderboard.mockReturnValue(NO_DATA);
    mockUseSnakeClassicLeaderboard.mockReturnValue(NO_DATA);
    mockUse2048Leaderboard.mockReturnValue(NO_DATA);

    render(<ArcadePage />);

    expect(screen.getAllByText("NO SCORES YET")).toHaveLength(3);
  });

  it("shows the placeholder for a game with an empty leaderboard", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true });
    mockUseTetrisLeaderboard.mockReturnValue({
      data: { entries: [] },
      isLoading: false,
    });
    mockUseSnakeClassicLeaderboard.mockReturnValue(NO_DATA);
    mockUse2048Leaderboard.mockReturnValue(NO_DATA);

    render(<ArcadePage />);

    expect(screen.getAllByText("NO SCORES YET")).toHaveLength(3);
  });

  it("shows the #1 leader's handle and score when present", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true });
    mockUseTetrisLeaderboard.mockReturnValue({
      data: {
        entries: [
          {
            rank: 1,
            userName: "igormariuta",
            avatarUrl: null,
            bestScore: 12400,
            gamesPlayed: 9,
          },
        ],
      },
      isLoading: false,
    });
    mockUseSnakeClassicLeaderboard.mockReturnValue(NO_DATA);
    mockUse2048Leaderboard.mockReturnValue(NO_DATA);

    render(<ArcadePage />);

    expect(screen.getByText("@igormariuta")).toBeInTheDocument();
    expect(screen.getByText("12,400")).toBeInTheDocument();
    // The other 2 games still fall back to the placeholder.
    expect(screen.getAllByText("NO SCORES YET")).toHaveLength(2);
  });

  it("links the leader's handle to their profile", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true });
    mockUseTetrisLeaderboard.mockReturnValue({
      data: {
        entries: [
          {
            rank: 1,
            userName: "igormariuta",
            avatarUrl: null,
            bestScore: 12400,
            gamesPlayed: 9,
          },
        ],
      },
      isLoading: false,
    });
    mockUseSnakeClassicLeaderboard.mockReturnValue(NO_DATA);
    mockUse2048Leaderboard.mockReturnValue(NO_DATA);

    render(<ArcadePage />);

    expect(screen.getByText("@igormariuta").closest("a")).toHaveAttribute(
      "href",
      "/u/igormariuta"
    );
  });
});
```

- [ ] **Step 2: Run the test file to verify it fails**

Run: `npx vitest run src/features/arcade/hub/ui/arcade-page.test.tsx`
Expected: FAIL — `"NO SCORES YET"` text not found (the row doesn't exist
yet), or a mock-not-called type error. Either failure confirms the test
exercises code that doesn't exist yet.

- [ ] **Step 3: Wire the hooks and imports**

In `src/features/arcade/hub/ui/arcade-page.tsx`, change the imports at the
top from:

```tsx
"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { SnakeMark } from "@/features/arcade/snake-classic";
import { Mark2048 } from "@/features/arcade/2048";
import { SlothMark } from "@/features/arcade/stay-awake";
import { RabbitChaseMark } from "./rabbit-chase-mark";
import { Label } from "@/shared/ui";
import { TetrominoMark } from "./tetromino-mark";
```

to:

```tsx
"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useAuth } from "@/entities/session";
import {
  SnakeMark,
  useSnakeClassicLeaderboard,
} from "@/features/arcade/snake-classic";
import { Mark2048, use2048Leaderboard } from "@/features/arcade/2048";
import { SlothMark } from "@/features/arcade/stay-awake";
import { useTetrisLeaderboard } from "@/features/arcade/tetris";
import { RabbitChaseMark } from "./rabbit-chase-mark";
import { fmt, Label } from "@/shared/ui";
import { userHref } from "@/shared/lib/routes";
import { TetrominoMark } from "./tetromino-mark";
```

- [ ] **Step 4: Add a `leader` prop to `GameCard`, keyed by `game`**

Change `GameCard` from:

```tsx
function GameCard({ game }: { game: GameEntry }) {
  return (
    <ScreenCard>
      <CellField field={game.field}>{game.mark}</CellField>
      <div className="col-span-2 p-5">
        <h2 className="mono-title transition-colors group-hover:text-[var(--m-accent)]">
          <Link
            href={game.href}
            className="mono-focus after:absolute after:inset-0"
          >
            {game.title}
          </Link>
        </h2>
        <p className="mt-4 text-[14px] leading-[1.6] text-[var(--m-muted)]">
          {game.description}
        </p>
      </div>
    </ScreenCard>
  );
}
```

to:

```tsx
/** The #1 leaderboard entry for one game, or undefined (no data / no scores
 *  yet / signed out — all three render the SAME placeholder, see `LeaderRow`,
 *  so a card never looks structurally different depending on why). */
type Leader = { userName: string; bestScore: number } | undefined;

/** ALWAYS renders (never conditionally omitted) — a card with data and a card
 *  without must have the identical shape, only this line's content differs.
 *  Modeled 1:1 on `PostCard`'s `CardMeta` row (post-card.tsx): handle left,
 *  stat right, same 12px/muted caption treatment. */
function LeaderRow({ leader }: { leader: Leader }) {
  return (
    <div className="mt-auto flex items-center pt-6 text-[12px] text-[var(--m-muted)]">
      {leader ? (
        <>
          <Link
            href={userHref(leader.userName)}
            className="relative z-[var(--m-z-content)] truncate transition-colors hover:text-[var(--m-accent)]"
          >
            @{leader.userName}
          </Link>
          <span className="ml-auto tabular-nums">{fmt(leader.bestScore)}</span>
        </>
      ) : (
        <span className="text-[11px] uppercase tracking-[0.12em] text-[var(--m-muted2)]">
          NO SCORES YET
        </span>
      )}
    </div>
  );
}

function GameCard({ game, leader }: { game: GameEntry; leader: Leader }) {
  return (
    <ScreenCard>
      <CellField field={game.field}>{game.mark}</CellField>
      <div className="col-span-2 flex h-full flex-col p-5">
        <h2 className="mono-title transition-colors group-hover:text-[var(--m-accent)]">
          <Link
            href={game.href}
            className="mono-focus after:absolute after:inset-0"
          >
            {game.title}
          </Link>
        </h2>
        <p className="mt-4 text-[14px] leading-[1.6] text-[var(--m-muted)]">
          {game.description}
        </p>
        <LeaderRow leader={leader} />
      </div>
    </ScreenCard>
  );
}
```

`col-span-2` stays (this `div` is still a grid item in `ScreenCard`'s 3-col
grid — that's unrelated to it also becoming a flex column internally for
`mt-auto` to work on `LeaderRow`).

- [ ] **Step 5: Compute each card's leader in `ArcadePage` and pass it down**

Change `ArcadePage` from:

```tsx
export function ArcadePage() {
  return (
    <div
      className="mono-scope min-h-app mx-[calc(50%-50vw)] w-screen bg-[var(--m-bg)] text-[var(--m-fg)]"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      <main className="mx-auto max-w-[1240px] px-5 pb-10 sm:px-10">
        <div className="flex items-center pb-6 pt-10">
          <Label>ARCADE</Label>
        </div>

        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {GAMES.filter((game) => !game.hidden).map((game) => (
            <GameCard key={game.href} game={game} />
          ))}
        </div>
      </main>
    </div>
  );
}
```

to:

```tsx
export function ArcadePage() {
  const { isAuthenticated } = useAuth();

  // Fixed, static set of 3 visible games — always call all 3 hooks
  // unconditionally (rules-of-hooks), each gated on auth like every other
  // arcade leaderboard read (ArcadeCrowns does the same).
  const tetris = useTetrisLeaderboard(isAuthenticated);
  const snakeClassic = useSnakeClassicLeaderboard(isAuthenticated);
  const game2048 = use2048Leaderboard(isAuthenticated);

  const leaderOf = (
    entries: { userName: string; bestScore: number }[] | undefined
  ): Leader => {
    const top = entries?.[0];
    return top
      ? { userName: top.userName, bestScore: top.bestScore }
      : undefined;
  };

  const leaderByGame: Record<string, Leader> = {
    tetris: leaderOf(tetris.data?.entries),
    "snake-classic": leaderOf(snakeClassic.data?.entries),
    "2048": leaderOf(game2048.data?.entries),
  };

  return (
    <div
      className="mono-scope min-h-app mx-[calc(50%-50vw)] w-screen bg-[var(--m-bg)] text-[var(--m-fg)]"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      <main className="mx-auto max-w-[1240px] px-5 pb-10 sm:px-10">
        <div className="flex items-center pb-6 pt-10">
          <Label>ARCADE</Label>
        </div>

        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {GAMES.filter((game) => !game.hidden).map((game) => (
            <GameCard
              key={game.href}
              game={game}
              leader={leaderByGame[game.game]}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 6: Run the test file to verify it passes**

Run: `npx vitest run src/features/arcade/hub/ui/arcade-page.test.tsx`
Expected: PASS, 4 tests.

- [ ] **Step 7: Typecheck and lint**

Run: `npm run typecheck`
Expected: 0 errors.

Run: `npm run lint`
Expected: 0 errors (pre-existing unrelated warnings in other files are fine).

- [ ] **Step 8: Retune `ScreenCard`'s `min-h-36` for the extra row**

Run: `npm run dev` (skip if already running), open
`http://localhost:3000/arcade` signed in as a user who holds at least one
`/arcade` game's #1 spot (or temporarily hardcode a `leader` value on one
`GameCard` call to preview both states), and compare all 3 visible cards
side by side.

Read the current class and comment on `ScreenCard`:

```tsx
/** The card is a THEME-FOLLOWING "screen" — the games themselves are
 *  theme-native (token-resolved palettes), so the hub preview follows the
 *  ambient theme too: `--m-bg` field + 2px `--m-line` frame, the same look as a
 *  bordered game canvas on the page. `min-h-36` (144px = p-5 pair + title +
 *  title→body 16 + THREE 14px/1.6 description lines): the card holds a stable
 *  stature but hugs its content — the 176 take left a dead band below the
 *  text (owner call). */
function ScreenCard({ children }: { children: ReactNode }) {
  return (
    <article className="mono-scope group relative grid h-full min-h-36 grid-cols-3 border-2 border-[var(--m-line)] bg-[var(--m-bg)] text-[var(--m-fg)] transition-colors hover:border-[var(--m-accent)]">
      {children}
    </article>
  );
}
```

Increase `min-h-36` to the next 4px-grid step that removes any dead band
under the leader row on the shortest 2-line description card, starting with
`min-h-44` (176px) and adjusting up/down by one grid step (`min-h-40`/192px→
no, grid steps here are Tailwind's own scale: 36→40→44→48, i.e.
144→160→176→192px) if it still clips or still leaves a gap. Update the
comment's parenthetical to state the new total and its breakdown (p-5 pair +
title + title→body 16 + description lines + `pt-6` + the leader row's own
line height), the same way the existing comment documents 144's breakdown.

- [ ] **Step 9: Re-run the full test file after the layout tweak**

Run: `npx vitest run src/features/arcade/hub/ui/arcade-page.test.tsx`
Expected: PASS, 4 tests (the `min-h-*` change doesn't affect these
assertions, this just confirms nothing else broke).

- [ ] **Step 10: Commit**

```bash
git add src/features/arcade/hub/ui/arcade-page.tsx src/features/arcade/hub/ui/arcade-page.test.tsx
git commit -m "feat(arcade): add leaderboard-leader row to hub cards"
```

---

## Post-plan verification (not a task — a final sanity pass)

After Task 3:

- `npm run typecheck` — 0 errors.
- `npm run lint` — 0 errors.
- `npx vitest run src/features/arcade/hub/ui/arcade-page.test.tsx` — all
  passing.
- Manual browser check at `/arcade`, signed OUT: 3 cards, each showing `NO
SCORES YET`.
- Manual browser check at `/arcade`, signed IN: cards for games with a
  submitted score show `@handle` + formatted score; games with none still
  show `NO SCORES YET`. No layout shift/dead space compared to the
  signed-out cards.
- `/arcade/stay-awake` and `/arcade/follow-the-rabbit` still load directly
  (routes untouched, just delisted from the hub grid).
