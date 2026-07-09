"use client";

import { useId } from "react";
import Link from "next/link";
import { useAuth } from "@/entities/session";
import { Dot } from "@/shared/ui";
import { useArcadeCrowns } from "../model/use-arcade-crowns";

/**
 * Profile-header crowns: one pixel icon per arcade game the user CURRENTLY
 * tops, rendered in the meta row after the post count — scaled to sit beside
 * 12px meta text. Trophy exception to the muted-icon meta rule: crowns render
 * ACCENT with a matching breathing glow (gold was tried and reverted) —
 * they're standings, not metadata. Hover = `TOP 1 · <GAME>` (native title for
 * now); click = the game page.
 *
 * Icon sourcing (2026-07-09 roster change — Rabbit/Stay Awake delisted from
 * the hub, Tetris/2048/Snake-classic are the current 3): Tetris's bitmap
 * used to deep-import the engine's REAL Z-tetromino sprite (the original
 * "no hand-drawn minis, off-model" rule) — but the arcade hub's own card
 * mark (`TetrominoMark`) shows a T-piece, not a Z, so the crown was
 * inconsistent with the card. Tetris now mirrors `TetrominoMark`'s T-shape
 * as a local bitmap. 2048 and Snake-classic have NO engine sprite to
 * deep-import (their board tiles/segments are drawn procedurally, not from a
 * static bitmap) — their hub card marks (`Mark2048`/`SnakeMark`) are also
 * multi-fill/gradient SVGs, not single-silhouette bitmaps, so they can't be
 * reused directly either. Both are hand-authored local bitmaps instead,
 * echoing each mark's shape as a single accent silhouette.
 */

type CrownIconDef = {
  bitmap: readonly string[];
  /** Bitmap chars that paint (everything else is transparent). */
  solid: readonly string[];
  /** CSS colour var — the figure's in-game body colour. */
  color: string;
  /** Contain-fit box (px) for THIS icon — the per-game tuning knob (also
   *  the icon's slot in the row, so any size goes — no shared cap). */
  size: number;
  /** Extra breathing room (px) added on BOTH sides of this icon, on top of
   *  the row's CROWN_GAP — bump it together with `size` so a bigger icon
   *  doesn't crowd its neighbours. */
  gap?: number;
};

/** Same T-piece as the hub card's `TetrominoMark` (3×2: one top-centre cell,
 *  a full bottom row) — was the engine's Z-tetromino, which read as a
 *  different piece than the card shows for the same game (owner catch). */
const TET_T = [" X ", "XXX"];

/** A pixel "2" — 2048's signature digit, truer to the game's identity at
 *  this scale than a plain tile block (which reads too close to Tetris). */
const DIGIT_2 = [" XXX ", "X   X", "    X", "  XX ", " X   ", "X    ", "XXXXX"];

/** A connected 2px-thick zigzag body + a detached food square — echoes
 *  `SnakeMark`'s coiled-body-plus-food composition as one accent silhouette
 *  (rendered + eyeballed at real crown scale before picking this shape: two
 *  disconnected blocks read as noise, not a snake — the body needs to stay
 *  ONE continuous path). */
const SNAKE_COIL = [
  "XX......",
  "XX......",
  "XXXX....",
  "..XX....",
  "..XXXX..",
  "....XX..",
  "........",
  "......XX",
  "......XX",
];

/** Gap (px) between crowns — the same tuning surface as the per-icon sizes
 *  (started at the meta rows' 16px between-metrics gap). */
const CROWN_GAP = 16;

const CROWN_ICONS: Record<string, CrownIconDef> = {
  tetris: {
    bitmap: TET_T,
    solid: ["X"],
    color: "var(--m-accent)",
    size: 14,
    gap: 4,
  },
  "2048": {
    bitmap: DIGIT_2,
    solid: ["X"],
    color: "var(--m-accent)",
    size: 13,
  },
  "snake-classic": {
    bitmap: SNAKE_COIL,
    solid: ["X"],
    color: "var(--m-accent)",
    size: 16,
    gap: 4,
  },
};

/** One engine bitmap as a pixel SVG, contain-fit into its own `size` box —
 *  eye/mouth chars stay transparent, so the faces read as punched holes.
 *  Trophy treatment (tailwind.css): the `.mono-crown-shine` GLINT — a
 *  diagonal light band sweeping across the icon, clipped to the pixel
 *  silhouette (hidden under reduced motion; the glow was cut — owner call).
 *  `shineDelay` staggers the sweep so it runs through the row L→R. */
function CrownIcon({
  bitmap,
  solid,
  color,
  size,
  shineDelay = 0,
}: CrownIconDef & { shineDelay?: number }) {
  const h = bitmap.length;
  const w = bitmap[0].length;
  const scale = size / Math.max(w, h);
  // useId carries colons — strip them, they break `url(#…)` references.
  const uid = useId().replace(/:/g, "");
  const cells = bitmap.flatMap((row, r) =>
    [...row].map((ch, c) =>
      solid.includes(ch) ? (
        <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} />
      ) : null
    )
  );
  return (
    <svg
      width={w * scale}
      height={h * scale}
      viewBox={`0 0 ${w} ${h}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <defs>
        {/* Glint colour = --m-bg, NOT white: the dark theme's accent is a
            near-white lime, so a white band vanished on it. The bg token is
            contrast-guaranteed against accent in BOTH themes (dark: a dark
            streak over lime; light: a white flash over olive). */}
        <linearGradient
          id={`crown-shine-${uid}`}
          x1="0"
          y1="0"
          x2="1"
          y2="0"
          gradientTransform="rotate(18)"
        >
          <stop
            offset="0.35"
            style={{ stopColor: "var(--m-bg)" }}
            stopOpacity="0"
          />
          <stop
            offset="0.5"
            style={{ stopColor: "var(--m-bg)" }}
            stopOpacity="0.85"
          />
          <stop
            offset="0.65"
            style={{ stopColor: "var(--m-bg)" }}
            stopOpacity="0"
          />
        </linearGradient>
        <clipPath id={`crown-clip-${uid}`}>{cells}</clipPath>
      </defs>
      <g style={{ fill: color }}>{cells}</g>
      <g clipPath={`url(#crown-clip-${uid})`}>
        <rect
          x={0}
          y={0}
          width={w}
          height={h}
          fill={`url(#crown-shine-${uid})`}
          className="mono-crown-shine"
          style={{ animationDelay: `${shineDelay}ms` }}
        />
      </g>
    </svg>
  );
}

/** Renders its own leading `Dot` so the meta row stays clean when there are
 *  no crowns (or the viewer is signed out — the leaderboard GET is auth-only). */
export function ArcadeCrowns({ userName }: { userName?: string }) {
  const { isAuthenticated } = useAuth();
  const crowns = useArcadeCrowns(userName, isAuthenticated);
  if (crowns.length === 0) return null;

  return (
    <>
      <Dot />
      {/* CROWN_GAP between chips; each crown centres in its OWN size-square
          slot (no shared cap — per-icon sizes are free). */}
      <span className="flex items-center" style={{ gap: CROWN_GAP }}>
        {crowns.map(({ game, title, href }, i) => {
          const def = CROWN_ICONS[game];
          return (
            <Link
              key={game}
              href={href}
              title={`TOP 1 · ${title}`}
              aria-label={`Top 1 in ${title} — open the game`}
              className="mono-focus flex items-center justify-center"
              style={{
                width: def.size,
                height: def.size,
                marginInline: def.gap ?? 0,
              }}
            >
              {/* 150ms stagger — the glint runs through the row L→R. */}
              <CrownIcon {...def} shineDelay={i * 150} />
            </Link>
          );
        })}
      </span>
    </>
  );
}
