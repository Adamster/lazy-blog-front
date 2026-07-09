"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useAuth } from "@/entities/session";
import {
  SnakeMark,
  useSnakeClassicLeaderboard,
} from "@/features/arcade/snake-classic";
import { Mark2048, use2048Leaderboard } from "@/features/arcade/2048";
import { SlothMark } from "@/features/arcade/stay-awake";
import { useTetrisLeaderboard } from "@/features/arcade/tetris";
import { RabbitChaseMark } from "./rabbit-chase-mark";
import { fmt, Label } from "@/shared/ui";
import { userHref } from "@/shared/lib/routes";
import { TetrominoMark } from "./tetromino-mark";

interface GameEntry {
  href: string;
  title: string;
  /** One deadpan muted line under the title. */
  description: string;
  mark: ReactNode;
  /** The mark's own pixel grid — cell size (px) + the cells the mark spans.
   *  Drives the CellField so the figure sits ON the field like a real render. */
  field: { cell: number; spanX: number; spanY: number };
  /** The backend `game` key for this card's leaderboard query — does NOT
   *  always match `title`/`href` (e.g. the hub's "Snake" card is the
   *  classic-Snake feature, backend key `snake-classic`; the backend key
   *  `snake` belongs to the hub's "The Rabbit" card). Get this from each
   *  feature's own `arcade-keys.ts` (`TETRIS_GAME`/`SNAKE_CLASSIC_GAME`/
   *  `GAME_2048`/`SNAKE_GAME`/`GAME_STAY_AWAKE`), never guess it from the title. */
  game: string;
  /** Temporarily delisted from the hub (owner call) — the route stays live;
   *  drop the flag to relist. */
  hidden?: boolean;
}

// Hollow Sloth is an unlisted prototype — deliberately absent here.
// ONE field scale across the cards: the shared 20px cell. Each mark is built
// from whole cells at that scale — its in-game placement, not a scaled logo —
// so `size` is always `<cell> × <rows the figure spans>`. SANCTIONED EXCEPTION:
// the 2048 card runs a bigger cell (owner call) — in-game its 4×4 cells dwarf
// every other game's, so its preview field scales up to keep the meaning.
const CELL = 20;
const CELL_2048 = 28;
const GAMES: GameEntry[] = [
  {
    href: "/arcade/tetris",
    title: "Tetris",
    description: "Blocks fall. Lines clear. Gravity always wins.",
    mark: <TetrominoMark size={CELL * 2} />,
    field: { cell: CELL, spanX: 3, spanY: 2 },
    game: "tetris",
  },
  {
    href: "/arcade/snake",
    title: "Snake",
    description: "The classic. You, your tail, and bad decisions.",
    mark: <SnakeMark size={CELL * 2} />,
    field: { cell: CELL, spanX: 5, spanY: 2 },
    game: "snake-classic",
  },
  {
    href: "/arcade/2048",
    title: "2048",
    description: "Double the numbers until the board disagrees.",
    mark: <Mark2048 size={CELL_2048 * 2} />,
    field: { cell: CELL_2048, spanX: 2, spanY: 2 },
    game: "2048",
  },
  {
    href: "/arcade/stay-awake",
    title: "Stay Awake",
    description: "The floor is sleep. Keep hopping.",
    mark: <SlothMark size={CELL * 4} />,
    field: { cell: CELL, spanX: 5, spanY: 4 },
    game: "stay-awake",
    // Needs a redesign (owner call, 2026-07-09) — route stays live.
    hidden: true,
  },
  {
    href: "/arcade/follow-the-rabbit",
    title: "The Rabbit",
    description: "Follow the rabbit. The striped ones bite.",
    mark: <RabbitChaseMark size={CELL * 2} />,
    field: { cell: CELL, spanX: 5, spanY: 2 },
    game: "snake",
    // Near-duplicate of Snake (owner call, 2026-07-09) — route stays live.
    hidden: true,
  },
];

/** The card is a THEME-FOLLOWING "screen" — the games themselves are
 *  theme-native (token-resolved palettes), so the hub preview follows the
 *  ambient theme too: `--m-bg` field + 2px `--m-line` frame, the same look as a
 *  bordered game canvas on the page. `min-h-36` (144px = p-5 pair + title +
 *  title→body 16 + THREE 14px/1.6 description lines): the card holds a stable
 *  stature but hugs its content — the 176 take left a dead band below the
 *  text (owner call). Since the leader row was added, real content on even the
 *  SHORTEST 2-line-description card (p-5 pair 40 + title ~21 + title→body 16 +
 *  TWO description lines ~45 + the row's own pt-6 gap 24 + its line height ~20
 *  ≈ 166px) already exceeds 144, so the min-height never binds and 3 visible
 *  cards render with zero dead band (measured at mobile/tablet/desktop widths).
 *  min-h-44/48 (176/192) were tried and rejected — both exceed that ~166px
 *  real minimum and open an 8–24px gap above the row instead of removing one,
 *  so `min-h-36` stays as the (now slack) floor. */
function ScreenCard({ children }: { children: ReactNode }) {
  return (
    <article className="mono-scope group relative grid h-full min-h-36 grid-cols-3 border-2 border-[var(--m-line)] bg-[var(--m-bg)] text-[var(--m-fg)] transition-colors hover:border-[var(--m-accent)]">
      {children}
    </article>
  );
}

/** The card's left third = the game's own FIELD — a faint cell grid at the
 *  mark's exact pixel scale (the in-game low-alpha `--m-fg` hairline), filling
 *  the column instead of a divider rail; the mark's pixels sit ON the grid
 *  like a real render. */
function CellField({
  field: { cell, spanX, spanY },
  children,
}: {
  field: GameEntry["field"];
  children: ReactNode;
}) {
  // The MARK stays dead-centre in the column; the PATTERN shifts half a cell on
  // an axis where the mark spans an EVEN number of cells, so a grid line (not a
  // cell centre) runs through the middle and the mark's edges land on the
  // lines. The three shared-CELL cards have identical span parity (odd × even),
  // so their fields still anchor identically; the 2048 card runs its own cell
  // scale anyway. The extra −0.5px CENTERS the 1px hairline ON the cell
  // boundary — the gradient draws it INSIDE the tile's left/top edge, which ate
  // a pixel from every block's left/top gap (the same skew the canvas grids had).
  const off = (span: number) => (span % 2 === 0 ? cell / 2 : 0);
  const line = "color-mix(in srgb, var(--m-fg) 6%, transparent)";
  return (
    <div className="relative flex items-center justify-center">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(to right, ${line} 1px, transparent 1px), linear-gradient(to bottom, ${line} 1px, transparent 1px)`,
          backgroundSize: `${cell}px ${cell}px`,
          backgroundPosition: `calc(50% + ${off(spanX) - 0.5}px) calc(50% + ${off(spanY) - 0.5}px)`,
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

/** The #1 leaderboard entry for one game, or undefined (no data / no scores
 *  yet / signed out — all three render the SAME placeholder, see `LeaderRow`,
 *  so a card never looks structurally different depending on why). */
type Leader = { userName: string; bestScore: number } | undefined;

/** ALWAYS renders (never conditionally omitted) — a card with data and a card
 *  without must have the identical shape, only this line's content differs.
 *  Modeled 1:1 on `PostCard`'s `CardMeta` row (post-card.tsx): handle left,
 *  stat right, same 12px/muted caption treatment. */
function LeaderRow({ leader }: { leader: Leader }) {
  return (
    <div className="mt-auto flex items-center pt-6 text-[12px] text-[var(--m-muted)]">
      {leader ? (
        <>
          <Link
            href={userHref(leader.userName)}
            className="relative z-[var(--m-z-content)] truncate transition-colors hover:text-[var(--m-accent)]"
          >
            @{leader.userName}
          </Link>
          <span className="ml-auto tabular-nums">{fmt(leader.bestScore)}</span>
        </>
      ) : (
        <span className="text-[11px] tracking-[0.12em] text-[var(--m-muted2)] uppercase">
          NO SCORES YET
        </span>
      )}
    </div>
  );
}

function GameCard({ game, leader }: { game: GameEntry; leader: Leader }) {
  return (
    <ScreenCard>
      <CellField field={game.field}>{game.mark}</CellField>
      <div className="col-span-2 flex h-full flex-col p-5">
        <h2 className="mono-title transition-colors group-hover:text-[var(--m-accent)]">
          <Link
            href={game.href}
            className="mono-focus after:absolute after:inset-0"
          >
            {game.title}
          </Link>
        </h2>
        <p className="mt-4 text-[14px] leading-[1.6] text-[var(--m-muted)]">
          {game.description}
        </p>
        <LeaderRow leader={leader} />
      </div>
    </ScreenCard>
  );
}

/** The `/arcade` hub — lists the playable arcade titles. Layout mirrors the game
 *  pages' shell (full-bleed mono scope, 1240 max column, 40px gutter).
 *  Public like every game page — signed-out visitors play local-only (the game
 *  hooks gate submit/stats/leaderboard on auth; no board surfaces signed out). */
export function ArcadePage() {
  const { isAuthenticated } = useAuth();

  // Fixed, static set of 3 visible games — always call all 3 hooks
  // unconditionally (rules-of-hooks), each gated on auth like every other
  // arcade leaderboard read (ArcadeCrowns does the same).
  const tetris = useTetrisLeaderboard(isAuthenticated);
  const snakeClassic = useSnakeClassicLeaderboard(isAuthenticated);
  const game2048 = use2048Leaderboard(isAuthenticated);

  const leaderOf = (
    entries: { userName: string; bestScore: number }[] | undefined
  ): Leader => {
    const top = entries?.[0];
    return top
      ? { userName: top.userName, bestScore: top.bestScore }
      : undefined;
  };

  const leaderByGame: Record<string, Leader> = {
    tetris: leaderOf(tetris.data?.entries),
    "snake-classic": leaderOf(snakeClassic.data?.entries),
    "2048": leaderOf(game2048.data?.entries),
  };

  return (
    <div
      className="mono-scope min-h-app mx-[calc(50%-50vw)] w-screen bg-[var(--m-bg)] text-[var(--m-fg)]"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      <main className="mx-auto max-w-[1240px] px-5 pb-10 sm:px-10">
        {/* Bare eyebrow first → pt-10 (section rhythm + flush-avoidance), pb-6 binds it down. */}
        <div className="flex items-center pt-10 pb-6">
          <Label>ARCADE</Label>
        </div>

        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {GAMES.filter((game) => !game.hidden).map((game) => (
            <GameCard
              key={game.href}
              game={game}
              leader={leaderByGame[game.game]}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
