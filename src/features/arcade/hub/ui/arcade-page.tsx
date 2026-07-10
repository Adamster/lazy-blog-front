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
import {
  FyzeMark,
  useShortFuseLeaderboard,
} from "@/features/arcade/short-fuse";
import { ARCADE_GAMES, type ArcadeGameEntry } from "@/features/arcade/shared";
import { fmt, Label } from "@/shared/ui";
import { userHref } from "@/shared/lib/routes";
import { TetrominoMark } from "./tetromino-mark";

interface GameEntry extends ArcadeGameEntry {
  mark: ReactNode;
  /** The mark's own pixel grid — cell size (px) + the cells the mark spans.
   *  Drives the CellField so the figure sits ON the field like a real render. */
  field: { cell: number; spanX: number; spanY: number };
}

// ONE field scale across ALL cards, incl. 2048 (owner call) — the shared
// 20px cell. Each mark is built from whole cells at that scale — its
// in-game placement, not a scaled logo — so `size` is always `<cell> × <rows
// the figure spans>`.
const CELL = 20;

// Hub-only visuals (mark + field), keyed by the shared roster's `game` id —
// title/href/hidden come from `ARCADE_GAMES` (also consumed by the profile
// crowns), so a roster change only needs editing that one shared list.
const VISUALS: Record<string, { mark: ReactNode; field: GameEntry["field"] }> =
  {
    tetris: {
      mark: <TetrominoMark size={CELL * 2} />,
      field: { cell: CELL, spanX: 3, spanY: 2 },
    },
    "2048": {
      mark: <Mark2048 size={CELL * 2} />,
      field: { cell: CELL, spanX: 2, spanY: 2 },
    },
    "snake-classic": {
      mark: <SnakeMark size={CELL * 2} />,
      field: { cell: CELL, spanX: 5, spanY: 2 },
    },
    "short-fuse": {
      mark: <FyzeMark size={CELL * 2} />,
      field: { cell: CELL, spanX: 3, spanY: 2 },
    },
    "stay-awake": {
      mark: <SlothMark size={CELL * 4} />,
      field: { cell: CELL, spanX: 5, spanY: 4 },
    },
  };

const GAMES: GameEntry[] = ARCADE_GAMES.map((entry) => ({
  ...entry,
  ...VISUALS[entry.game],
}));

/** The card is a THEME-FOLLOWING "screen" — the games themselves are
 *  theme-native (token-resolved palettes), so the hub preview follows the
 *  ambient theme too: `--m-bg` field + 2px `--m-line` frame, the same look as a
 *  bordered game canvas on the page. Stacked like `PostCard` (cover on top,
 *  content below) — no explicit min-height; the grid row (like PostCard's
 *  feed grid) stretches every card in a row to the tallest sibling, and
 *  `h-full` + `flex-col` on the card + content column let it fill that. */
function ScreenCard({ children }: { children: ReactNode }) {
  return (
    <article className="mono-scope group relative flex h-full flex-col border-2 border-[var(--m-line)] bg-[var(--m-bg)] text-[var(--m-fg)] transition-colors hover:border-[var(--m-accent)]">
      {children}
    </article>
  );
}

/** The card's TOP "cover" — a faint cell grid at the mark's exact pixel scale
 *  (the in-game low-alpha `--m-fg` hairline), the same `aspect-[16/10]` box
 *  `PostCard` uses for its cover image; the mark's pixels sit ON the grid like
 *  a real render. */
function CellField({
  field: { cell, spanX, spanY },
  children,
}: {
  field: GameEntry["field"];
  children: ReactNode;
}) {
  // The MARK stays dead-centre in the box; the PATTERN shifts half a cell on
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
    <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(to right, ${line} 1px, transparent 1px), linear-gradient(to bottom, ${line} 1px, transparent 1px)`,
          backgroundSize: `${cell}px ${cell}px`,
          backgroundPosition: `calc(50% + ${off(spanX) - 0.5}px) calc(50% + ${off(spanY) - 0.5}px)`,
          // The box's fluid, responsive height is never an exact multiple of
          // `cell` (nor is its width, for that matter — the top/left/right
          // edges crop a partial cell too, just hidden under the card's own
          // 2px border). A hard line forced exactly at the bottom edge lands
          // mid-cell and reads as a visibly SHORTER last row, not a clean
          // close. Fading the pattern out instead sidesteps needing an exact
          // pixel-snapped height (which would mean JS-measuring the box,
          // like the canvas boards do) — it just softens into the bottom
          // edge, closing it without exposing the crop.
          WebkitMaskImage: "linear-gradient(to bottom, black 80%, transparent)",
          maskImage: "linear-gradient(to bottom, black 80%, transparent)",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

/** One top-3 leaderboard entry. */
type LeaderEntry = { userName: string; bestScore: number };

/** Plain zero-padded position ("01"/"02"/"03") — same rank-column treatment as
 *  the game page's own high-score board (leaderboard.tsx's `BoardRow`),
 *  rank-1 reads accent, 2/3 read muted2. */
function RankNumber({ rank }: { rank: number }) {
  const isTop = rank === 1;
  return (
    <span
      className={`text-[12px] tabular-nums ${
        isTop ? "text-[var(--m-accent)]" : "text-[var(--m-muted2)]"
      }`}
    >
      {String(rank).padStart(2, "0")}
    </span>
  );
}

/** ALWAYS renders exactly 3 rows (never conditionally omitted or shorter) —
 *  a card with data and a card without must have the identical shape, only
 *  each row's content differs. Row markup modeled on `PostCard`'s `CardMeta`
 *  (post-card.tsx): handle left, stat right, same 12px/muted caption
 *  treatment — with a `RankNumber` prepended per row. */
function LeaderRow({ leaders }: { leaders: LeaderEntry[] }) {
  return (
    <div className="mt-auto flex flex-col gap-1 pt-6 text-[12px] text-[var(--m-muted)]">
      {[1, 2, 3].map((rank) => {
        const entry = leaders[rank - 1];
        return (
          <div key={rank} className="flex items-center gap-3">
            <RankNumber rank={rank} />
            {entry ? (
              <>
                <Link
                  href={userHref(entry.userName)}
                  className="relative z-[var(--m-z-content)] truncate transition-colors hover:text-[var(--m-accent)]"
                >
                  @{entry.userName}
                </Link>
                <span className="ml-auto tabular-nums">
                  {fmt(entry.bestScore)}
                </span>
              </>
            ) : (
              <span
                className="flex-1 overflow-hidden text-clip whitespace-nowrap text-[var(--m-dim)]"
                role="img"
                aria-label="No score yet"
              >
                ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function GameCard({
  game,
  leaders,
}: {
  game: GameEntry;
  leaders: LeaderEntry[];
}) {
  return (
    <ScreenCard>
      <CellField field={game.field}>{game.mark}</CellField>
      <div className="flex flex-1 flex-col p-5">
        <h2 className="mono-title transition-colors group-hover:text-[var(--m-accent)]">
          <Link
            href={game.href}
            className="mono-focus after:absolute after:inset-0"
          >
            {game.title}
          </Link>
        </h2>
        <LeaderRow leaders={leaders} />
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

  // Fixed, static set of 4 visible games — always call all 4 hooks
  // unconditionally (rules-of-hooks), each gated on auth like every other
  // arcade leaderboard read (ArcadeAchievements does the same).
  const tetris = useTetrisLeaderboard(isAuthenticated);
  const snakeClassic = useSnakeClassicLeaderboard(isAuthenticated);
  const game2048 = use2048Leaderboard(isAuthenticated);
  const shortFuse = useShortFuseLeaderboard(isAuthenticated);

  const leadersOf = (
    entries: { userName: string; bestScore: number }[] | undefined
  ): LeaderEntry[] =>
    (entries ?? [])
      .slice(0, 3)
      .map((e) => ({ userName: e.userName, bestScore: e.bestScore }));

  const leadersByGame: Record<string, LeaderEntry[]> = {
    tetris: leadersOf(tetris.data?.entries),
    "snake-classic": leadersOf(snakeClassic.data?.entries),
    "2048": leadersOf(game2048.data?.entries),
    "short-fuse": leadersOf(shortFuse.data?.entries),
  };

  return (
    <div
      className="mono-scope min-h-app mx-[calc(50%-50vw)] w-screen bg-[var(--m-bg)] text-[var(--m-fg)]"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      <main className="mx-auto max-w-[1240px] px-5 pb-10 sm:px-10">
        {/* Bare eyebrow first → pt-10 (section rhythm + flush-avoidance). Eyebrow→H1
            and H1→subtitle mirror the home hero / post-page title rhythm (24 / 16). */}
        <div className="pt-10">
          <Label>ARCADE</Label>
          <h1 className="font-display mt-6 text-[32px] leading-[1.04] font-bold tracking-[-0.02em] text-balance md:text-[40px]">
            The official excuse for procrastinating
          </h1>
          <p className="mt-4 text-[14px] leading-[1.6] text-[var(--m-muted)]">
            Too lazy to work? At least get good at this.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {GAMES.filter((game) => !game.hidden).map((game) => (
            <GameCard
              key={game.href}
              game={game}
              leaders={leadersByGame[game.game]}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
