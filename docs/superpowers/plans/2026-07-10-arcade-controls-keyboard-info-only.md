# CONTROLS modal: keyboard becomes informational-only — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove keyboard rebinding everywhere (Tetris is the only game that
had it) and make the CONTROLS modal's keyboard column purely informational
(current PC keys, not clickable) on all three games — Tetris, Snake, 2048.
Gamepad rebinding is unchanged.

**Architecture:** `ControlsModal` is rewritten: its three keyboard-rebind
props (`value`/`defaults`/`onChange`) collapse into one read-only
`keyboardValue`, and all keyboard-capture logic is deleted (only gamepad
capture remains). Tetris's hook drops its keyboard `bindings` state
entirely and reads the fixed `TETRIS_DEFAULT_BINDINGS` constant directly.
Snake and 2048 each get one new constant (`*_KEYBOARD_INFO`) purely for
display — neither game's actual keyboard-reading code changes at all.

**Tech Stack:** Next.js 16 (webpack), React 19, TypeScript, Vitest.

## Global Constraints

- `npm run typecheck` and `npm run lint` must stay at 0 errors after every
  task (per project CLAUDE.md).
- No code comments explaining WHAT code does — only WHY, when non-obvious
  (per project CLAUDE.md).
- Gamepad rebinding must be byte-for-byte unaffected in all three games.
- Snake's and 2048's actual keyboard-input READING code (the raw
  `key`/`code` checks in each hook) does not change — only a new constant
  is added for the modal to DISPLAY.

---

## Task 1: `ControlsModal` keyboard-info rewrite + Tetris update

**Files:**

- Modify: `src/features/arcade/shared/ui/controls-modal.tsx`
- Modify: `src/features/arcade/tetris/model/bindings.ts`
- Modify: `src/features/arcade/tetris/model/types.ts`
- Modify: `src/features/arcade/tetris/model/use-tetris-game.ts`
- Modify: `src/features/arcade/tetris/ui/tetris-board.tsx`

**Interfaces:**

- Consumes: nothing from other tasks.
- Produces: `ControlsModal`'s new prop shape (`keyboardValue?: BindingMap<A>`
  replacing `value`/`defaults`/`onChange`) — consumed by Task 2 (Snake) and
  Task 3 (2048), which currently omit keyboard props entirely and will add
  `keyboardValue` for the first time.

These five files must land together — `ControlsModal`'s prop rename breaks
its only current caller (Tetris) immediately, so this is one task, not two.

- [ ] **Step 1: Rewrite `controls-modal.tsx`**

  Replace the entire contents of `src/features/arcade/shared/ui/controls-modal.tsx` with:

  ```tsx
  "use client";

  import { Fragment, useEffect, useState } from "react";
  import { Button, Modal, ModalHeader } from "@/shared/ui";
  import { bindingLabel, rebind, type BindingMap } from "../model/key-bindings";
  import { codeGlyph, KbdBadge } from "./board-overlay";

  /** One gamepad capture chip inside a `ControlsModal` action row — a fixed 36px
   * (`h-9`) TRANSPARENT outline button (no own fill — the raised fill lives on the
   * inner key-caps, below), its border revealing accent on hover
   * (`hover:border-[var(--m-accent)]`, the shared `.mono-btn-outline` treatment) and
   * pinned accent while armed. Renders the current binding as `filled` icon-glyph
   * key-caps (the {@link KbdBadge} language shared with the menu key-hint rows, here
   * carrying the `--m-card` keycap fill so each key reads as a raised cap against the
   * transparent chip), or the plain "PRESS BUTTON…" placeholder while armed. Each
   * bound code becomes its own COMPACT keycap (`codeGlyph(code, true)` — `size-3`
   * icons a notch down from the menu's `size-3.5`) on the shared 20px square floor,
   * sitting `gap-1` apart (a chip only ever holds ONE action's alternates, so no `·`
   * separator); an unbound action shows the plain "—" mark. `aria-label` keeps the
   * spelled-out binding text for screen readers even though the visible chip is
   * icons. */
  function CaptureChip({
    active,
    ariaLabel,
    codes,
    onClick,
  }: {
    active: boolean;
    ariaLabel: string;
    codes: readonly string[];
    onClick: () => void;
  }) {
    return (
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={onClick}
        className={`mono-focus flex h-9 w-full items-center justify-center border-2 px-4 transition-colors ${
          active
            ? "border-[var(--m-accent)]"
            : "border-[var(--m-dim)] hover:border-[var(--m-accent)]"
        }`}
      >
        {active ? (
          <span className="text-[11px] uppercase leading-none tracking-[0.12em] text-[var(--m-accent)]">
            PRESS BUTTON…
          </span>
        ) : codes.length === 0 ? (
          <span className="text-[11px] uppercase leading-none tracking-[0.12em] text-[var(--m-muted2)]">
            —
          </span>
        ) : (
          <span className="flex items-center gap-1">
            {codes.map((code, i) => (
              <KbdBadge key={i} size="h-5 min-w-5 px-0.5" filled>
                {codeGlyph(code, true)}
              </KbdBadge>
            ))}
          </span>
        )}
      </button>
    );
  }

  /** Static, non-interactive display of the current KEYBOARD binding for one
   *  action — same keycap language as {@link CaptureChip}, but a plain `<div>`:
   *  no hover/active state, no click handler. Keyboard is informational only. */
  function KeyInfoChip({
    codes,
    ariaLabel,
  }: {
    codes: readonly string[];
    ariaLabel: string;
  }) {
    return (
      <div
        aria-label={ariaLabel}
        className="flex h-9 w-full items-center justify-center border-2 border-[var(--m-dim)] px-4"
      >
        {codes.length === 0 ? (
          <span className="text-[11px] uppercase leading-none tracking-[0.12em] text-[var(--m-muted2)]">
            —
          </span>
        ) : (
          <span className="flex items-center gap-1">
            {codes.map((code, i) => (
              <KbdBadge key={i} size="h-5 min-w-5 px-0.5" filled>
                {codeGlyph(code, true)}
              </KbdBadge>
            ))}
          </span>
        )}
      </div>
    );
  }

  /**
   * Gamepad-remapping modal for an arcade game: one row per action, an optional
   * informational keyboard column (current PC keys, not clickable) + a rebindable
   * gamepad chip. Click the gamepad chip to arm capture ("PRESS BUTTON…"); the
   * next polled button press binds it (stealing it from any other action).
   * Escape cancels an armed capture. The host must suspend its game keys while
   * the modal is open (all three games: `setKeysSuspended`).
   */
  export function ControlsModal<A extends string>({
    isOpen,
    onOpenChange,
    actions,
    keyboardValue,
    padValue,
    padDefaults,
    onPadChange,
  }: {
    isOpen: boolean;
    onOpenChange: () => void;
    actions: readonly { id: A; label: string }[];
    /** Informational only — current keyboard binding per action, rendered as
     *  static (non-clickable) chips. Omit to hide the keyboard column entirely. */
    keyboardValue?: BindingMap<A>;
    padValue: BindingMap<A>;
    padDefaults: BindingMap<A>;
    onPadChange: (next: BindingMap<A>) => void;
  }) {
    const keyboardShown = keyboardValue !== undefined;
    const [capturing, setCapturing] = useState<A | null>(null);

    // Escape cancels an armed gamepad capture.
    useEffect(() => {
      if (!capturing) return;
      const onKey = (e: KeyboardEvent) => {
        if (e.code !== "Escape") return;
        e.preventDefault();
        e.stopPropagation();
        setCapturing(null);
      };
      window.addEventListener("keydown", onKey, true);
      return () => window.removeEventListener("keydown", onKey, true);
    }, [capturing]);

    // Gamepad capture — poll for the first NEW button press (edge), assign it.
    useEffect(() => {
      if (!capturing) return;
      let raf = 0;
      let prevPressed: boolean[] | null = null; // null = no baseline captured yet
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
          if (prevPressed) {
            const pressedIndex = nowPressed.findIndex(
              (p, i) => p && !prevPressed![i]
            );
            if (pressedIndex !== -1) {
              onPadChange(rebind<A>(padValue, capturing, `Pad${pressedIndex}`));
              setCapturing(null);
              return;
            }
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
              subtitle="Click a slot, then press its new button. Esc cancels."
              onClose={closeModal}
            />
            <div
              className={`grid items-center gap-x-3 gap-y-4 ${
                keyboardShown
                  ? "grid-cols-[auto_1fr_1fr]"
                  : "grid-cols-[auto_1fr]"
              }`}
            >
              {actions.map(({ id, label }) => {
                const padActive = capturing === id;
                return (
                  <Fragment key={id}>
                    <span className="text-[11px] font-medium uppercase leading-none tracking-[0.12em] text-[var(--m-muted2)]">
                      {label}
                    </span>
                    {keyboardShown && (
                      <KeyInfoChip
                        codes={keyboardValue![id]}
                        ariaLabel={`${label} — keyboard: ${bindingLabel(keyboardValue![id])}`}
                      />
                    )}
                    <CaptureChip
                      active={padActive}
                      ariaLabel={`${label} — gamepad: ${padActive ? "press button" : bindingLabel(padValue[id])}`}
                      codes={padValue[id]}
                      onClick={() => setCapturing(padActive ? null : id)}
                    />
                  </Fragment>
                );
              })}
            </div>
            {/* One-off exception: a 2px `--m-dim` top rule caps this unusually
                dense modal (8 rows × 2 chip columns) so the Reset/Done footer reads
                as separated — every OTHER modal is spacing-only here. Same 2px
                `--m-dim` weight/token as the Tetris-menu rule. The rule sits with
                symmetric 24px air on BOTH sides: `mt-6` (outside the border box)
                separates it from the last action row, `pt-6` (inside) separates it
                from the buttons — so the line never collides with the PAUSE row's
                chip borders. */}
            <div className="mt-6 flex justify-end gap-3 border-t-2 border-[var(--m-dim)] pt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setCapturing(null);
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

- [ ] **Step 2: Drop `TETRIS_KEYS_STORAGE` from `bindings.ts`**

  In `src/features/arcade/tetris/model/bindings.ts`, find the last line:

  ```ts
  export const TETRIS_KEYS_STORAGE = "arcade.tetris.keys.v1";
  ```

  Delete it. Nothing else in this file changes — `TETRIS_ACTIONS`,
  `TETRIS_ACTION_IDS`, `TETRIS_DEFAULT_BINDINGS`, `TetrisAction` all stay
  (they're still used: `TETRIS_DEFAULT_BINDINGS` becomes the ONE fixed
  keyboard map, read directly by the hook and passed as `keyboardValue`).

- [ ] **Step 3: Drop `bindings`/`setBindings` from `TetrisGameApi`**

  In `src/features/arcade/tetris/model/types.ts`, find:

  ```ts
    history: HistoryPoint[];
    start: () => void;
    togglePause: () => void;
    /** Live remappable-key map — read by the keyboard handler, edited by CONTROLS. */
    bindings: BindingMap<TetrisAction>;
    setBindings: (next: BindingMap<TetrisAction>) => void;
    /** Live remappable-gamepad-button map — read by the gamepad poller, edited by
     *  CONTROLS. Independent of `bindings` (keyboard); rebinding one never touches
     *  the other. */
    padBindings: BindingMap<TetrisAction>;
    setPadBindings: (next: BindingMap<TetrisAction>) => void;
  ```

  Replace with:

  ```ts
    history: HistoryPoint[];
    start: () => void;
    togglePause: () => void;
    /** Live remappable-gamepad-button map — read by the gamepad poller, edited by
     *  CONTROLS. Keyboard is fixed (not remappable) — see `TETRIS_DEFAULT_BINDINGS`. */
    padBindings: BindingMap<TetrisAction>;
    setPadBindings: (next: BindingMap<TetrisAction>) => void;
  ```

- [ ] **Step 4: Remove the keyboard-bindings state block from the hook**

  In `src/features/arcade/tetris/model/use-tetris-game.ts`, find the import
  block (currently lines 25-30):

  ```ts
  import {
    TETRIS_ACTION_IDS,
    TETRIS_DEFAULT_BINDINGS,
    TETRIS_KEYS_STORAGE,
    type TetrisAction,
  } from "./bindings";
  ```

  Replace with:

  ```ts
  import {
    TETRIS_ACTION_IDS,
    TETRIS_DEFAULT_BINDINGS,
    type TetrisAction,
  } from "./bindings";
  ```

  Find:

  ```ts
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
        setBindingsState(
          loadBindings(TETRIS_KEYS_STORAGE, TETRIS_DEFAULT_BINDINGS)
        )
      );
      return () => cancelAnimationFrame(raf);
    }, []);

    const [padBindings, setPadBindingsState] = useState<BindingMap<TetrisAction>>(
  ```

  Delete the whole `bindings` block, keeping the `padBindings` declaration
  that follows it — result:

  ```ts
    const [padBindings, setPadBindingsState] = useState<BindingMap<TetrisAction>>(
  ```

- [ ] **Step 5: Remove `setBindings`**

  Find:

  ```ts
    const setBindings = useCallback((next: BindingMap<TetrisAction>) => {
      setBindingsState(next);
      saveBindings(TETRIS_KEYS_STORAGE, next);
      // Drop any in-flight holds — a key physically held across a remap would
      // otherwise resolve to a different/no action on keyup and stick forever.
      resetInput();
    }, []);

    const setPadBindings = useCallback((next: BindingMap<TetrisAction>) => {
  ```

  Delete the `setBindings` callback, keeping `setPadBindings` — result:

  ```ts
    const setPadBindings = useCallback((next: BindingMap<TetrisAction>) => {
  ```

- [ ] **Step 6: Point the keyboard handler at the fixed constant**

  Find:

  ```ts
  const actionOf = (code: string): TetrisAction | null => {
    const map = bindingsRef.current;
    for (const a of TETRIS_ACTION_IDS) {
      if (map[a].includes(code)) return a;
    }
    return null;
  };

  // A held action stays on while ANY of its bound keys is physically down
  // (defaults bind two keys per direction — ← + A etc.).
  const stillHeld = (a: TetrisAction) =>
    bindingsRef.current[a].some((code) => heldRef.current.has(code));
  ```

  Replace with:

  ```ts
  const actionOf = (code: string): TetrisAction | null => {
    for (const a of TETRIS_ACTION_IDS) {
      if (TETRIS_DEFAULT_BINDINGS[a].includes(code)) return a;
    }
    return null;
  };

  // A held action stays on while ANY of its bound keys is physically down
  // (defaults bind two keys per direction — ← + A etc.).
  const stillHeld = (a: TetrisAction) =>
    TETRIS_DEFAULT_BINDINGS[a].some((code) => heldRef.current.has(code));
  ```

- [ ] **Step 7: Drop `bindings`/`setBindings` from the return object**

  Find:

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
  }
  ```

  Replace with:

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
      padBindings,
      setPadBindings,
      setKeysSuspended,
    };
  }
  ```

- [ ] **Step 8: Update the board's call sites**

  In `src/features/arcade/tetris/ui/tetris-board.tsx`, find:

  ```ts
  const b = api.bindings;
  ```

  Replace with:

  ```ts
  const b = TETRIS_DEFAULT_BINDINGS;
  ```

  The file's existing import already covers this — confirm it still reads
  exactly:

  ```ts
  import { TETRIS_ACTIONS, TETRIS_DEFAULT_BINDINGS } from "../model/bindings";
  ```

  No import change needed in this file.

  Find the `PauseOverlay` line:

  ```ts
          <PauseOverlay hint={`${keyLabel(b.pause[0] ?? "KeyP")} to resume`} />
  ```

  Replace with:

  ```ts
          <PauseOverlay hint={`${keyLabel(b.pause[0])} to resume`} />
  ```

  Find the `ControlsModal` call site:

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

  Replace with:

  ```tsx
  <ControlsModal
    isOpen={controlsOpen}
    onOpenChange={closeControls}
    actions={TETRIS_ACTIONS}
    keyboardValue={TETRIS_DEFAULT_BINDINGS}
    padValue={api.padBindings}
    padDefaults={TETRIS_DEFAULT_GAMEPAD_BINDINGS}
    onPadChange={api.setPadBindings}
  />
  ```

- [ ] **Step 9: Typecheck, lint, and run Tetris's existing tests**

  Run: `npm run typecheck && npm run lint`
  Expected: 0 errors. (If typecheck flags an unused `BindingMap` import in
  `use-tetris-game.ts` — it's still used for `padBindings`'s type, so this
  should not happen; if it does, investigate rather than blindly removing
  the import.)

  Run: `npx vitest run src/features/arcade/tetris`
  Expected: all existing tests pass unchanged (no test exercises the
  keyboard-rebind UI or `ControlsModal`'s rendering).

- [ ] **Step 10: Manual verification note**

  Add to your report: open `/arcade/tetris`, confirm the CONTROLS modal
  shows three columns (action / keyboard info / gamepad), the keyboard
  column is NOT clickable (no hover border, no "PRESS KEY…" state ever
  appears), gamepad rebind still works exactly as before, and the
  PauseOverlay hint still reads "P to resume". A human with a gamepad still
  needs to confirm gamepad rebind/reset/Escape-cancel feel unchanged — you
  cannot verify this yourself.

- [ ] **Step 11: Commit**

  ```bash
  git add src/features/arcade/shared/ui/controls-modal.tsx \
    src/features/arcade/tetris/model/bindings.ts \
    src/features/arcade/tetris/model/types.ts \
    src/features/arcade/tetris/model/use-tetris-game.ts \
    src/features/arcade/tetris/ui/tetris-board.tsx
  git commit -m "feat(arcade): keyboard becomes informational-only in CONTROLS (Tetris)"
  ```

---

## Task 2: Add the informational keyboard column to Snake

**Files:**

- Modify: `src/features/arcade/snake-classic/model/gamepad-bindings.ts`
- Modify: `src/features/arcade/snake-classic/ui/snake-classic-board.tsx`

**Interfaces:**

- Consumes: `ControlsModal`'s new `keyboardValue` prop (Task 1).
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Add the keyboard-info constant**

  In `src/features/arcade/snake-classic/model/gamepad-bindings.ts`, find the
  last line:

  ```ts
  export const SNAKE_CLASSIC_GAMEPAD_STORAGE = "arcade.snake-classic.pad.v1";
  ```

  Add this block AFTER it:

  ```ts
  /** Informational only — mirrors the hook's actual hardcoded keyboard keys
   *  (`use-snake-classic-game.ts`'s `onKey` handler). NOT rebindable; this
   *  constant drives the CONTROLS modal's read-only keyboard column, nothing
   *  else. Keep in sync by hand if the hook's hardcoded keys ever change. */
  export const SNAKE_CLASSIC_KEYBOARD_INFO: BindingMap<SnakeClassicAction> = {
    moveUp: ["ArrowUp", "KeyW"],
    moveDown: ["ArrowDown", "KeyS"],
    moveLeft: ["ArrowLeft", "KeyA"],
    moveRight: ["ArrowRight", "KeyD"],
    start: ["Enter", "Space"],
    pause: ["Space"],
  };
  ```

- [ ] **Step 2: Wire it into the board's `ControlsModal` call**

  In `src/features/arcade/snake-classic/ui/snake-classic-board.tsx`, find
  the import:

  ```ts
  import {
    SNAKE_CLASSIC_ACTIONS,
    SNAKE_CLASSIC_DEFAULT_GAMEPAD_BINDINGS,
  } from "../model/gamepad-bindings";
  ```

  Replace with:

  ```ts
  import {
    SNAKE_CLASSIC_ACTIONS,
    SNAKE_CLASSIC_DEFAULT_GAMEPAD_BINDINGS,
    SNAKE_CLASSIC_KEYBOARD_INFO,
  } from "../model/gamepad-bindings";
  ```

  Find:

  ```tsx
  <ControlsModal
    isOpen={controlsOpen}
    onOpenChange={closeControls}
    actions={SNAKE_CLASSIC_ACTIONS}
    padValue={padBindings}
    padDefaults={SNAKE_CLASSIC_DEFAULT_GAMEPAD_BINDINGS}
    onPadChange={setPadBindings}
  />
  ```

  Replace with:

  ```tsx
  <ControlsModal
    isOpen={controlsOpen}
    onOpenChange={closeControls}
    actions={SNAKE_CLASSIC_ACTIONS}
    keyboardValue={SNAKE_CLASSIC_KEYBOARD_INFO}
    padValue={padBindings}
    padDefaults={SNAKE_CLASSIC_DEFAULT_GAMEPAD_BINDINGS}
    onPadChange={setPadBindings}
  />
  ```

- [ ] **Step 3: Typecheck, lint, and run Snake's existing tests**

  Run: `npm run typecheck && npm run lint`
  Expected: 0 errors.

  Run: `npx vitest run src/features/arcade/snake-classic`
  Expected: `engine.test.ts` passes unchanged (this task is a display-only
  addition, no engine or key-reading change).

- [ ] **Step 4: Manual verification note**

  Add to your report: open `/arcade/snake`, confirm CONTROLS now shows a
  keyboard column with the correct static keys (↑↓←→/WASD, Enter/Space for
  start, Space for pause), not clickable, and gamepad rebind still works.

- [ ] **Step 5: Commit**

  ```bash
  git add src/features/arcade/snake-classic/model/gamepad-bindings.ts \
    src/features/arcade/snake-classic/ui/snake-classic-board.tsx
  git commit -m "feat(arcade): add informational keyboard column to Snake's CONTROLS"
  ```

---

## Task 3: Add the informational keyboard column to 2048

**Files:**

- Modify: `src/features/arcade/2048/model/gamepad-bindings.ts`
- Modify: `src/features/arcade/2048/ui/board-2048.tsx`

**Interfaces:**

- Consumes: `ControlsModal`'s new `keyboardValue` prop (Task 1).
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Add the keyboard-info constant**

  In `src/features/arcade/2048/model/gamepad-bindings.ts`, find the last line:

  ```ts
  export const GAME_2048_GAMEPAD_STORAGE = "arcade.2048.pad.v1";
  ```

  Add this block AFTER it:

  ```ts
  /** Informational only — mirrors the hook's actual hardcoded keyboard keys
   *  (`use-2048-game.ts`'s `dirFor`/`isStart`). NOT rebindable; this constant
   *  drives the CONTROLS modal's read-only keyboard column, nothing else.
   *  Keep in sync by hand if the hook's hardcoded keys ever change. */
  export const GAME_2048_KEYBOARD_INFO: BindingMap<Game2048Action> = {
    moveLeft: ["ArrowLeft", "KeyA"],
    moveRight: ["ArrowRight", "KeyD"],
    moveUp: ["ArrowUp", "KeyW"],
    moveDown: ["ArrowDown", "KeyS"],
    start: ["Enter", "Space"],
    continueRun: ["Enter", "Space"],
  };
  ```

- [ ] **Step 2: Wire it into the board's `ControlsModal` call**

  In `src/features/arcade/2048/ui/board-2048.tsx`, find the import:

  ```ts
  import {
    GAME_2048_ACTIONS,
    GAME_2048_DEFAULT_GAMEPAD_BINDINGS,
  } from "../model/gamepad-bindings";
  ```

  Replace with:

  ```ts
  import {
    GAME_2048_ACTIONS,
    GAME_2048_DEFAULT_GAMEPAD_BINDINGS,
    GAME_2048_KEYBOARD_INFO,
  } from "../model/gamepad-bindings";
  ```

  Find:

  ```tsx
  <ControlsModal
    isOpen={controlsOpen}
    onOpenChange={closeControls}
    actions={GAME_2048_ACTIONS}
    padValue={padBindings}
    padDefaults={GAME_2048_DEFAULT_GAMEPAD_BINDINGS}
    onPadChange={setPadBindings}
  />
  ```

  Replace with:

  ```tsx
  <ControlsModal
    isOpen={controlsOpen}
    onOpenChange={closeControls}
    actions={GAME_2048_ACTIONS}
    keyboardValue={GAME_2048_KEYBOARD_INFO}
    padValue={padBindings}
    padDefaults={GAME_2048_DEFAULT_GAMEPAD_BINDINGS}
    onPadChange={setPadBindings}
  />
  ```

- [ ] **Step 3: Typecheck, lint, and run 2048's existing tests**

  Run: `npm run typecheck && npm run lint`
  Expected: 0 errors.

  Run: `npx vitest run src/features/arcade/2048`
  Expected: all existing tests pass unchanged.

- [ ] **Step 4: Manual verification note**

  Add to your report: open `/arcade/2048`, confirm CONTROLS now shows a
  keyboard column with the correct static keys, not clickable, and gamepad
  rebind still works.

- [ ] **Step 5: Commit**

  ```bash
  git add src/features/arcade/2048/model/gamepad-bindings.ts \
    src/features/arcade/2048/ui/board-2048.tsx
  git commit -m "feat(arcade): add informational keyboard column to 2048's CONTROLS"
  ```

---

## Task 4: Full-repo verification

**Files:** none (verification only).

**Interfaces:** none.

- [ ] **Step 1: Full typecheck, lint, and test suite**

  Run: `npm run typecheck && npm run lint && npx vitest run`
  Expected: 0 typecheck/lint errors; all tests pass except the 2
  pre-existing, unrelated failures in
  `src/shared/ui/overlays/submit-button.test.tsx`.

- [ ] **Step 2: Grep for leftover keyboard-rebind references**

  Run:

  ```bash
  grep -rn "TETRIS_KEYS_STORAGE\|setBindings\b" src
  ```

  Expected: no matches — confirms Task 1 fully removed the keyboard-rebind
  machinery (the `setBindings` grep should not match `setPadBindings` or
  `setBindingsState`, both different identifiers — if it does, refine and
  re-check by hand rather than trusting a false-positive grep blindly).

- [ ] **Step 3: Manual full pass (owed to the human)**

  Open `/arcade/tetris`, `/arcade/snake`, `/arcade/2048` — CONTROLS shows
  three columns on each, keyboard column is informational-only everywhere
  (no click response), gamepad rebind/reset/Escape-cancel all still work.
  With a physical gamepad: confirm Tetris still _feels_ identical (this
  task didn't touch gamepad logic, but confirm nothing regressed from the
  `bindings`-removal refactor).

  This step has no exit code to check — confirm each bullet and report
  back.
