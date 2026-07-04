"use client";

import Link from "next/link";
import { useAuth } from "@/entities/session";
import { Dot } from "@/shared/ui";
// Deep engine imports on purpose (read-only ART constants, no logic): the
// crowns must show the games' REAL sprites (owner call — hand-drawn minis
// read off-model), and importing the bitmaps keeps them in lockstep with any
// future sprite retune.
import { RABBIT_PLAIN } from "@/features/arcade/snake/model/engine";
import { SLOTH_SIT } from "@/features/arcade/stay-awake/model/engine";
import { SHAPES } from "@/features/arcade/tetris/model/engine";
import { useArcadeCrowns } from "../model/use-arcade-crowns";

/**
 * Profile-header crowns: one pixel icon per arcade game the user CURRENTLY
 * tops, rendered in the meta row after the post count — the ORIGINAL engine
 * bitmaps (plain white rabbit, sitting sloth, the T tetromino), scaled to
 * sit beside 12px meta text. Trophy exception to the muted-icon meta rule:
 * crowns render ACCENT with a matching breathing glow (gold was tried and
 * reverted) — they're standings, not metadata. Hover = `TOP 1 · <GAME>`
 * (native title for now); click = the game page.
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

/** The Z tetromino from the engine's SHAPES, empty rows trimmed (a T was
 *  tried first — owner picked the Z). */
const TET_Z = SHAPES.Z.filter((row) => row.includes("X"));

/** Gap (px) between crowns — the same tuning surface as the per-icon sizes
 *  (started at the meta rows' 16px between-metrics gap). */
const CROWN_GAP = 16;

const CROWN_ICONS: Record<string, CrownIconDef> = {
  snake: {
    bitmap: RABBIT_PLAIN,
    solid: ["1"],
    color: "var(--m-accent)",
    size: 16,
  },
  "stay-awake": {
    bitmap: SLOTH_SIT,
    solid: ["1", "P"],
    color: "var(--m-accent)",
    size: 12,
  },
  tetris: {
    bitmap: TET_Z,
    solid: ["X"],
    color: "var(--m-accent)",
    size: 14,
    gap: 4,
  },
};

/** One engine bitmap as a pixel SVG, contain-fit into its own `size` box —
 *  eye/mouth chars stay transparent, so the faces read as punched holes.
 *  The trophy GLOW is the `.mono-crown-glow` pulse (tailwind.css) — a slow
 *  breathing double drop-shadow in the icon's own colour, static under
 *  reduced motion. */
function CrownIcon({ bitmap, solid, color, size }: CrownIconDef) {
  const h = bitmap.length;
  const w = bitmap[0].length;
  const scale = size / Math.max(w, h);
  const halo = `color-mix(in srgb, ${color} 45%, transparent)`;
  return (
    <svg
      width={w * scale}
      height={h * scale}
      viewBox={`0 0 ${w} ${h}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
      className="mono-crown-glow"
      style={{ "--crown-halo": halo } as React.CSSProperties}
    >
      {bitmap.flatMap((row, r) =>
        [...row].map((ch, c) =>
          solid.includes(ch) ? (
            <rect
              key={`${r}-${c}`}
              x={c}
              y={r}
              width={1}
              height={1}
              style={{ fill: color }}
            />
          ) : null
        )
      )}
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
        {crowns.map(({ game, title, href }) => {
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
              <CrownIcon {...def} />
            </Link>
          );
        })}
      </span>
    </>
  );
}
