"use client";

import Link from "next/link";
import { useAuth } from "@/entities/session";
import { useArcadeCrowns } from "../model/use-arcade-crowns";

/**
 * Profile "// ARCADE ACHIEVEMENTS" block — one bordered chip per game the
 * user CURRENTLY tops, rendered below the bio (or below the meta row when
 * there's no bio). Design-file variant 1b (`notlazy/Arcade Achievements
 * Options.dc.html`), ported onto the project's own 2px-border convention
 * (the design file draws 1px — reference, not gospel). Click goes to the
 * game page.
 */

/** Trophy glyph — the design file's path had asymmetric handles (the right
 *  loop rendered near-solid, the left had a visible inner cutout); redrawn
 *  here as a bowl/rim/stem/base path plus ONE handle path mirrored via
 *  `scale(-1,1)`, so left/right are pixel-identical by construction. The
 *  handle's two attach points reach past the bowl's outline (into its fill,
 *  not just up to its edge) so the union reads as one connected piece even
 *  at the icon's real ~14px render size — flush against the curve left a
 *  visible hairline gap. */
const TROPHY_HANDLE =
  "M7.2,6 C4.3,5.5 2,7.2 2,9.3 C2,11.5 4,13.1 6.5,13.3 L6.9,11.7 C5,11.5 3.4,10.4 3.4,9.2 C3.4,8 5,6.9 7.5,7.3 Z";
const TROPHY_BOWL = "M6,5 L18,5 C18,9 15.5,12.5 12,13 C8.5,12.5 6,9 6,5 Z";
const TROPHY_RIM = "M6,3 L18,3 L18,5 L6,5 Z";
const TROPHY_STEM = "M11,13 L13,13 L13,16 L11,16 Z";
const TROPHY_BASE = "M8,16 L16,16 L16,18 L8,18 Z";

function TrophyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="var(--m-accent)"
      className="size-3.5 shrink-0"
      aria-hidden="true"
    >
      <path d={TROPHY_HANDLE} />
      <g transform="translate(24,0) scale(-1,1)">
        <path d={TROPHY_HANDLE} />
      </g>
      <path d={TROPHY_BOWL} />
      <path d={TROPHY_RIM} />
      <path d={TROPHY_STEM} />
      <path d={TROPHY_BASE} />
    </svg>
  );
}

/** Renders nothing when there are no crowns to show (no data yet, or the
 *  viewer is signed out — the leaderboard GET is auth-only). */
export function ArcadeAchievements({ userName }: { userName?: string }) {
  const { isAuthenticated } = useAuth();
  const crowns = useArcadeCrowns(userName, isAuthenticated);
  if (crowns.length === 0) return null;

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2">
        {crowns.map(({ game, title, href }) => (
          <Link
            key={game}
            href={href}
            title={`TOP 1 · ${title}`}
            aria-label={`Top 1 in ${title} — open the game`}
            className="mono-focus flex items-center gap-2 border-2 border-[var(--m-dim)] px-3 py-2 transition-colors hover:border-[var(--m-accent)]"
          >
            <TrophyIcon />
            <span className="text-[11px] font-semibold tracking-[0.12em] text-[var(--m-fg)] uppercase">
              {title}
            </span>
            <span className="text-[11px] text-[var(--m-muted2)]">rank #1</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
