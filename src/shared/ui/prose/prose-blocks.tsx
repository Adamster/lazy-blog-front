import type { ReactNode } from "react";

/* ---------------------------------------------------------------------------
 * Block-level prose effect primitives — the BLOCK directives the post read view
 * routes to (`::divider`, `:::callout`). All static + server-safe; they reuse
 * the documented prose recipes (hr rhythm, info-box) so they read identically to
 * the rest of the article. Shown live in the LAB tab too. Visual treatment lives
 * in `.mono-divider` / `.mono-callout` (prose.css), so the editor preview and
 * read view agree.
 * ------------------------------------------------------------------------- */

type DividerVariant = "dots" | "slash";

const DIVIDER_GLYPHS: Record<DividerVariant, string> = {
  dots: "▪ ▪ ▪",
  slash: "——[ / ]——",
};

/**
 * ASCII section break — a centered glyph run on the section rhythm (`36px 0`,
 * matching `.mono-prose hr`). `variant` picks the glyph set. Static.
 */
export function AsciiDivider({
  variant = "dots",
}: {
  variant?: DividerVariant;
}) {
  const glyphs = DIVIDER_GLYPHS[variant] ?? DIVIDER_GLYPHS.dots;
  return (
    <div className="mono-divider" role="separator" aria-hidden="true">
      {glyphs}
    </div>
  );
}

type CalloutType = "note" | "warn";

const CALLOUT_EYEBROW: Record<CalloutType, string> = {
  note: "// NOTE",
  warn: "// WARN",
};

/**
 * Console callout — the info-box recipe (left 2px accent / error edge, `--m-card`
 * bg, `p-5`) with a `// NOTE` / `// WARN` eyebrow over body prose (14/1.85). The
 * `type` is a closed whitelist → a fixed class (never a user colour). Static.
 */
export function Callout({
  type = "note",
  children,
}: {
  type?: CalloutType;
  children: ReactNode;
}) {
  const variant = type === "warn" ? "warn" : "note";
  return (
    <div className={`mono-callout mono-callout--${variant}`}>
      <div className="mono-callout-eyebrow">{CALLOUT_EYEBROW[variant]}</div>
      <div className="mono-callout-body">{children}</div>
    </div>
  );
}
