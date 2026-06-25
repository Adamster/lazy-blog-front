import type { ReactNode } from "react";

/* ---------------------------------------------------------------------------
 * Block-level prose effect primitives — the BLOCK directives the post read view
 * routes to (`::divider`, `:::quote`, `:::callout`). All static + server-safe;
 * they reuse the documented prose recipes (hr rhythm, blockquote chrome, info-
 * box) so they read identically to the rest of the article. Shown live in the
 * LAB tab too. Visual treatment lives in `.mono-divider` / `.mono-pullquote` /
 * `.mono-callout` (prose.css), so the editor preview and read view agree.
 * ------------------------------------------------------------------------- */

type DividerVariant = "dots" | "slash" | "mark";

const DIVIDER_GLYPHS: Record<DividerVariant, string> = {
  dots: "▪ ▪ ▪",
  slash: "——[ / ]——",
  mark: "——[ ✕ ]——",
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

/**
 * Terminal pull-quote — the blockquote chrome (left 2px `--m-accent`, ~6% accent
 * wash) with the quote text stepped up to H3 18px/600 (the one prose-legal step,
 * NOT an invented size), a `// QUOTE` eyebrow and an optional `— @handle`
 * attribution (12px muted). Static.
 */
export function PullQuote({
  children,
  cite,
}: {
  children: ReactNode;
  /** Attribution handle/name (rendered as `— …`). */
  cite?: string;
}) {
  return (
    <blockquote className="mono-pullquote">
      <div className="mono-pullquote-eyebrow">{"// QUOTE"}</div>
      <div className="mono-pullquote-body">{children}</div>
      {cite ? <div className="mono-pullquote-cite">— {cite}</div> : null}
    </blockquote>
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
