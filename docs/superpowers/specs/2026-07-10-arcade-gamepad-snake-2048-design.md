# Gamepad-only controls for Snake + 2048

## Context

Tetris already has full keyboard-and-gamepad rebinding via a CONTROLS modal, on
shared infra: `src/features/arcade/shared/model/key-bindings.ts`
(`BindingMap`/`loadBindings`/`saveBindings`/`rebind`/`keyLabel`/`bindingLabel`),
`src/features/arcade/shared/model/gamepad.ts` (`createGamepadPoller`), and
`src/features/arcade/shared/ui/controls-modal.tsx` (`ControlsModal`/
`CaptureChip`).

This spec supersedes the unimplemented
`2026-07-06-arcade-controls-rollout-design.md` for two reasons: (1) "Snake"
and "Snake Classic" have since been merged into one surviving Snake game
(feature folder `src/features/arcade/snake-classic`, route `/arcade/snake`,
title "Snake" — see `2026-07-10-arcade-remove-rabbit-hollow-sloth-design.md`),
and (2) the owner wants **gamepad support only** this time — **no keyboard
rebinding**. Keyboard behavior in both games stays exactly as it is today,
completely untouched. **Stay Awake is out of scope** (not requested).

Scope: add gamepad play + a gamepad-only CONTROLS modal to exactly two games —
**2048** (`src/features/arcade/2048/`) and **Snake**
(`src/features/arcade/snake-classic/`).

## Current state (surveyed)

Neither game has any gamepad support. Both are single `keydown`-only
handlers dispatching a one-shot edge — simpler to retrofit than Tetris (no
held-key/DAS pattern to replicate):

| Game  | Actions                                                   | Current hardcoded keys                                                                                  | Input model                                                                                                        |
| ----- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 2048  | moveLeft, moveRight, moveUp, moveDown, start, continueRun | ←/A, →/D, ↑/W, ↓/S (`use-2048-game.ts:57-63`); start/continue: Enter/Space/`" "` (`:305-334`)           | One-shot edge written to `inputRef.current.dir`, drained by `Engine2048.update()` (`:252`)                         |
| Snake | moveUp, moveDown, moveLeft, moveRight, start, pause       | ↑/W, ↓/S, ←/A, →/D (`use-snake-classic-game.ts:351-354`); start: Enter/Space; pause: Space (`:344-349`) | Direct call — `steer(x,y)` calls `getEngine().steer(x,y)` (`:151-155`); `start`/`togglePause` are direct calls too |

Neither hook has a `keysSuspendedRef` today (Tetris does, `use-tetris-game.ts:238,284-287,552`) — needed so the game's own keyboard handler goes inert while the (new, gamepad-only) CONTROLS modal is open, exactly mirroring Tetris's existing pattern. Both games' "Controls" entry point only exists on the **menu screen** (same as Tetris's `MenuOverlay` `extra` slot, `tetris-board.tsx:169-193`), so the directional/movement code paths never run while the modal is open regardless (that code only runs when `screen === "playing"`) — the only leak to guard is the menu screen's own Enter/Space "start" key and a gamepad "start" action firing underneath an open modal.

## Prerequisite: generalize `createGamepadPoller` (touches Tetris — regression risk)

`src/features/arcade/shared/model/gamepad.ts` is currently hardcoded to
Tetris's 8-action `PadFrame` shape and computes edge-vs-hold + axis fallback
internally. This must become genuinely generic before 2048/Snake (a
different, smaller action set each) can use it.

**New signature** (verbatim, current file for reference: `gamepad.ts:67-111`):

```ts
export function createGamepadPoller<A extends string>(
  actionIds: readonly A[],
  getBindings: () => BindingMap<A>
): () => Partial<Record<A, boolean>> & { anyPress: boolean };

/** Raw left-stick / D-pad-axis reading, unresolved against any action or
 *  deadzone — callers apply their own threshold and edge/hold semantics. */
export function readGamepadAxes(): { x: number; y: number };

export const GAMEPAD_DEADZONE: number; // was the module-private `DEADZONE`
```

`createGamepadPoller` now reports ONLY "is this action's bound button
currently held down," per action id, plus `anyPress` (any button on the pad
pressed) — no edge computation, no axis logic. Both move to the caller:

- **Edge-vs-hold** is the caller's call: Tetris treats `moveLeft`/`moveRight`/
  `softDrop` as holds (unchanged) and `hardDrop`/`rotateCW`/`rotateCCW`/
  `hold`/`pause`/(its menu `anyPress`) as edges it computes itself by diffing
  against a `prevPadRef` it now owns (previously `gamepad.ts` owned this
  internally).
- **Analog stick** fallback is the caller's call too: each hook calls the new
  `readGamepadAxes()` and ORs the result into whichever of its OWN actions
  represent directional movement, at the same `GAMEPAD_DEADZONE` (0.5)
  Tetris already uses.

**Tetris regression requirement:** `tetris/model/use-tetris-game.ts`'s
gamepad block (`:141,148-151,204-234,456-474`) is refactored to the new API
with IDENTICAL resulting behavior — same edge semantics (button diffed
frame-to-frame), same axis-exempt-from-rebinding behavior for
`moveLeft`/`moveRight`/`softDrop`, same `anyPress`-starts-from-menu and
`pause`-toggles-while-playing behavior gated by `keysSuspendedRef`. This is
the one place already-shipped, merged Tetris code changes in this spec, and
it must be manually verified afterward to behave identically (a gamepad, not
a unit test, is the only way to confirm feel — flag for the owner to check).

`gamepad.test.ts` (existing) needs reworking for the new generic signature —
same fake-Gamepad approach, existing cases translate directly, plus one new
case proving genericism with a DIFFERENT action set than Tetris's 8.

## `ControlsModal` gains a gamepad-only mode (touches Tetris's consumer — low risk)

`src/features/arcade/shared/ui/controls-modal.tsx`'s `value`/`defaults`/
`onChange` props (currently required, `:80-92`) become **optional**. When
all three are omitted, the modal renders **gamepad-only**: one chip column
per action instead of two (`grid-cols-[auto_1fr]` instead of
`grid-cols-[auto_1fr_1fr]`), no keyboard `CaptureChip`, and Reset only
resets the gamepad map (`onPadChange(padDefaults)`, skipping the
keyboard-defaults call). The keyboard-capture `useEffect` (`:104-119`) keeps
its Escape-cancel behavior unconditionally (Escape must still cancel an
armed gamepad capture) but only calls `onChange`/`rebind` for a `"key"`
capture, which can never be armed in gamepad-only mode since there's no
keyboard chip to click. Tetris passes all six props as it does today and is
behaviorally unaffected — this is a pure additive change (new optional
props), not a rewrite of the required-props path.

## Per-game work (2048, then Snake)

For each game:

1. **`<game>/model/gamepad-bindings.ts`** (new file, mirrors
   `tetris/model/gamepad-bindings.ts`): `<GAME>_DEFAULT_GAMEPAD_BINDINGS`
   (Standard-Gamepad defaults, see Decisions below) + `<GAME>_GAMEPAD_STORAGE`
   (a new, game-scoped localStorage key: `arcade.2048.pad.v1` /
   `arcade.snake-classic.pad.v1`).
2. **`<game>/model/types.ts`** (modify): add an action-id union + ordered
   `<GAME>_ACTIONS: readonly {id, label}[]` (for the modal's rows) to the
   game's own `bindings.ts`-equivalent location — since there's no keyboard
   `bindings.ts` this time, these live directly in `gamepad-bindings.ts`
   alongside the defaults (one file per game, not two, since gamepad is the
   only rebindable layer). Add `padBindings`/`setPadBindings`/
   `setKeysSuspended` to the game's `*GameApi` interface.
3. **`<game>/model/use-<game>-game.ts`** (modify):
   - Add `padBindings` state + `padBindingsRef` mirror + hydration effect
     (rAF-deferred `loadBindings`, mirroring Tetris's `use-tetris-game.ts:221-235`
     exactly) + `setPadBindings`.
   - Add `keysSuspendedRef` + `setKeysSuspended` (mirrors
     `use-tetris-game.ts:238,284-287`); the existing keydown handler gets one
     new early-return guard line at its top (mirrors `:552`) — no other
     keyboard-handling code changes.
   - Add a lazily-created poller via
     `createGamepadPoller(<GAME>_ACTION_IDS, () => padBindingsRef.current)`
     (mirrors `use-tetris-game.ts:141,148-151`), polled once per tick inside
     the existing rAF loop.
   - Compute this game's own edges: for each of the 4 movement actions,
     `pressed = held.moveX || axisExceedsThreshold`, `edge = pressed &&
!prevPad.current.moveX`, tracked in one `prevPadRef` the hook now owns;
     `start`/`continueRun`/`pause` are edges the same way (button-only, no
     axis). On a movement edge: 2048 sets `inputRef.current.dir` (same field
     the keyboard path already writes — the engine drains it either way, no
     engine change); Snake calls `steer(x, y)` directly (same function the
     keyboard path already calls). On a `start`/`continueRun`/`pause` edge:
     call the corresponding hook function directly, gated by
     `!keysSuspendedRef.current` (mirrors Tetris's `:457` gate) so an
     open CONTROLS modal can't also trigger the game underneath it.
   - No engine file changes in either game — this is purely an input-layer
     addition alongside the existing keyboard path, not a replacement of it.
4. **`<game>/ui/board-<game>.tsx`** (modify): add the (gamepad-only)
   `ControlsModal` + a "Controls" link under the Start button inside
   `MenuOverlay`'s `extra` slot — verbatim copy of Tetris's established
   pattern (`tetris-board.tsx:53-60,174-193,215-225`, minus the
   `value`/`defaults`/`onChange` props since this modal instance is
   gamepad-only).

## Decisions

1. **Gamepad default mapping per game** (all freely rebindable afterward via
   the CONTROLS modal — these are just sane starting points):
   - **2048**: D-pad/stick = move (4-directional), **A = start AND
     continueRun** (they never fire simultaneously — different screens),
     no pause action (2048 has none today).
   - **Snake**: D-pad/stick = steer (4-directional), **Start = pause**, **A
     = start** (menu/over).
2. **Order of the 2 games**: Snake, then 2048 — Snake's direct-call input
   model (`steer(x,y)`) is a smaller diff than 2048's ref-based one, so it's
   the better first pass to validate the pattern.
3. **Plan structure**: ONE implementation plan — the shared `gamepad.ts`
   generalization + `ControlsModal` gamepad-only mode + Tetris regression
   fix-up first (one task, most delicate), then Snake, then 2048 (each its
   own task/wave), executed sequentially via subagent-driven-development,
   same shape as the Rabbit/Hollow-Sloth cleanup plan. Manual gamepad
   verification (owed to the owner, no agent has gamepad hardware): confirm
   Tetris feels identical post-refactor, then confirm each new game's
   movement/start/pause + CONTROLS modal rebind/reset/Escape-cancel.

## Out of scope

- Keyboard rebinding for either game (explicit owner call — keyboard stays
  hardcoded exactly as today).
- Stay Awake (not requested this round).
- Any engine (`engine.ts`) or visual/draw changes in either game.
