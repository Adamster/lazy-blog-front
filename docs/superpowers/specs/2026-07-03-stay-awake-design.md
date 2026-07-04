# Stay Awake — endless climber, design

Approved direction (owner, 2026-07-03): a Jumping Joe-style endless vertical
climber, variant A (vertical tower), hero = a sloth forced to do cardio.
Board deliberately a bit WIDER than Tetris's well (owner request).
Name approved (owner, 2026-07-03): **Stay Awake** — hub title "Stay Awake",
route `/arcade/stay-awake`, game id `"stay-awake"`.

## Theme & the прикол

- Hero: a **sloth** — the laziest animal alive, doing cardio against its will.
- The pressure: a **sleep wave** rises from below — a translucent haze of
  drifting `Z` glyphs. Stop hopping and it catches you: the sloth falls asleep,
  run over ("caught napping").
- Pickups: **coffee cups** (+25). A cumulative in-run coffee counter — every
  3rd coffee collected triggers a short **espresso rush** (sleep wave frozen
  for 3 s); the counter keeps counting (6th, 9th, … re-trigger it).
- The trap (killer-bunny DNA): a rare **chamomile flower** that reads as a
  pickup but is a sedative — land on it and the sleep wave **surges 3 rows up**.
- Second death cause: **cactus** cells — landing on one is lethal ("ouch").

## Rules

- Well: **11 wide × 20 tall** visible cells (owner playtest retune 2026-07-03:
  13 felt too wide → tried 10 → settled on 11). Odd width on purpose: a true
  centre column makes the start symmetric — both walls exactly 5 hops away.
  Start column = 5, player fixed at screen row 13 of 20 (~2/3 down).
- Hop: ← / → (or A/D) = instant hop **1 row up + 1 column sideways**. At a wall,
  hopping into the wall = a **wall bounce**: straight up, same column (still
  climbs the row). No idle vertical hop key — sideways/bounce only, like the
  original.
- Each hop scrolls the world down one row; a new row is generated on top.
- Sleep wave: starts **6 rows below the player**; **rises one row every
  `waveMs`** (start 1100 ms, −10 ms per row climbed, floor 450 ms). A hop
  scrolls the world down one row, i.e. buys one row of distance. Espresso rush
  pauses the rise timer for 3000 ms. Chamomile surge = instant +3 rows of wave
  (can kill if it reaches the player's row — readable risk, by design). Wave
  reaching the player's row = death.
- Row generation (fairness invariant, the head-exclusion analog): for EVERY
  column c, at least one hop target from c — `{c−1, c+1}`, with the wall-bounce
  mapping at the edges (`c=0 → {0, 1}`, `c=12 → {11, 12}`) — is non-cactus in
  the new row. Chamomile counts as landable (its cost is the wave surge, not
  death) — so a column whose only non-cactus target is the chamomile is a
  legal, deliberately nasty layout. Cactus density ramps with altitude; coffee
  ~1 per 3–4 rows; chamomile rare (~1 per 40 rows).
- Score: **+1 per row climbed, +25 per coffee**. No lives — one run.

## Feature slice — mirrors the `snake-classic` template 1:1 (FSD)

- `src/features/arcade/stay-awake/`
  - `model/engine.ts` — pure headless engine: state + `hop(dir)` + `step(now)`
    - canvas draw; ring buffer of rows; the row generator with the fairness
      invariant; palette injected (theme-native — no CSS reads in the engine).
      Sprite rasteriser: same integer-device-pixel `drawSprite` pattern as the
      rabbit snake engine (copied in — engines stay self-contained, per the
      tetris/2048 precedent).
  - `model/engine.test.ts` — vitest: hop left/right, wall bounce both walls,
    world shift + altitude score, wave rise + catch death, cactus death,
    coffee score + 3-streak rush freeze, chamomile surge (+3 rows, can kill),
    row-generator fairness invariant (bulk-generate rows, assert every column
    keeps a safe hop target), speed ramp floor.
  - `model/types.ts`, `model/arcade-keys.ts`, and the standard query set with
    the new game id: leaderboard (top 10), my-stats, submit-score (failures
    swallowed), `score-history.ts` localStorage sparkline log
    (`notlazy_stay_awake_history_v1`).
  - `model/use-stay-awake-game.ts` — the canonical hook (rAF loop + throttled-tab
    fallback, ResizeObserver, keyboard via `e.code` incl. A/D, palette resolved
    from live `--m-*` tokens + MutationObserver theme-flip re-push, teardown).
  - `ui/stay-awake-board.tsx`, `ui/stay-awake-leaderboard.tsx`,
    `ui/sloth-mark.tsx`, `ui/use-stay-awake-arcade.ts`, barrel `index.ts`.
- Route: `/arcade/stay-awake` — `page.tsx` (meta) + PUBLIC client page (the
  arcade family moved to guest play mid-build: signed-out runs are local-only —
  auth-gated queries, `useLocalBest` fallback, `BoardSignInTeaser` instead of
  the leaderboard, `canRank={showBoard}`). Title: "Stay Awake".
- Hub: new `GAMES` entry (shared 20px CELL field, pixel sloth mark built from
  whole cells, `spanX/spanY` per the mark's real cell span).
- Backend game id: `"stay-awake"` — a new id just works against
  `POST /arcade/score` / `GET /arcade/leaderboard`.

## Board UI (the Tetris shell pattern)

- Outer footprint stays the shared **`aspect-[30/18]`** board shell, so every
  arcade board keeps one footprint; the **13/20 well** is centered inside
  (`[aspect-ratio:13/20] h-full`, 2px `--m-dim` border), side panels flank it
  (the Tetris side-panel language, `gap-10 p-5`):
  - Left panel: **coffee streak pips** — 3 cup pips filling toward the next
    espresso rush, plus the rush countdown state.
  - Right panel: **sleep-wave proximity meter** — a vertical bar (muted2 base
    fill → error once the wave is ≤2 rows out; accent ONLY while an espresso
    rush freezes the wave — accent = "frozen/safe" must not collide with the
    base fill, the vote-counter colour-collision principle) + `ZZZ` label.
- Overlays: shared `MenuOverlay` (title "Stay Awake", subtitle
  "The floor is sleep. Keep hopping." + key hints) / `PauseOverlay` /
  `GameOverOverlay` with a cause-specific detail line — cactus:
  "SAT ON A CACTUS." · sleep wave: "CAUGHT NAPPING.". `CornerBrackets` as
  everywhere.
- `BoardEyebrow`: `// ALT n · COFFEE n`. `StatsBand`: SCORE / BEST / sparkline.

## Controls

- Desktop: **← → / A D** = hop, **Space** = pause. Guarded against inputs;
  WASD via `e.code`.
- Mobile: **tap left/right half of the board shell** = hop left/right (tap, not
  swipe — the twitch cadence needs zero gesture latency). Pause via the
  overlay affordance only.

## Render

- Theme-native (the Tetris/classic-snake pattern): canvas palette resolved from
  ambient `--m-*` tokens; overlays on `--m-card` scrims; no forced `.dark`.
- Sprites (pixel bitmaps, whole-device-pixel blocks): sloth ×2 poses
  (sit / mid-hop), cactus, coffee cup, chamomile flower. Sloth ← `--m-fg`
  family, coffee ← accent, chamomile ← accent-family too (that IS the trap —
  it reads as a pickup), cactus ← `--m-error` tint. Faint cell grid + frame
  like the snake boards.
- Sleep wave: translucent `--m-muted` haze band + drifting `Z` glyphs above its
  edge.
- `prefers-reduced-motion` (shared `prefersReducedMotion()` guard): wave edge
  steps discretely (no drift animation), hop = teleport (no tween), Z glyphs
  static, haze static; gameplay unaffected. No synchronous setState in effects
  (repo lint rule).

## Naming / copy (approved — standup-copywriter pass, owner pick)

- Title **"Stay Awake"** · route `/arcade/stay-awake` · game id `"stay-awake"`.
- Menu subtitle: "The floor is sleep. Keep hopping."
- Game over: cactus → "SAT ON A CACTUS." · sleep wave → "CAUGHT NAPPING."
- Chamomile legend (if a legend row ever ships): "Chamomile — looks like a
  pickup, puts you under." Copy note: coffee must read unambiguously friendly
  in-game, or the chamomile fake-out reads unfair instead of funny.

## Out of scope

- No speed presets UI, no lives, no level select, no backend changes, no
  hub-card redesign. Hollow-sloth stays unlisted and untouched.
