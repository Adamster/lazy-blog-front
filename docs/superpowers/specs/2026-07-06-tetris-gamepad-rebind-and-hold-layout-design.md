# Tetris: gamepad button remapping + HOLD panel on the left

## Context

Two independent, small changes to the Tetris arcade game (`src/features/arcade/tetris/**`):

1. **Bug/gap:** the CONTROLS modal (`ControlsModal` + `shared/model/key-bindings.ts`) only
   captures and stores `KeyboardEvent.code` values. Gamepad input is a fully separate,
   hardcoded system (`shared/model/gamepad.ts`, doc-commented "fixed v1") with zero link
   to the rebind UI — a user with a gamepad has no way to remap what any button does.
2. **Layout:** the HOLD preview currently sits stacked above NEXT in the single panel
   column to the right of the well. Most Tetris implementations (guideline-style) put
   HOLD to the left of the well and NEXT to the right. The owner wants that convention.

Both changes are scoped to desktop/tablet (`sm:` breakpoint, ≥640px). Below that, the
board currently renders a placeholder for anything under 600px viewport width, so mobile
layout is out of scope for this spec.

## Feature 1 — Gamepad button remapping

### Goals

- Every `TetrisAction` (`moveLeft`, `moveRight`, `softDrop`, `hardDrop`, `rotateCW`,
  `rotateCCW`, `hold`, `pause`) gets an independently rebindable gamepad button, alongside
  its existing rebindable keyboard key.
- Default gamepad mapping is byte-identical to today's hardcoded behavior — only the
  ability to change it is new.
- The analog stick (left stick, and D-pad-as-axes) keeps unconditionally feeding
  `moveLeft`/`moveRight`/`softDrop` exactly as it does today, regardless of what buttons
  are bound to those actions. It is not part of the rebindable surface.

### Architecture

Reuse the existing generic `BindingMap<A>` / `loadBindings` / `saveBindings` / `rebind`
from `src/features/arcade/shared/model/key-bindings.ts` completely unchanged. Gamepad
buttons are encoded as strings `"Pad0"` … `"Pad16"` (the button's index in the Standard
Gamepad layout, matching what `gamepad.ts` already assumes). This means gamepad bindings
are just a second, independent `BindingMap<TetrisAction>` instance under its own
storage key — no new persistence/rebind logic needed.

**New file** `src/features/arcade/tetris/model/gamepad-bindings.ts` (mirrors the existing
`bindings.ts`):

```ts
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

(Values match the current hardcoded indices in `gamepad.ts`: D-pad up/down/left/right =
12/13/14/15, A/B = 0/1, LB/RB = 4/5, Start = 9.)

**`key-bindings.ts` addition:** a `padLabel(code: string): string` helper (or extend
`keyLabel`/`bindingLabel` to dispatch on a `"Pad"` prefix) with a label table:

```
Pad0 A · Pad1 B · Pad2 X · Pad3 Y · Pad4 LB · Pad5 RB · Pad6 LT · Pad7 RT ·
Pad8 BACK · Pad9 START · Pad10 L3 · Pad11 R3 ·
Pad12 D-PAD ↑ · Pad13 D-PAD ↓ · Pad14 D-PAD ← · Pad15 D-PAD → · Pad16 HOME
```

**`use-tetris-game.ts`:** add `padBindings` state hydrated via `loadBindings` on mount
(same pattern as `bindings`), plus `setPadBindings` (saves via `saveBindings`, resets
in-flight input the same way `setBindings` does today) exposed on `TetrisGameApi`.

**`gamepad.ts` (`createGamepadPoller`):** generalize from the current hardcoded
`btn(0)`/`btn(1)`/… reads to a lookup against the live `padBindings` map, mirroring the
keyboard handler's `actionOf(code)` pattern — for each `TETRIS_ACTION_IDS` entry, check
if any of its bound `Pad<n>` codes is currently pressed. Edge-detection (press vs hold)
for hardDrop/rotateCW/rotateCCW/hold/pause stays exactly as today (compare against the
previous frame's snapshot); moveLeft/moveRight/softDrop stay level-triggered (holds).
The analog-stick axis checks (`axisX`/`axisY` vs `DEADZONE`) are NOT looked up through
`padBindings` — they stay hardcoded exactly as now, OR'd in unconditionally alongside
whatever button is bound to those three actions.

### UI — `ControlsModal`

Each action row currently renders one clickable chip (the keyboard binding). It gains a
second chip alongside it for the gamepad binding — both chips live in the same row.
Clicking a chip arms capture for `{ action, kind: "key" | "pad" }`.

- `kind: "key"` capture: unchanged — the existing `window` `keydown` capture-phase
  listener.
- `kind: "pad"` capture: a `requestAnimationFrame` polling loop reading
  `navigator.getGamepads()` each frame, diffing against the previous frame's
  `button.pressed` array; the first button whose state transitions false→true is
  captured, assigned via the same `rebind()` call (against the pad `BindingMap`, so it
  only steals from other gamepad bindings, never from keyboard ones), and capture ends.
  A keyboard `Escape` press still cancels capture regardless of `kind` (the existing
  `window` keydown listener stays mounted during "pad" capture too, for this purpose
  only).
- The gamepad chip column always renders (with its current binding or "—"), even with
  no gamepad connected — clicking it just arms capture that will resolve whenever a
  button press is next observed; no "connect a controller" gating.

`ControlsModal` therefore needs two more props threaded from `TetrisBoard` (mirroring
the existing keyboard ones): `padValue`, `padDefaults`, `onPadChange` — sourced from
`api.padBindings` / `TETRIS_DEFAULT_GAMEPAD_BINDINGS` / `api.setPadBindings`.

The existing "Reset" button resets only the keyboard map today (`onChange(defaults)`);
it must now reset both maps in one click — `onChange(defaults)` and
`onPadChange(padDefaults)` together — so Reset restores the full default control scheme,
not just half of it.

### Out of scope

- Remapping the analog stick itself.
- Multi-gamepad support (still picks the first connected pad, unchanged).
- Any change to Snake/2048/other arcade games (none of them have rebinding at all today).

## Feature 2 — HOLD panel to the left of the well

### Current layout (`tetris-board.tsx`)

```
[ invisible w-20 spacer ]  [ well canvas ]  [ panel: HOLD, NEXT, SCORE, LINES, LEVEL ]
        sm:block only            (all)                        (all)
```

The invisible spacer exists purely so the well renders visually centered relative to
the right-hand panel's width, and is deliberately `sm:`-only per an existing code
comment (it broke mobile layout when tried there).

### New layout (sm+ only)

Replace the invisible spacer with a real HOLD panel, reusing the exact same
`PanelLabel` + canvas markup already used for HOLD today — just relocated:

```
[ HOLD panel, w-20 ]  [ well canvas ]  [ panel: NEXT, SCORE, LINES, LEVEL ]
    sm:flex only            (all)                     (all)
```

- Left panel: `hidden w-20 shrink-0 flex-col items-center gap-2 self-center sm:flex`,
  containing `<PanelLabel>HOLD</PanelLabel>` + the `holdCanvasRef` canvas — identical
  markup to what exists today, moved out of the right-hand panel.
- Right panel: unchanged except the HOLD block (and its `gap-6` slot) is removed —
  `NEXT` becomes the first item, followed by `SCORE`/`LINES`/`LEVEL`.
- Below `sm`: no change. The mobile placeholder (viewport < 600px) means this path
  isn't rendered as a real layout today, so nothing to preserve or migrate there.

No hook/logic changes for this feature — `holdCanvasRef` is still drawn into by the
same engine code; only its DOM position moves.

## Testing

- `key-bindings.ts`/`gamepad-bindings.ts`: extend the existing
  `key-bindings.test.ts` (or add a sibling test) to cover `Pad<n>` codes round-tripping
  through `loadBindings`/`saveBindings`/`rebind` the same as keyboard codes today.
- Manual verification (no automated test harness for actual `Gamepad` hardware):
  connect a controller, open Controls, rebind a few actions on both keyboard and
  gamepad columns, confirm defaults still work pre-rebind, confirm Reset restores both
  keyboard and gamepad defaults, confirm stick input still moves/soft-drops regardless
  of button rebinds.
- Visual check of the HOLD/NEXT layout swap at `sm` and above; confirm the well stays
  centered (same width budget as the old invisible-spacer arrangement).
