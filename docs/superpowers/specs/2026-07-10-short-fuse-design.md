# Short Fuse — Bomberman-like arcade game (design)

Date: 2026-07-10 · Status: approved by owner (brainstorm session)

## Summary

A canonical Bomberman-style PvE arcade game for `/arcade`, skinned copyright-safe as
**Short Fuse**. Grid maze, bombs with cross-shaped blasts, destructible soft blocks,
wandering enemies, powerups, endless procedural level progression. Mirrors the
snake-classic feature anatomy; zero backend changes (game key is a free-form string).

Owner references: Miniclip's "Playing with Fire 2" feel (smooth movement, chunky cute
character). Name/character/trade dress must not evoke Bomberman/Hudson/Konami.

## Identity

- **Title:** `Short Fuse` · **backend/leaderboard key:** `short-fuse` · **route:** `/arcade/short-fuse`.
- **Mascot: Fyze** — a walking bomb. Round `--m-fg` body, two stub legs, one wick with a
  `--m-error` spark (flickers 1px on/off; solid-on under `prefers-reduced-motion`), eyes as
  background-knockout pixels, single `--m-accent` belly band. One-mass silhouette, legible
  at 16–24px. Enemies/blocks share the chunky-pixel style on theme tokens.
- **Menu copy:** title `Short Fuse` · description `"The lazy way through a wall is a bomb."`
  · hint `"Space to light it"`.

## Rules (canonical PvE)

- **Arena 15×11** (odd×odd): indestructible frame + pillars at even/even intersections;
  soft blocks placed procedurally. Player spawn corner (and its two adjacent cells) always
  clear.
- **Movement: smooth sub-cell** — pixel-space position with velocity, grid-constrained
  sliding, corner-assist (nudges the player around a corner when nearly aligned). PwF feel,
  not tick-hop.
- **Bombs:** planted on the player's cell (Space), ~2s fuse, cross blast of current range,
  chain-detonates other bombs, stopped by pillars/frame, destroys soft blocks, kills
  enemies and the player. A planted bomb becomes solid once the player steps off its cell.
- **Enemies, 3 types:** wanderer (random turns at intersections), chaser (slower, walks
  toward the player through free cells — greedy step, no full pathfinding needed), skitter
  (fast, erratic). Contact with the player is lethal.
- **Exit:** hidden under one soft block; revealed when the block is destroyed, opens only
  after ALL enemies are dead; walking onto the open exit advances to the next level.
- **Lives: 3 per run.** Death = −1 life, the level regenerates (fresh layout), collected
  powerups are KEPT (kind mode, PwF-style). 0 lives = game over → score submit.
- **Level timer: 3:00.** Expiry = −1 life (same regenerate flow).

## Powerups

Drop from ~30% of destroyed soft blocks, picked up by walking over:

- `+bomb` — max simultaneous bombs +1
- `+range` — blast radius +1
- `+speed` — movement speed up (capped)
- **skull** — negative, 10s temporary debuff, random: slow OR range clamped to 1.
  Visually distinct but sits among the good drops — greed risk.

## Scoring (leaderboard metric)

- Soft block 10 · wanderer 100 · chaser 200 · skitter 300 · powerup pickup 50
- Level clear 500 + time bonus proportional to remaining timer.
- Endless progression: per-level params ramp — soft-block density, enemy count/mix/speed,
  tighter timer.

## Architecture — mirror of snake-classic, no backend changes

```
src/features/arcade/short-fuse/
  model/engine.ts        — pure stateful class, fixed-timestep update(dt), injectable rng
  model/types.ts
  model/arcade-keys.ts   — SHORT_FUSE_GAME = "short-fuse" + query-key factory
  model/gamepad-bindings.ts — actions: moveUp/Down/Left/Right, bomb, start, pause
  model/leaderboard.ts, score-history.ts, use-submit-score.ts,
        use-short-fuse-leaderboard.ts, use-my-arcade-stats.ts
  model/engine.test.ts   — blast propagation/chaining, collisions, level gen, powerups
                           (deterministic via injected rng)
  ui/short-fuse-board.tsx — canvas + MenuOverlay/PauseOverlay/GameOverOverlay/
                            ControlsModal/CornerBrackets/BoardFullscreenButton
  ui/fyze-mark.tsx       — theme-native SVG mark for the hub card
  ui/use-short-fuse-arcade.ts — orchestrator (engine hook + leaderboard + stats + submit)
  index.ts
src/app/arcade/short-fuse/
  page.tsx               — metadata (title, noindex), renders client page
  short-fuse-page.tsx    — StatsBand + board/leaderboard rail, desktop-only gating
```

Registration: add entry to `ARCADE_GAMES` (`shared/model/arcade-games.ts`) and a
`VISUALS` map entry (mark + cell field) in `hub/ui/arcade-page.tsx`. Leaderboard/submit/
my-stats endpoints already accept any game string.

### Engine & rendering

- Game loop: rAF + throttled-tab fallback (same as snake hook); engine consumes
  fixed-timestep `update(dt)` for smooth movement; bombs/blasts on timers.
- Canvas: DPR capped at 2, `image-rendering: pixelated`, sprites drawn as rect pixel-maps,
  theme tokens resolved on mount + `MutationObserver` on `<html class>` (snake pattern).
- Blast: cross of cells, 2–3 animation frames; static single frame under
  `prefers-reduced-motion`.
- HUD (lives · timer · level) drawn by the engine as a strip above the arena inside the
  canvas; score/best live in the shared StatsBand as on other games.

### Controls

Keyboard: WASD/arrows move, Space = bomb, Enter or Space = start on the menu screen,
**P = pause/resume** (Space is taken by the bomb, unlike snake); gamepad via the shared kit with rebindable bindings in
ControlsModal (`arcade.short-fuse.pad.v1` storage key).

### Non-goals (this iteration)

- No remote detonation / bomb kick powerups (possible phase 2).
- No PvP/bot arena mode.
- No mobile/touch play (arcade is desktop-only by owner decision).
- No backend work (crowns stay frontend-composed; key is free-form).

## Size estimate

engine ~800 lines · game hook ~450 · board ~150 · total ~1600 + tests. One feature folder,
one route folder, two shared-file touches (roster + hub visuals).
