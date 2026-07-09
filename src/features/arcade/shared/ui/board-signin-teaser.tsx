"use client";

import { Label } from "@/shared/ui";
import { BIN_GLYPHS, GlyphRainV } from "@/shared/ui/effects";

/**
 * Signed-out stand-in for a game page's high-score rail: a STATIC `// ` eyebrow
 * (the `Label` primitive renders the slashes — no scramble, owner call) over
 * the brand glyph rain (the `/brand` GLYPH-RAIN "15 · SPARSE" preset — half the
 * columns, so it shimmers instead of shouting) filling the rest of the rail.
 * BARE on the page surface (owner call): `surface="theme"` paints the live
 * `--m-bg`, no border, no panel. `lg:self-stretch` + `flex-1` size the rain box
 * to the grid row — i.e. the board's height; stacked (mobile) it falls back to
 * the brand lab's 200px box. The effect degrades under reduced motion.
 */
export function BoardSignInTeaser({
  text = "HIGH SCORES · MEMBERS ONLY",
  className = "",
}: {
  text?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col lg:self-stretch ${className}`}>
      <Label className="mono-label pb-4">{text}</Label>
      <div className="h-[200px] overflow-hidden lg:h-auto lg:flex-1">
        {/* opacity 0.2 — ambient shimmer only; full-strength rain pulled the
            eye off the game (owner call). */}
        <GlyphRainV
          glyphs={BIN_GLYPHS}
          surface="theme"
          speed={0.95}
          fade={0.13}
          density={0.7}
          opacity={0.4}
          scatter
        />
      </div>
    </div>
  );
}
