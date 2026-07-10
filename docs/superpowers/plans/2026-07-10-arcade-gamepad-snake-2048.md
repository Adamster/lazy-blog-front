# Gamepad-only controls for Snake + 2048 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add gamepad play + a gamepad-only CONTROLS modal (rebindable, no
keyboard rebinding) to Snake (`src/features/arcade/snake-classic/`) and 2048
(`src/features/arcade/2048/`), building on Tetris's existing gamepad
infrastructure — generalized first since it's currently Tetris-specific.

**Architecture:** `src/features/arcade/shared/model/gamepad.ts` becomes
generic over any action-id union (`createGamepadPoller<A>`) and stops owning
edge-detection/axis-fallback — those move to each consuming hook. Tetris's
hook is refactored onto the new API with byte-for-byte identical resulting
behavior (regression-sensitive — its own task, reviewed carefully).
`ControlsModal` gains an optional gamepad-only rendering mode. Snake and
2048 each get a new `gamepad-bindings.ts` (defaults + storage key + action
list), a hook-level poller wired into their existing rAF loop, and a
CONTROLS modal instance in their board UI. No engine or keyboard-behavior
changes in either game.

**Tech Stack:** Next.js 16 (webpack), React 19, TypeScript, Vitest, Gamepad
API, Canvas 2D.

## Global Constraints

- `npm run typecheck` and `npm run lint` must stay at 0 errors after every
  task (per project CLAUDE.md).
- No code comments explaining WHAT code does — only WHY, when non-obvious
  (per project CLAUDE.md).
- Keyboard behavior in Snake and 2048 stays completely untouched — no
  keyboard rebinding is added in this plan (explicit owner call).
- Stay Awake is out of scope.
- `.mono-focus`/existing design-system primitives are reused as-is — this
  plan adds no new visual treatment, only wires existing `ControlsModal`/
  `MenuOverlay` `extra` slot into two more games.
- No agent in this plan has gamepad hardware — every task's manual
  verification step is flagged to the human owner, not run by the
  implementer.

---

## Task 1: Generalize `createGamepadPoller`

**Files:**

- Modify: `src/features/arcade/shared/model/gamepad.ts`
- Modify: `src/features/arcade/shared/model/gamepad.test.ts`
- Modify: `src/features/arcade/shared/index.ts`

**Interfaces:**

- Consumes: nothing from other tasks.
- Produces: `createGamepadPoller<A extends string>(actionIds: readonly A[], getBindings: () => BindingMap<A>): () => Partial<Record<A, boolean>> & { anyPress: boolean }`, `readGamepadAxes(): { x: number; y: number }`, `GAMEPAD_DEADZONE: number` — all consumed by Task 2 (Tetris refactor), Task 4 (Snake), Task 5 (2048).

- [ ] **Step 1: Replace `gamepad.ts` with the generic version**

  Replace the entire contents of `src/features/arcade/shared/model/gamepad.ts` with:

  ```ts
  /**
   * Gamepad input for the arcade — polled from a game's EXISTING rAF loop (no loop of
   * its own; the Gamepad API is poll-only). Button→action assignment is REMAPPABLE:
   * the caller supplies a live `BindingMap` (per-game `gamepad-bindings.ts`, edited via
   * the CONTROLS modal) and this module just resolves it each poll — it owns no
   * defaults itself. Standard-layout button INDICES are encoded as `"Pad<n>"` strings,
   * the same generic code format `key-bindings.ts` uses for keyboard codes.
   *
   * This module reports RAW HELD state only — for any action id in the caller's own
   * set, "is its bound button down right now." It does not compute press-edges and
   * does not read the analog stick/D-pad axes: both are the CALLER's responsibility,
   * since a generic action set can't assume which (if any) of its actions represent
   * directional movement, and different games want different held-vs-edge semantics
   * for the same shape of action (Tetris holds `moveLeft`/`moveRight` for DAS; Snake/
   * 2048 want a single edge per press). Use {@link readGamepadAxes} for the stick/
   * D-pad reading and {@link GAMEPAD_DEADZONE} for the threshold.
   */

  import type { BindingMap } from "./key-bindings";

  /** Deadzone for the left stick / D-pad axes (`readGamepadAxes`) — every game in
   *  this arcade uses ±0.5. */
  export const GAMEPAD_DEADZONE = 0.5;

  function firstConnectedPad(): Gamepad | null {
    const pads =
      typeof navigator !== "undefined" && navigator.getGamepads
        ? navigator.getGamepads()
        : [];
    return (
      Array.from(pads ?? []).find((p): p is Gamepad => !!p && p.connected) ??
      null
    );
  }

  /** Raw left-stick / D-pad-axis reading (axes 0/1), unresolved against any
   *  deadzone or action — `{ x: 0, y: 0 }` when no pad is connected. */
  export function readGamepadAxes(): { x: number; y: number } {
    const gp = firstConnectedPad();
    return { x: gp?.axes[0] ?? 0, y: gp?.axes[1] ?? 0 };
  }

  /** `"Pad12"` → `12`; anything malformed resolves to -1 (never matches a real button). */
  function padButtonIndex(code: string): number {
    if (!code.startsWith("Pad")) return -1;
    const n = Number(code.slice(3));
    return Number.isInteger(n) ? n : -1;
  }

  /**
   * Build a poller reporting, for each of `actionIds`, whether ANY of its bound
   * `"Pad<n>"` codes is currently held down — plus `anyPress` (any button on the pad
   * pressed at all, regardless of bindings). Returns `{ anyPress: false }` (no action
   * fields set) when no gamepad is connected. Callers own edge-detection (diff
   * against their own previous frame) and axis fallback (via {@link readGamepadAxes}).
   */
  export function createGamepadPoller<A extends string>(
    actionIds: readonly A[],
    getBindings: () => BindingMap<A>
  ): () => Partial<Record<A, boolean>> & { anyPress: boolean } {
    return () => {
      const gp = firstConnectedPad();
      const frame = { anyPress: false } as Partial<Record<A, boolean>> & {
        anyPress: boolean;
      };
      if (!gp) return frame;
      const btn = (i: number) => !!gp.buttons[i]?.pressed;
      const bindings = getBindings();
      for (const id of actionIds) {
        frame[id] = bindings[id].some((code) => btn(padButtonIndex(code)));
      }
      frame.anyPress = gp.buttons.some((b) => b.pressed);
      return frame;
    };
  }
  ```

- [ ] **Step 2: Update the shared barrel**

  In `src/features/arcade/shared/index.ts`, find (currently lines 49-50):

  ```ts
  export { createGamepadPoller } from "./model/gamepad";
  export type { PadFrame } from "./model/gamepad";
  ```

  Replace with:

  ```ts
  export {
    createGamepadPoller,
    readGamepadAxes,
    GAMEPAD_DEADZONE,
  } from "./model/gamepad";
  ```

- [ ] **Step 3: Rewrite `gamepad.test.ts` for the generic contract**

  Replace the entire contents of `src/features/arcade/shared/model/gamepad.test.ts` with:

  ```ts
  import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
  import { createGamepadPoller, readGamepadAxes } from "./gamepad";
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

    it("returns anyPress=false and no action fields with no gamepad connected", () => {
      const poll = createGamepadPoller(ACTION_IDS, () => BINDINGS);
      const frame = poll();
      expect(frame.moveLeft).toBeUndefined();
      expect(frame.hardDrop).toBeUndefined();
      expect(frame.anyPress).toBe(false);
    });

    it("resolves a held action from its bound button", () => {
      vi.stubGlobal("navigator", { getGamepads: () => [fakeGamepad([14])] });
      const poll = createGamepadPoller(ACTION_IDS, () => BINDINGS);
      const frame = poll();
      expect(frame.moveLeft).toBe(true);
      expect(frame.moveRight).toBe(false);
    });

    it("keeps reporting a button as held across multiple polls (edge detection is the caller's job)", () => {
      vi.stubGlobal("navigator", { getGamepads: () => [fakeGamepad([0])] });
      const poll = createGamepadPoller(ACTION_IDS, () => BINDINGS);
      expect(poll().rotateCW).toBe(true);
      expect(poll().rotateCW).toBe(true);
    });

    it("does not resolve the analog stick — axis reading is the caller's job", () => {
      vi.stubGlobal("navigator", {
        getGamepads: () => [fakeGamepad([], [-1, 0])],
      });
      const poll = createGamepadPoller(ACTION_IDS, () => BINDINGS);
      expect(poll().moveLeft).toBe(false);
    });

    it("follows a rebind to a new button", () => {
      const rebound: BindingMap<Act> = { ...BINDINGS, hardDrop: ["Pad2"] };
      vi.stubGlobal("navigator", { getGamepads: () => [fakeGamepad([2])] });
      const poll = createGamepadPoller(ACTION_IDS, () => rebound);
      expect(poll().hardDrop).toBe(true);
    });

    it("resolves correctly for a DIFFERENT action set than the one above (proves genericism)", () => {
      type SnakeAct = "moveUp" | "moveDown" | "start" | "pause";
      const SNAKE_ACTION_IDS: readonly SnakeAct[] = [
        "moveUp",
        "moveDown",
        "start",
        "pause",
      ];
      const snakeBindings: BindingMap<SnakeAct> = {
        moveUp: ["Pad12"],
        moveDown: ["Pad13"],
        start: ["Pad0"],
        pause: ["Pad9"],
      };
      vi.stubGlobal("navigator", {
        getGamepads: () => [fakeGamepad([12, 9])],
      });
      const poll = createGamepadPoller(SNAKE_ACTION_IDS, () => snakeBindings);
      const frame = poll();
      expect(frame.moveUp).toBe(true);
      expect(frame.moveDown).toBe(false);
      expect(frame.pause).toBe(true);
      expect(frame.start).toBe(false);
    });

    it("anyPress is true whenever any button is pressed, independent of bindings", () => {
      vi.stubGlobal("navigator", { getGamepads: () => [fakeGamepad([16])] });
      const poll = createGamepadPoller(ACTION_IDS, () => BINDINGS);
      expect(poll().anyPress).toBe(true);
    });
  });

  describe("readGamepadAxes", () => {
    beforeEach(() => {
      vi.stubGlobal("navigator", { getGamepads: () => [] });
    });

    it("returns {x:0,y:0} with no gamepad connected", () => {
      expect(readGamepadAxes()).toEqual({ x: 0, y: 0 });
    });

    it("reads axes 0/1 from the first connected pad", () => {
      vi.stubGlobal("navigator", {
        getGamepads: () => [fakeGamepad([], [0.7, -0.3])],
      });
      expect(readGamepadAxes()).toEqual({ x: 0.7, y: -0.3 });
    });
  });
  ```

- [ ] **Step 4: Run the test and typecheck**

  Run: `npx vitest run src/features/arcade/shared/model/gamepad.test.ts`
  Expected: FAIL at this point is NOT expected — this file compiles and
  passes standalone. The expected failures right now are everywhere ELSE
  that still imports the old `PadFrame` type / old single-argument
  `createGamepadPoller` signature (Tetris's hook) — confirm via:

  Run: `npm run typecheck`
  Expected: errors ONLY in `src/features/arcade/tetris/model/use-tetris-game.ts`
  (old `PadFrame` import, old `createGamepadPoller(getBindings)` call shape) —
  this is expected and fixed in Task 2. If typecheck errors appear ANYWHERE
  else, stop and report — that means something else imports the old gamepad
  API that this brief didn't account for.

- [ ] **Step 5: Commit**

  ```bash
  git add src/features/arcade/shared/model/gamepad.ts \
    src/features/arcade/shared/model/gamepad.test.ts \
    src/features/arcade/shared/index.ts
  git commit -m "feat(arcade): generalize createGamepadPoller over any action set"
  ```

---

## Task 2: Refactor Tetris onto the generic gamepad API (regression-sensitive)

**Files:**

- Modify: `src/features/arcade/tetris/model/use-tetris-game.ts`

**Interfaces:**

- Consumes: `createGamepadPoller<A>`, `readGamepadAxes`, `GAMEPAD_DEADZONE` from Task 1's `@/features/arcade/shared` barrel; `TETRIS_ACTION_IDS`, `type TetrisAction` (already exist in `./bindings`, unchanged).
- Produces: nothing later tasks depend on (Tetris is not touched again in this plan).

- [ ] **Step 1: Update the gamepad-related imports**

  Find (currently lines 16-23):

  ```ts
  import {
    GUEST_SCOPE,
    loadBindings,
    saveBindings,
    type BindingMap,
    createGamepadPoller,
    type PadFrame,
  } from "@/features/arcade/shared";
  ```

  Replace with:

  ```ts
  import {
    GUEST_SCOPE,
    loadBindings,
    saveBindings,
    type BindingMap,
    createGamepadPoller,
    readGamepadAxes,
    GAMEPAD_DEADZONE,
  } from "@/features/arcade/shared";
  ```

- [ ] **Step 2: Update the poller ref + add a previous-frame ref**

  Find (currently line 141):

  ```ts
  const pollPadRef = useRef<(() => PadFrame) | null>(null);
  ```

  Replace with:

  ```ts
  const pollPadRef = useRef<
    | (() => Partial<Record<TetrisAction, boolean>> & { anyPress: boolean })
    | null
  >(null);
  const prevPadRef = useRef<
    Partial<Record<TetrisAction, boolean>> & { anyPress: boolean }
  >({ anyPress: false });
  ```

- [ ] **Step 3: Update `getPollPad` to pass the action id list**

  Find (currently lines 148-151):

  ```ts
  const getPollPad = () => {
    pollPadRef.current ??= createGamepadPoller(() => padBindingsRef.current);
    return pollPadRef.current;
  };
  ```

  Replace with:

  ```ts
  const getPollPad = () => {
    pollPadRef.current ??= createGamepadPoller(
      TETRIS_ACTION_IDS,
      () => padBindingsRef.current
    );
    return pollPadRef.current;
  };
  ```

- [ ] **Step 4: Compute the old `PadFrame` shape locally in `tick()`**

  Find, inside the `tick` function (currently lines 456-463):

  ```ts
  const pad = getPollPad()();
  if (!keysSuspendedRef.current) {
    if (screenRef.current !== "playing") {
      if (pad.anyPress) start();
    } else if (pad.pause) {
      togglePause();
    }
  }
  ```

  Replace with:

  ```ts
  const held = getPollPad()();
  const axes = readGamepadAxes();
  const prevPad = prevPadRef.current;
  const pad = {
    left: !!held.moveLeft || axes.x < -GAMEPAD_DEADZONE,
    right: !!held.moveRight || axes.x > GAMEPAD_DEADZONE,
    softDrop: !!held.softDrop || axes.y > GAMEPAD_DEADZONE,
    rotateCW: !!held.rotateCW && !prevPad.rotateCW,
    rotateCCW: !!held.rotateCCW && !prevPad.rotateCCW,
    hardDrop: !!held.hardDrop && !prevPad.hardDrop,
    hold: !!held.hold && !prevPad.hold,
    pause: !!held.pause && !prevPad.pause,
    anyPress: !!held.anyPress && !prevPad.anyPress,
  };
  prevPadRef.current = held;
  if (!keysSuspendedRef.current) {
    if (screenRef.current !== "playing") {
      if (pad.anyPress) start();
    } else if (pad.pause) {
      togglePause();
    }
  }
  ```

  Everything below this block in `tick()` (the `input.left = kb.left || pad.left`
  lines and onward, currently lines 465-474) is UNCHANGED — `pad` is still a
  local object with the exact same field names (`left`, `right`, `softDrop`,
  `rotateCW`, `rotateCCW`, `hardDrop`, `hold`, `pause`, `anyPress`), so nothing
  downstream needs to change.

- [ ] **Step 5: Typecheck, lint, and run the existing Tetris tests**

  Run: `npm run typecheck && npm run lint`
  Expected: 0 errors.

  Run: `npx vitest run src/features/arcade/tetris`
  Expected: all existing Tetris tests pass unchanged (this task touches only
  the gamepad-frame computation, not engine/game-state logic — no Tetris
  test exercises the Gamepad API directly, so none should be affected).

- [ ] **Step 6: Flag manual verification (do not attempt without hardware)**

  Add a note to your report (do not skip this step even though you cannot
  perform it yourself): a human with a gamepad must play a Tetris run after
  this change and confirm movement/rotate/hard-drop/hold/pause/start-from-menu
  all feel IDENTICAL to before this refactor — this is a behavior-preserving
  refactor, and a gamepad is the only way to confirm feel/timing didn't shift.

- [ ] **Step 7: Commit**

  ```bash
  git add src/features/arcade/tetris/model/use-tetris-game.ts
  git commit -m "refactor(arcade): move Tetris onto the generic gamepad-poller API"
  ```

---

## Task 3: `ControlsModal` gains a gamepad-only mode

**Files:**

- Modify: `src/features/arcade/shared/ui/controls-modal.tsx`

**Interfaces:**

- Consumes: nothing new (uses the module's own existing `rebind`/`bindingLabel`/`BindingMap`).
- Produces: `ControlsModal`'s `value`/`defaults`/`onChange` props become optional — Task 4 (Snake) and Task 5 (2048) render it WITHOUT those three props to get the gamepad-only layout. Tetris (Task 2, already merged) continues passing all six props and is unaffected.

- [ ] **Step 1: Make the keyboard props optional and derive `keyboardEnabled`**

  Find (currently lines 76-97):

  ```ts
  export function ControlsModal<A extends string>({
    isOpen,
    onOpenChange,
    actions,
    value,
    defaults,
    onChange,
    padValue,
    padDefaults,
    onPadChange,
  }: {
    isOpen: boolean;
    onOpenChange: () => void;
    actions: readonly { id: A; label: string }[];
    value: BindingMap<A>;
    defaults: BindingMap<A>;
    onChange: (next: BindingMap<A>) => void;
    /** Gamepad counterpart of `value`/`defaults`/`onChange` — independent binding map. */
    padValue: BindingMap<A>;
    padDefaults: BindingMap<A>;
    onPadChange: (next: BindingMap<A>) => void;
  }) {
  ```

  Replace with:

  ```ts
  export function ControlsModal<A extends string>({
    isOpen,
    onOpenChange,
    actions,
    value,
    defaults,
    onChange,
    padValue,
    padDefaults,
    onPadChange,
  }: {
    isOpen: boolean;
    onOpenChange: () => void;
    actions: readonly { id: A; label: string }[];
    /** Omit `value`/`defaults`/`onChange` together to run GAMEPAD-ONLY: one chip
     *  column instead of two, no keyboard rebinding UI, Reset only resets the
     *  gamepad map. */
    value?: BindingMap<A>;
    defaults?: BindingMap<A>;
    onChange?: (next: BindingMap<A>) => void;
    /** Gamepad counterpart of `value`/`defaults`/`onChange` — independent binding map. */
    padValue: BindingMap<A>;
    padDefaults: BindingMap<A>;
    onPadChange: (next: BindingMap<A>) => void;
  }) {
    const keyboardEnabled = value !== undefined && onChange !== undefined;
  ```

- [ ] **Step 2: Guard the keyboard-capture effect**

  Find (currently lines 103-119, right after the `keyboardEnabled` line you
  just added, before the `capturing` state's OWN declaration which stays
  where it is — insert `keyboardEnabled` between the destructured props and
  the `useState<{...}>` call):

  ```ts
  // Keyboard capture — also the ONLY way to cancel a "pad" capture (Escape).
  useEffect(() => {
    if (!capturing) return;
    const onKey = (e: KeyboardEvent) => {
      if (capturing.kind === "pad" && e.code !== "Escape") return; // irrelevant to a pad capture
      e.preventDefault();
      e.stopPropagation();
      if (e.code === "Escape") {
        setCapturing(null);
        return;
      }
      onChange(rebind<A>(value, capturing.action, e.code));
      setCapturing(null);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [capturing, value, onChange]);
  ```

  Replace with:

  ```ts
  // Keyboard capture — also the ONLY way to cancel a "pad" capture (Escape).
  useEffect(() => {
    if (!capturing) return;
    const onKey = (e: KeyboardEvent) => {
      if (capturing.kind === "pad" && e.code !== "Escape") return; // irrelevant to a pad capture
      e.preventDefault();
      e.stopPropagation();
      if (e.code === "Escape") {
        setCapturing(null);
        return;
      }
      if (capturing.kind === "key" && value && onChange) {
        onChange(rebind<A>(value, capturing.action, e.code));
      }
      setCapturing(null);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [capturing, value, onChange]);
  ```

- [ ] **Step 3: Single-column layout + conditional keyboard chip**

  Find (currently lines 177-213):

  ```tsx
  <div className="grid grid-cols-[auto_1fr_1fr] items-center gap-x-3 gap-y-4">
    {actions.map(({ id, label }) => {
      const keyActive = capturing?.action === id && capturing.kind === "key";
      const padActive = capturing?.action === id && capturing.kind === "pad";
      return (
        <Fragment key={id}>
          <span className="text-[11px] font-medium uppercase leading-none tracking-[0.12em] text-[var(--m-muted2)]">
            {label}
          </span>
          <CaptureChip
            active={keyActive}
            ariaLabel={`${label} — keyboard: ${keyActive ? "press key" : bindingLabel(value[id])}`}
            placeholder="PRESS KEY…"
            codes={value[id]}
            onClick={() =>
              setCapturing(keyActive ? null : { action: id, kind: "key" })
            }
          />
          <CaptureChip
            active={padActive}
            ariaLabel={`${label} — gamepad: ${padActive ? "press button" : bindingLabel(padValue[id])}`}
            placeholder="PRESS BUTTON…"
            codes={padValue[id]}
            onClick={() =>
              setCapturing(padActive ? null : { action: id, kind: "pad" })
            }
          />
        </Fragment>
      );
    })}
  </div>
  ```

  Replace with:

  ```tsx
  <div
    className={`grid items-center gap-x-3 gap-y-4 ${
      keyboardEnabled ? "grid-cols-[auto_1fr_1fr]" : "grid-cols-[auto_1fr]"
    }`}
  >
    {actions.map(({ id, label }) => {
      const keyActive = capturing?.action === id && capturing.kind === "key";
      const padActive = capturing?.action === id && capturing.kind === "pad";
      return (
        <Fragment key={id}>
          <span className="text-[11px] font-medium uppercase leading-none tracking-[0.12em] text-[var(--m-muted2)]">
            {label}
          </span>
          {keyboardEnabled && (
            <CaptureChip
              active={keyActive}
              ariaLabel={`${label} — keyboard: ${keyActive ? "press key" : bindingLabel(value![id])}`}
              placeholder="PRESS KEY…"
              codes={value![id]}
              onClick={() =>
                setCapturing(keyActive ? null : { action: id, kind: "key" })
              }
            />
          )}
          <CaptureChip
            active={padActive}
            ariaLabel={`${label} — gamepad: ${padActive ? "press button" : bindingLabel(padValue[id])}`}
            placeholder="PRESS BUTTON…"
            codes={padValue[id]}
            onClick={() =>
              setCapturing(padActive ? null : { action: id, kind: "pad" })
            }
          />
        </Fragment>
      );
    })}
  </div>
  ```

- [ ] **Step 4: Reset button only resets what's enabled**

  Find (currently lines 222-232):

  ```tsx
  <Button
    variant="outline"
    onClick={() => {
      setCapturing(null);
      onChange(defaults);
      onPadChange(padDefaults);
    }}
  >
    Reset
  </Button>
  ```

  Replace with:

  ```tsx
  <Button
    variant="outline"
    onClick={() => {
      setCapturing(null);
      if (keyboardEnabled) onChange!(defaults!);
      onPadChange(padDefaults);
    }}
  >
    Reset
  </Button>
  ```

- [ ] **Step 5: Typecheck, lint, and run Tetris's existing tests**

  Run: `npm run typecheck && npm run lint`
  Expected: 0 errors.

  Run: `npx vitest run src/features/arcade/tetris`
  Expected: all pass unchanged — Tetris still passes all six props, so
  `keyboardEnabled` is always `true` for it and its rendering path is
  identical to before this change.

- [ ] **Step 6: Commit**

  ```bash
  git add src/features/arcade/shared/ui/controls-modal.tsx
  git commit -m "feat(arcade): ControlsModal gains an optional gamepad-only mode"
  ```

---

## Task 4: Gamepad wiring for Snake

**Files:**

- Create: `src/features/arcade/snake-classic/model/gamepad-bindings.ts`
- Modify: `src/features/arcade/snake-classic/model/types.ts`
- Modify: `src/features/arcade/snake-classic/model/use-snake-classic-game.ts`
- Modify: `src/features/arcade/snake-classic/ui/snake-classic-board.tsx`

**Interfaces:**

- Consumes: `createGamepadPoller`, `readGamepadAxes`, `GAMEPAD_DEADZONE`, `loadBindings`, `saveBindings`, `type BindingMap`, `ControlsModal` (all from `@/features/arcade/shared`, Tasks 1 & 3).
- Produces: `SnakeClassicGameApi.padBindings/setPadBindings/setKeysSuspended` — consumed only by this task's own board file (no cross-task consumer).

- [ ] **Step 1: Create the gamepad bindings file**

  Create `src/features/arcade/snake-classic/model/gamepad-bindings.ts`:

  ```ts
  import type { BindingMap } from "@/features/arcade/shared";

  export type SnakeClassicAction =
    | "moveUp"
    | "moveDown"
    | "moveLeft"
    | "moveRight"
    | "start"
    | "pause";

  /** Ordered action list — the CONTROLS modal rows + the gamepad-poller action set. */
  export const SNAKE_CLASSIC_ACTIONS: readonly {
    id: SnakeClassicAction;
    label: string;
  }[] = [
    { id: "moveUp", label: "Move up" },
    { id: "moveDown", label: "Move down" },
    { id: "moveLeft", label: "Move left" },
    { id: "moveRight", label: "Move right" },
    { id: "start", label: "Start" },
    { id: "pause", label: "Pause" },
  ];

  export const SNAKE_CLASSIC_ACTION_IDS = SNAKE_CLASSIC_ACTIONS.map(
    (a) => a.id
  );

  /** Standard-Gamepad defaults — freely rebindable via the CONTROLS modal. */
  export const SNAKE_CLASSIC_DEFAULT_GAMEPAD_BINDINGS: BindingMap<SnakeClassicAction> =
    {
      moveUp: ["Pad12"],
      moveDown: ["Pad13"],
      moveLeft: ["Pad14"],
      moveRight: ["Pad15"],
      start: ["Pad0"],
      pause: ["Pad9"],
    };

  export const SNAKE_CLASSIC_GAMEPAD_STORAGE = "arcade.snake-classic.pad.v1";
  ```

- [ ] **Step 2: Add bindings fields to the game's API type**

  In `src/features/arcade/snake-classic/model/types.ts`, add this import at
  the very top of the file (it currently has no imports):

  ```ts
  import type { BindingMap } from "@/features/arcade/shared";
  import type { SnakeClassicAction } from "./gamepad-bindings";
  ```

  Then find (currently lines 45-53):

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

  Replace with:

  ```ts
  export interface SnakeClassicGameApi {
    state: SnakeClassicGameState;
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
    history: HistoryPoint[];
    start: () => void;
    togglePause: () => void;
    /** Steer; ignored if it would reverse into the neck. */
    steer: (x: number, y: number) => void;
    padBindings: BindingMap<SnakeClassicAction>;
    setPadBindings: (next: BindingMap<SnakeClassicAction>) => void;
    /** True while the CONTROLS modal owns input capture — game keys/gamepad go inert. */
    setKeysSuspended: (suspended: boolean) => void;
  }
  ```

- [ ] **Step 3: Wire the hook's imports**

  In `src/features/arcade/snake-classic/model/use-snake-classic-game.ts`,
  find (currently lines 13-20):

  ```ts
  import { GUEST_SCOPE } from "@/features/arcade/shared";
  import { loadHistory, recentSeries, recordScore } from "./score-history";
  import type {
    HistoryPoint,
    SnakeClassicGameApi,
    SnakeClassicGameState,
    UseSnakeClassicGameOptions,
  } from "./types";
  ```

  Replace with:

  ```ts
  import {
    GUEST_SCOPE,
    createGamepadPoller,
    readGamepadAxes,
    GAMEPAD_DEADZONE,
    loadBindings,
    saveBindings,
    type BindingMap,
  } from "@/features/arcade/shared";
  import {
    SNAKE_CLASSIC_ACTION_IDS,
    SNAKE_CLASSIC_DEFAULT_GAMEPAD_BINDINGS,
    SNAKE_CLASSIC_GAMEPAD_STORAGE,
    type SnakeClassicAction,
  } from "./gamepad-bindings";
  import { loadHistory, recentSeries, recordScore } from "./score-history";
  import type {
    HistoryPoint,
    SnakeClassicGameApi,
    SnakeClassicGameState,
    UseSnakeClassicGameOptions,
  } from "./types";
  ```

- [ ] **Step 4: Add bindings/suspend/poller state**

  Find the `steer` callback (currently lines 151-155):

  ```ts
  const steer = useCallback((x: number, y: number) => {
    if (screenRef.current !== "playing" || pausedRef.current) return;
    getEngine().steer(x, y);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  ```

  Insert this block IMMEDIATELY BEFORE it (i.e. right after the log-hydration
  effect that currently ends at line 149, before `const steer = ...`):

  ```ts
  const [padBindings, setPadBindingsState] = useState<
    BindingMap<SnakeClassicAction>
  >(SNAKE_CLASSIC_DEFAULT_GAMEPAD_BINDINGS);
  const padBindingsRef = useRef(padBindings);
  useEffect(() => {
    padBindingsRef.current = padBindings;
  }, [padBindings]);
  // Hydrate persisted gamepad bindings on mount; rAF-deferred (lint rule).
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
  const setPadBindings = useCallback((next: BindingMap<SnakeClassicAction>) => {
    setPadBindingsState(next);
    saveBindings(SNAKE_CLASSIC_GAMEPAD_STORAGE, next);
  }, []);

  /** True while the CONTROLS modal owns input capture — game keys/gamepad go inert. */
  const keysSuspendedRef = useRef(false);
  const setKeysSuspended = useCallback((suspended: boolean) => {
    keysSuspendedRef.current = suspended;
  }, []);

  const pollPadRef = useRef<
    | (() => Partial<Record<SnakeClassicAction, boolean>> & {
        anyPress: boolean;
      })
    | null
  >(null);
  const getPollPad = () => {
    pollPadRef.current ??= createGamepadPoller(
      SNAKE_CLASSIC_ACTION_IDS,
      () => padBindingsRef.current
    );
    return pollPadRef.current;
  };
  const prevPadRef = useRef<
    Partial<Record<SnakeClassicAction, boolean>> & { anyPress: boolean }
  >({ anyPress: false });
  ```

- [ ] **Step 5: Poll the gamepad inside the existing tick loop**

  Find, inside the big rAF-loop `useEffect` (currently lines 257-266):

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

  Insert this block right after `const screen = screenRef.current;` and
  BEFORE the `if (screen === "playing" && !pausedRef.current) {` line:

  ```ts
  const held = getPollPad()();
  const axes = readGamepadAxes();
  const prevPad = prevPadRef.current;
  const pad = {
    moveUp: !!held.moveUp || axes.y < -GAMEPAD_DEADZONE,
    moveDown: !!held.moveDown || axes.y > GAMEPAD_DEADZONE,
    moveLeft: !!held.moveLeft || axes.x < -GAMEPAD_DEADZONE,
    moveRight: !!held.moveRight || axes.x > GAMEPAD_DEADZONE,
    start: !!held.start,
    pause: !!held.pause,
  };
  const edge = {
    moveUp: pad.moveUp && !prevPad.moveUp,
    moveDown: pad.moveDown && !prevPad.moveDown,
    moveLeft: pad.moveLeft && !prevPad.moveLeft,
    moveRight: pad.moveRight && !prevPad.moveRight,
    start: pad.start && !prevPad.start,
    pause: pad.pause && !prevPad.pause,
  };
  prevPadRef.current = pad;
  if (!keysSuspendedRef.current) {
    if (screen !== "playing") {
      if (edge.start) start();
    } else {
      if (edge.pause) togglePause();
      else if (edge.moveUp) steer(0, -1);
      else if (edge.moveDown) steer(0, 1);
      else if (edge.moveLeft) steer(-1, 0);
      else if (edge.moveRight) steer(1, 0);
    }
  }
  ```

  This effect's dependency array currently reads `}, [handleGameOver]);`
  (the line right before the keyboard `useEffect`) — update it to also list
  the three functions this new block now calls from inside the effect:

  ```ts
    }, [handleGameOver, start, togglePause, steer]);
  ```

- [ ] **Step 6: Suspend the keyboard handler while the modal is open**

  Find (currently the first line inside the keyboard `useEffect`'s handler,
  right after `const onKey = (e: KeyboardEvent) => {`):

  ```ts
      const onKey = (e: KeyboardEvent) => {
        // Never hijack typing in a field (defensive — no inputs on the page).
  ```

  Replace with:

  ```ts
      const onKey = (e: KeyboardEvent) => {
        if (keysSuspendedRef.current) return; // CONTROLS modal owns input capture
        // Never hijack typing in a field (defensive — no inputs on the page).
  ```

- [ ] **Step 7: Return the new fields from the hook**

  Find (currently lines 360-368):

  ```ts
  return {
    state,
    canvasRef,
    history,
    start,
    togglePause,
    steer,
  };
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
    padBindings,
    setPadBindings,
    setKeysSuspended,
  };
  ```

- [ ] **Step 8: Wire the board UI**

  Replace the entire contents of
  `src/features/arcade/snake-classic/ui/snake-classic-board.tsx` with:

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
    SNAKE_CLASSIC_DEFAULT_GAMEPAD_BINDINGS,
  } from "../model/gamepad-bindings";
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
    const {
      state,
      canvasRef,
      start,
      padBindings,
      setPadBindings,
      setKeysSuspended,
    } = api;
    const {
      rootRef: fullscreenRootRef,
      isFullscreen,
      toggle: toggleFullscreen,
    } = useBoardFullscreen();

    const [controlsOpen, setControlsOpen] = useState(false);
    const openControls = () => {
      setControlsOpen(true);
      setKeysSuspended(true);
    };
    const closeControls = () => {
      setControlsOpen(false);
      setKeysSuspended(false);
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
            description="The classic. You, your tail, and bad decisions."
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
          padValue={padBindings}
          padDefaults={SNAKE_CLASSIC_DEFAULT_GAMEPAD_BINDINGS}
          onPadChange={setPadBindings}
        />
      </div>
    );
  }
  ```

- [ ] **Step 9: Typecheck, lint, and run Snake's existing tests**

  Run: `npm run typecheck && npm run lint`
  Expected: 0 errors.

  Run: `npx vitest run src/features/arcade/snake-classic`
  Expected: `engine.test.ts` passes unchanged (this task adds an input
  layer alongside the engine, doesn't touch it).

- [ ] **Step 10: Flag manual verification**

  Add to your report: a human with a gamepad must open `/arcade/snake`,
  confirm D-pad/stick steers in all 4 directions, Start button (Pad0)
  starts a run, Start-button-labeled pad button (Pad9) pauses/resumes, the
  "Controls" link opens the modal with ONE chip column (no "PRESS KEY…"
  chips anywhere), clicking a chip + pressing a gamepad button rebinds it,
  Escape cancels an armed capture, and Reset restores the defaults.

- [ ] **Step 11: Commit**

  ```bash
  git add src/features/arcade/snake-classic/model/gamepad-bindings.ts \
    src/features/arcade/snake-classic/model/types.ts \
    src/features/arcade/snake-classic/model/use-snake-classic-game.ts \
    src/features/arcade/snake-classic/ui/snake-classic-board.tsx
  git commit -m "feat(arcade): add gamepad play + CONTROLS modal to Snake"
  ```

---

## Task 5: Gamepad wiring for 2048

**Files:**

- Create: `src/features/arcade/2048/model/gamepad-bindings.ts`
- Modify: `src/features/arcade/2048/model/types.ts`
- Modify: `src/features/arcade/2048/model/use-2048-game.ts`
- Modify: `src/features/arcade/2048/ui/board-2048.tsx`

**Interfaces:**

- Consumes: `createGamepadPoller`, `readGamepadAxes`, `GAMEPAD_DEADZONE`, `loadBindings`, `saveBindings`, `type BindingMap`, `ControlsModal` (all from `@/features/arcade/shared`, Tasks 1 & 3).
- Produces: `Game2048Api.padBindings/setPadBindings/setKeysSuspended` — consumed only by this task's own board file.

- [ ] **Step 1: Create the gamepad bindings file**

  Create `src/features/arcade/2048/model/gamepad-bindings.ts`:

  ```ts
  import type { BindingMap } from "@/features/arcade/shared";

  export type Game2048Action =
    | "moveLeft"
    | "moveRight"
    | "moveUp"
    | "moveDown"
    | "start"
    | "continueRun";

  /** Ordered action list — the CONTROLS modal rows + the gamepad-poller action set. */
  export const GAME_2048_ACTIONS: readonly {
    id: Game2048Action;
    label: string;
  }[] = [
    { id: "moveLeft", label: "Move left" },
    { id: "moveRight", label: "Move right" },
    { id: "moveUp", label: "Move up" },
    { id: "moveDown", label: "Move down" },
    { id: "start", label: "Start" },
    { id: "continueRun", label: "Continue" },
  ];

  export const GAME_2048_ACTION_IDS = GAME_2048_ACTIONS.map((a) => a.id);

  /** Standard-Gamepad defaults — freely rebindable via the CONTROLS modal. */
  export const GAME_2048_DEFAULT_GAMEPAD_BINDINGS: BindingMap<Game2048Action> =
    {
      moveLeft: ["Pad14"],
      moveRight: ["Pad15"],
      moveUp: ["Pad12"],
      moveDown: ["Pad13"],
      start: ["Pad0"],
      continueRun: ["Pad0"],
    };

  export const GAME_2048_GAMEPAD_STORAGE = "arcade.2048.pad.v1";
  ```

- [ ] **Step 2: Add bindings fields to the game's API type**

  In `src/features/arcade/2048/model/types.ts`, add this import at the very
  top of the file (it currently has no imports):

  ```ts
  import type { BindingMap } from "@/features/arcade/shared";
  import type { Game2048Action } from "./gamepad-bindings";
  ```

  Then find (currently lines 53-62):

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

  Replace with:

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
    padBindings: BindingMap<Game2048Action>;
    setPadBindings: (next: BindingMap<Game2048Action>) => void;
    /** True while the CONTROLS modal owns input capture — game keys/gamepad go inert. */
    setKeysSuspended: (suspended: boolean) => void;
  }
  ```

- [ ] **Step 3: Wire the hook's imports**

  In `src/features/arcade/2048/model/use-2048-game.ts`, find (currently
  lines 1-15):

  ```ts
  "use client";

  import { useCallback, useEffect, useRef, useState } from "react";
  import { prefersReducedMotion } from "@/shared/lib/prefers-reduced-motion";
  import { Engine2048, GRID, parseHexRgb, type Palette2048 } from "./engine";
  import { GUEST_SCOPE } from "@/features/arcade/shared";
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

  Replace with:

  ```ts
  "use client";

  import { useCallback, useEffect, useRef, useState } from "react";
  import { prefersReducedMotion } from "@/shared/lib/prefers-reduced-motion";
  import { Engine2048, GRID, parseHexRgb, type Palette2048 } from "./engine";
  import {
    GUEST_SCOPE,
    createGamepadPoller,
    readGamepadAxes,
    GAMEPAD_DEADZONE,
    loadBindings,
    saveBindings,
    type BindingMap,
  } from "@/features/arcade/shared";
  import {
    GAME_2048_ACTION_IDS,
    GAME_2048_DEFAULT_GAMEPAD_BINDINGS,
    GAME_2048_GAMEPAD_STORAGE,
    type Game2048Action,
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

- [ ] **Step 4: Add bindings/suspend/poller state**

  Find (currently lines 137-143):

  ```ts
    // One-shot direction edge the loop feeds the engine (consumed there).
    const inputRef = useRef<Input2048>({ dir: null });
    const resetInput = () => {
      inputRef.current.dir = null;
    };

    const start = useCallback(() => {
  ```

  Insert this block between `resetInput`'s closing brace and
  `const start = useCallback(...)`:

  ```ts
  const [padBindings, setPadBindingsState] = useState<
    BindingMap<Game2048Action>
  >(GAME_2048_DEFAULT_GAMEPAD_BINDINGS);
  const padBindingsRef = useRef(padBindings);
  useEffect(() => {
    padBindingsRef.current = padBindings;
  }, [padBindings]);
  // Hydrate persisted gamepad bindings on mount; rAF-deferred (lint rule).
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
  const setPadBindings = useCallback((next: BindingMap<Game2048Action>) => {
    setPadBindingsState(next);
    saveBindings(GAME_2048_GAMEPAD_STORAGE, next);
  }, []);

  /** True while the CONTROLS modal owns input capture — game keys/gamepad go inert. */
  const keysSuspendedRef = useRef(false);
  const setKeysSuspended = useCallback((suspended: boolean) => {
    keysSuspendedRef.current = suspended;
  }, []);

  const pollPadRef = useRef<
    | (() => Partial<Record<Game2048Action, boolean>> & {
        anyPress: boolean;
      })
    | null
  >(null);
  const getPollPad = () => {
    pollPadRef.current ??= createGamepadPoller(
      GAME_2048_ACTION_IDS,
      () => padBindingsRef.current
    );
    return pollPadRef.current;
  };
  const prevPadRef = useRef<
    Partial<Record<Game2048Action, boolean>> & { anyPress: boolean }
  >({ anyPress: false });
  ```

- [ ] **Step 5: Poll the gamepad inside the existing tick function**

  Find (currently lines 245-251):

  ```ts
      const tick = (now: number) => {
        lastFrame = now;
        const dt = now - last;
        last = now;
        const animate = !prefersReducedMotion();

        if (screenRef.current === "playing" && !endedRef.current) {
  ```

  Insert this block right after `const animate = !prefersReducedMotion();`
  and BEFORE the `if (screenRef.current === "playing" ...)` line:

  ```ts
  const held = getPollPad()();
  const axes = readGamepadAxes();
  const prevPad = prevPadRef.current;
  const pad = {
    moveLeft: !!held.moveLeft || axes.x < -GAMEPAD_DEADZONE,
    moveRight: !!held.moveRight || axes.x > GAMEPAD_DEADZONE,
    moveUp: !!held.moveUp || axes.y < -GAMEPAD_DEADZONE,
    moveDown: !!held.moveDown || axes.y > GAMEPAD_DEADZONE,
    start: !!held.start,
    continueRun: !!held.continueRun,
  };
  const edge = {
    moveLeft: pad.moveLeft && !prevPad.moveLeft,
    moveRight: pad.moveRight && !prevPad.moveRight,
    moveUp: pad.moveUp && !prevPad.moveUp,
    moveDown: pad.moveDown && !prevPad.moveDown,
    start: pad.start && !prevPad.start,
    continueRun: pad.continueRun && !prevPad.continueRun,
  };
  prevPadRef.current = pad;
  if (!keysSuspendedRef.current) {
    const screen = screenRef.current;
    if (screen === "menu" || screen === "over") {
      if (edge.start) start();
    } else if (screen === "won") {
      if (edge.continueRun) continueRun();
    } else if (screen === "playing") {
      if (edge.moveLeft) inputRef.current.dir = "left";
      else if (edge.moveRight) inputRef.current.dir = "right";
      else if (edge.moveUp) inputRef.current.dir = "up";
      else if (edge.moveDown) inputRef.current.dir = "down";
    }
  }
  ```

  This effect's dependency array currently reads `}, [handleGameOver]);`
  (right before the `// ---------- keyboard ----------` comment) — update it
  to also list `start`/`continueRun`, which this new block now calls from
  inside the effect:

  ```ts
    }, [handleGameOver, start, continueRun]);
  ```

- [ ] **Step 6: Suspend the keyboard handler while the modal is open**

  Find (currently the first line inside `onKeyDown`, right after
  `const onKeyDown = (e: KeyboardEvent) => {`):

  ```ts
      const onKeyDown = (e: KeyboardEvent) => {
        // Never hijack typing, and let a FOCUSED button/link keep its native
  ```

  Replace with:

  ```ts
      const onKeyDown = (e: KeyboardEvent) => {
        if (keysSuspendedRef.current) return; // CONTROLS modal owns input capture
        // Never hijack typing, and let a FOCUSED button/link keep its native
  ```

- [ ] **Step 7: Return the new fields from the hook**

  Find (currently the last line of the hook body):

  ```ts
  return { state, canvasRef, history, start, continueRun };
  ```

  Replace with:

  ```ts
  return {
    state,
    canvasRef,
    history,
    start,
    continueRun,
    padBindings,
    setPadBindings,
    setKeysSuspended,
  };
  ```

- [ ] **Step 8: Wire the board UI**

  In `src/features/arcade/2048/ui/board-2048.tsx`, find (currently lines
  1-19):

  ```ts
  "use client";

  import {
    ArcadeButton,
    BoardFullscreenButton,
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
  import type { Game2048Api } from "../model/types";
  ```

  Replace with:

  ```ts
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
    GAME_2048_DEFAULT_GAMEPAD_BINDINGS,
  } from "../model/gamepad-bindings";
  import type { Game2048Api } from "../model/types";
  ```

  Find (currently lines 30-48):

  ```ts
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

    const rankClause = rankLine(state.rank, canRank, "merge higher");
    // Fullscreen toggle lives on the OVERLAY screens only — 2048 has no pause,
    // so that's the pre-game menu (owner call: never over live gameplay).
    const showFullscreenToggle = state.screen === "menu";
  ```

  Replace with:

  ```ts
  export function Board2048({
    api,
    canRank = true,
  }: {
    api: Game2048Api;
    /** False for a signed-out viewer — runs stay local, so no board/rank talk. */
    canRank?: boolean;
  }) {
    const {
      state,
      canvasRef,
      start,
      continueRun,
      padBindings,
      setPadBindings,
      setKeysSuspended,
    } = api;
    const {
      rootRef: fullscreenRootRef,
      isFullscreen,
      toggle: toggleFullscreen,
    } = useBoardFullscreen();

    const [controlsOpen, setControlsOpen] = useState(false);
    const openControls = () => {
      setControlsOpen(true);
      setKeysSuspended(true);
    };
    const closeControls = () => {
      setControlsOpen(false);
      setKeysSuspended(false);
    };

    const rankClause = rankLine(state.rank, canRank, "merge higher");
    // Fullscreen toggle lives on the OVERLAY screens only — 2048 has no pause,
    // so that's the pre-game menu (owner call: never over live gameplay).
    const showFullscreenToggle = state.screen === "menu";
  ```

  Find (currently lines 82-88):

  ```tsx
  {
    state.screen === "menu" && (
      <MenuOverlay
        title="2048"
        description="Double the numbers until the board disagrees."
        onStart={start}
      />
    );
  }
  ```

  Replace with:

  ```tsx
  {
    state.screen === "menu" && (
      <MenuOverlay
        title="2048"
        description="Double the numbers until the board disagrees."
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

  Find the component's closing (currently lines 115-123):

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
          actions={GAME_2048_ACTIONS}
          padValue={padBindings}
          padDefaults={GAME_2048_DEFAULT_GAMEPAD_BINDINGS}
          onPadChange={setPadBindings}
        />
      </div>
    );
  }
  ```

- [ ] **Step 9: Typecheck, lint, and run 2048's existing tests**

  Run: `npm run typecheck && npm run lint`
  Expected: 0 errors.

  Run: `npx vitest run src/features/arcade/2048`
  Expected: all existing tests pass unchanged.

- [ ] **Step 10: Flag manual verification**

  Add to your report: a human with a gamepad must open `/arcade/2048`,
  confirm D-pad/stick slides tiles in all 4 directions (one slide per
  press, not a continuous slide while held), Start button (Pad0) starts a
  run AND continues from the win overlay, the "Controls" link opens the
  modal with ONE chip column, rebind/reset/Escape-cancel all work.

- [ ] **Step 11: Commit**

  ```bash
  git add src/features/arcade/2048/model/gamepad-bindings.ts \
    src/features/arcade/2048/model/types.ts \
    src/features/arcade/2048/model/use-2048-game.ts \
    src/features/arcade/2048/ui/board-2048.tsx
  git commit -m "feat(arcade): add gamepad play + CONTROLS modal to 2048"
  ```

---

## Task 6: Full-repo verification

**Files:** none (verification only).

**Interfaces:** none.

- [ ] **Step 1: Full typecheck, lint, and test suite**

  Run: `npm run typecheck && npm run lint && npx vitest run`
  Expected: 0 typecheck/lint errors; all tests pass except the 2
  pre-existing, unrelated failures in `src/shared/ui/overlays/submit-button.test.tsx`
  (present on `main`/this branch before any work in this plan — confirm via
  `git stash` + rerun if you want to double-check the baseline, then
  restore).

- [ ] **Step 2: Grep for leftover references to removed types**

  Run:

  ```bash
  grep -rn "PadFrame" src
  ```

  Expected: no matches — confirms Task 2 fully removed the old type from
  Tetris and nothing else referenced it.

- [ ] **Step 3: Manual full pass (owed to the human — no agent has gamepad hardware)**

  With a physical gamepad connected: play a Tetris run (confirm feel is
  unchanged from before this plan), then a Snake run (steer, pause, start,
  Controls modal rebind/reset), then a 2048 run (slide, start, continue
  from win, Controls modal rebind/reset). Confirm the "Controls" link is
  ABSENT from Stay Awake and any other game not touched by this plan.

  This step has no exit code to check — confirm each bullet and report
  back.
