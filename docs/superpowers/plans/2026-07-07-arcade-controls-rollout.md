# Arcade Controls Rollout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give 2048, Snake ("Follow the Rabbit"), Snake Classic, and Stay Awake the same rebindable keyboard + gamepad CONTROLS modal Tetris already has — reusing all existing shared infrastructure.

**Architecture:** Generalize `createGamepadPoller` (currently hardcoded to Tetris's 8 actions) into a genuinely action-set-generic poller, adapt Tetris's own hook to the new signature (regression-checked), then repeat one mechanical pattern 4×: a per-game `bindings.ts` + `gamepad-bindings.ts` (mirroring `tetris/model/bindings.ts`/`gamepad-bindings.ts`), a hook rewrite that replaces hardcoded key checks with a `BindingMap` lookup and wires the generic poller, and a board change that adds `ControlsModal` + a "Controls" link. No engine/draw/visual changes anywhere.

**Tech Stack:** Next.js 16 (client components), React 19, TypeScript, Vitest + jsdom.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-06-arcade-controls-rollout-design.md` — read it for full context; this plan implements it directly.
- `start` (and 2048's `continueRun`) stay **hardcoded** to Enter/Space (keyboard) and "any button" (gamepad) — same as Tetris's own precedent (`start` is NOT part of Tetris's rebindable action set either). Only movement/pause-type actions are rebindable.
- Movement in 2048/Snake/Snake Classic/Stay Awake is **one-shot per input** (no DAS/held-repeat, unlike Tetris) — gamepad movement must be edge-detected the same way, not level-triggered.
- Follow the Brutalist-Mono design system in `CLAUDE.md` for any new UI (the "Controls" link + `--m-dim` divider pattern is already established by Tetris — copy it verbatim, don't reinvent).
- Run `npm run typecheck` and `npm run lint` after every task; keep both at 0 errors.
- Don't commit without checking the current branch first (`git branch --show-current`) — this session discovered mid-flight that branches can get merged/reset out from under you by parallel activity on GitHub.

---

## File Structure

- **Modify** `src/features/arcade/shared/model/gamepad.ts` — generalize `createGamepadPoller` to take an action list, return per-action HELD booleans + raw stick axes (edge-detection and axis-fallback become the caller's job).
- **Modify** `src/features/arcade/shared/model/gamepad.test.ts` — update for the new signature; add a test proving genericism with a non-Tetris action set.
- **Modify** `src/features/arcade/tetris/model/use-tetris-game.ts` — adapt to the new poller signature, computing its own edge-detection/axis-fallback (behavior must stay identical).
- **Create**, per game (`2048`, `snake`, `snake-classic`, `stay-awake`): `<game>/model/bindings.ts`, `<game>/model/bindings.test.ts`, `<game>/model/gamepad-bindings.ts`, `<game>/model/gamepad-bindings.test.ts`.
- **Modify**, per game: `<game>/model/use-<game>-game.ts` (bindings state + keyboard/gamepad rewiring), `<game>/model/types.ts` (API additions), `<game>/ui/board-<game>.tsx` (ControlsModal + Controls link).

---

### Task 1: Generalize `createGamepadPoller`, adapt Tetris

**Files:**

- Modify: `src/features/arcade/shared/model/gamepad.ts` (full file)
- Modify: `src/features/arcade/shared/model/gamepad.test.ts` (full file)
- Modify: `src/features/arcade/shared/index.ts:48-49`
- Modify: `src/features/arcade/tetris/model/use-tetris-game.ts` (imports; the `pollPadRef`/`getPollPad` block; a new `prevPadHeldRef`; the `tick()` function's pad-consuming block; nothing else)

**Interfaces:**

- Consumes: nothing new.
- Produces: `createGamepadPoller<A extends string>(actionIds: readonly A[], getBindings: () => BindingMap<A>): () => GamepadPollFrame<A>` and `interface GamepadPollFrame<A> { held: Record<A, boolean>; anyPress: boolean; axisX: number; axisY: number }`, plus `GAMEPAD_AXIS_DEADZONE: number` — ALL consumed by every later task in this plan (each game's hook calls this exact signature).

- [ ] **Step 1: Write the failing tests**

Replace the full contents of `src/features/arcade/shared/model/gamepad.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createGamepadPoller } from "./gamepad";
import type { BindingMap } from "./key-bindings";

type Act =
  | "moveLeft"
  | "moveRight"
  | "softDrop"
  | "hardDrop"
  | "rotateCW"
  | "rotateCCW"
  | "hold"
  | "pause";

const ACTION_IDS: readonly Act[] = [
  "moveLeft",
  "moveRight",
  "softDrop",
  "hardDrop",
  "rotateCW",
  "rotateCCW",
  "hold",
  "pause",
];

const BINDINGS: BindingMap<Act> = {
  moveLeft: ["Pad14"],
  moveRight: ["Pad15"],
  softDrop: ["Pad13"],
  hardDrop: ["Pad12"],
  rotateCW: ["Pad0"],
  rotateCCW: ["Pad1"],
  hold: ["Pad4", "Pad5"],
  pause: ["Pad9"],
};

function fakeGamepad(
  pressedIndices: number[],
  axes: readonly number[] = [0, 0]
): Gamepad {
  const buttons = Array.from({ length: 17 }, (_, i) => ({
    pressed: pressedIndices.includes(i),
    touched: pressedIndices.includes(i),
    value: pressedIndices.includes(i) ? 1 : 0,
  })) as GamepadButton[];
  return {
    id: "fake",
    index: 0,
    connected: true,
    timestamp: 0,
    mapping: "standard",
    buttons,
    axes,
    vibrationActuator: null,
  } as unknown as Gamepad;
}

afterEach(() => vi.unstubAllGlobals());

describe("createGamepadPoller", () => {
  beforeEach(() => {
    vi.stubGlobal("navigator", { getGamepads: () => [] });
  });

  it("returns all-false held with no gamepad connected", () => {
    const poll = createGamepadPoller(ACTION_IDS, () => BINDINGS);
    const frame = poll();
    expect(frame.held.moveLeft).toBe(false);
    expect(frame.held.hardDrop).toBe(false);
    expect(frame.anyPress).toBe(false);
    expect(frame.axisX).toBe(0);
    expect(frame.axisY).toBe(0);
  });

  it("resolves a held action from its bound button", () => {
    vi.stubGlobal("navigator", { getGamepads: () => [fakeGamepad([14])] });
    const poll = createGamepadPoller(ACTION_IDS, () => BINDINGS);
    const frame = poll();
    expect(frame.held.moveLeft).toBe(true);
    expect(frame.held.moveRight).toBe(false);
  });

  it("reports the SAME held state on every poll — edge detection is the caller's job now", () => {
    vi.stubGlobal("navigator", { getGamepads: () => [fakeGamepad([0])] });
    const poll = createGamepadPoller(ACTION_IDS, () => BINDINGS);
    expect(poll().held.rotateCW).toBe(true);
    expect(poll().held.rotateCW).toBe(true);
  });

  it("reports raw stick axes for the caller to fold into its own direction fallback", () => {
    vi.stubGlobal("navigator", {
      getGamepads: () => [fakeGamepad([], [-1, 0.7])],
    });
    const poll = createGamepadPoller(ACTION_IDS, () => BINDINGS);
    const frame = poll();
    expect(frame.axisX).toBe(-1);
    expect(frame.axisY).toBe(0.7);
  });

  it("follows a rebind to a new button", () => {
    const rebound: BindingMap<Act> = { ...BINDINGS, hardDrop: ["Pad2"] };
    vi.stubGlobal("navigator", { getGamepads: () => [fakeGamepad([2])] });
    const poll = createGamepadPoller(ACTION_IDS, () => rebound);
    expect(poll().held.hardDrop).toBe(true);
  });

  it("works for a completely different action set — proves genericism", () => {
    type HopAct = "hopLeft" | "hopRight" | "pause";
    const hopIds: readonly HopAct[] = ["hopLeft", "hopRight", "pause"];
    const hopBindings: BindingMap<HopAct> = {
      hopLeft: ["Pad14"],
      hopRight: ["Pad15"],
      pause: ["Pad9"],
    };
    vi.stubGlobal("navigator", { getGamepads: () => [fakeGamepad([15])] });
    const poll = createGamepadPoller(hopIds, () => hopBindings);
    const frame = poll();
    expect(frame.held.hopRight).toBe(true);
    expect(frame.held.hopLeft).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/features/arcade/shared/model/gamepad.test.ts`
Expected: FAIL to compile/run — `createGamepadPoller` still takes one argument, not two, and returns the old `PadFrame` shape (no `.held`, no `.axisX`).

- [ ] **Step 3: Rewrite `gamepad.ts`**

Replace the full contents of `src/features/arcade/shared/model/gamepad.ts`:

```ts
/**
 * Gamepad input for the arcade — polled from a game's EXISTING rAF loop (no loop of
 * its own; the Gamepad API is poll-only). Button→action assignment is REMAPPABLE:
 * the caller supplies its action id list and a live `BindingMap` (each game owns its
 * own `gamepad-bindings.ts`, edited via the CONTROLS modal) and this module just
 * resolves "is this action's bound button held right now" each poll, generically,
 * for ANY action set — it owns no defaults, no per-action edge/hold semantics, and
 * no direction/axis assumptions (a generic poller can't assume every action set has
 * a `moveLeft`). Standard-layout button INDICES are encoded as `"Pad<n>"` strings,
 * the same generic code format `key-bindings.ts` uses for keyboard codes.
 *
 * Callers own two things this module used to hardcode for Tetris:
 * - Edge-vs-hold semantics: diff the returned `held` booleans against your own
 *   previous-frame snapshot for actions you want as one-shot presses; use `held`
 *   directly for actions you want as continuous holds (Tetris does both).
 * - Analog-stick/D-pad-axis fallback: `axisX`/`axisY` are the raw left-stick axes
 *   (0 when no gamepad is connected) — OR them into whichever of YOUR OWN actions
 *   represent movement, with `GAMEPAD_AXIS_DEADZONE` as the shared threshold.
 */

import type { BindingMap } from "./key-bindings";

export interface GamepadPollFrame<A extends string> {
  /** Held-right-now booleans, one per requested action id. */
  held: Record<A, boolean>;
  /** True if ANY button on the pad is currently pressed (menu/over "any key"). */
  anyPress: boolean;
  /** Raw left-stick X axis; 0 when no gamepad is connected. */
  axisX: number;
  /** Raw left-stick Y axis; 0 when no gamepad is connected. */
  axisY: number;
}

/** Shared stick deadzone — every caller ORing in an axis fallback uses this same
 *  threshold, so "how far is a tilt" reads identically across every game. */
export const GAMEPAD_AXIS_DEADZONE = 0.5;

/** `"Pad12"` → `12`; anything malformed resolves to -1 (never matches a real button). */
function padButtonIndex(code: string): number {
  if (!code.startsWith("Pad")) return -1;
  const n = Number(code.slice(3));
  return Number.isInteger(n) ? n : -1;
}

export function createGamepadPoller<A extends string>(
  actionIds: readonly A[],
  getBindings: () => BindingMap<A>
): () => GamepadPollFrame<A> {
  const idleHeld = Object.fromEntries(
    actionIds.map((a) => [a, false])
  ) as Record<A, boolean>;

  return () => {
    const pads =
      typeof navigator !== "undefined" && navigator.getGamepads
        ? navigator.getGamepads()
        : [];
    const gp = Array.from(pads ?? []).find(
      (p): p is Gamepad => !!p && p.connected
    );
    if (!gp) {
      return { held: idleHeld, anyPress: false, axisX: 0, axisY: 0 };
    }
    const btn = (i: number) => !!gp.buttons[i]?.pressed;
    const bindings = getBindings();
    const held = Object.fromEntries(
      actionIds.map((a) => [
        a,
        bindings[a].some((code) => btn(padButtonIndex(code))),
      ])
    ) as Record<A, boolean>;
    return {
      held,
      anyPress: gp.buttons.some((b) => b.pressed),
      axisX: gp.axes[0] ?? 0,
      axisY: gp.axes[1] ?? 0,
    };
  };
}
```

- [ ] **Step 4: Run to verify the new tests pass**

Run: `npx vitest run src/features/arcade/shared/model/gamepad.test.ts`
Expected: PASS (all 6 tests).

- [ ] **Step 5: Update the shared barrel**

In `src/features/arcade/shared/index.ts`, replace lines 48-49:

```ts
export { createGamepadPoller, GAMEPAD_AXIS_DEADZONE } from "./model/gamepad";
export type { GamepadPollFrame } from "./model/gamepad";
```

- [ ] **Step 6: Adapt Tetris's hook to the new signature**

In `src/features/arcade/tetris/model/use-tetris-game.ts`:

Replace the import block (was lines 1-42):

```ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/shared/lib/prefers-reduced-motion";
import {
  COLS,
  ROWS,
  NEXT_CELL_MAX,
  NEXT_CELL_MAX_FS,
  NEXT_CELL_SCALE,
  NEXT_COLS,
  NEXT_ROWS,
  TetrisEngine,
  type TetrisPalette,
} from "./engine";
import {
  GUEST_SCOPE,
  loadBindings,
  saveBindings,
  type BindingMap,
  createGamepadPoller,
  GAMEPAD_AXIS_DEADZONE,
  type GamepadPollFrame,
} from "@/features/arcade/shared";
import {
  TETRIS_ACTION_IDS,
  TETRIS_DEFAULT_BINDINGS,
  TETRIS_KEYS_STORAGE,
  type TetrisAction,
} from "./bindings";
import {
  TETRIS_DEFAULT_GAMEPAD_BINDINGS,
  TETRIS_GAMEPAD_STORAGE,
} from "./gamepad-bindings";
import { loadHistory, recentSeries, recordScore } from "./score-history";
import type {
  ClearEvent,
  HistoryPoint,
  TetrisGameApi,
  TetrisGameState,
  TetrisInput,
  UseTetrisGameOptions,
} from "./types";
```

Find this exact block (the `pollPadRef`/`getPollPad` declarations):

```ts
const pollPadRef = useRef<(() => PadFrame) | null>(null);
const getEngine = () => {
  engineRef.current ??= new TetrisEngine();
  return engineRef.current;
};
// Lazy like getEngine — created on first real use (inside the loop, never
// during render) so the ref-reading closure is never invoked at render time.
const getPollPad = () => {
  pollPadRef.current ??= createGamepadPoller(() => padBindingsRef.current);
  return pollPadRef.current;
};
```

Replace it with:

```ts
const pollPadRef = useRef<(() => GamepadPollFrame<TetrisAction>) | null>(null);
const getEngine = () => {
  engineRef.current ??= new TetrisEngine();
  return engineRef.current;
};
// Lazy like getEngine — created on first real use (inside the loop, never
// during render) so the ref-reading closure is never invoked at render time.
const getPollPad = () => {
  pollPadRef.current ??= createGamepadPoller(
    TETRIS_ACTION_IDS,
    () => padBindingsRef.current
  );
  return pollPadRef.current;
};
```

Find this exact line (right before the `/** True while the CONTROLS modal owns the keyboard — game keys go inert. */` comment that precedes `const keysSuspendedRef = useRef(false);`):

```ts
// Hydrate persisted gamepad bindings on mount; rAF-deferred (lint rule).
useEffect(() => {
  const raf = requestAnimationFrame(() =>
    setPadBindingsState(
      loadBindings(TETRIS_GAMEPAD_STORAGE, TETRIS_DEFAULT_GAMEPAD_BINDINGS)
    )
  );
  return () => cancelAnimationFrame(raf);
}, []);
```

Immediately after it (still before the `keysSuspendedRef` comment/line), insert:

```ts
// Previous frame's gamepad held-state, for this hook's OWN edge detection
// (the generic poller reports raw held booleans now, not pre-computed edges).
// NOT reset by resetInput() — matches the old poller's behavior, where its
// internal `prev` closure state survived a rebind untouched.
const prevPadHeldRef = useRef<Record<TetrisAction, boolean>>(
  Object.fromEntries(TETRIS_ACTION_IDS.map((a) => [a, false])) as Record<
    TetrisAction,
    boolean
  >
);
```

Find this exact block inside the loop effect's `tick` function:

```ts
      const pad = getPollPad()();
      if (!keysSuspendedRef.current) {
        if (screenRef.current !== "playing") {
          if (pad.anyPress) start();
        } else if (pad.pause) {
          togglePause();
        }
      }

      if (screen === "playing" && !pausedRef.current && !endedRef.current) {
        const input = inputRef.current;
        const kb = kbHeldRef.current;
        input.left = kb.left || pad.left;
        input.right = kb.right || pad.right;
        input.softDrop = kb.softDrop || pad.softDrop;
        if (pad.rotateCW) input.rotateCW = true;
        if (pad.rotateCCW) input.rotateCCW = true;
        if (pad.hardDrop) input.hardDrop = true;
        if (pad.hold) input.hold = true;
        const res = engine.update(dt, input, animate);
```

Replace it with:

```ts
      const padFrame = getPollPad()();
      const padHeld = padFrame.held;
      const prevPadHeld = prevPadHeldRef.current;
      const padEdge = (a: TetrisAction) => padHeld[a] && !prevPadHeld[a];

      if (!keysSuspendedRef.current) {
        if (screenRef.current !== "playing") {
          if (padFrame.anyPress) start();
        } else if (padEdge("pause")) {
          togglePause();
        }
      }

      if (screen === "playing" && !pausedRef.current && !endedRef.current) {
        const input = inputRef.current;
        const kb = kbHeldRef.current;
        input.left =
          kb.left ||
          padHeld.moveLeft ||
          padFrame.axisX < -GAMEPAD_AXIS_DEADZONE;
        input.right =
          kb.right ||
          padHeld.moveRight ||
          padFrame.axisX > GAMEPAD_AXIS_DEADZONE;
        input.softDrop =
          kb.softDrop ||
          padHeld.softDrop ||
          padFrame.axisY > GAMEPAD_AXIS_DEADZONE;
        if (padEdge("rotateCW")) input.rotateCW = true;
        if (padEdge("rotateCCW")) input.rotateCCW = true;
        if (padEdge("hardDrop")) input.hardDrop = true;
        if (padEdge("hold")) input.hold = true;
        const res = engine.update(dt, input, animate);
```

A few lines further down, find the closing brace of that `if (screen === "playing" ...)` block, immediately followed by the repaint comment:

```ts
      }
      // Always repaint (menu / paused / over draw the static field too).
      paint();
```

Replace it with (adds one line — `prevPadHeldRef` must update EVERY tick regardless of screen, matching the old poller's unconditional `prev = held` at the end of every poll):

```ts
      }
      prevPadHeldRef.current = padHeld;
      // Always repaint (menu / paused / over draw the static field too).
      paint();
```

- [ ] **Step 7: Typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: 0 errors. (`type PadFrame` is no longer imported/used anywhere in this file — if typecheck flags an unused import, you missed removing it from the old import block; the replacement import block above already omits it.)

- [ ] **Step 8: Regression-check Tetris**

Run: `npx vitest run` (full suite) — expect the same baseline as before this task (209+ passing, the 2 pre-existing `submit-button.test.tsx` failures unrelated). Then manually reason through (no gamepad hardware available): confirm `padEdge`'s logic is IDENTICAL in effect to the old poller's internal `held.X && !prev.X` — same operands, same order, just relocated. Confirm the axis fallback (`axisX < -GAMEPAD_AXIS_DEADZONE` etc.) uses the exact same `0.5` threshold as before (`GAMEPAD_AXIS_DEADZONE` constant equals the old inline `DEADZONE = 0.5`).

- [ ] **Step 9: Commit**

```bash
git branch --show-current
git add src/features/arcade/shared/model/gamepad.ts src/features/arcade/shared/model/gamepad.test.ts src/features/arcade/shared/index.ts src/features/arcade/tetris/model/use-tetris-game.ts
git commit -m "refactor(arcade): generalize createGamepadPoller to any action set"
```

---

### Task 2: Snake Classic — bindings + hook

**Files:**

- Create: `src/features/arcade/snake-classic/model/bindings.ts`
- Create: `src/features/arcade/snake-classic/model/bindings.test.ts`
- Create: `src/features/arcade/snake-classic/model/gamepad-bindings.ts`
- Create: `src/features/arcade/snake-classic/model/gamepad-bindings.test.ts`
- Modify: `src/features/arcade/snake-classic/model/types.ts`
- Modify: `src/features/arcade/snake-classic/model/use-snake-classic-game.ts`

**Interfaces:**

- Consumes: `createGamepadPoller<A>`, `GAMEPAD_AXIS_DEADZONE`, `GamepadPollFrame<A>`, `BindingMap<A>`, `loadBindings`, `saveBindings`, `rebind` from `@/features/arcade/shared` (all from Task 1 / pre-existing shared infra).
- Produces: `SnakeClassicAction` type, `SNAKE_CLASSIC_ACTIONS`, `SNAKE_CLASSIC_ACTION_IDS`, `SNAKE_CLASSIC_DEFAULT_BINDINGS`, `SNAKE_CLASSIC_KEYS_STORAGE`, `SNAKE_CLASSIC_DEFAULT_GAMEPAD_BINDINGS`, `SNAKE_CLASSIC_GAMEPAD_STORAGE` — consumed by Task 3 (board wiring).
  `SnakeClassicGameApi` gains `bindings`, `setBindings`, `padBindings`, `setPadBindings` — consumed by Task 3.

- [ ] **Step 1: Write the failing tests**

Create `src/features/arcade/snake-classic/model/bindings.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  SNAKE_CLASSIC_ACTION_IDS,
  SNAKE_CLASSIC_DEFAULT_BINDINGS,
} from "./bindings";

describe("SNAKE_CLASSIC_DEFAULT_BINDINGS", () => {
  it("has exactly one entry per action id — no extras, no gaps", () => {
    expect(Object.keys(SNAKE_CLASSIC_DEFAULT_BINDINGS).sort()).toEqual(
      [...SNAKE_CLASSIC_ACTION_IDS].sort()
    );
  });

  it("every default binding has at least one key", () => {
    for (const id of SNAKE_CLASSIC_ACTION_IDS) {
      expect(SNAKE_CLASSIC_DEFAULT_BINDINGS[id].length).toBeGreaterThan(0);
    }
  });
});
```

Create `src/features/arcade/snake-classic/model/gamepad-bindings.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { SNAKE_CLASSIC_ACTION_IDS } from "./bindings";
import { SNAKE_CLASSIC_DEFAULT_GAMEPAD_BINDINGS } from "./gamepad-bindings";

describe("SNAKE_CLASSIC_DEFAULT_GAMEPAD_BINDINGS", () => {
  it("has exactly one entry per action id — no extras, no gaps", () => {
    expect(Object.keys(SNAKE_CLASSIC_DEFAULT_GAMEPAD_BINDINGS).sort()).toEqual(
      [...SNAKE_CLASSIC_ACTION_IDS].sort()
    );
  });

  it("every default binding has at least one Pad<n> key", () => {
    for (const id of SNAKE_CLASSIC_ACTION_IDS) {
      const codes = SNAKE_CLASSIC_DEFAULT_GAMEPAD_BINDINGS[id];
      expect(codes.length).toBeGreaterThan(0);
      for (const code of codes) expect(code).toMatch(/^Pad\d+$/);
    }
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/features/arcade/snake-classic/model/bindings.test.ts src/features/arcade/snake-classic/model/gamepad-bindings.test.ts`
Expected: FAIL — neither `./bindings` nor `./gamepad-bindings` exists yet.

- [ ] **Step 3: Create the bindings files**

Create `src/features/arcade/snake-classic/model/bindings.ts`:

```ts
import type { BindingMap } from "@/features/arcade/shared";

export type SnakeClassicAction =
  | "moveUp"
  | "moveDown"
  | "moveLeft"
  | "moveRight"
  | "pause";

/** Ordered action list — the CONTROLS modal rows + the code→action lookup. */
export const SNAKE_CLASSIC_ACTIONS: readonly {
  id: SnakeClassicAction;
  label: string;
}[] = [
  { id: "moveUp", label: "Move up" },
  { id: "moveDown", label: "Move down" },
  { id: "moveLeft", label: "Move left" },
  { id: "moveRight", label: "Move right" },
  { id: "pause", label: "Pause" },
];

export const SNAKE_CLASSIC_ACTION_IDS = SNAKE_CLASSIC_ACTIONS.map((a) => a.id);

/** Matches the current hardcoded keys exactly — rebinding only adds the ABILITY
 *  to change these; the out-of-the-box feel is unchanged. `start` is NOT here —
 *  it stays hardcoded to Enter/Space, same as Tetris's own precedent. */
export const SNAKE_CLASSIC_DEFAULT_BINDINGS: BindingMap<SnakeClassicAction> = {
  moveUp: ["ArrowUp", "KeyW"],
  moveDown: ["ArrowDown", "KeyS"],
  moveLeft: ["ArrowLeft", "KeyA"],
  moveRight: ["ArrowRight", "KeyD"],
  pause: ["Space"],
};

export const SNAKE_CLASSIC_KEYS_STORAGE = "arcade.snake-classic.keys.v1";
```

Create `src/features/arcade/snake-classic/model/gamepad-bindings.ts`:

```ts
import type { BindingMap } from "@/features/arcade/shared";
import type { SnakeClassicAction } from "./bindings";

/** Standard-layout defaults: D-pad for movement, Start for pause. `start`
 *  (menu/over) is NOT bound here — it's the generic "any button" press,
 *  same as Tetris's. */
export const SNAKE_CLASSIC_DEFAULT_GAMEPAD_BINDINGS: BindingMap<SnakeClassicAction> =
  {
    moveUp: ["Pad12"],
    moveDown: ["Pad13"],
    moveLeft: ["Pad14"],
    moveRight: ["Pad15"],
    pause: ["Pad9"],
  };

export const SNAKE_CLASSIC_GAMEPAD_STORAGE = "arcade.snake-classic.pad.v1";
```

- [ ] **Step 4: Run to verify they pass**

Run: `npx vitest run src/features/arcade/snake-classic/model/bindings.test.ts src/features/arcade/snake-classic/model/gamepad-bindings.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Add API members to `types.ts`**

In `src/features/arcade/snake-classic/model/types.ts`, add this import at the top of the file (before the existing content):

```ts
import type { BindingMap } from "@/features/arcade/shared";
import type { SnakeClassicAction } from "./bindings";
```

Then replace the `SnakeClassicGameApi` interface (currently):

```ts
export interface SnakeClassicGameApi {
  state: SnakeClassicGameState;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  history: HistoryPoint[];
  start: () => void;
  togglePause: () => void;
  /** Steer; ignored if it would reverse into the neck. */
  steer: (x: number, y: number) => void;
}
```

with:

```ts
export interface SnakeClassicGameApi {
  state: SnakeClassicGameState;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  history: HistoryPoint[];
  start: () => void;
  togglePause: () => void;
  /** Steer; ignored if it would reverse into the neck. */
  steer: (x: number, y: number) => void;
  /** Live remappable-key map — read by the keyboard handler, edited by CONTROLS. */
  bindings: BindingMap<SnakeClassicAction>;
  setBindings: (next: BindingMap<SnakeClassicAction>) => void;
  /** Live remappable-gamepad-button map — independent of `bindings`. */
  padBindings: BindingMap<SnakeClassicAction>;
  setPadBindings: (next: BindingMap<SnakeClassicAction>) => void;
  /** True while a modal (e.g. CONTROLS) owns the keyboard — game keys go inert. */
  setKeysSuspended: (suspended: boolean) => void;
}
```

- [ ] **Step 6: Rewire the hook**

In `src/features/arcade/snake-classic/model/use-snake-classic-game.ts`:

Add these imports (alongside the existing ones — exact merge point: add after the `GUEST_SCOPE` import line, before `loadHistory`):

```ts
import {
  GUEST_SCOPE,
  loadBindings,
  saveBindings,
  type BindingMap,
  createGamepadPoller,
  GAMEPAD_AXIS_DEADZONE,
  type GamepadPollFrame,
} from "@/features/arcade/shared";
import {
  SNAKE_CLASSIC_ACTION_IDS,
  SNAKE_CLASSIC_DEFAULT_BINDINGS,
  SNAKE_CLASSIC_KEYS_STORAGE,
  type SnakeClassicAction,
} from "./bindings";
import {
  SNAKE_CLASSIC_DEFAULT_GAMEPAD_BINDINGS,
  SNAKE_CLASSIC_GAMEPAD_STORAGE,
} from "./gamepad-bindings";
```

(This replaces the plain `import { GUEST_SCOPE } from "@/features/arcade/shared";` line.)

Inside `useSnakeClassicGame`, immediately after the `engineRef`/`getEngine` declaration and before the `useState<SnakeClassicGameState>` line, add:

```ts
const pollPadRef = useRef<(() => GamepadPollFrame<SnakeClassicAction>) | null>(
  null
);
const getPollPad = () => {
  pollPadRef.current ??= createGamepadPoller(
    SNAKE_CLASSIC_ACTION_IDS,
    () => padBindingsRef.current
  );
  return pollPadRef.current;
};
```

Immediately after the existing `historyRef` declaration (`const historyRef = useRef<number[]>([]);`) and before its adjacent `useEffect(() => { screenRef.current = ... })`, add the bindings state block:

```ts
const [bindings, setBindingsState] = useState<BindingMap<SnakeClassicAction>>(
  SNAKE_CLASSIC_DEFAULT_BINDINGS
);
const bindingsRef = useRef(bindings);
useEffect(() => {
  bindingsRef.current = bindings;
}, [bindings]);
useEffect(() => {
  const raf = requestAnimationFrame(() =>
    setBindingsState(
      loadBindings(SNAKE_CLASSIC_KEYS_STORAGE, SNAKE_CLASSIC_DEFAULT_BINDINGS)
    )
  );
  return () => cancelAnimationFrame(raf);
}, []);

const [padBindings, setPadBindingsState] = useState<
  BindingMap<SnakeClassicAction>
>(SNAKE_CLASSIC_DEFAULT_GAMEPAD_BINDINGS);
const padBindingsRef = useRef(padBindings);
useEffect(() => {
  padBindingsRef.current = padBindings;
}, [padBindings]);
useEffect(() => {
  const raf = requestAnimationFrame(() =>
    setPadBindingsState(
      loadBindings(
        SNAKE_CLASSIC_GAMEPAD_STORAGE,
        SNAKE_CLASSIC_DEFAULT_GAMEPAD_BINDINGS
      )
    )
  );
  return () => cancelAnimationFrame(raf);
}, []);

const setBindings = useCallback((next: BindingMap<SnakeClassicAction>) => {
  setBindingsState(next);
  saveBindings(SNAKE_CLASSIC_KEYS_STORAGE, next);
}, []);

const setPadBindings = useCallback((next: BindingMap<SnakeClassicAction>) => {
  setPadBindingsState(next);
  saveBindings(SNAKE_CLASSIC_GAMEPAD_STORAGE, next);
}, []);

/** True while the CONTROLS modal owns the keyboard — game keys go inert. */
const keysSuspendedRef = useRef(false);
const setKeysSuspended = useCallback((suspended: boolean) => {
  keysSuspendedRef.current = suspended;
}, []);

// Previous frame's gamepad held-state, for this hook's own edge detection.
const prevPadHeldRef = useRef<Record<SnakeClassicAction, boolean>>(
  Object.fromEntries(SNAKE_CLASSIC_ACTION_IDS.map((a) => [a, false])) as Record<
    SnakeClassicAction,
    boolean
  >
);
```

Find the start of the main loop effect's `tick` function:

```ts
    const tick = (now: number) => {
      lastFrame = now;
      if (
        Math.abs(canvas.clientWidth - cssW) > 1 ||
        Math.abs(canvas.clientHeight - cssH) > 1
      ) {
        resize();
      }
      const animate = !prefersReducedMotion();
      const screen = screenRef.current;

      if (screen === "playing" && !pausedRef.current) {
```

Replace it with (adds gamepad polling right after `screen` is read, before the existing playing-branch):

```ts
    const tick = (now: number) => {
      lastFrame = now;
      if (
        Math.abs(canvas.clientWidth - cssW) > 1 ||
        Math.abs(canvas.clientHeight - cssH) > 1
      ) {
        resize();
      }
      const animate = !prefersReducedMotion();
      const screen = screenRef.current;

      if (!keysSuspendedRef.current) {
        const padFrame = getPollPad()();
        const padHeld = padFrame.held;
        const prevPadHeld = prevPadHeldRef.current;
        const combinedHeld: Record<SnakeClassicAction, boolean> = {
          ...padHeld,
          moveLeft:
            padHeld.moveLeft || padFrame.axisX < -GAMEPAD_AXIS_DEADZONE,
          moveRight:
            padHeld.moveRight || padFrame.axisX > GAMEPAD_AXIS_DEADZONE,
          moveUp: padHeld.moveUp || padFrame.axisY < -GAMEPAD_AXIS_DEADZONE,
          moveDown: padHeld.moveDown || padFrame.axisY > GAMEPAD_AXIS_DEADZONE,
        };
        const padEdge = (a: SnakeClassicAction) =>
          combinedHeld[a] && !prevPadHeld[a];

        if (screen !== "playing") {
          if (padFrame.anyPress) start();
        } else {
          if (padEdge("pause")) togglePause();
          if (padEdge("moveUp")) steer(0, -1);
          else if (padEdge("moveDown")) steer(0, 1);
          else if (padEdge("moveLeft")) steer(-1, 0);
          else if (padEdge("moveRight")) steer(1, 0);
        }
        prevPadHeldRef.current = combinedHeld;
      }

      if (screen === "playing" && !pausedRef.current) {
```

This references `start`, `togglePause`, `steer` — all already defined earlier in the hook (as `useCallback`s) and already in this effect's closure scope (the existing loop effect's dependency array is `[handleGameOver]` with an `eslint-disable-next-line react-hooks/exhaustive-deps` comment — leave that disable comment in place; `start`/`togglePause`/`steer` are stable `useCallback`s with empty/ref-only deps, so this doesn't introduce a real staleness bug, consistent with the existing suppressed-lint pattern in this file).

Now rewrite the keyboard effect. Find:

```ts
useEffect(() => {
  const onKey = (e: KeyboardEvent) => {
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

    const k = e.key;
    // WASD matched on `e.code` (the PHYSICAL key), not `e.key`: on a non-Latin
    // layout `e.key` yields "ц/ф/ы/в", so a key-based check silently fails.
    // `e.code` is layout-independent. Arrows stay on `e.key` (already layout-independent).
    const c = e.code;
    const isArrow =
      k === "ArrowUp" ||
      k === "ArrowDown" ||
      k === "ArrowLeft" ||
      k === "ArrowRight";
    if (isArrow || k === " ") e.preventDefault();

    if (screenRef.current !== "playing") {
      if (k === "Enter" || k === " ") start();
      return;
    }
    if (k === " ") {
      togglePause();
      return;
    }
    if (k === "ArrowUp" || c === "KeyW") steer(0, -1);
    else if (k === "ArrowDown" || c === "KeyS") steer(0, 1);
    else if (k === "ArrowLeft" || c === "KeyA") steer(-1, 0);
    else if (k === "ArrowRight" || c === "KeyD") steer(1, 0);
  };
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}, [start, togglePause, steer]);
```

Replace it with:

```ts
useEffect(() => {
  const actionOf = (code: string): SnakeClassicAction | null => {
    const map = bindingsRef.current;
    for (const a of SNAKE_CLASSIC_ACTION_IDS) {
      if (map[a].includes(code)) return a;
    }
    return null;
  };

  const onKey = (e: KeyboardEvent) => {
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
    if (keysSuspendedRef.current) return; // CONTROLS modal owns the keyboard

    const c = e.code;
    const action = actionOf(c);
    if (action || c === "Space") e.preventDefault();

    if (screenRef.current !== "playing") {
      if (c === "Enter" || c === "Space") start();
      return;
    }
    if (action === "pause") {
      togglePause();
      return;
    }
    switch (action) {
      case "moveUp":
        steer(0, -1);
        break;
      case "moveDown":
        steer(0, 1);
        break;
      case "moveLeft":
        steer(-1, 0);
        break;
      case "moveRight":
        steer(1, 0);
        break;
    }
  };
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}, [start, togglePause, steer]);
```

Finally, add the new members to the hook's return statement. Find:

```ts
  return {
    state,
    canvasRef,
    history,
    start,
    togglePause,
    steer,
  };
}
```

Replace with:

```ts
  return {
    state,
    canvasRef,
    history,
    start,
    togglePause,
    steer,
    bindings,
    setBindings,
    padBindings,
    setPadBindings,
    setKeysSuspended,
  };
}
```

- [ ] **Step 7: Typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: 0 errors. (Expect the board file to now show a type error because `SnakeClassicBoard` doesn't yet destructure/use the new API members — that's fine, Task 3 fixes it. Confirm no OTHER errors exist in this task's own files.)

- [ ] **Step 8: Run this task's tests**

Run: `npx vitest run src/features/arcade/snake-classic`
Expected: PASS, no regressions in this game's existing `engine.test.ts` (if any) plus the 4 new binding tests.

- [ ] **Step 9: Commit**

```bash
git branch --show-current
git add src/features/arcade/snake-classic/model/bindings.ts src/features/arcade/snake-classic/model/bindings.test.ts src/features/arcade/snake-classic/model/gamepad-bindings.ts src/features/arcade/snake-classic/model/gamepad-bindings.test.ts src/features/arcade/snake-classic/model/types.ts src/features/arcade/snake-classic/model/use-snake-classic-game.ts
git commit -m "feat(arcade): snake classic keyboard+gamepad rebinding (data + hook)"
```

---

### Task 3: Snake Classic — board wiring

**Files:**

- Modify: `src/features/arcade/snake-classic/ui/snake-classic-board.tsx` (full file)

**Interfaces:**

- Consumes: `SnakeClassicGameApi.bindings/setBindings/padBindings/setPadBindings/setKeysSuspended` (Task 2), `SNAKE_CLASSIC_ACTIONS`/`SNAKE_CLASSIC_DEFAULT_BINDINGS` (Task 2's `bindings.ts`), `SNAKE_CLASSIC_DEFAULT_GAMEPAD_BINDINGS` (Task 2's `gamepad-bindings.ts`), `ControlsModal` (pre-existing shared).
- Produces: nothing further downstream.

- [ ] **Step 1: Replace the board file**

Replace the full contents of `src/features/arcade/snake-classic/ui/snake-classic-board.tsx`:

```tsx
"use client";

import { useState } from "react";
import {
  BoardFullscreenButton,
  ControlsModal,
  CornerBrackets,
  FULLSCREEN_ROOT,
  GameOverOverlay,
  MenuOverlay,
  PauseOverlay,
  rankLine,
  useBoardFullscreen,
} from "@/features/arcade/shared";
import {
  SNAKE_CLASSIC_ACTIONS,
  SNAKE_CLASSIC_DEFAULT_BINDINGS,
} from "../model/bindings";
import { SNAKE_CLASSIC_DEFAULT_GAMEPAD_BINDINGS } from "../model/gamepad-bindings";
import type { SnakeClassicGameApi } from "../model/types";

/** The canvas play-field + its overlays (menu / pause / game-over). Pure
 *  presentation — the hook owns all logic; the board only renders `api`.
 *
 *  THEME-NATIVE (the Tetris pattern): NO forced `dark` scope — the board and
 *  overlays read the AMBIENT `--m-*` tokens, and the canvas palette is resolved
 *  from those same tokens in the hook. */
export function SnakeClassicBoard({
  api,
  canRank = true,
}: {
  api: SnakeClassicGameApi;
  /** False for a signed-out viewer — runs stay local, so no board/rank talk. */
  canRank?: boolean;
}) {
  const { state, canvasRef, start } = api;
  const {
    rootRef: fullscreenRootRef,
    isFullscreen,
    toggle: toggleFullscreen,
  } = useBoardFullscreen();

  const [controlsOpen, setControlsOpen] = useState(false);
  const openControls = () => {
    setControlsOpen(true);
    api.setKeysSuspended(true);
  };
  const closeControls = () => {
    setControlsOpen(false);
    api.setKeysSuspended(false);
  };

  const rankClause = rankLine(state.rank, canRank, "eat more, grow longer");
  // Fullscreen toggle lives on the OVERLAY screens only (menu / pause — owner
  // call): never a floating control over live gameplay.
  const showFullscreenToggle =
    state.screen === "menu" || (state.screen === "playing" && state.paused);

  return (
    <div
      ref={fullscreenRootRef}
      className={`mono-scope relative flex aspect-[30/18] w-full items-center justify-center overflow-hidden bg-[var(--m-bg)] p-5 ${FULLSCREEN_ROOT}`}
    >
      {/* The canvas is JS-SIZED (inline px from the hook, contain-fit 5:3 in
          the host's content box) — the CSS takes kept breaking (iOS % heights,
          then the absolute/aspect variant on desktop). The root just flex-
          centres whatever size the hook writes, fullscreen included. */}
      <canvas
        ref={canvasRef}
        aria-label="Classic Snake game board. Use the arrow keys to steer, Space to pause. Walls are lethal."
        role="img"
        className="block [image-rendering:pixelated]"
      />

      <CornerBrackets />

      {state.screen === "menu" && (
        <MenuOverlay
          title="Snake"
          onStart={start}
          extra={
            <>
              <div className="h-0.5 w-full bg-[var(--m-dim)]" aria-hidden />
              <button
                type="button"
                onClick={openControls}
                className="mono-focus text-[11px] font-medium uppercase leading-none tracking-[0.12em] text-[var(--m-muted2)] transition-colors hover:text-[var(--m-muted)]"
              >
                Controls
              </button>
            </>
          }
        />
      )}

      {state.screen === "playing" && state.paused && (
        <PauseOverlay hint="Space to resume" />
      )}

      {state.screen === "over" && (
        <GameOverOverlay
          isNewBest={state.isNewBest}
          score={state.score}
          detail={rankClause}
          onRestart={start}
        />
      )}

      {showFullscreenToggle && (
        <BoardFullscreenButton
          isFullscreen={isFullscreen}
          onToggle={toggleFullscreen}
        />
      )}

      <ControlsModal
        isOpen={controlsOpen}
        onOpenChange={closeControls}
        actions={SNAKE_CLASSIC_ACTIONS}
        value={api.bindings}
        defaults={SNAKE_CLASSIC_DEFAULT_BINDINGS}
        onChange={api.setBindings}
        padValue={api.padBindings}
        padDefaults={SNAKE_CLASSIC_DEFAULT_GAMEPAD_BINDINGS}
        onPadChange={api.setPadBindings}
      />
    </div>
  );
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: 0 errors.

- [ ] **Step 3: Manual verification**

Run: `npm run dev`, open `/arcade/snake`. Confirm: the menu shows a `Controls` link under Start Game with a divider above it (same look as Tetris); opening it shows 5 rows (Move up/down/left/right, Pause) each with a keyboard chip + gamepad chip; rebinding a key changes in-game behavior; Escape cancels a gamepad capture; Reset restores both maps.

- [ ] **Step 4: Commit**

```bash
git branch --show-current
git add src/features/arcade/snake-classic/ui/snake-classic-board.tsx
git commit -m "feat(arcade): wire CONTROLS modal into Snake Classic"
```

---

### Task 4: 2048 — bindings + hook

**Files:**

- Create: `src/features/arcade/2048/model/bindings.ts`
- Create: `src/features/arcade/2048/model/bindings.test.ts`
- Create: `src/features/arcade/2048/model/gamepad-bindings.ts`
- Create: `src/features/arcade/2048/model/gamepad-bindings.test.ts`
- Modify: `src/features/arcade/2048/model/types.ts`
- Modify: `src/features/arcade/2048/model/use-2048-game.ts`

**Interfaces:**

- Consumes: same shared infra as Task 2 (`createGamepadPoller`, `GAMEPAD_AXIS_DEADZONE`, `GamepadPollFrame`, `BindingMap`, `loadBindings`, `saveBindings`).
- Produces: `Game2048Action`, `GAME_2048_ACTIONS`, `GAME_2048_ACTION_IDS`, `GAME_2048_DEFAULT_BINDINGS`, `GAME_2048_KEYS_STORAGE`, `GAME_2048_DEFAULT_GAMEPAD_BINDINGS`, `GAME_2048_GAMEPAD_STORAGE` — consumed by Task 5.
  `Game2048Api` gains `bindings`, `setBindings`, `padBindings`, `setPadBindings`, `setKeysSuspended` — consumed by Task 5.

- [ ] **Step 1: Write the failing tests**

Create `src/features/arcade/2048/model/bindings.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { GAME_2048_ACTION_IDS, GAME_2048_DEFAULT_BINDINGS } from "./bindings";

describe("GAME_2048_DEFAULT_BINDINGS", () => {
  it("has exactly one entry per action id — no extras, no gaps", () => {
    expect(Object.keys(GAME_2048_DEFAULT_BINDINGS).sort()).toEqual(
      [...GAME_2048_ACTION_IDS].sort()
    );
  });

  it("every default binding has at least one key", () => {
    for (const id of GAME_2048_ACTION_IDS) {
      expect(GAME_2048_DEFAULT_BINDINGS[id].length).toBeGreaterThan(0);
    }
  });
});
```

Create `src/features/arcade/2048/model/gamepad-bindings.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { GAME_2048_ACTION_IDS } from "./bindings";
import { GAME_2048_DEFAULT_GAMEPAD_BINDINGS } from "./gamepad-bindings";

describe("GAME_2048_DEFAULT_GAMEPAD_BINDINGS", () => {
  it("has exactly one entry per action id — no extras, no gaps", () => {
    expect(Object.keys(GAME_2048_DEFAULT_GAMEPAD_BINDINGS).sort()).toEqual(
      [...GAME_2048_ACTION_IDS].sort()
    );
  });

  it("every default binding has at least one Pad<n> key", () => {
    for (const id of GAME_2048_ACTION_IDS) {
      const codes = GAME_2048_DEFAULT_GAMEPAD_BINDINGS[id];
      expect(codes.length).toBeGreaterThan(0);
      for (const code of codes) expect(code).toMatch(/^Pad\d+$/);
    }
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/features/arcade/2048/model/bindings.test.ts src/features/arcade/2048/model/gamepad-bindings.test.ts`
Expected: FAIL — files don't exist yet.

- [ ] **Step 3: Create the bindings files**

Create `src/features/arcade/2048/model/bindings.ts`:

```ts
import type { BindingMap } from "@/features/arcade/shared";

export type Game2048Action = "moveLeft" | "moveRight" | "moveUp" | "moveDown";

/** Ordered action list — the CONTROLS modal rows + the code→action lookup.
 *  `start`/`continueRun` are NOT here — they stay hardcoded to Enter/Space
 *  (and gamepad "any button"), same as Tetris's own `start` precedent. */
export const GAME_2048_ACTIONS: readonly {
  id: Game2048Action;
  label: string;
}[] = [
  { id: "moveLeft", label: "Move left" },
  { id: "moveRight", label: "Move right" },
  { id: "moveUp", label: "Move up" },
  { id: "moveDown", label: "Move down" },
];

export const GAME_2048_ACTION_IDS = GAME_2048_ACTIONS.map((a) => a.id);

/** Matches the current hardcoded `dirFor()` mapping exactly. */
export const GAME_2048_DEFAULT_BINDINGS: BindingMap<Game2048Action> = {
  moveLeft: ["ArrowLeft", "KeyA"],
  moveRight: ["ArrowRight", "KeyD"],
  moveUp: ["ArrowUp", "KeyW"],
  moveDown: ["ArrowDown", "KeyS"],
};

export const GAME_2048_KEYS_STORAGE = "arcade.2048.keys.v1";
```

Create `src/features/arcade/2048/model/gamepad-bindings.ts`:

```ts
import type { BindingMap } from "@/features/arcade/shared";
import type { Game2048Action } from "./bindings";

/** Standard-layout defaults: D-pad for movement. `start`/`continueRun` are
 *  the generic "any button" press, not bound here. */
export const GAME_2048_DEFAULT_GAMEPAD_BINDINGS: BindingMap<Game2048Action> = {
  moveLeft: ["Pad14"],
  moveRight: ["Pad15"],
  moveUp: ["Pad12"],
  moveDown: ["Pad13"],
};

export const GAME_2048_GAMEPAD_STORAGE = "arcade.2048.pad.v1";
```

- [ ] **Step 4: Run to verify they pass**

Run: `npx vitest run src/features/arcade/2048/model/bindings.test.ts src/features/arcade/2048/model/gamepad-bindings.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Add API members to `types.ts`**

In `src/features/arcade/2048/model/types.ts`, add at the top:

```ts
import type { BindingMap } from "@/features/arcade/shared";
import type { Game2048Action } from "./bindings";
```

Replace the `Game2048Api` interface (currently):

```ts
export interface Game2048Api {
  state: Game2048State;
  /** The 4×4 board canvas — centered alone in the band (run stats live in the top
   *  stats band, not beside the game). */
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  history: HistoryPoint[];
  start: () => void;
  /** Resume endless play from the win overlay. */
  continueRun: () => void;
}
```

with:

```ts
export interface Game2048Api {
  state: Game2048State;
  /** The 4×4 board canvas — centered alone in the band (run stats live in the top
   *  stats band, not beside the game). */
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  history: HistoryPoint[];
  start: () => void;
  /** Resume endless play from the win overlay. */
  continueRun: () => void;
  /** Live remappable-key map — read by the keyboard handler, edited by CONTROLS. */
  bindings: BindingMap<Game2048Action>;
  setBindings: (next: BindingMap<Game2048Action>) => void;
  /** Live remappable-gamepad-button map — independent of `bindings`. */
  padBindings: BindingMap<Game2048Action>;
  setPadBindings: (next: BindingMap<Game2048Action>) => void;
  /** True while a modal (e.g. CONTROLS) owns the keyboard — game keys go inert. */
  setKeysSuspended: (suspended: boolean) => void;
}
```

- [ ] **Step 6: Rewire the hook**

In `src/features/arcade/2048/model/use-2048-game.ts`:

Replace the import block (was lines 1-15):

```ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/shared/lib/prefers-reduced-motion";
import { Engine2048, GRID, parseHexRgb, type Palette2048 } from "./engine";
import {
  GUEST_SCOPE,
  loadBindings,
  saveBindings,
  type BindingMap,
  createGamepadPoller,
  GAMEPAD_AXIS_DEADZONE,
  type GamepadPollFrame,
} from "@/features/arcade/shared";
import {
  GAME_2048_ACTION_IDS,
  GAME_2048_DEFAULT_BINDINGS,
  GAME_2048_KEYS_STORAGE,
  type Game2048Action,
} from "./bindings";
import {
  GAME_2048_DEFAULT_GAMEPAD_BINDINGS,
  GAME_2048_GAMEPAD_STORAGE,
} from "./gamepad-bindings";
import { loadHistory, recentSeries, recordScore } from "./score-history";
import type {
  Direction,
  Game2048Api,
  Game2048State,
  HistoryPoint,
  Input2048,
  Use2048GameOptions,
} from "./types";
```

Remove the now-unused `dirFor()` function (it's superseded by the `actionOf()`/binding-based lookup in Step below — delete these lines entirely):

```ts
/** Map a key event to a slide direction (arrows / WASD), or null. */
function dirFor(code: string, key: string): Direction | null {
  if (code === "KeyA" || key === "ArrowLeft") return "left";
  if (code === "KeyD" || key === "ArrowRight") return "right";
  if (code === "KeyW" || key === "ArrowUp") return "up";
  if (code === "KeyS" || key === "ArrowDown") return "down";
  return null;
}
```

Immediately after the `engineRef`/`getEngine` declaration and before the `useState<Game2048State>` line, add:

```ts
const pollPadRef = useRef<(() => GamepadPollFrame<Game2048Action>) | null>(
  null
);
const getPollPad = () => {
  pollPadRef.current ??= createGamepadPoller(
    GAME_2048_ACTION_IDS,
    () => padBindingsRef.current
  );
  return pollPadRef.current;
};
```

Immediately after the existing `historyRef` declaration (`const historyRef = useRef<number[]>([]);`) and before its adjacent `endedRef`/`wonNotifiedRef` declarations, add:

```ts
const [bindings, setBindingsState] = useState<BindingMap<Game2048Action>>(
  GAME_2048_DEFAULT_BINDINGS
);
const bindingsRef = useRef(bindings);
useEffect(() => {
  bindingsRef.current = bindings;
}, [bindings]);
useEffect(() => {
  const raf = requestAnimationFrame(() =>
    setBindingsState(
      loadBindings(GAME_2048_KEYS_STORAGE, GAME_2048_DEFAULT_BINDINGS)
    )
  );
  return () => cancelAnimationFrame(raf);
}, []);

const [padBindings, setPadBindingsState] = useState<BindingMap<Game2048Action>>(
  GAME_2048_DEFAULT_GAMEPAD_BINDINGS
);
const padBindingsRef = useRef(padBindings);
useEffect(() => {
  padBindingsRef.current = padBindings;
}, [padBindings]);
useEffect(() => {
  const raf = requestAnimationFrame(() =>
    setPadBindingsState(
      loadBindings(
        GAME_2048_GAMEPAD_STORAGE,
        GAME_2048_DEFAULT_GAMEPAD_BINDINGS
      )
    )
  );
  return () => cancelAnimationFrame(raf);
}, []);

const setBindings = useCallback((next: BindingMap<Game2048Action>) => {
  setBindingsState(next);
  saveBindings(GAME_2048_KEYS_STORAGE, next);
}, []);

const setPadBindings = useCallback((next: BindingMap<Game2048Action>) => {
  setPadBindingsState(next);
  saveBindings(GAME_2048_GAMEPAD_STORAGE, next);
}, []);

/** True while the CONTROLS modal owns the keyboard — game keys go inert. */
const keysSuspendedRef = useRef(false);
const setKeysSuspended = useCallback((suspended: boolean) => {
  keysSuspendedRef.current = suspended;
}, []);

const prevPadHeldRef = useRef<Record<Game2048Action, boolean>>(
  Object.fromEntries(GAME_2048_ACTION_IDS.map((a) => [a, false])) as Record<
    Game2048Action,
    boolean
  >
);
```

Find the tick function's playing-branch:

```ts
    const tick = (now: number) => {
      lastFrame = now;
      const dt = now - last;
      last = now;
      const animate = !prefersReducedMotion();

      if (screenRef.current === "playing" && !endedRef.current) {
        const res = engine.update(dt, inputRef.current, animate);
```

Replace it with (adds gamepad polling before the existing screen check, and folds pad-driven direction/start/continue into the existing `inputRef`):

```ts
    const tick = (now: number) => {
      lastFrame = now;
      const dt = now - last;
      last = now;
      const animate = !prefersReducedMotion();

      if (!keysSuspendedRef.current) {
        const padFrame = getPollPad()();
        const padHeld = padFrame.held;
        const prevPadHeld = prevPadHeldRef.current;
        const combinedHeld: Record<Game2048Action, boolean> = {
          moveLeft:
            padHeld.moveLeft || padFrame.axisX < -GAMEPAD_AXIS_DEADZONE,
          moveRight:
            padHeld.moveRight || padFrame.axisX > GAMEPAD_AXIS_DEADZONE,
          moveUp: padHeld.moveUp || padFrame.axisY < -GAMEPAD_AXIS_DEADZONE,
          moveDown: padHeld.moveDown || padFrame.axisY > GAMEPAD_AXIS_DEADZONE,
        };
        const padEdge = (a: Game2048Action) =>
          combinedHeld[a] && !prevPadHeld[a];
        const screen = screenRef.current;

        if (screen === "menu" || screen === "over") {
          if (padFrame.anyPress) start();
        } else if (screen === "won") {
          if (padFrame.anyPress) continueRun();
        } else if (!inputRef.current.dir) {
          if (padEdge("moveLeft")) inputRef.current.dir = "left";
          else if (padEdge("moveRight")) inputRef.current.dir = "right";
          else if (padEdge("moveUp")) inputRef.current.dir = "up";
          else if (padEdge("moveDown")) inputRef.current.dir = "down";
        }
        prevPadHeldRef.current = combinedHeld;
      }

      if (screenRef.current === "playing" && !endedRef.current) {
        const res = engine.update(dt, inputRef.current, animate);
```

This references `continueRun`, which is defined later in the file as a `useCallback` — confirm the loop effect's dependency array (currently `[handleGameOver]`, with implicit closure over `start`/`continueRun` the same way it already closes over `start` today) still works; if TypeScript/eslint flags a stale-closure warning for `continueRun`/`start` here, this file already suppresses similar warnings elsewhere in this hook — match the existing pattern (these are stable empty-deps `useCallback`s, so it's safe).

Now rewrite the keyboard effect. Find:

```ts
useEffect(() => {
  const isStart = (c: string, k: string) =>
    c === "Enter" || c === "Space" || k === " ";

  const onKeyDown = (e: KeyboardEvent) => {
    // Never hijack typing, and let a FOCUSED button/link keep its native
    // Enter/Space activation (the won overlay has TWO actions — routing a
    // focused "New game" Space press to Continue would misfire).
    const el = e.target as HTMLElement | null;
    if (
      el &&
      (el.tagName === "INPUT" ||
        el.tagName === "TEXTAREA" ||
        el.tagName === "BUTTON" ||
        el.tagName === "A" ||
        el.isContentEditable)
    ) {
      return;
    }
    const dir = dirFor(e.code, e.key);
    if (dir || e.key === " ") e.preventDefault();

    const screen = screenRef.current;
    if (screen === "menu" || screen === "over") {
      if (isStart(e.code, e.key)) start();
      return;
    }
    if (screen === "won") {
      if (isStart(e.code, e.key)) continueRun();
      return;
    }
    if (dir) inputRef.current.dir = dir;
  };

  window.addEventListener("keydown", onKeyDown);
  return () => window.removeEventListener("keydown", onKeyDown);
}, [start, continueRun]);
```

Replace it with:

```ts
useEffect(() => {
  const isStart = (c: string, k: string) =>
    c === "Enter" || c === "Space" || k === " ";

  const actionOf = (code: string): Game2048Action | null => {
    const map = bindingsRef.current;
    for (const a of GAME_2048_ACTION_IDS) {
      if (map[a].includes(code)) return a;
    }
    return null;
  };

  const onKeyDown = (e: KeyboardEvent) => {
    // Never hijack typing, and let a FOCUSED button/link keep its native
    // Enter/Space activation (the won overlay has TWO actions — routing a
    // focused "New game" Space press to Continue would misfire).
    const el = e.target as HTMLElement | null;
    if (
      el &&
      (el.tagName === "INPUT" ||
        el.tagName === "TEXTAREA" ||
        el.tagName === "BUTTON" ||
        el.tagName === "A" ||
        el.isContentEditable)
    ) {
      return;
    }
    if (keysSuspendedRef.current) return; // CONTROLS modal owns the keyboard

    const action = actionOf(e.code);
    if (action || e.key === " ") e.preventDefault();

    const screen = screenRef.current;
    if (screen === "menu" || screen === "over") {
      if (isStart(e.code, e.key)) start();
      return;
    }
    if (screen === "won") {
      if (isStart(e.code, e.key)) continueRun();
      return;
    }
    if (action) inputRef.current.dir = action;
  };

  window.addEventListener("keydown", onKeyDown);
  return () => window.removeEventListener("keydown", onKeyDown);
}, [start, continueRun]);
```

(`action` is a `Game2048Action`, which is exactly the same string union as `Direction` — `"left" | "right" | "up" | "down"` — no, wait: `Game2048Action` is `"moveLeft" | "moveRight" | "moveUp" | "moveDown"`, NOT the same strings as `Direction` = `"left" | "right" | "up" | "down"`. `inputRef.current.dir` is typed `Direction | null`. You must map action→direction explicitly — replace the last line `if (action) inputRef.current.dir = action;` with:

```ts
switch (action) {
  case "moveLeft":
    inputRef.current.dir = "left";
    break;
  case "moveRight":
    inputRef.current.dir = "right";
    break;
  case "moveUp":
    inputRef.current.dir = "up";
    break;
  case "moveDown":
    inputRef.current.dir = "down";
    break;
}
```

Finally, update the hook's return statement. Find:

```ts
  return { state, canvasRef, history, start, continueRun };
}
```

Replace with:

```ts
  return {
    state,
    canvasRef,
    history,
    start,
    continueRun,
    bindings,
    setBindings,
    padBindings,
    setPadBindings,
    setKeysSuspended,
  };
}
```

- [ ] **Step 7: Typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: 0 errors, EXCEPT the board file (`board-2048.tsx`) — Task 5 fixes that. Confirm `dirFor`/`Direction` import (if now unused anywhere) doesn't trigger an unused-import error; `Direction` is still used by `Input2048`'s type in `types.ts`, so keep that import in `use-2048-game.ts` only if still referenced (it's used in the `switch` above via string literals, not the type itself, in this file — if `Direction` is no longer referenced as a TYPE in this file after removing `dirFor`, remove it from this file's `import type { Direction, ... } from "./types";` list; keep it in `types.ts` itself where `Input2048` still needs it).

- [ ] **Step 8: Run this task's tests**

Run: `npx vitest run src/features/arcade/2048`
Expected: PASS, including the existing `engine.test.ts` (unaffected — engine wasn't touched) plus the 4 new binding tests.

- [ ] **Step 9: Commit**

```bash
git branch --show-current
git add src/features/arcade/2048/model/bindings.ts src/features/arcade/2048/model/bindings.test.ts src/features/arcade/2048/model/gamepad-bindings.ts src/features/arcade/2048/model/gamepad-bindings.test.ts src/features/arcade/2048/model/types.ts src/features/arcade/2048/model/use-2048-game.ts
git commit -m "feat(arcade): 2048 keyboard+gamepad rebinding (data + hook)"
```

---

### Task 5: 2048 — board wiring

**Files:**

- Modify: `src/features/arcade/2048/ui/board-2048.tsx` (full file)

**Interfaces:**

- Consumes: `Game2048Api.bindings/setBindings/padBindings/setPadBindings/setKeysSuspended` (Task 4), `GAME_2048_ACTIONS`/`GAME_2048_DEFAULT_BINDINGS` (Task 4), `GAME_2048_DEFAULT_GAMEPAD_BINDINGS` (Task 4), `ControlsModal`.
- Produces: nothing further downstream. Also deletes the dead `KEY_HINTS` constant this file still carries.

- [ ] **Step 1: Replace the board file**

Replace the full contents of `src/features/arcade/2048/ui/board-2048.tsx`:

```tsx
"use client";

import { useState } from "react";
import {
  ArcadeButton,
  BoardFullscreenButton,
  ControlsModal,
  CornerBrackets,
  FULLSCREEN_ROOT,
  FULLSCREEN_STAGE,
  GameOverOverlay,
  MenuOverlay,
  overlayBase,
  OverlayDetail,
  OverlayHeading,
  OverlayRail,
  rankLine,
  useBoardFullscreen,
} from "@/features/arcade/shared";
import { Button } from "@/shared/ui";
import {
  GAME_2048_ACTIONS,
  GAME_2048_DEFAULT_BINDINGS,
} from "../model/bindings";
import { GAME_2048_DEFAULT_GAMEPAD_BINDINGS } from "../model/gamepad-bindings";
import type { Game2048Api } from "../model/types";

/**
 * The CLASSIC 2048 play surface — the DPR-crisp square 4×4 canvas (inset tiles + 1px
 * grid), centered alone, + the DOM overlays (menu / won / game-over). Run stats live
 * in the top stats band, not beside the game. Pure presentation: the hook owns all
 * logic and the engine draws the canvas imperatively; this only renders `api`.
 *
 * THEME-NATIVE (like Tetris): NO forced `dark` scope — board, HUD and overlays read
 * the AMBIENT `--m-*` tokens; the canvas palette is resolved from them in the hook.
 */
export function Board2048({
  api,
  canRank = true,
}: {
  api: Game2048Api;
  /** False for a signed-out viewer — runs stay local, so no board/rank talk. */
  canRank?: boolean;
}) {
  const { state, canvasRef, start, continueRun } = api;
  const {
    rootRef: fullscreenRootRef,
    isFullscreen,
    toggle: toggleFullscreen,
  } = useBoardFullscreen();

  const [controlsOpen, setControlsOpen] = useState(false);
  const openControls = () => {
    setControlsOpen(true);
    api.setKeysSuspended(true);
  };
  const closeControls = () => {
    setControlsOpen(false);
    api.setKeysSuspended(false);
  };

  const rankClause = rankLine(state.rank, canRank, "merge higher");
  // Fullscreen toggle lives on the OVERLAY screens only — 2048 has no pause,
  // so that's the pre-game menu (owner call: never over live gameplay).
  const showFullscreenToggle = state.screen === "menu";

  return (
    // BARE play surface (owner call: no `--m-card` band, no inner padding) — the
    // bordered board IS the stage; the overlay scrims carry their own veil.
    <div
      ref={fullscreenRootRef}
      className={`mono-scope relative w-full overflow-hidden ${FULLSCREEN_ROOT}`}
    >
      {/* The board sits ALONE, centered — run stats live in the top stats band
          (owner call: no duplicated HUD beside the game). aspect-[30/18] = the
          snake boards' footprint, so every arcade board renders the same height
          at the same column width. */}
      {/* p-5 pulls the canvas in from the CornerBrackets (the frame reads as a
          stage around it) and centres the height-fit board in the footprint —
          40 read too far (the game shrank noticeably); 20 is the owner pick. */}
      {/* min-h-0 is LOAD-BEARING for the fullscreen round-trip: aspect-ratio
          boxes get a content-based automatic minimum height, so after exiting
          fullscreen the still-large canvas would prop the stage open forever. */}
      <div
        className={`flex aspect-[30/18] min-h-0 w-full items-stretch justify-center p-5 ${FULLSCREEN_STAGE}`}
      >
        {/* The board: JS-sized to an EXACT 4×4 cell multiple (square). `touch-none`
            keeps swipes on the canvas from scrolling the page. */}
        <canvas
          ref={canvasRef}
          aria-label="2048 board. Arrow keys or WASD to slide tiles."
          role="img"
          className="block aspect-square h-full touch-none self-center border-2 border-[var(--m-dim)]"
        />
      </div>

      <CornerBrackets />

      {state.screen === "menu" && (
        <MenuOverlay
          title="2048"
          onStart={start}
          extra={
            <>
              <div className="h-0.5 w-full bg-[var(--m-dim)]" aria-hidden />
              <button
                type="button"
                onClick={openControls}
                className="mono-focus text-[11px] font-medium uppercase leading-none tracking-[0.12em] text-[var(--m-muted2)] transition-colors hover:text-[var(--m-muted)]"
              >
                Controls
              </button>
            </>
          }
        />
      )}

      {state.screen === "won" && (
        <div className={overlayBase}>
          <OverlayRail>
            <OverlayHeading>Merge complete</OverlayHeading>
            <OverlayDetail>Keep going for a higher score</OverlayDetail>
            {/* Secondary left, primary right — the project's button-order rule. */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={start}>
                New game
              </Button>
              <ArcadeButton onClick={continueRun}>Continue</ArcadeButton>
            </div>
          </OverlayRail>
        </div>
      )}

      {state.screen === "over" && (
        <GameOverOverlay
          isNewBest={state.isNewBest}
          score={state.score}
          detail={`${state.moves} moves · ${rankClause}`}
          onRestart={start}
        />
      )}

      {showFullscreenToggle && (
        <BoardFullscreenButton
          isFullscreen={isFullscreen}
          onToggle={toggleFullscreen}
        />
      )}

      <ControlsModal
        isOpen={controlsOpen}
        onOpenChange={closeControls}
        actions={GAME_2048_ACTIONS}
        value={api.bindings}
        defaults={GAME_2048_DEFAULT_BINDINGS}
        onChange={api.setBindings}
        padValue={api.padBindings}
        padDefaults={GAME_2048_DEFAULT_GAMEPAD_BINDINGS}
        onPadChange={api.setPadBindings}
      />
    </div>
  );
}
```

(This drops the dead `KEY_HINTS` constant that lived in this file, unused, before this task.)

- [ ] **Step 2: Typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: 0 errors.

- [ ] **Step 3: Manual verification**

Run: `npm run dev`, open `/arcade/2048`. Confirm: Controls link + divider under Start Game; modal shows 4 rows (Move left/right/up/down); rebind a key and confirm the tile slides using the new key; gamepad D-pad moves tiles once per press (no repeat-on-hold); Reset restores both maps.

- [ ] **Step 4: Commit**

```bash
git branch --show-current
git add src/features/arcade/2048/ui/board-2048.tsx
git commit -m "feat(arcade): wire CONTROLS modal into 2048"
```

---

### Task 6: Stay Awake — bindings + hook

**Files:**

- Create: `src/features/arcade/stay-awake/model/bindings.ts`
- Create: `src/features/arcade/stay-awake/model/bindings.test.ts`
- Create: `src/features/arcade/stay-awake/model/gamepad-bindings.ts`
- Create: `src/features/arcade/stay-awake/model/gamepad-bindings.test.ts`
- Modify: `src/features/arcade/stay-awake/model/types.ts`
- Modify: `src/features/arcade/stay-awake/model/use-stay-awake-game.ts`

**Interfaces:**

- Consumes: same shared infra as Tasks 2/4.
- Produces: `StayAwakeAction`, `STAY_AWAKE_ACTIONS`, `STAY_AWAKE_ACTION_IDS`, `STAY_AWAKE_DEFAULT_BINDINGS`, `STAY_AWAKE_KEYS_STORAGE`, `STAY_AWAKE_DEFAULT_GAMEPAD_BINDINGS`, `STAY_AWAKE_GAMEPAD_STORAGE` — consumed by Task 7.
  `StayAwakeGameApi` gains `bindings`, `setBindings`, `padBindings`, `setPadBindings`, `setKeysSuspended` — consumed by Task 7.

- [ ] **Step 1: Write the failing tests**

Create `src/features/arcade/stay-awake/model/bindings.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { STAY_AWAKE_ACTION_IDS, STAY_AWAKE_DEFAULT_BINDINGS } from "./bindings";

describe("STAY_AWAKE_DEFAULT_BINDINGS", () => {
  it("has exactly one entry per action id — no extras, no gaps", () => {
    expect(Object.keys(STAY_AWAKE_DEFAULT_BINDINGS).sort()).toEqual(
      [...STAY_AWAKE_ACTION_IDS].sort()
    );
  });

  it("every default binding has at least one key", () => {
    for (const id of STAY_AWAKE_ACTION_IDS) {
      expect(STAY_AWAKE_DEFAULT_BINDINGS[id].length).toBeGreaterThan(0);
    }
  });
});
```

Create `src/features/arcade/stay-awake/model/gamepad-bindings.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { STAY_AWAKE_ACTION_IDS } from "./bindings";
import { STAY_AWAKE_DEFAULT_GAMEPAD_BINDINGS } from "./gamepad-bindings";

describe("STAY_AWAKE_DEFAULT_GAMEPAD_BINDINGS", () => {
  it("has exactly one entry per action id — no extras, no gaps", () => {
    expect(Object.keys(STAY_AWAKE_DEFAULT_GAMEPAD_BINDINGS).sort()).toEqual(
      [...STAY_AWAKE_ACTION_IDS].sort()
    );
  });

  it("every default binding has at least one Pad<n> key", () => {
    for (const id of STAY_AWAKE_ACTION_IDS) {
      const codes = STAY_AWAKE_DEFAULT_GAMEPAD_BINDINGS[id];
      expect(codes.length).toBeGreaterThan(0);
      for (const code of codes) expect(code).toMatch(/^Pad\d+$/);
    }
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/features/arcade/stay-awake/model/bindings.test.ts src/features/arcade/stay-awake/model/gamepad-bindings.test.ts`
Expected: FAIL — files don't exist yet.

- [ ] **Step 3: Create the bindings files**

Create `src/features/arcade/stay-awake/model/bindings.ts`:

```ts
import type { BindingMap } from "@/features/arcade/shared";

export type StayAwakeAction = "hopLeft" | "hopRight" | "pause";

/** Ordered action list — the CONTROLS modal rows + the code→action lookup.
 *  `start` is NOT here — it stays hardcoded to Enter/Space, Tetris's precedent. */
export const STAY_AWAKE_ACTIONS: readonly {
  id: StayAwakeAction;
  label: string;
}[] = [
  { id: "hopLeft", label: "Hop left" },
  { id: "hopRight", label: "Hop right" },
  { id: "pause", label: "Pause" },
];

export const STAY_AWAKE_ACTION_IDS = STAY_AWAKE_ACTIONS.map((a) => a.id);

/** Matches the current hardcoded `hopFor()` mapping exactly. */
export const STAY_AWAKE_DEFAULT_BINDINGS: BindingMap<StayAwakeAction> = {
  hopLeft: ["ArrowLeft", "KeyA"],
  hopRight: ["ArrowRight", "KeyD"],
  pause: ["Space"],
};

export const STAY_AWAKE_KEYS_STORAGE = "arcade.stay-awake.keys.v1";
```

Create `src/features/arcade/stay-awake/model/gamepad-bindings.ts`:

```ts
import type { BindingMap } from "@/features/arcade/shared";
import type { StayAwakeAction } from "./bindings";

/** Standard-layout defaults: D-pad left/right to hop, Start for pause. */
export const STAY_AWAKE_DEFAULT_GAMEPAD_BINDINGS: BindingMap<StayAwakeAction> =
  {
    hopLeft: ["Pad14"],
    hopRight: ["Pad15"],
    pause: ["Pad9"],
  };

export const STAY_AWAKE_GAMEPAD_STORAGE = "arcade.stay-awake.pad.v1";
```

- [ ] **Step 4: Run to verify they pass**

Run: `npx vitest run src/features/arcade/stay-awake/model/bindings.test.ts src/features/arcade/stay-awake/model/gamepad-bindings.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Add API members to `types.ts`**

In `src/features/arcade/stay-awake/model/types.ts`, add at the top:

```ts
import type { BindingMap } from "@/features/arcade/shared";
import type { StayAwakeAction } from "./bindings";
```

Replace the `StayAwakeGameApi` interface (currently):

```ts
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
  /** Space and the mobile pause button both call this. */
  togglePause: () => void;
}
```

with:

```ts
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
  /** Space and the mobile pause button both call this. */
  togglePause: () => void;
  /** Live remappable-key map — read by the keyboard handler, edited by CONTROLS. */
  bindings: BindingMap<StayAwakeAction>;
  setBindings: (next: BindingMap<StayAwakeAction>) => void;
  /** Live remappable-gamepad-button map — independent of `bindings`. */
  padBindings: BindingMap<StayAwakeAction>;
  setPadBindings: (next: BindingMap<StayAwakeAction>) => void;
  /** True while a modal (e.g. CONTROLS) owns the keyboard — game keys go inert. */
  setKeysSuspended: (suspended: boolean) => void;
}
```

- [ ] **Step 6: Rewire the hook**

In `src/features/arcade/stay-awake/model/use-stay-awake-game.ts`:

Replace the imports (was lines 1-21):

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
import {
  GUEST_SCOPE,
  loadBindings,
  saveBindings,
  type BindingMap,
  createGamepadPoller,
  GAMEPAD_AXIS_DEADZONE,
  type GamepadPollFrame,
} from "@/features/arcade/shared";
import {
  STAY_AWAKE_ACTION_IDS,
  STAY_AWAKE_DEFAULT_BINDINGS,
  STAY_AWAKE_KEYS_STORAGE,
  type StayAwakeAction,
} from "./bindings";
import {
  STAY_AWAKE_DEFAULT_GAMEPAD_BINDINGS,
  STAY_AWAKE_GAMEPAD_STORAGE,
} from "./gamepad-bindings";
```

Remove the now-unused `hopFor()` function:

```ts
/** Map a key event to a hop, or null. WASD via `e.code` (layout-proof). */
function hopFor(code: string, key: string): HopDir | null {
  if (code === "KeyA" || key === "ArrowLeft") return "left";
  if (code === "KeyD" || key === "ArrowRight") return "right";
  return null;
}
```

Immediately after the `engineRef`/`getEngine` declaration and before the `useState<StayAwakeState>` line, add:

```ts
const pollPadRef = useRef<(() => GamepadPollFrame<StayAwakeAction>) | null>(
  null
);
const getPollPad = () => {
  pollPadRef.current ??= createGamepadPoller(
    STAY_AWAKE_ACTION_IDS,
    () => padBindingsRef.current
  );
  return pollPadRef.current;
};
```

Immediately after the existing `gameOverTimerRef` declaration and before its adjacent `useEffect(() => { screenRef.current = ... })`, add:

```ts
const [bindings, setBindingsState] = useState<BindingMap<StayAwakeAction>>(
  STAY_AWAKE_DEFAULT_BINDINGS
);
const bindingsRef = useRef(bindings);
useEffect(() => {
  bindingsRef.current = bindings;
}, [bindings]);
useEffect(() => {
  const raf = requestAnimationFrame(() =>
    setBindingsState(
      loadBindings(STAY_AWAKE_KEYS_STORAGE, STAY_AWAKE_DEFAULT_BINDINGS)
    )
  );
  return () => cancelAnimationFrame(raf);
}, []);

const [padBindings, setPadBindingsState] = useState<
  BindingMap<StayAwakeAction>
>(STAY_AWAKE_DEFAULT_GAMEPAD_BINDINGS);
const padBindingsRef = useRef(padBindings);
useEffect(() => {
  padBindingsRef.current = padBindings;
}, [padBindings]);
useEffect(() => {
  const raf = requestAnimationFrame(() =>
    setPadBindingsState(
      loadBindings(
        STAY_AWAKE_GAMEPAD_STORAGE,
        STAY_AWAKE_DEFAULT_GAMEPAD_BINDINGS
      )
    )
  );
  return () => cancelAnimationFrame(raf);
}, []);

const setBindings = useCallback((next: BindingMap<StayAwakeAction>) => {
  setBindingsState(next);
  saveBindings(STAY_AWAKE_KEYS_STORAGE, next);
}, []);

const setPadBindings = useCallback((next: BindingMap<StayAwakeAction>) => {
  setPadBindingsState(next);
  saveBindings(STAY_AWAKE_GAMEPAD_STORAGE, next);
}, []);

/** True while the CONTROLS modal owns the keyboard — game keys go inert. */
const keysSuspendedRef = useRef(false);
const setKeysSuspended = useCallback((suspended: boolean) => {
  keysSuspendedRef.current = suspended;
}, []);

const prevPadHeldRef = useRef<Record<StayAwakeAction, boolean>>(
  Object.fromEntries(STAY_AWAKE_ACTION_IDS.map((a) => [a, false])) as Record<
    StayAwakeAction,
    boolean
  >
);
```

Find the tick function's opening:

```ts
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
```

Replace it with:

```ts
    const tick = (now: number) => {
      lastFrame = now;
      const dt = now - last;
      last = now;
      const animate = !prefersReducedMotion();

      if (!keysSuspendedRef.current) {
        const padFrame = getPollPad()();
        const padHeld = padFrame.held;
        const prevPadHeld = prevPadHeldRef.current;
        const combinedHeld: Record<StayAwakeAction, boolean> = {
          ...padHeld,
          hopLeft: padHeld.hopLeft || padFrame.axisX < -GAMEPAD_AXIS_DEADZONE,
          hopRight: padHeld.hopRight || padFrame.axisX > GAMEPAD_AXIS_DEADZONE,
        };
        const padEdge = (a: StayAwakeAction) =>
          combinedHeld[a] && !prevPadHeld[a];

        if (screenRef.current !== "playing") {
          if (padFrame.anyPress) start();
        } else {
          if (padEdge("pause")) togglePause();
          if (padEdge("hopLeft")) hop("left");
          else if (padEdge("hopRight")) hop("right");
        }
        prevPadHeldRef.current = combinedHeld;
      }

      if (
        screenRef.current === "playing" &&
        !pausedRef.current &&
        !endedRef.current
      ) {
```

Now rewrite the keyboard effect. Find:

```ts
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
    if (e.key === " ") {
      togglePause();
      return;
    }
    if (dir) hop(dir);
  };

  window.addEventListener("keydown", onKeyDown);
  return () => window.removeEventListener("keydown", onKeyDown);
}, [start, hop, togglePause]);
```

Replace it with:

```ts
useEffect(() => {
  const isStart = (c: string, k: string) =>
    c === "Enter" || c === "Space" || k === " ";

  const actionOf = (code: string): StayAwakeAction | null => {
    const map = bindingsRef.current;
    for (const a of STAY_AWAKE_ACTION_IDS) {
      if (map[a].includes(code)) return a;
    }
    return null;
  };

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
    if (keysSuspendedRef.current) return; // CONTROLS modal owns the keyboard

    const action = actionOf(e.code);
    if (action || e.key === " ") e.preventDefault();

    const screen = screenRef.current;
    if (screen === "menu" || screen === "over") {
      if (isStart(e.code, e.key)) start();
      return;
    }
    if (action === "pause") {
      togglePause();
      return;
    }
    if (action === "hopLeft") hop("left");
    else if (action === "hopRight") hop("right");
  };

  window.addEventListener("keydown", onKeyDown);
  return () => window.removeEventListener("keydown", onKeyDown);
}, [start, hop, togglePause]);
```

Finally, update the return statement. Find:

```ts
  return {
    state,
    canvasRef,
    leftPanelRef,
    rightPanelRef,
    history,
    start,
    hop,
    togglePause,
  };
}
```

Replace with:

```ts
  return {
    state,
    canvasRef,
    leftPanelRef,
    rightPanelRef,
    history,
    start,
    hop,
    togglePause,
    bindings,
    setBindings,
    padBindings,
    setPadBindings,
    setKeysSuspended,
  };
}
```

- [ ] **Step 7: Typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: 0 errors, EXCEPT the board file (Task 7 fixes it). If `HopDir` is now unused as a value import (only used as a type in `types.ts`), confirm `use-stay-awake-game.ts`'s `import type { ... HopDir ... } from "./types"` is still needed (it IS — `hop(dir: HopDir)`'s call sites `hop("left")`/`hop("right")` don't need the type imported explicitly since they're string literals, but check if `HopDir` is referenced as a type anywhere else in this file; if not, remove it from the import list to avoid an unused-import lint error).

- [ ] **Step 8: Run this task's tests**

Run: `npx vitest run src/features/arcade/stay-awake`
Expected: PASS, existing `engine.test.ts` unaffected, plus the 4 new binding tests.

- [ ] **Step 9: Commit**

```bash
git branch --show-current
git add src/features/arcade/stay-awake/model/bindings.ts src/features/arcade/stay-awake/model/bindings.test.ts src/features/arcade/stay-awake/model/gamepad-bindings.ts src/features/arcade/stay-awake/model/gamepad-bindings.test.ts src/features/arcade/stay-awake/model/types.ts src/features/arcade/stay-awake/model/use-stay-awake-game.ts
git commit -m "feat(arcade): stay awake keyboard+gamepad rebinding (data + hook)"
```

---

### Task 7: Stay Awake — board wiring

**Files:**

- Modify: `src/features/arcade/stay-awake/ui/stay-awake-board.tsx` (imports + the `MenuOverlay` JSX only)

**Interfaces:**

- Consumes: `StayAwakeGameApi.bindings/setBindings/padBindings/setPadBindings/setKeysSuspended` (Task 6), `STAY_AWAKE_ACTIONS`/`STAY_AWAKE_DEFAULT_BINDINGS` (Task 6), `STAY_AWAKE_DEFAULT_GAMEPAD_BINDINGS` (Task 6), `ControlsModal`.
- Produces: nothing further downstream.

- [ ] **Step 1: Update imports**

In `src/features/arcade/stay-awake/ui/stay-awake-board.tsx`, replace the import block:

```tsx
"use client";

import type { PointerEvent } from "react";
import {
  BoardFullscreenButton,
  CornerBrackets,
  FULLSCREEN_PANEL,
  FULLSCREEN_ROOT,
  FULLSCREEN_STAGE,
  GameOverOverlay,
  MenuOverlay,
  PanelLabel,
  PanelReadout,
  PauseOverlay,
  rankLine,
  useBoardFullscreen,
} from "@/features/arcade/shared";
import { RUSH_EVERY, WAVE_MAX_GAP } from "../model/engine";
import type { StayAwakeGameApi, StayAwakeState } from "../model/types";
```

with:

```tsx
"use client";

import { useState, type PointerEvent } from "react";
import {
  BoardFullscreenButton,
  ControlsModal,
  CornerBrackets,
  FULLSCREEN_PANEL,
  FULLSCREEN_ROOT,
  FULLSCREEN_STAGE,
  GameOverOverlay,
  MenuOverlay,
  PanelLabel,
  PanelReadout,
  PauseOverlay,
  rankLine,
  useBoardFullscreen,
} from "@/features/arcade/shared";
import { RUSH_EVERY, WAVE_MAX_GAP } from "../model/engine";
import {
  STAY_AWAKE_ACTIONS,
  STAY_AWAKE_DEFAULT_BINDINGS,
} from "../model/bindings";
import { STAY_AWAKE_DEFAULT_GAMEPAD_BINDINGS } from "../model/gamepad-bindings";
import type { StayAwakeGameApi, StayAwakeState } from "../model/types";
```

- [ ] **Step 2: Add the Controls-open state + handlers**

Inside `StayAwakeBoard`, find:

```ts
const { state, canvasRef, leftPanelRef, rightPanelRef, start, hop } = api;
const {
  rootRef: fullscreenRootRef,
  isFullscreen,
  toggle: toggleFullscreen,
} = useBoardFullscreen();
```

Replace with:

```ts
const { state, canvasRef, leftPanelRef, rightPanelRef, start, hop } = api;
const {
  rootRef: fullscreenRootRef,
  isFullscreen,
  toggle: toggleFullscreen,
} = useBoardFullscreen();

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

- [ ] **Step 3: Add the Controls link + modal**

Find the menu overlay JSX:

```tsx
{
  state.screen === "menu" && <MenuOverlay title="Stay Awake" onStart={start} />;
}
```

Replace with:

```tsx
{
  state.screen === "menu" && (
    <MenuOverlay
      title="Stay Awake"
      onStart={start}
      extra={
        <>
          <div className="h-0.5 w-full bg-[var(--m-dim)]" aria-hidden />
          <button
            type="button"
            onClick={openControls}
            className="mono-focus text-[11px] font-medium uppercase leading-none tracking-[0.12em] text-[var(--m-muted2)] transition-colors hover:text-[var(--m-muted)]"
          >
            Controls
          </button>
        </>
      }
    />
  );
}
```

Find the closing `</div>` of the component's outer root (the very last one, right before the final `);`):

```tsx
      {showFullscreenToggle && (
        <BoardFullscreenButton
          isFullscreen={isFullscreen}
          onToggle={toggleFullscreen}
        />
      )}
    </div>
  );
}
```

Replace with:

```tsx
      {showFullscreenToggle && (
        <BoardFullscreenButton
          isFullscreen={isFullscreen}
          onToggle={toggleFullscreen}
        />
      )}

      <ControlsModal
        isOpen={controlsOpen}
        onOpenChange={closeControls}
        actions={STAY_AWAKE_ACTIONS}
        value={api.bindings}
        defaults={STAY_AWAKE_DEFAULT_BINDINGS}
        onChange={api.setBindings}
        padValue={api.padBindings}
        padDefaults={STAY_AWAKE_DEFAULT_GAMEPAD_BINDINGS}
        onPadChange={api.setPadBindings}
      />
    </div>
  );
}
```

- [ ] **Step 4: Typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: 0 errors.

- [ ] **Step 5: Manual verification**

Run: `npm run dev`, open `/arcade/stay-awake`. Confirm: Controls link + divider under Start Game; modal shows 3 rows (Hop left/right, Pause); rebinding works; gamepad D-pad hops once per press; Reset restores both maps.

- [ ] **Step 6: Commit**

```bash
git branch --show-current
git add src/features/arcade/stay-awake/ui/stay-awake-board.tsx
git commit -m "feat(arcade): wire CONTROLS modal into Stay Awake"
```

---

### Task 8: Snake (Follow the Rabbit) — bindings + hook

**Files:**

- Create: `src/features/arcade/snake/model/bindings.ts`
- Create: `src/features/arcade/snake/model/bindings.test.ts`
- Create: `src/features/arcade/snake/model/gamepad-bindings.ts`
- Create: `src/features/arcade/snake/model/gamepad-bindings.test.ts`
- Modify: `src/features/arcade/snake/model/types.ts`
- Modify: `src/features/arcade/snake/model/use-snake-game.ts`

**Interfaces:**

- Consumes: same shared infra as Tasks 2/4/6.
- Produces: `SnakeAction`, `SNAKE_ACTIONS`, `SNAKE_ACTION_IDS`, `SNAKE_DEFAULT_BINDINGS`, `SNAKE_KEYS_STORAGE`, `SNAKE_DEFAULT_GAMEPAD_BINDINGS`, `SNAKE_GAMEPAD_STORAGE` — consumed by Task 9.
  `SnakeGameApi` gains `bindings`, `setBindings`, `padBindings`, `setPadBindings`, `setKeysSuspended` — consumed by Task 9.

This game's hook is structurally identical to Snake Classic's (Task 2) — same `steer(x, y)` dispatch model, same `wrapWalls` option (irrelevant to bindings), same action shape. The ONLY differences from Task 2: identifier prefix (`Snake` not `SnakeClassic`), storage keys (`arcade.snake.*` not `arcade.snake-classic.*`), and this file additionally has a `speed`/`wrapWalls`-driven `useEffect` (untouched by this task) between the engine setup and the history hydration.

- [ ] **Step 1: Write the failing tests**

Create `src/features/arcade/snake/model/bindings.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { SNAKE_ACTION_IDS, SNAKE_DEFAULT_BINDINGS } from "./bindings";

describe("SNAKE_DEFAULT_BINDINGS", () => {
  it("has exactly one entry per action id — no extras, no gaps", () => {
    expect(Object.keys(SNAKE_DEFAULT_BINDINGS).sort()).toEqual(
      [...SNAKE_ACTION_IDS].sort()
    );
  });

  it("every default binding has at least one key", () => {
    for (const id of SNAKE_ACTION_IDS) {
      expect(SNAKE_DEFAULT_BINDINGS[id].length).toBeGreaterThan(0);
    }
  });
});
```

Create `src/features/arcade/snake/model/gamepad-bindings.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { SNAKE_ACTION_IDS } from "./bindings";
import { SNAKE_DEFAULT_GAMEPAD_BINDINGS } from "./gamepad-bindings";

describe("SNAKE_DEFAULT_GAMEPAD_BINDINGS", () => {
  it("has exactly one entry per action id — no extras, no gaps", () => {
    expect(Object.keys(SNAKE_DEFAULT_GAMEPAD_BINDINGS).sort()).toEqual(
      [...SNAKE_ACTION_IDS].sort()
    );
  });

  it("every default binding has at least one Pad<n> key", () => {
    for (const id of SNAKE_ACTION_IDS) {
      const codes = SNAKE_DEFAULT_GAMEPAD_BINDINGS[id];
      expect(codes.length).toBeGreaterThan(0);
      for (const code of codes) expect(code).toMatch(/^Pad\d+$/);
    }
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/features/arcade/snake/model/bindings.test.ts src/features/arcade/snake/model/gamepad-bindings.test.ts`
Expected: FAIL — files don't exist yet.

- [ ] **Step 3: Create the bindings files**

Create `src/features/arcade/snake/model/bindings.ts`:

```ts
import type { BindingMap } from "@/features/arcade/shared";

export type SnakeAction =
  | "moveUp"
  | "moveDown"
  | "moveLeft"
  | "moveRight"
  | "pause";

/** Ordered action list — the CONTROLS modal rows + the code→action lookup. */
export const SNAKE_ACTIONS: readonly { id: SnakeAction; label: string }[] = [
  { id: "moveUp", label: "Move up" },
  { id: "moveDown", label: "Move down" },
  { id: "moveLeft", label: "Move left" },
  { id: "moveRight", label: "Move right" },
  { id: "pause", label: "Pause" },
];

export const SNAKE_ACTION_IDS = SNAKE_ACTIONS.map((a) => a.id);

/** Matches the current hardcoded keys exactly — `start` is NOT here, it stays
 *  hardcoded to Enter/Space. */
export const SNAKE_DEFAULT_BINDINGS: BindingMap<SnakeAction> = {
  moveUp: ["ArrowUp", "KeyW"],
  moveDown: ["ArrowDown", "KeyS"],
  moveLeft: ["ArrowLeft", "KeyA"],
  moveRight: ["ArrowRight", "KeyD"],
  pause: ["Space"],
};

export const SNAKE_KEYS_STORAGE = "arcade.snake.keys.v1";
```

Create `src/features/arcade/snake/model/gamepad-bindings.ts`:

```ts
import type { BindingMap } from "@/features/arcade/shared";
import type { SnakeAction } from "./bindings";

export const SNAKE_DEFAULT_GAMEPAD_BINDINGS: BindingMap<SnakeAction> = {
  moveUp: ["Pad12"],
  moveDown: ["Pad13"],
  moveLeft: ["Pad14"],
  moveRight: ["Pad15"],
  pause: ["Pad9"],
};

export const SNAKE_GAMEPAD_STORAGE = "arcade.snake.pad.v1";
```

- [ ] **Step 4: Run to verify they pass**

Run: `npx vitest run src/features/arcade/snake/model/bindings.test.ts src/features/arcade/snake/model/gamepad-bindings.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Add API members to `types.ts`**

In `src/features/arcade/snake/model/types.ts`, add at the top:

```ts
import type { BindingMap } from "@/features/arcade/shared";
import type { SnakeAction } from "./bindings";
```

Replace the `SnakeGameApi` interface (currently):

```ts
export interface SnakeGameApi {
  state: SnakeGameState;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  history: HistoryPoint[];
  start: () => void;
  togglePause: () => void;
  /** Steer; ignored if it would reverse into the neck. */
  steer: (x: number, y: number) => void;
}
```

with:

```ts
export interface SnakeGameApi {
  state: SnakeGameState;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  history: HistoryPoint[];
  start: () => void;
  togglePause: () => void;
  /** Steer; ignored if it would reverse into the neck. */
  steer: (x: number, y: number) => void;
  /** Live remappable-key map — read by the keyboard handler, edited by CONTROLS. */
  bindings: BindingMap<SnakeAction>;
  setBindings: (next: BindingMap<SnakeAction>) => void;
  /** Live remappable-gamepad-button map — independent of `bindings`. */
  padBindings: BindingMap<SnakeAction>;
  setPadBindings: (next: BindingMap<SnakeAction>) => void;
  /** True while a modal (e.g. CONTROLS) owns the keyboard — game keys go inert. */
  setKeysSuspended: (suspended: boolean) => void;
}
```

- [ ] **Step 6: Rewire the hook**

In `src/features/arcade/snake/model/use-snake-game.ts`:

Replace the import block (was lines 1-19):

```ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/shared/lib/prefers-reduced-motion";
import {
  GRID_H,
  GRID_W,
  lerpHex,
  SnakeEngine,
  type SnakePalette,
} from "./engine";
import {
  GUEST_SCOPE,
  loadBindings,
  saveBindings,
  type BindingMap,
  createGamepadPoller,
  GAMEPAD_AXIS_DEADZONE,
  type GamepadPollFrame,
} from "@/features/arcade/shared";
import {
  SNAKE_ACTION_IDS,
  SNAKE_DEFAULT_BINDINGS,
  SNAKE_KEYS_STORAGE,
  type SnakeAction,
} from "./bindings";
import {
  SNAKE_DEFAULT_GAMEPAD_BINDINGS,
  SNAKE_GAMEPAD_STORAGE,
} from "./gamepad-bindings";
import { loadHistory, recentSeries, recordScore } from "./score-history";
import type {
  HistoryPoint,
  SnakeGameApi,
  SnakeGameState,
  UseSnakeGameOptions,
} from "./types";
```

Immediately after the `engineRef`/`getEngine` declaration and before the `useState<SnakeGameState>` line, add:

```ts
const pollPadRef = useRef<(() => GamepadPollFrame<SnakeAction>) | null>(null);
const getPollPad = () => {
  pollPadRef.current ??= createGamepadPoller(
    SNAKE_ACTION_IDS,
    () => padBindingsRef.current
  );
  return pollPadRef.current;
};
```

Immediately after the existing `historyRef` declaration (`const historyRef = useRef<number[]>([]);`) and before its adjacent `useEffect(() => { screenRef.current = ... })`, add:

```ts
const [bindings, setBindingsState] = useState<BindingMap<SnakeAction>>(
  SNAKE_DEFAULT_BINDINGS
);
const bindingsRef = useRef(bindings);
useEffect(() => {
  bindingsRef.current = bindings;
}, [bindings]);
useEffect(() => {
  const raf = requestAnimationFrame(() =>
    setBindingsState(loadBindings(SNAKE_KEYS_STORAGE, SNAKE_DEFAULT_BINDINGS))
  );
  return () => cancelAnimationFrame(raf);
}, []);

const [padBindings, setPadBindingsState] = useState<BindingMap<SnakeAction>>(
  SNAKE_DEFAULT_GAMEPAD_BINDINGS
);
const padBindingsRef = useRef(padBindings);
useEffect(() => {
  padBindingsRef.current = padBindings;
}, [padBindings]);
useEffect(() => {
  const raf = requestAnimationFrame(() =>
    setPadBindingsState(
      loadBindings(SNAKE_GAMEPAD_STORAGE, SNAKE_DEFAULT_GAMEPAD_BINDINGS)
    )
  );
  return () => cancelAnimationFrame(raf);
}, []);

const setBindings = useCallback((next: BindingMap<SnakeAction>) => {
  setBindingsState(next);
  saveBindings(SNAKE_KEYS_STORAGE, next);
}, []);

const setPadBindings = useCallback((next: BindingMap<SnakeAction>) => {
  setPadBindingsState(next);
  saveBindings(SNAKE_GAMEPAD_STORAGE, next);
}, []);

/** True while the CONTROLS modal owns the keyboard — game keys go inert. */
const keysSuspendedRef = useRef(false);
const setKeysSuspended = useCallback((suspended: boolean) => {
  keysSuspendedRef.current = suspended;
}, []);

const prevPadHeldRef = useRef<Record<SnakeAction, boolean>>(
  Object.fromEntries(SNAKE_ACTION_IDS.map((a) => [a, false])) as Record<
    SnakeAction,
    boolean
  >
);
```

Find the tick function's opening (note this file's tick signature differs slightly from Snake Classic's — it recomputes `resize()` inline via a clientWidth/clientHeight check, keep that untouched):

```ts
    const tick = (now: number) => {
      lastFrame = now;
      if (
        Math.abs(canvas.clientWidth - cssW) > 1 ||
        Math.abs(canvas.clientHeight - cssH) > 1
      ) {
        resize();
      }
      const animate = !prefersReducedMotion();
      const screen = screenRef.current;

      if (screen === "playing" && !pausedRef.current) {
```

Replace it with:

```ts
    const tick = (now: number) => {
      lastFrame = now;
      if (
        Math.abs(canvas.clientWidth - cssW) > 1 ||
        Math.abs(canvas.clientHeight - cssH) > 1
      ) {
        resize();
      }
      const animate = !prefersReducedMotion();
      const screen = screenRef.current;

      if (!keysSuspendedRef.current) {
        const padFrame = getPollPad()();
        const padHeld = padFrame.held;
        const prevPadHeld = prevPadHeldRef.current;
        const combinedHeld: Record<SnakeAction, boolean> = {
          ...padHeld,
          moveLeft:
            padHeld.moveLeft || padFrame.axisX < -GAMEPAD_AXIS_DEADZONE,
          moveRight:
            padHeld.moveRight || padFrame.axisX > GAMEPAD_AXIS_DEADZONE,
          moveUp: padHeld.moveUp || padFrame.axisY < -GAMEPAD_AXIS_DEADZONE,
          moveDown: padHeld.moveDown || padFrame.axisY > GAMEPAD_AXIS_DEADZONE,
        };
        const padEdge = (a: SnakeAction) => combinedHeld[a] && !prevPadHeld[a];

        if (screen !== "playing") {
          if (padFrame.anyPress) start();
        } else {
          if (padEdge("pause")) togglePause();
          if (padEdge("moveUp")) steer(0, -1);
          else if (padEdge("moveDown")) steer(0, 1);
          else if (padEdge("moveLeft")) steer(-1, 0);
          else if (padEdge("moveRight")) steer(1, 0);
        }
        prevPadHeldRef.current = combinedHeld;
      }

      if (screen === "playing" && !pausedRef.current) {
```

Now rewrite the keyboard effect. Find:

```ts
useEffect(() => {
  const onKey = (e: KeyboardEvent) => {
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

    const k = e.key;
    // WASD matched on `e.code` (the PHYSICAL key), not `e.key`: on a non-Latin
    // layout `e.key` yields "ц/ф/ы/в", so a key-based check silently fails.
    // `e.code` is layout-independent. Arrows stay on `e.key` (already layout-independent).
    const c = e.code;
    const isArrow =
      k === "ArrowUp" ||
      k === "ArrowDown" ||
      k === "ArrowLeft" ||
      k === "ArrowRight";
    if (isArrow || k === " ") e.preventDefault();

    if (screenRef.current !== "playing") {
      if (k === "Enter" || k === " ") start();
      return;
    }
    if (k === " ") {
      togglePause();
      return;
    }
    if (k === "ArrowUp" || c === "KeyW") steer(0, -1);
    else if (k === "ArrowDown" || c === "KeyS") steer(0, 1);
    else if (k === "ArrowLeft" || c === "KeyA") steer(-1, 0);
    else if (k === "ArrowRight" || c === "KeyD") steer(1, 0);
  };
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}, [start, togglePause, steer]);
```

Replace it with:

```ts
useEffect(() => {
  const actionOf = (code: string): SnakeAction | null => {
    const map = bindingsRef.current;
    for (const a of SNAKE_ACTION_IDS) {
      if (map[a].includes(code)) return a;
    }
    return null;
  };

  const onKey = (e: KeyboardEvent) => {
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
    if (keysSuspendedRef.current) return; // CONTROLS modal owns the keyboard

    const c = e.code;
    const action = actionOf(c);
    if (action || c === "Space") e.preventDefault();

    if (screenRef.current !== "playing") {
      if (c === "Enter" || c === "Space") start();
      return;
    }
    if (action === "pause") {
      togglePause();
      return;
    }
    switch (action) {
      case "moveUp":
        steer(0, -1);
        break;
      case "moveDown":
        steer(0, 1);
        break;
      case "moveLeft":
        steer(-1, 0);
        break;
      case "moveRight":
        steer(1, 0);
        break;
    }
  };
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}, [start, togglePause, steer]);
```

Finally, update the return statement. Find:

```ts
  return {
    state,
    canvasRef,
    history,
    start,
    togglePause,
    steer,
  };
}
```

Replace with:

```ts
  return {
    state,
    canvasRef,
    history,
    start,
    togglePause,
    steer,
    bindings,
    setBindings,
    padBindings,
    setPadBindings,
    setKeysSuspended,
  };
}
```

- [ ] **Step 7: Typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: 0 errors, EXCEPT the board file (Task 9 fixes it).

- [ ] **Step 8: Run this task's tests**

Run: `npx vitest run src/features/arcade/snake`
Expected: PASS, no regressions, plus the 4 new binding tests.

- [ ] **Step 9: Commit**

```bash
git branch --show-current
git add src/features/arcade/snake/model/bindings.ts src/features/arcade/snake/model/bindings.test.ts src/features/arcade/snake/model/gamepad-bindings.ts src/features/arcade/snake/model/gamepad-bindings.test.ts src/features/arcade/snake/model/types.ts src/features/arcade/snake/model/use-snake-game.ts
git commit -m "feat(arcade): snake (rabbit) keyboard+gamepad rebinding (data + hook)"
```

---

### Task 9: Snake (Follow the Rabbit) — board wiring

**Files:**

- Modify: `src/features/arcade/snake/ui/snake-board.tsx` (full file)

**Interfaces:**

- Consumes: `SnakeGameApi.bindings/setBindings/padBindings/setPadBindings/setKeysSuspended` (Task 8), `SNAKE_ACTIONS`/`SNAKE_DEFAULT_BINDINGS` (Task 8), `SNAKE_DEFAULT_GAMEPAD_BINDINGS` (Task 8), `ControlsModal`.
- Produces: nothing further downstream.

Note: this file was already edited earlier this session (removed an `isDarkTheme`-conditional menu title; it's now the plain string `"Follow the Rabbit"`) — the version below reflects that current state.

- [ ] **Step 1: Replace the board file**

Replace the full contents of `src/features/arcade/snake/ui/snake-board.tsx`:

```tsx
"use client";

import { useState } from "react";
import {
  BoardFullscreenButton,
  ControlsModal,
  CornerBrackets,
  FULLSCREEN_ROOT,
  GameOverOverlay,
  MenuOverlay,
  PauseOverlay,
  rankLine,
  useBoardFullscreen,
} from "@/features/arcade/shared";
import { prefersReducedMotion } from "@/shared/lib/prefers-reduced-motion";
import { SNAKE_ACTIONS, SNAKE_DEFAULT_BINDINGS } from "../model/bindings";
import { SNAKE_DEFAULT_GAMEPAD_BINDINGS } from "../model/gamepad-bindings";
import type { SnakeGameApi } from "../model/types";
import { Confetti } from "./confetti";

/** The canvas play-field + its overlays (menu / pause / game-over). Pure
 *  presentation — the hook owns all logic; the board only renders `api`.
 *
 *  THEME-NATIVE (the classic-Snake/Tetris pattern): NO forced `dark` scope — the
 *  board and overlays read the AMBIENT `--m-*` tokens, and the canvas palette is
 *  resolved from those same tokens in the hook. */
export function SnakeBoard({
  api,
  canRank = true,
}: {
  api: SnakeGameApi;
  /** False for a signed-out viewer — runs stay local, so no board/rank talk. */
  canRank?: boolean;
}) {
  const { state, canvasRef, start } = api;
  const {
    rootRef: fullscreenRootRef,
    isFullscreen,
    toggle: toggleFullscreen,
  } = useBoardFullscreen();
  const reduce = prefersReducedMotion();
  // Fullscreen toggle lives on the OVERLAY screens only (menu / pause — owner
  // call): never a floating control over live gameplay.
  const showFullscreenToggle =
    state.screen === "menu" || (state.screen === "playing" && state.paused);

  const [controlsOpen, setControlsOpen] = useState(false);
  const openControls = () => {
    setControlsOpen(true);
    api.setKeysSuspended(true);
  };
  const closeControls = () => {
    setControlsOpen(false);
    api.setKeysSuspended(false);
  };

  const rankClause = rankLine(state.rank, canRank, "eat more, grow longer");

  return (
    <div
      ref={fullscreenRootRef}
      className={`mono-scope relative flex aspect-[30/18] w-full items-center justify-center overflow-hidden bg-[var(--m-bg)] p-5 ${FULLSCREEN_ROOT}`}
    >
      <canvas
        ref={canvasRef}
        aria-label="Follow the Rabbit game board. Use the arrow keys to steer, Space to pause."
        role="img"
        className="block border-2 border-[var(--m-error)] [image-rendering:pixelated]"
      />

      <CornerBrackets />

      {state.screen === "menu" && (
        <MenuOverlay
          title="Follow the Rabbit"
          onStart={start}
          extra={
            <>
              <div className="h-0.5 w-full bg-[var(--m-dim)]" aria-hidden />
              <button
                type="button"
                onClick={openControls}
                className="mono-focus text-[11px] font-medium uppercase leading-none tracking-[0.12em] text-[var(--m-muted2)] transition-colors hover:text-[var(--m-muted)]"
              >
                Controls
              </button>
            </>
          }
        />
      )}

      {state.screen === "playing" && state.paused && (
        <PauseOverlay hint="Space to resume" />
      )}

      {state.screen === "over" && state.isNewBest && !reduce && <Confetti />}

      {state.screen === "over" && (
        <GameOverOverlay
          isNewBest={state.isNewBest}
          score={state.score}
          detail={rankClause}
          onRestart={start}
        />
      )}

      {showFullscreenToggle && (
        <BoardFullscreenButton
          isFullscreen={isFullscreen}
          onToggle={toggleFullscreen}
        />
      )}

      <ControlsModal
        isOpen={controlsOpen}
        onOpenChange={closeControls}
        actions={SNAKE_ACTIONS}
        value={api.bindings}
        defaults={SNAKE_DEFAULT_BINDINGS}
        onChange={api.setBindings}
        padValue={api.padBindings}
        padDefaults={SNAKE_DEFAULT_GAMEPAD_BINDINGS}
        onPadChange={api.setPadBindings}
      />
    </div>
  );
}
```

**IMPORTANT — verify before replacing:** this task's Step 1 reconstructs the file from the last full read this session plus the two additions (Controls link/modal). Before overwriting, Read the CURRENT file first and diff it mentally against the block above — if anything else changed in it since (canvas `aria-label`/`className`, the exact `border-2 border-[var(--m-error)]` class, `Confetti` placement), preserve THOSE exact current values and only add the `useState`/`ControlsModal`/`Controls`-link/import pieces shown above, rather than blindly overwriting with this reconstruction.

- [ ] **Step 2: Typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: 0 errors.

- [ ] **Step 3: Manual verification**

Run: `npm run dev`, open `/arcade/follow-the-rabbit`. Confirm: Controls link + divider under Start Game; modal shows 5 rows; rebinding works; gamepad D-pad steers once per press; Reset restores both maps.

- [ ] **Step 4: Commit**

```bash
git branch --show-current
git add src/features/arcade/snake/ui/snake-board.tsx
git commit -m "feat(arcade): wire CONTROLS modal into Follow the Rabbit"
```

---

## Final Verification (after all 9 tasks)

- [ ] Run: `npm run typecheck && npm run lint && npx vitest run` — project-wide, 0 typecheck/lint errors, only the 2 pre-existing unrelated `submit-button.test.tsx` failures.
- [ ] Smoke-check all 5 game routes return 200 on a dev server: `/arcade/tetris`, `/arcade/snake`, `/arcade/2048`, `/arcade/stay-awake`, `/arcade/follow-the-rabbit`.
- [ ] Dispatch the final whole-branch code review (per `subagent-driven-development`) covering the full range from before Task 1 to the last commit.
- [ ] Manual owner playtest still owed (no agent has gamepad/browser hardware): for EACH of the 5 games — open Controls, rebind a few keyboard AND gamepad actions, confirm Reset restores both maps, confirm the analog stick still drives movement regardless of button rebinds, confirm Escape cancels an in-progress gamepad capture, confirm the "Controls" link + divider look identical across all 5 menus.

## Plan Self-Review Notes

- **Spec coverage:** Task 1 covers the spec's "Prerequisite: generalize `createGamepadPoller`" section in full, including the Tetris regression requirement. Tasks 2-9 cover the spec's "Per-game work" section for all 4 games in the spec's decided order (Snake Classic → 2048 → Stay Awake → Snake/Rabbit). The spec's `start`/`continueRun`-stays-hardcoded decision (discovered by cross-referencing Tetris's own precedent during planning) is applied uniformly across all 4 games. Testing section: `gamepad.test.ts` genericism test (Task 1, Step 1's last test case) and per-game `bindings.ts`/`gamepad-bindings.ts` round-trip tests (Tasks 2/4/6/8) are both covered.
- **Type consistency:** `GamepadPollFrame<A>`/`createGamepadPoller<A>` (Task 1) is the exact signature every later task's `getPollPad` calls. Each game's `<Prefix>_ACTION_IDS`/`<Prefix>Action`/`<Prefix>_DEFAULT_BINDINGS`/`<Prefix>_KEYS_STORAGE`/`<Prefix>_DEFAULT_GAMEPAD_BINDINGS`/`<Prefix>_GAMEPAD_STORAGE` naming is consistent within its own pair of tasks (data+hook, then board).
- **No placeholders:** every step has literal, complete code; no "similar to Task N" — even though Tasks 2/4/6/8 share one mechanical shape, each was written out in full because the underlying hooks differ enough (one-shot `inputRef` vs. direct `steer()` calls, differing action counts, 2048's extra `won`/`continueRun` screen) that a reader must not have to reconstruct any of it from a neighboring task.
- **Scope check:** 9 tasks + a final-verification task is large for one plan, but every task's shape was already proven once (Tetris, shipped) and the remaining risk is almost entirely mechanical transcription — the spec's own reasoning for keeping this as ONE plan with sequential waves rather than 4 separate plans.
