# CONTROLS modal: keyboard becomes informational-only (no rebind), across all three games

## Context

Tetris currently lets the player rebind BOTH keyboard and gamepad via the
CONTROLS modal. Snake and 2048 (just shipped) rebind gamepad only and show
no keyboard information at all. The owner wants keyboard rebinding removed
everywhere — keyboard becomes a **read-only reference** (current PC keys,
not clickable) — and wants that same read-only keyboard column added to
Snake and 2048 too, so all three games show the same three-column shape:
**action · keyboard (info) · gamepad (rebindable)**.

Gamepad rebinding is UNCHANGED by this spec — only the keyboard side of the
modal changes, from "rebindable" to "informational."

## Scope

### 1. `ControlsModal` — drop keyboard rebind, add a static keyboard column

`src/features/arcade/shared/ui/controls-modal.tsx` loses its keyboard
capture machinery entirely: no more `"key"` vs `"pad"` capture kind (only
gamepad capture exists now), no more keyboard `useEffect` that listens for
`keydown` and calls `rebind`. The props shrink from `value`/`defaults`/
`onChange` (the rebind trio) to a single `keyboardValue?: BindingMap<A>` —
when provided, its codes render as static, non-interactive chips (a new
`KeyInfoChip`, visually similar to the existing gamepad `CaptureChip` but a
plain `<div>`, no border-hover, no click handler, no "PRESS KEY…" state).
When omitted, the keyboard column is hidden (single-column layout) — kept
optional for a hypothetical future game with no keyboard input, though all
three current games will provide it.

Escape still cancels an in-progress GAMEPAD capture (the only kind of
capture left). Reset only ever resets the gamepad map now (there's no
keyboard map to reset).

This is a rewrite of the component's capture logic, not a "gamepad-only
mode" toggle layered on the old three-value keyboard API — the old
`keyboardEnabled` ternary from the prior "gamepad-only mode" work is
removed along with the machinery it was gating.

### 2. Tetris — keyboard rebind removed, defaults become fixed

- `src/features/arcade/tetris/model/bindings.ts`: drop `TETRIS_KEYS_STORAGE`
  (nothing loads/saves keyboard bindings anymore). `TETRIS_DEFAULT_BINDINGS`
  stays — it's now the ONE fixed keyboard map, not a "default to reset to."
- `src/features/arcade/tetris/model/use-tetris-game.ts`: remove the
  `bindings`/`setBindingsState`/`bindingsRef`/hydration-effect/`setBindings`
  block entirely. The keyboard handler's `actionOf`/`stillHeld` helpers read
  `TETRIS_DEFAULT_BINDINGS` directly (a plain constant) instead of
  `bindingsRef.current` — behavior for any player who never touched the old
  rebind UI is unchanged, since defaults never changed for them either.
  `keysSuspendedRef`/`setKeysSuspended` are UNCHANGED — the modal still
  needs to own input capture while a gamepad rebind is in progress (Enter
  pressed mid-capture must not also fire `start()`).
- `src/features/arcade/tetris/model/types.ts`: drop `bindings`/`setBindings`
  from `TetrisGameApi`.
- `src/features/arcade/tetris/ui/tetris-board.tsx`: the `PauseOverlay` hint
  (`${keyLabel(b.pause[0] ?? "KeyP")} to resume`) reads
  `TETRIS_DEFAULT_BINDINGS.pause[0]` directly now (no more `api.bindings`,
  no more `?? "KeyP"` fallback — the constant is never empty).
  `ControlsModal`'s call site passes `keyboardValue={TETRIS_DEFAULT_BINDINGS}`
  instead of `value`/`defaults`/`onChange`.

### 3. Snake + 2048 — add the informational keyboard column

Neither game has ever had a keyboard `BindingMap` (their keyboard handling
is raw inline `key`/`code` checks, unchanged by this spec — this is display
only, not a refactor of how keys are actually read). Each gets one new
constant, added to its existing `gamepad-bindings.ts` (no new file — it
already holds this game's action list):

- `src/features/arcade/snake-classic/model/gamepad-bindings.ts`: add
  `SNAKE_CLASSIC_KEYBOARD_INFO: BindingMap<SnakeClassicAction>` mirroring
  the hook's actual hardcoded keys (`ArrowUp/KeyW`, `ArrowDown/KeyS`,
  `ArrowLeft/KeyA`, `ArrowRight/KeyD`, `Enter/Space` for start,
  `Space` for pause).
- `src/features/arcade/2048/model/gamepad-bindings.ts`: add
  `GAME_2048_KEYBOARD_INFO: BindingMap<Game2048Action>` mirroring 2048's
  hardcoded keys (same arrows/WASD, `Enter/Space` for both `start` and
  `continueRun` — both screens accept the same two keys today).
- Each board file passes the new constant as `keyboardValue` to its
  existing `ControlsModal` call (which currently omits keyboard props
  entirely) — no other change to either board file.

### 4. Out of scope

- Any change to how Snake/2048 actually READ keyboard input (still raw
  inline checks — this spec only adds a DISPLAY constant, doesn't refactor
  key-reading into a `BindingMap`-driven lookup the way Tetris's does).
- Gamepad rebinding (unchanged in all three games).
- Stay Awake (still out of scope, as before).

## Testing

- `npm run typecheck && npm run lint` — 0 errors.
- `npx vitest run src/features/arcade` — existing suites pass; no test
  exercises `ControlsModal`'s rendering (no prior test file), consistent
  with the established pattern for this component.
- Manual: open CONTROLS on each of the three games — keyboard column shows
  the correct static keys, is NOT clickable (no hover border change, no
  "PRESS KEY…" state ever appears), Escape still cancels an armed gamepad
  capture, gamepad rebind/reset still work exactly as before.
