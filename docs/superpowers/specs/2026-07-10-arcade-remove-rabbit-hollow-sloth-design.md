# Arcade cleanup: remove "The Rabbit" + "Hollow Sloth", port rabbit food sprite into classic Snake

## Context

Owner wants to simplify the arcade roster before the gamepad-controls rollout
(see `2026-07-06-arcade-controls-rollout-design.md`, not yet implemented). Two
games go away entirely:

- **"The Rabbit"** (feature folder `src/features/arcade/snake`, route
  `/arcade/follow-the-rabbit`, hub entry `game: "snake"`, hidden from the hub
  grid) — a reskinned Snake where food is a rabbit-shaped pickup (+10 white,
  striped negative variant) with rank/killer mechanics.
- **"Hollow Sloth"** (feature folder `src/features/arcade/hollow-sloth`, route
  `/arcade/hollow-sloth`) — an unlisted prototype, never wired into the hub
  roster or the backend leaderboard.

**"Snake"** (feature folder `src/features/arcade/snake-classic`, route
`/arcade/snake`, backend key `"snake-classic"`) is the one Snake game that
survives. Its visual gets one change: the food pickup (currently a single
pulsing white square) becomes the rabbit sprite ported from "The Rabbit". The
snake's own body stays square segments — unchanged.

This is a frontend-only cleanup. The backend leaderboard rows under game key
`"snake"` (The Rabbit's key) become orphaned data; that's a separate backend
concern to flag, not a blocker here — Hollow Sloth never had a backend key at
all.

## Scope

### 1. Delete routes

- `src/app/arcade/follow-the-rabbit/` (`page.tsx`, `snake-page.tsx`)
- `src/app/arcade/hollow-sloth/` (`page.tsx`)

### 2. Port the rabbit sprite into `snake-classic/model/engine.ts`

Add the POSITIVE-only rabbit bitmap (13 rows × 7 cols — 7 ear rows +
6 face rows), copied as a static literal from the old game's
`RABBIT_PLAIN` (`snake/model/engine.ts:254-257`, itself built from
`RABBIT_EAR_WHITE` × 7 + `RABBIT_FACE`). No stripes/killer/rank variants —
classic Snake has one food type.

Replace `drawFood()`'s `drawSquare(...)` call with a new private
`drawSprite()` method, scoped to `snake-classic/model/engine.ts` only (not a
shared/reusable helper — single consumer, and it's a deliberately smaller cut
of the old game's `drawSprite`: no rotation/jiggle, no `fillToCell`, no
x/y-offset). Behavior:

- Iterate the bitmap; each `"1"` cell paints one `fillStyle = palette.food`
  block, sized so the whole sprite's bounding box (`max(sw, sh)` = 13) fits
  `FOOD_FILL * pulse` fraction of the cell — reusing the existing
  `FOOD_FILL` (0.62) and pulse constants (`FOOD_PULSE_AMP`,
  `FOOD_PULSE_FREQ`) unchanged, just driving a sprite box instead of a square
  side.
- `fillRect` per bit is already device-pixel-crisp without touching
  `imageSmoothingEnabled` (that flag only affects `drawImage`, not
  `fillRect`) — no smoothing toggle needed, unlike the old game's version
  (which needed it for its rotation feature).
- Color stays `palette.food` (theme-native — resolves to `--m-fg`, light or
  dark), matching the current square's theming. No new palette field.

### 3. Delete feature folders

- `src/features/arcade/snake/` (all of it, after step 2 has copied what it
  needs)
- `src/features/arcade/hollow-sloth/` (all of it)
- `src/features/arcade/hub/ui/rabbit-chase-mark.tsx` (lives in `hub/ui`,
  outside the two folders above; its only import is `RABBIT_PLAIN` from
  `@/features/arcade/snake`, so it breaks once that folder is gone)

### 4. Hub roster + hub page

- `src/features/arcade/shared/model/arcade-games.ts`: delete the
  `{ game: "snake", title: "The Rabbit", href: "/arcade/follow-the-rabbit",
hidden: true }` entry. The kept `{ game: "snake-classic", title: "Snake",
href: "/arcade/snake" }` entry is untouched.
- `src/features/arcade/hub/ui/arcade-page.tsx`: remove the
  `RabbitChaseMark` import and its `VISUALS["snake"]` entry (~lines 14, 54-57).
- No Hollow Sloth entry exists in the roster today (it was never listed) — no
  roster edit needed for it.
- Crowns (`src/features/arcade/crowns/**`) derive their game list by
  filtering `ARCADE_GAMES` for `!hidden` — since The Rabbit was already
  `hidden: true`, removing its roster entry needs no separate crowns edit.

### 5. Out of scope

- Backend cleanup of orphaned `"snake"`-keyed leaderboard rows — flagged to
  the backend owner separately, not part of this change.
- `docs/superpowers/plans/specs/*.md` historical mentions of Rabbit/Hollow
  Sloth — documentation, left as-is (historical record).
- The gamepad-controls rollout (separate spec, comes after this).

## Testing

- `npm run typecheck && npm run lint` — zero errors, confirms no dangling
  imports from the deleted folders.
- Manual: `/arcade` hub renders with only Tetris, 2048, Snake tiles (Stay
  Awake stays hidden/unlisted as today); `/arcade/follow-the-rabbit` and
  `/arcade/hollow-sloth` 404; `/arcade/snake` plays normally with the rabbit
  sprite as food, pulse animation intact, both light and dark theme.
