# Tetris gamepad rebinding + HOLD-left layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let players rebind Tetris gamepad buttons from the CONTROLS modal (today only keyboard keys are rebindable), and move the HOLD preview to the left of the well canvas to match conventional Tetris layout.

**Architecture:** Reuse the existing generic `BindingMap<A>`/`loadBindings`/`saveBindings`/`rebind` from `shared/model/key-bindings.ts` unchanged — gamepad buttons are encoded as strings `"Pad0"`…`"Pad16"` (Standard Gamepad button index) and stored as a second, independent `BindingMap<TetrisAction>` under its own localStorage key, so all persistence/rebind logic is shared with keyboard bindings for free. `ControlsModal` grows a second chip per row (keyboard + gamepad); `gamepad.ts`'s poller resolves actions from the live gamepad `BindingMap` instead of hardcoded button indices. The analog stick stays hardcoded (not rebindable), per owner decision.

**Tech Stack:** Next.js 16 (client components), React 19, TypeScript, Vitest + jsdom, Tailwind (Brutalist-Mono design system).

## Global Constraints

- Follow the Brutalist-Mono design system in `/Users/igormariuta/Code/lazy-team/lazy-blog-front/CLAUDE.md`: closed type/spacing scales, `gap-3` (12px) for adjacent action buttons, `.mono-focus` for focus rings, square 2px borders, uppercase 11px/0.12em labels.
- Extract anything that repeats — reuse `key-bindings.ts`'s generic functions rather than duplicating rebind/persistence logic for gamepad.
- Run `npm run typecheck` and `npm run lint` after every task; keep both at 0 errors.
- Don't commit without explicit user go-ahead beyond what's already been given for this plan's tasks (the user approved starting implementation; still surface anything destructive before doing it).
- Work happens on branch `feat/tetris-gamepad-rebind-hold-layout` (already created off `main`).

---

## File Structure

- **Modify** `src/features/arcade/shared/model/key-bindings.ts` — add a `PAD_LABELS` table so `keyLabel()`/`bindingLabel()` also render gamepad `Pad<n>` codes (e.g. `Pad0` → `"A"`).
- **Modify** `src/features/arcade/shared/model/key-bindings.test.ts` — cover the new gamepad labels.
- **Create** `src/features/arcade/tetris/model/gamepad-bindings.ts` — Tetris's default gamepad `BindingMap` + its storage key (mirrors `bindings.ts`).
- **Modify** `src/features/arcade/shared/model/gamepad.ts` — `createGamepadPoller` takes a `getBindings` callback and resolves each action from it instead of hardcoded button indices; the analog stick stays hardcoded.
- **Create** `src/features/arcade/shared/model/gamepad.test.ts` — unit tests for the generalized poller.
- **Modify** `src/features/arcade/tetris/model/types.ts` — `TetrisGameApi` gains `padBindings`/`setPadBindings`.
- **Modify** `src/features/arcade/tetris/model/use-tetris-game.ts` — load/persist/expose `padBindings`, feed the poller from it.
- **Modify** `src/features/arcade/shared/ui/controls-modal.tsx` — two capture-able chips per action row (keyboard + gamepad), Reset restores both.
- **Modify** `src/features/arcade/tetris/ui/tetris-board.tsx` — wire the new `ControlsModal` props; move the HOLD preview from the right-hand panel into the (previously invisible) left spacer, `sm:` and up.

---

### Task 1: Gamepad button labels in `key-bindings.ts`

**Files:**

- Modify: `src/features/arcade/shared/model/key-bindings.ts:61-82`
- Test: `src/features/arcade/shared/model/key-bindings.test.ts`

**Interfaces:**

- Consumes: nothing new.
- Produces: `keyLabel(code)`/`bindingLabel(codes)` now also render `"Pad0"`…`"Pad16"` — later tasks (`ControlsModal`, `tetris-board.tsx` hint rows) rely on this to display gamepad bindings without any gamepad-specific label helper.

- [ ] **Step 1: Write the failing test**

Add to the `describe("labels", ...)` block in `key-bindings.test.ts`:

```ts
it("maps gamepad Pad<n> codes to their button glyph", () => {
  expect(keyLabel("Pad0")).toBe("A");
  expect(keyLabel("Pad9")).toBe("START");
  expect(keyLabel("Pad14")).toBe("D-PAD ←");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/arcade/shared/model/key-bindings.test.ts`
Expected: FAIL — `keyLabel("Pad0")` returns `"PAD0"` (falls through to `.toUpperCase()`), not `"A"`.

- [ ] **Step 3: Implement `PAD_LABELS` and wire it into `keyLabel`**

Replace lines 61-82 of `key-bindings.ts`:

```ts
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

/** Human label for one gamepad button code (`"Pad<index>"`, Standard Gamepad layout —
 *  same layout `gamepad.ts` assumes). */
const PAD_LABELS: Record<string, string> = {
  Pad0: "A",
  Pad1: "B",
  Pad2: "X",
  Pad3: "Y",
  Pad4: "LB",
  Pad5: "RB",
  Pad6: "LT",
  Pad7: "RT",
  Pad8: "BACK",
  Pad9: "START",
  Pad10: "L3",
  Pad11: "R3",
  Pad12: "D-PAD ↑",
  Pad13: "D-PAD ↓",
  Pad14: "D-PAD ←",
  Pad15: "D-PAD →",
  Pad16: "HOME",
};

export function keyLabel(code: string): string {
  if (KEY_LABELS[code]) return KEY_LABELS[code];
  if (PAD_LABELS[code]) return PAD_LABELS[code];
  if (code.startsWith("Key")) return code.slice(3);
  if (code.startsWith("Digit")) return code.slice(5);
  return code.toUpperCase();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/arcade/shared/model/key-bindings.test.ts`
Expected: PASS (all tests in the file, including the new one).

- [ ] **Step 5: Typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/features/arcade/shared/model/key-bindings.ts src/features/arcade/shared/model/key-bindings.test.ts
git commit -m "feat(arcade): label gamepad Pad<n> codes in keyLabel/bindingLabel"
```

---

### Task 2: Tetris gamepad defaults + generalize the poller

**Files:**

- Create: `src/features/arcade/tetris/model/gamepad-bindings.ts`
- Modify: `src/features/arcade/shared/model/gamepad.ts` (full file)
- Create: `src/features/arcade/shared/model/gamepad.test.ts`

**Interfaces:**

- Consumes: `BindingMap<A>` type from `./key-bindings` (already in the same folder).
- Produces:
  - `TETRIS_DEFAULT_GAMEPAD_BINDINGS: BindingMap<TetrisAction>` and `TETRIS_GAMEPAD_STORAGE: string` — consumed by Task 3 (`use-tetris-game.ts`) and Task 5 (`tetris-board.tsx`, as the modal's `padDefaults`).
  - `createGamepadPoller(getBindings: () => BindingMap<string>): () => PadFrame` — the `getBindings` param is new; `PadFrame`'s shape (`left`/`right`/`softDrop`/`hardDrop`/`rotateCW`/`rotateCCW`/`hold`/`pause`/`anyPress`) is UNCHANGED, so `use-tetris-game.ts`'s existing `pad.left`/`pad.rotateCW`/etc. reads keep working untouched.

- [ ] **Step 1: Create the Tetris gamepad defaults**

Create `src/features/arcade/tetris/model/gamepad-bindings.ts`:

```ts
import type { BindingMap } from "@/features/arcade/shared";
import type { TetrisAction } from "./bindings";

/** Same layout the poller hardcoded before rebinding existed — rebinding only adds
 *  the ABILITY to change these, the out-of-the-box feel is unchanged. */
export const TETRIS_DEFAULT_GAMEPAD_BINDINGS: BindingMap<TetrisAction> = {
  moveLeft: ["Pad14"],
  moveRight: ["Pad15"],
  softDrop: ["Pad13"],
  hardDrop: ["Pad12"],
  rotateCW: ["Pad0"],
  rotateCCW: ["Pad1"],
  hold: ["Pad4", "Pad5"],
  pause: ["Pad9"],
};

export const TETRIS_GAMEPAD_STORAGE = "arcade.tetris.pad.v1";
```

- [ ] **Step 2: Write the failing poller tests**

Create `src/features/arcade/shared/model/gamepad.test.ts`:

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

  it("returns all-idle with no gamepad connected", () => {
    const poll = createGamepadPoller(() => BINDINGS);
    const frame = poll();
    expect(frame.left).toBe(false);
    expect(frame.hardDrop).toBe(false);
    expect(frame.anyPress).toBe(false);
  });

  it("resolves a held direction from its bound button", () => {
    vi.stubGlobal("navigator", { getGamepads: () => [fakeGamepad([14])] });
    const poll = createGamepadPoller(() => BINDINGS);
    const frame = poll();
    expect(frame.left).toBe(true);
    expect(frame.right).toBe(false);
  });

  it("fires an edge action once, not on every held frame", () => {
    vi.stubGlobal("navigator", { getGamepads: () => [fakeGamepad([0])] });
    const poll = createGamepadPoller(() => BINDINGS);
    expect(poll().rotateCW).toBe(true);
    expect(poll().rotateCW).toBe(false);
  });

  it("the analog stick always drives movement regardless of button bindings", () => {
    vi.stubGlobal("navigator", {
      getGamepads: () => [fakeGamepad([], [-1, 0])],
    });
    const poll = createGamepadPoller(() => BINDINGS);
    expect(poll().left).toBe(true);
  });

  it("follows a rebind to a new button", () => {
    const rebound: BindingMap<Act> = { ...BINDINGS, hardDrop: ["Pad2"] };
    vi.stubGlobal("navigator", { getGamepads: () => [fakeGamepad([2])] });
    const poll = createGamepadPoller(() => rebound);
    expect(poll().hardDrop).toBe(true);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/features/arcade/shared/model/gamepad.test.ts`
Expected: FAIL to compile/run — `createGamepadPoller` doesn't accept an argument yet.

- [ ] **Step 4: Generalize the poller**

Replace the full contents of `src/features/arcade/shared/model/gamepad.ts`:

```ts
/**
 * Gamepad input for the arcade — polled from a game's EXISTING rAF loop (no loop of
 * its own; the Gamepad API is poll-only). Button→action assignment is REMAPPABLE:
 * the caller supplies a live `BindingMap` (Tetris: `gamepad-bindings.ts`, edited via
 * the CONTROLS modal) and this module just resolves it each poll — it owns no
 * defaults itself. Standard-layout button INDICES are encoded as `"Pad<n>"` strings,
 * the same generic code format `key-bindings.ts` uses for keyboard codes. The left
 * stick (+ D-pad axes) is a fixed, NON-remappable bonus input for move/soft-drop only
 * (axes 0/1, ±0.5 deadzone) — always live alongside whatever buttons are bound to
 * those actions. Directions are HOLDS (feed the same DAS as the keyboard); the rest
 * are press EDGES computed against the previous frame's snapshot.
 */

import type { BindingMap } from "./key-bindings";

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

/** `"Pad12"` → `12`; anything malformed resolves to -1 (never matches a real button). */
function padButtonIndex(code: string): number {
  if (!code.startsWith("Pad")) return -1;
  const n = Number(code.slice(3));
  return Number.isInteger(n) ? n : -1;
}

export function createGamepadPoller(
  getBindings: () => BindingMap<string>
): () => PadFrame {
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
    const bindings = getBindings();
    const pressed = (action: string) =>
      bindings[action].some((code) => btn(padButtonIndex(code)));
    const axisX = gp.axes[0] ?? 0;
    const axisY = gp.axes[1] ?? 0;
    const held: RawHeld = {
      hard: pressed("hardDrop"),
      cw: pressed("rotateCW"),
      ccw: pressed("rotateCCW"),
      hold: pressed("hold"),
      pause: pressed("pause"),
      any: gp.buttons.some((b) => b.pressed),
    };
    const frame: PadFrame = {
      left: pressed("moveLeft") || axisX < -DEADZONE,
      right: pressed("moveRight") || axisX > DEADZONE,
      softDrop: pressed("softDrop") || axisY > DEADZONE,
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

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/features/arcade/shared/model/gamepad.test.ts`
Expected: PASS (all 5 tests).

- [ ] **Step 6: Typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: 0 errors. (Note: `use-tetris-game.ts` still calls `createGamepadPoller()` with no argument at this point — Task 3 fixes that call site. If typecheck fails ONLY on that one call site, that's expected and resolved by the next task; don't paper over it with a stray default parameter here.)

- [ ] **Step 7: Commit**

```bash
git add src/features/arcade/tetris/model/gamepad-bindings.ts src/features/arcade/shared/model/gamepad.ts src/features/arcade/shared/model/gamepad.test.ts
git commit -m "feat(arcade): resolve gamepad actions from a live BindingMap instead of hardcoded buttons"
```

---

### Task 3: Wire `padBindings` into `use-tetris-game.ts` + `TetrisGameApi`

**Files:**

- Modify: `src/features/arcade/tetris/model/types.ts:84-102`
- Modify: `src/features/arcade/tetris/model/use-tetris-game.ts` (imports, lines 15-27, 135, 192-207, 240-246, 574-587)

**Interfaces:**

- Consumes: `TETRIS_DEFAULT_GAMEPAD_BINDINGS`, `TETRIS_GAMEPAD_STORAGE` from Task 2; `createGamepadPoller(getBindings)` signature from Task 2.
- Produces: `TetrisGameApi.padBindings: BindingMap<TetrisAction>` and `TetrisGameApi.setPadBindings(next): void` — consumed by Task 5 (`tetris-board.tsx` passing them to `ControlsModal`).

- [ ] **Step 1: Add the API members to `TetrisGameApi`**

In `src/features/arcade/tetris/model/types.ts`, replace lines 96-101:

```ts
  /** Live remappable-key map — read by the keyboard handler, edited by CONTROLS. */
  bindings: BindingMap<TetrisAction>;
  setBindings: (next: BindingMap<TetrisAction>) => void;
  /** Live remappable-gamepad-button map — read by the gamepad poller, edited by
   *  CONTROLS. Independent of `bindings` (keyboard); rebinding one never touches
   *  the other. */
  padBindings: BindingMap<TetrisAction>;
  setPadBindings: (next: BindingMap<TetrisAction>) => void;
  /** True while a modal (e.g. CONTROLS) owns the keyboard — game keys go inert. */
  setKeysSuspended: (suspended: boolean) => void;
```

- [ ] **Step 2: Import the gamepad defaults in the hook**

In `src/features/arcade/tetris/model/use-tetris-game.ts`, replace the import block at lines 22-27:

```ts
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
```

- [ ] **Step 3: Feed the poller from a `padBindings` ref**

Replace line 135:

```ts
const pollPadRef = useRef(createGamepadPoller(() => padBindingsRef.current));
```

(`padBindingsRef` is declared further down in the same function, in Step 4 below — this is a valid forward reference: the arrow function isn't _called_ until the game loop's first tick, by which point every hook-body statement, including `padBindingsRef`'s declaration, has already run.)

- [ ] **Step 4: Add `padBindings` state + hydration**

Immediately after the existing bindings-hydration block (after line 207, i.e. right after the `}, []);` that closes the `bindings` hydration effect and before the `keysSuspendedRef` comment on line 208), insert:

```ts
const [padBindings, setPadBindingsState] = useState<BindingMap<TetrisAction>>(
  TETRIS_DEFAULT_GAMEPAD_BINDINGS
);
const padBindingsRef = useRef(padBindings);
useEffect(() => {
  padBindingsRef.current = padBindings;
}, [padBindings]);
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

- [ ] **Step 5: Add `setPadBindings`**

Immediately after `setBindings` (after line 246, the `}, []);` closing it), insert:

```ts
const setPadBindings = useCallback((next: BindingMap<TetrisAction>) => {
  setPadBindingsState(next);
  saveBindings(TETRIS_GAMEPAD_STORAGE, next);
  // Same rationale as setBindings: drop in-flight holds across a remap.
  resetInput();
}, []);
```

- [ ] **Step 6: Expose the new members**

In the hook's return statement (was lines 574-587), add `padBindings` and `setPadBindings`:

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
  padBindings,
  setPadBindings,
  setKeysSuspended,
};
```

- [ ] **Step 7: Typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: 0 errors — this resolves the `createGamepadPoller()` call-site mismatch flagged (expected) at the end of Task 2.

- [ ] **Step 8: Commit**

```bash
git add src/features/arcade/tetris/model/types.ts src/features/arcade/tetris/model/use-tetris-game.ts
git commit -m "feat(arcade): expose padBindings/setPadBindings on the Tetris game API"
```

---

### Task 4: `ControlsModal` — dual keyboard/gamepad capture

**Files:**

- Modify: `src/features/arcade/shared/ui/controls-modal.tsx` (full file)

**Interfaces:**

- Consumes: `BindingMap<A>`, `bindingLabel`, `rebind` from `../model/key-bindings` (unchanged); `TETRIS_DEFAULT_GAMEPAD_BINDINGS` etc. are NOT imported here — the component stays generic over `A extends string`, gamepad-vs-keyboard specifics live entirely in the caller (Task 5).
- Produces: `ControlsModal` now requires three additional props — `padValue: BindingMap<A>`, `padDefaults: BindingMap<A>`, `onPadChange: (next: BindingMap<A>) => void` — consumed by Task 5's `tetris-board.tsx`. This is a breaking prop-signature change; there's exactly one caller in the codebase (`tetris-board.tsx`), fixed in Task 5.

- [ ] **Step 1: Replace `controls-modal.tsx`**

Replace the full contents of `src/features/arcade/shared/ui/controls-modal.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { Button, Modal, ModalHeader } from "@/shared/ui";
import { bindingLabel, rebind, type BindingMap } from "../model/key-bindings";

/**
 * Key/button-remapping modal for an arcade game: one row per action, two chips each
 * (keyboard, gamepad). Click a chip to arm capture ("PRESS KEY…" / "PRESS BUTTON…");
 * for a keyboard chip the next `keydown` binds it (stealing it from any other
 * action); for a gamepad chip the next polled button press binds it the same way.
 * Escape cancels either capture. The keyboard-capture listener runs in the WINDOW
 * capture phase with stopPropagation, so neither the game's key handler nor the
 * Modal's own document-level Escape-close sees the press. The host must suspend its
 * game keys while the modal is open (Tetris: `setKeysSuspended`).
 */
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
  const [capturing, setCapturing] = useState<{
    action: A;
    kind: "key" | "pad";
  } | null>(null);

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

  // Gamepad capture — poll for the first NEW button press (edge), assign it.
  useEffect(() => {
    if (!capturing || capturing.kind !== "pad") return;
    let raf = 0;
    let prevPressed: boolean[] = [];
    const poll = () => {
      const pads =
        typeof navigator !== "undefined" && navigator.getGamepads
          ? navigator.getGamepads()
          : [];
      const gp = Array.from(pads ?? []).find(
        (p): p is Gamepad => !!p && p.connected
      );
      if (gp) {
        const nowPressed = gp.buttons.map((b) => b.pressed);
        const pressedIndex = nowPressed.findIndex(
          (p, i) => p && !prevPressed[i]
        );
        if (pressedIndex !== -1) {
          onPadChange(
            rebind<A>(padValue, capturing.action, `Pad${pressedIndex}`)
          );
          setCapturing(null);
          return;
        }
        prevPressed = nowPressed;
      }
      raf = requestAnimationFrame(poll);
    };
    raf = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(raf);
  }, [capturing, padValue, onPadChange]);

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
            subtitle="Click a slot, then press its new key or button. Esc cancels."
            onClose={closeModal}
          />
          <div className="flex flex-col gap-4">
            {actions.map(({ id, label }) => {
              const keyActive =
                capturing?.action === id && capturing.kind === "key";
              const padActive =
                capturing?.action === id && capturing.kind === "pad";
              return (
                <div
                  key={id}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="text-[11px] font-medium uppercase leading-none tracking-[0.12em] text-[var(--m-muted2)]">
                    {label}
                  </span>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      aria-label={`${label} — keyboard`}
                      onClick={() =>
                        setCapturing(
                          keyActive ? null : { action: id, kind: "key" }
                        )
                      }
                      className={`mono-focus flex h-9 flex-1 items-center justify-center border-2 px-4 ${
                        keyActive
                          ? "border-[var(--m-accent)]"
                          : "border-[var(--m-dim)]"
                      }`}
                    >
                      <span
                        className={`text-[11px] uppercase leading-none tracking-[0.12em] ${
                          keyActive
                            ? "text-[var(--m-accent)]"
                            : "text-[var(--m-fg)]"
                        }`}
                      >
                        {keyActive ? "PRESS KEY…" : bindingLabel(value[id])}
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-label={`${label} — gamepad`}
                      onClick={() =>
                        setCapturing(
                          padActive ? null : { action: id, kind: "pad" }
                        )
                      }
                      className={`mono-focus flex h-9 flex-1 items-center justify-center border-2 px-4 ${
                        padActive
                          ? "border-[var(--m-accent)]"
                          : "border-[var(--m-dim)]"
                      }`}
                    >
                      <span
                        className={`text-[11px] uppercase leading-none tracking-[0.12em] ${
                          padActive
                            ? "text-[var(--m-accent)]"
                            : "text-[var(--m-fg)]"
                        }`}
                      >
                        {padActive
                          ? "PRESS BUTTON…"
                          : bindingLabel(padValue[id])}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 flex justify-end gap-3">
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
            <Button variant="primary" onClick={closeModal}>
              Done
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: fails at `tetris-board.tsx`'s `<ControlsModal>` call (missing `padValue`/`padDefaults`/`onPadChange`) — expected, fixed in Task 5. Confirm there are no OTHER type errors in `controls-modal.tsx` itself.

- [ ] **Step 3: Lint**

Run: `npm run lint -- src/features/arcade/shared/ui/controls-modal.tsx`
Expected: 0 errors in this file.

- [ ] **Step 4: Commit**

```bash
git add src/features/arcade/shared/ui/controls-modal.tsx
git commit -m "feat(arcade): ControlsModal captures gamepad button bindings alongside keyboard"
```

---

### Task 5: Wire `TetrisBoard` to the new `ControlsModal` props + manual verification

**Files:**

- Modify: `src/features/arcade/tetris/ui/tetris-board.tsx:1-21, 208-215`

**Interfaces:**

- Consumes: `api.padBindings`/`api.setPadBindings` (Task 3), `TETRIS_DEFAULT_GAMEPAD_BINDINGS` (Task 2), `ControlsModal`'s new props (Task 4).
- Produces: nothing further downstream — this is the integration point.

- [ ] **Step 1: Import the gamepad defaults**

In `src/features/arcade/tetris/ui/tetris-board.tsx`, replace line 20:

```ts
import { TETRIS_ACTIONS, TETRIS_DEFAULT_BINDINGS } from "../model/bindings";
import { TETRIS_DEFAULT_GAMEPAD_BINDINGS } from "../model/gamepad-bindings";
```

- [ ] **Step 2: Pass the new props to `ControlsModal`**

Replace lines 208-215:

```tsx
<ControlsModal
  isOpen={controlsOpen}
  onOpenChange={closeControls}
  actions={TETRIS_ACTIONS}
  value={api.bindings}
  defaults={TETRIS_DEFAULT_BINDINGS}
  onChange={api.setBindings}
  padValue={api.padBindings}
  padDefaults={TETRIS_DEFAULT_GAMEPAD_BINDINGS}
  onPadChange={api.setPadBindings}
/>
```

- [ ] **Step 3: Typecheck + lint (whole project)**

Run: `npm run typecheck && npm run lint`
Expected: 0 errors — this resolves the `ControlsModal` prop-mismatch flagged (expected) at the end of Task 4.

- [ ] **Step 4: Run the full test suite**

Run: `npx vitest run`
Expected: PASS — no regressions in unrelated suites.

- [ ] **Step 5: Manual verification with the dev server**

Run: `npm run dev`, open the Tetris board, open Controls from the menu.

Verify:

- Every action row shows two chips; the second reads the current gamepad binding (or "—" with no controller connected).
- Clicking the gamepad chip shows "PRESS BUTTON…"; pressing a button on a connected controller assigns it and the label updates (e.g. rebind `hardDrop` to a different button, confirm hard-dropping in-game now requires the new button).
- Escape cancels an in-progress gamepad capture.
- Reset restores BOTH keyboard and gamepad chips to their defaults in one click.
- The analog stick still moves/soft-drops regardless of what's bound to `moveLeft`/`moveRight`/`softDrop`.
- Chip spacing/typography reads consistent with the rest of the modal (11px/0.12em uppercase, `gap-3` between the two chips, `.mono-focus` ring on tab) — adjust classes if anything looks off-scale per the design system in `CLAUDE.md`.

- [ ] **Step 6: Commit**

```bash
git add src/features/arcade/tetris/ui/tetris-board.tsx
git commit -m "feat(arcade): wire gamepad rebinding into the Tetris CONTROLS modal"
```

---

### Task 6: Move the HOLD preview to the left of the well (sm+)

**Files:**

- Modify: `src/features/arcade/tetris/ui/tetris-board.tsx:84-150`

**Interfaces:**

- Consumes: `api.holdCanvasRef` (unchanged ref, just relocated in the JSX).
- Produces: nothing downstream — pure layout change.

- [ ] **Step 1: Replace the stage's left-spacer/canvas/panel block**

Replace lines 84-150 of `tetris-board.tsx`:

```tsx
{
  /* Well ↔ side-panel gap = 40px (`gap-10`, owner pick after the label was
            dropped) — a layout-column separation on the 4px grid. */
}
{
  /* aspect-[30/18] = the snake boards' footprint, so every arcade board
            renders the same height at the same column width. */
}
{
  /* p-5 pulls the canvas in from the CornerBrackets (the frame reads as a
            stage around it) and centres the height-fit well in the footprint —
            40 read too far (the game shrank noticeably); 20 is the owner pick. */
}
{
  /* min-h-0 is LOAD-BEARING for the fullscreen round-trip: aspect-ratio
            boxes get a content-based automatic minimum height, so after exiting
            fullscreen the still-large canvas would prop the stage open forever. */
}
<div
  className={`flex aspect-[30/18] min-h-0 w-full items-stretch justify-center gap-5 p-5 sm:gap-10 ${FULLSCREEN_STAGE}`}
>
  {/* HOLD preview, left of the well (conventional Tetris layout — guideline
            games put HOLD left / NEXT right). DESKTOP-ONLY, matching the spacer it
            replaces: on a phone (esp. portrait fullscreen) there's no room for a
            left column. */}
  <div className="hidden w-20 shrink-0 flex-col items-center gap-2 self-center sm:flex">
    <PanelLabel>HOLD</PanelLabel>
    <canvas
      ref={holdCanvasRef}
      aria-label="Hold piece"
      role="img"
      className="block h-6 w-12"
    />
  </div>
  {/* The well: JS-sized to an EXACT 10×20 cell multiple (no leftover strip);
              `h-full`/aspect are only the pre-hydration fallback — inline w/h override
              them. `self-center` centres it if the height-fit leaves side margin. */}
  <canvas
    ref={canvasRef}
    aria-label={`Tetris well. ${bindingLabel(b.moveLeft)} and ${bindingLabel(
      b.moveRight
    )} to move, ${bindingLabel(b.rotateCW)} to rotate, ${bindingLabel(
      b.hardDrop
    )} to hard drop.`}
    role="img"
    className="block h-full self-center border-2 border-[var(--m-dim)] [aspect-ratio:1/2]"
  />

  {/* Beside the well: the NEXT preview + the run readouts (owner call
            2026-07-04 — Score/Lines/Level joined the board so FULLSCREEN shows
            them; the top stats band is outside the fullscreen element). NEXT
            kept its label and border-less look (owner call — it reads as one
            more readout in the column, not a boxed widget); its cells track
            the well's at NEXT_CELL_SCALE — the hook sizes the canvas to
            NEXT_COLS·cell·scale; `size-12` is only the pre-hydration fallback.
            Fixed w-20: growing score digits never change the panel width and
            re-size the well mid-run. */}
  <div
    ref={panelRef}
    className="flex w-20 shrink-0 flex-col items-center gap-6 self-center"
  >
    <div className="flex flex-col items-center gap-2">
      <PanelLabel>NEXT</PanelLabel>
      <canvas
        ref={nextCanvasRef}
        aria-label="Next piece"
        role="img"
        className="block h-6 w-12"
      />
    </div>
    <PanelReadout label="SCORE" value={state.score} />
    <PanelReadout label="LINES" value={state.lines} />
    <PanelReadout label="LEVEL" value={state.level} />
  </div>
</div>;
```

(This removes the old invisible `w-20` mirror `<div>` entirely — the visible HOLD panel now does that centering job — and removes the HOLD block from the right-hand panel, which now starts at NEXT.)

- [ ] **Step 2: Typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: 0 errors.

- [ ] **Step 3: Manual verification with the dev server**

Run: `npm run dev` (or reuse the already-running one from Task 5), open the Tetris board at a viewport ≥640px wide.

Verify:

- HOLD renders to the LEFT of the well, NEXT + SCORE/LINES/LEVEL to the right.
- The well is still visually centered in the stage (same as before — the HOLD panel now does the job the invisible spacer used to).
- Holding a piece (via keyboard or gamepad `hold` action) still draws into the correct (now left-side) canvas.
- Below 640px width: layout is unaffected (still the placeholder path, out of scope).
- Fullscreen toggle still works and HOLD/NEXT positions hold up inside fullscreen.

- [ ] **Step 4: Commit**

```bash
git add src/features/arcade/tetris/ui/tetris-board.tsx
git commit -m "feat(arcade): move Tetris HOLD preview left of the well (sm+)"
```

---

## Plan Self-Review Notes

- **Spec coverage:** Feature 1 (gamepad rebinding: architecture, defaults, UI, Reset-both, stick exemption) is covered by Tasks 1-5. Feature 2 (HOLD left of well, sm+ only) is covered by Task 6. Both spec "Out of scope" items (stick remapping, multi-gamepad, other arcade games) are untouched by every task above.
- **Type consistency:** `padBindings`/`setPadBindings` (Task 3) match the prop names threaded in Task 5 (`api.padBindings`, `api.setPadBindings`); `padValue`/`padDefaults`/`onPadChange` (Task 4) match the prop names passed in Task 5. `createGamepadPoller(getBindings)` (Task 2) matches its only call site (Task 3, `pollPadRef`).
- **No placeholders:** every step has literal code; no "add tests for the above" or "handle edge cases" steps.
