import type { ReactNode } from "react";

type DividerVariant = "dots" | "slash";

const DIVIDER_GLYPHS: Record<DividerVariant, string> = {
  dots: "▪ ▪ ▪",
  slash: "——[ / ]——",
};

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

// `type` is a closed whitelist → a fixed class (never a user colour).
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
