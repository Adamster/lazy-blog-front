# Arcade hub card: leaderboard-leader row

Date: 2026-07-09
Status: approved, ready for implementation plan

## Context

The `/arcade` hub (`src/features/arcade/hub/ui/arcade-page.tsx`) lists playable
games as cards: an icon-grid preview on the left third, title + one-line
description on the right two-thirds (`GameCard`/`ScreenCard`). A prior attempt
added a leaderboard block to these cards and it was cut — the code comment on
`GameEntry.description` records why: _"the leaderboard block was cut: filled
vs empty read uneven"_ (signed-in cards had data, signed-out/empty cards
didn't, and the two states read as inconsistent).

Owner wants to try this again, explicitly modeled on the home feed's
`PostCard` meta row (`src/features/post/ui/post-card.tsx`'s `CardMeta`): one
line, `@handle` left, a stat right. For arcade cards: the game's #1 leader's
username (left) and their best score (right).

This round also trims the hub roster: **Stay Awake** (needs a redesign) and
**Follow the Rabbit** (near-duplicate of Snake) are delisted. Both already
have the mechanism for this — `GameEntry.hidden` — a flag with the exact
established semantics: _"Temporarily delisted from the hub (owner call) — the
route stays live; drop the flag to relist."_ Neither game's route/feature
code is touched. (Explicitly out of scope: permanently deleting the Follow
the Rabbit feature/route — raised as a possible follow-up, not this task.)

Visible hub games after this change: **Tetris, Snake (backend key
`snake-classic`), 2048**.

## Why this time is different (the "filled vs empty" problem)

The earlier cut happened because the row only existed when there was data —
so a card with a leader looked different in _kind_ (not just content) from
one without. This design fixes that by making the row **always present,
always the same shape**: real data or one static muted placeholder line, same
position, same size, every card, every viewer. Signed-in-with-data and
signed-out-or-empty differ only in that one line's text, not in layout.

## Data

Each of the 3 visible games already has a typed leaderboard hook (built for
the game's own board page), which already fetches top-10 entries and is
already gated on auth:

- `useTetrisLeaderboard(enabled)` — `src/features/arcade/tetris`
- `useSnakeClassicLeaderboard(enabled)` — `src/features/arcade/snake-classic`
- `use2048Leaderboard(enabled)` — `src/features/arcade/2048`

None of these are currently exported from their feature's barrel
(`index.ts`) — only the `*Leaderboard` UI components are. Add the hook to
each of the 3 barrels (small, additive, matches how `HeaderLockup` was
exported from the header barrel for the same reason: a consumer outside the
feature needs it).

`ArcadePage` calls all 3 hooks directly and unconditionally (a fixed, static
set — no rules-of-hooks issue), each with `enabled: isAuthenticated` (from
`useAuth()`, same convention as `ArcadeCrowns`). Each hook's query key is
`["arcade", "leaderboard", <game>, 10]`, identical to the key each game's own
board page and `ArcadeCrowns` already use — so this adds no new cache
entries and no new network cost for a visitor who then opens a game (or
already has, e.g. from `ArcadeCrowns` on their own profile).

`GameEntry` gains a `game: string` field (the backend key), since it's
`"snake-classic"` for the hub's "Snake" card and would be `"snake"` for the
hub's "The Rabbit" card if that's ever relisted — the hub's game titles and
the backend's `game` keys do not match 1:1, and this has already been a
source of confusion once (`ArcadeCrowns`' `CROWN_GAMES` list runs into the
same mapping). Get this mapping right in the plan/implementation:

| Hub card | href             | backend `game` key |
| -------- | ---------------- | ------------------ |
| Tetris   | `/arcade/tetris` | `tetris`           |
| Snake    | `/arcade/snake`  | `snake-classic`    |
| 2048     | `/arcade/2048`   | `2048`             |

From each hook's result, only `data.entries[0]` (rank-1) is used.

## Layout

`GameCard`'s right column (currently `<div className="col-span-2 p-5">`
holding just the title `<h2>` and description `<p>`) becomes a flex column
(`flex h-full flex-col`) so a new row can be pinned to the bottom with
`mt-auto`, the same technique `PostCard` uses for its `CardMeta` row.

New row, directly modeled on `CardMeta`'s markup/classes (`mt-auto pt-6 ...
text-[12px] text-[var(--m-muted)]`, left item + `ml-auto` right item):

- **With a leader:** `@username` (left, links to the profile via `userHref`,
  hover `muted → accent` like every other handle link in the app) — best
  score (right, `ml-auto`, `tabular-nums`, formatted like `Metric`'s `fmt()`
  — e.g. `12,400`). No icons; plain typography, matching the "Approach B1"
  the owner picked over the crown-icon variant.
- **Without one** (signed-out, this specific game has zero scores yet, or the
  query hasn't resolved yet): a single static muted2 line, same position,
  same row height. Copy: **`NO SCORES YET`** (11px/0.12em uppercase, the
  label/caption tone) — one line, no separate "sign in" vs "empty" wording
  (owner's call: don't let the card reveal _why_ there's no leader, just
  that there isn't one right now).
- The brief loading-state flash (query in flight → placeholder → real name)
  is accepted as-is, not special-cased — these queries are fast and
  long-`staleTime` cached, and this is a small decorative line, not primary
  content.

`ScreenCard`'s `min-h-36` (144px, sized and commented for the current
2-line/3-line description + no extra row) needs to grow to fit the new row
without leaving dead space on the shortest description. The exact value is a
"render it and look" number, not a formula — pick it live in the browser
(same spirit as the existing comment on that class) across all 3 visible
cards, and update the explanatory comment to describe the new math.

## Non-goals / explicitly deferred

- Top-3 (rejected in favor of top-1, to keep the row a true single line like
  `CardMeta`).
- A crown/rank icon next to the leader's name (rejected in favor of plain
  text, per the owner's approach pick).
- A backend/public endpoint for this (the existing per-game auth-gated
  `getLeaderboard` is reused as-is; `project_arcade_backlog`'s parked
  "crowns backend variant" is a related but separate idea, not pulled in
  here).
- Deleting the Follow the Rabbit feature/route/backend game key, or Stay
  Awake's redesign — both stay exactly as they are, just delisted from the
  hub via `hidden: true`.

## Files touched (implementation plan will detail exact edits)

- `src/features/arcade/hub/ui/arcade-page.tsx` — `GameEntry.game` field,
  `hidden: true` on Stay Awake + Follow the Rabbit, the 3 leaderboard hook
  calls + `useAuth`, the new bottom row in `GameCard`, `min-h-36` retune.
- `src/features/arcade/tetris/index.ts`,
  `src/features/arcade/snake-classic/index.ts`,
  `src/features/arcade/2048/index.ts` — export the leaderboard hook.
