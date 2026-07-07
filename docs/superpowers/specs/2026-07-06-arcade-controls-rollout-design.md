# Arcade CONTROLS rollout: keyboard + gamepad rebinding for 2048, Snake, Snake Classic, Stay Awake

## Context

Tetris (already shipped, merged) has a full CONTROLS modal: every action is rebindable
from both keyboard and gamepad, persisted independently per input type, via the shared
`BindingMap`/`loadBindings`/`saveBindings`/`rebind`/`keyLabel`/`bindingLabel`
infrastructure in `src/features/arcade/shared/model/key-bindings.ts`, a shared
`createGamepadPoller` in `src/features/arcade/shared/model/gamepad.ts`, and a shared,
generic `ControlsModal`/`CaptureChip` in `src/features/arcade/shared/ui/controls-modal.tsx`.

The owner wants full parity — keyboard AND gamepad rebinding — for the four remaining
arcade games: **2048, Snake ("Follow the Rabbit"), Snake Classic, Stay Awake**. (Hollow
Sloth is a `.gitignore`d, unlisted prototype — out of scope.)

## Current state (surveyed)

None of the four games has any gamepad support today, and none has a CONTROLS modal —
`MenuOverlay`'s `hints`/`extra` slots are Tetris-only right now. All four games are
structurally **simpler** to retrofit than Tetris was: none uses a held-key `Set` + DAS
pattern — they're single `keydown`-only handlers dispatching a one-shot edge (either
directly into the engine, or via a ref the loop drains). No held/DAS logic needs
porting; this is a "replace hardcoded key checks with a `BindingMap` lookup" job per
game, plus wiring in the (generalized) gamepad poller and the (already-generic)
`ControlsModal`.

| Game                            | Actions                                                                                  | Current hardcoded keys                                                     | Input model                                                                   |
| ------------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **2048**                        | moveLeft, moveRight, moveUp, moveDown, start (menu/over→play), continueRun (won-overlay) | ←/A, →/D, ↑/W, ↓/S; start/continue: Enter/Space                            | One-shot edge into `inputRef.current.dir`, drained by `Engine2048.update()`   |
| **Snake** ("Follow the Rabbit") | moveUp, moveDown, moveLeft, moveRight, start, togglePause                                | ↑/W, ↓/S, ←/A, →/D; pause: Space (playing); start: Enter/Space (menu/over) | Direct engine call — `getEngine().steer(x, y)`, no ref indirection            |
| **Snake Classic**               | Same shape as Snake                                                                      | Byte-identical mapping to Snake                                            | Same direct-call pattern as Snake                                             |
| **Stay Awake**                  | hop (left \| right only — a 2-lane hopper), start, togglePause                           | ←/A, →/D; pause: Space; start: Enter/Space                                 | One-shot edge into `inputRef.current.dir`, drained by the engine's `update()` |

All four already use `code` for WASD and `key` for arrows — both map cleanly onto the
existing `code`-keyed `BindingMap` (arrow `key` values have equally-valid `code` forms,
e.g. `key === "ArrowLeft"` ⟺ `code === "ArrowLeft"` — no behavior change swapping one
for the other).

## Prerequisite: generalize `createGamepadPoller`

`gamepad.ts`'s `PadFrame` interface and `createGamepadPoller`'s internals are hardcoded
to Tetris's 8-action shape (`left/right/softDrop/hardDrop/rotateCW/rotateCCW/hold/pause`)
despite the module doc claiming genericism. This must become genuinely action-set-generic
before any other game can use it.

**New signature:**

```ts
export function createGamepadPoller<A extends string>(
  actionIds: readonly A[],
  getBindings: () => BindingMap<A>
): () => Partial<Record<A, boolean>> & { anyPress: boolean };
```

Each action resolves to a HELD boolean (button currently down, per its bound `Pad<n>`
codes) each poll — callers decide for themselves which actions they treat as one-shot
edges (by diffing against their own previous-frame state, same as Tetris's `use-tetris-game.ts`
already does for `rotateCW`/`hardDrop`/etc. via `held.X && !prev.X`) versus which they
treat as level-triggered holds (Tetris's `left`/`right`/`softDrop`). This pushes the
edge-vs-hold distinction OUT of `gamepad.ts` and into each consumer — `gamepad.ts` itself
just reports "is this action's bound button down right now," generically, for any action
set. Tetris's own hook is refactored to compute its edges from this generic frame instead
of `gamepad.ts` doing it internally — this is the one place existing (already-shipped,
merged) Tetris code changes, and it must be verified to behave identically after the
refactor (same edge-detection semantics, same analog-stick exemption for
moveLeft/moveRight/softDrop-equivalent actions — see below).

**Analog stick:** Tetris's left-stick/D-pad-axis fallback for `moveLeft`/`moveRight`/
`softDrop` was hardcoded fully inside the old `createGamepadPoller`. In the generalized
version, the stick-axis fallback becomes the CALLER's responsibility too (each game ORs
its own axis reading into whichever of its OWN actions represent "left"/"right"/"down"
movement) — `gamepad.ts` no longer hardcodes which action names correspond to
directions, since a generic version can't assume every action set has a `moveLeft`. Each
game's hook, after calling the poller, ORs in its own `axisX`/`axisY` reads for its own
movement actions (2048/Snake/SnakeClassic: all four directions; Stay Awake: left/right
only). `gamepad.ts` exports the raw axis-reading helper (or each hook reads
`navigator.getGamepads()` axes directly — a tiny, ~4-line duplication across 4 games is
preferable to threading a callback-based axis API through the generic poller for a
one-time deadzone check).

## Per-game work (repeats 4×, same shape each time)

For each of {2048, Snake, Snake Classic, Stay Awake}:

1. **`<game>/model/bindings.ts`** (new file, mirrors `tetris/model/bindings.ts`):
   `<Game>Action` union, `<GAME>_ACTIONS: readonly {id, label}[]`, `<GAME>_ACTION_IDS`,
   `<GAME>_DEFAULT_BINDINGS: BindingMap<Action>` (the table above, unchanged from
   today's hardcoded defaults), `<GAME>_KEYS_STORAGE` (a new, game-scoped localStorage
   key, e.g. `arcade.2048.keys.v1`).
2. **`<game>/model/gamepad-bindings.ts`** (new file, mirrors `tetris/model/gamepad-bindings.ts`):
   `<GAME>_DEFAULT_GAMEPAD_BINDINGS` (the per-game Standard-Gamepad defaults fixed in
   the Decisions section below), `<GAME>_GAMEPAD_STORAGE`.
3. **`<game>/model/use-<game>-game.ts`** (modify): add `bindings`/`padBindings` state +
   hydration effects + `setBindings`/`setPadBindings`, mirroring Tetris's hook exactly
   (rAF-deferred `loadBindings` on mount, ref-mirrors for the keyboard/poll closures,
   `resetInput()`-equivalent on rebind). Replace the hardcoded key-check function
   (`dirFor()`/inline `if` chains) with an `actionOf(code)` lookup against the live
   `bindings` map. Wire the (now-generic) `createGamepadPoller(ACTION_IDS, () => padBindingsRef.current)`
   in place of the direct engine/ref calls, computing each game's own edge-vs-hold
   distinction and axis fallback as described above.
4. **`<game>/model/types.ts`** (modify): add `bindings`/`setBindings`/`padBindings`/
   `setPadBindings` to the game's API interface.
5. **`<game>/ui/board-<game>.tsx`** (modify): add the `ControlsModal` + a "Controls" link
   under the Start button in `MenuOverlay` (verbatim copy of Tetris's now-established
   pattern: the link, the `--m-dim` divider above it, `setKeysSuspended`-equivalent
   wiring so the modal owns input capture while open). Delete 2048's dead `KEY_HINTS`
   constant while touching this file.

No change to: engine files (`engine.ts`), draw/palette code, score/leaderboard data
layer, or the games' visual design — this is purely an input-layer retrofit.

## Testing

- `gamepad.test.ts` (existing, Tetris-authored) needs updating for the new generic
  `createGamepadPoller<A>(actionIds, getBindings)` signature — existing test cases
  translate directly (same fake-Gamepad approach), plus a new test confirming a
  DIFFERENT action set (not Tetris's 8) resolves correctly, to prove genericism.
- Each game's `bindings.ts` gets the same `key-bindings.test.ts`-style coverage Tetris's
  `TETRIS_DEFAULT_BINDINGS` already implicitly gets for free via the shared
  `rebind`/`loadBindings` tests (no NEW shared-infra tests needed — those are generic
  and already covered) — the only new per-game test surface is confirming
  `<GAME>_DEFAULT_BINDINGS`/`<GAME>_DEFAULT_GAMEPAD_BINDINGS` round-trip correctly,
  which is really just exercising the same generic functions with new data (low value
  to duplicate 4×; skip unless a game's action set reveals an edge case the generic
  tests don't cover).
- Manual verification per game (owed to the owner, no agent has gamepad/browser
  hardware): open Controls, rebind a few actions on both columns, confirm defaults,
  confirm Reset restores both maps, confirm the analog stick still moves regardless of
  button rebinds where applicable, confirm Escape cancels a gamepad capture.

## Decisions

1. **Gamepad default mapping per game** — Tetris's defaults mirrored its PRE-EXISTING
   hardcoded gamepad behavior (there was none for these 4 games, so there's nothing to
   preserve). Defaults (all freely rebindable afterward, so these are just sane
   out-of-the-box starting points, not locked-in choices):
   - **2048**: D-pad/stick = move (4-directional), A = start/continue, Start = —
     (no pause in this game).
   - **Snake / Snake Classic**: D-pad/stick = steer (4-directional), Start = pause,
     A = start (menu/over).
   - **Stay Awake**: D-pad-left/right or stick-X = hop left/right, Start = pause,
     A = start (menu/over).
2. **Order of the 4 games**: Snake Classic → 2048 → Stay Awake → Snake (Rabbit),
   matching the hub's current display order (Tetris already done, first in that order).
3. **Plan structure**: ONE implementation plan covering the shared `gamepad.ts`
   generalization (one task, touches Tetris too — needs its own careful regression
   check) followed by 4 near-identical waves of ~5 tasks each (one wave per game, in
   the order above), executed sequentially via subagent-driven-development, same as
   the Tetris plan. One PR for the whole rollout (may be split into several PRs along
   the way if that proves cleaner mid-flight).
