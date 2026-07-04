"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { SnakeMark } from "@/features/arcade/snake-classic";
import { Mark2048 } from "@/features/arcade/2048";
import { SlothMark } from "@/features/arcade/stay-awake";
import { RabbitChaseMark } from "./rabbit-chase-mark";
import { Label } from "@/shared/ui";
import { TetrominoMark } from "./tetromino-mark";

interface GameEntry {
  href: string;
  title: string;
  /** One deadpan muted line under the title — the SAME card for signed-in and
   *  signed-out (the leaderboard block was cut: filled vs empty read uneven). */
  description: string;
  mark: ReactNode;
  /** The mark's own pixel grid — cell size (px) + the cells the mark spans.
   *  Drives the CellField so the figure sits ON the field like a real render. */
  field: { cell: number; spanX: number; spanY: number };
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
    href: "/arcade/follow-the-rabbit",
    title: "The Rabbit",
    description: "Follow the white rabbit. The striped ones bite.",
    mark: <RabbitChaseMark size={CELL * 2} />,
    field: { cell: CELL, spanX: 5, spanY: 2 },
  },
  {
    href: "/arcade/stay-awake",
    title: "Stay Awake",
    description: "The floor is sleep. Keep hopping.",
    mark: <SlothMark size={CELL * 4} />,
    field: { cell: CELL, spanX: 5, spanY: 4 },
  },
  {
    href: "/arcade/snake",
    title: "Snake",
    description: "The classic. You, your tail, and bad decisions.",
    mark: <SnakeMark size={CELL * 2} />,
    field: { cell: CELL, spanX: 5, spanY: 2 },
    hidden: true,
  },
  {
    href: "/arcade/tetris",
    title: "Tetris",
    description: "Blocks fall. Lines clear. Gravity always wins.",
    mark: <TetrominoMark size={CELL * 2} />,
    field: { cell: CELL, spanX: 3, spanY: 2 },
  },
  {
    href: "/arcade/2048",
    title: "2048",
    description: "Double the numbers until the board disagrees.",
    mark: <Mark2048 size={CELL_2048 * 2} />,
    field: { cell: CELL_2048, spanX: 2, spanY: 2 },
    hidden: true,
  },
];

/** The card is a THEME-FOLLOWING "screen" — the games themselves are
 *  theme-native (token-resolved palettes), so the hub preview follows the
 *  ambient theme too: `--m-bg` field + 2px `--m-line` frame, the same look as a
 *  bordered game canvas on the page. `min-h-36` (144px = p-5 pair + title +
 *  title→body 16 + THREE 14px/1.6 description lines): the card holds a stable
 *  stature but hugs its content — the 176 take left a dead band below the
 *  text (owner call). */
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

function GameCard({ game }: { game: GameEntry }) {
  return (
    <ScreenCard>
      <CellField field={game.field}>{game.mark}</CellField>
      <div className="col-span-2 p-5">
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
      </div>
    </ScreenCard>
  );
}

/** The `/arcade` hub — lists the playable arcade titles. Layout mirrors the game
 *  pages' shell (full-bleed mono scope, 1240 max column, 40px gutter).
 *  Public like every game page — signed-out visitors play local-only (the game
 *  hooks gate submit/stats/leaderboard on auth; no board surfaces signed out). */
export function ArcadePage() {
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
            <GameCard key={game.href} game={game} />
          ))}
        </div>
      </main>
    </div>
  );
}
