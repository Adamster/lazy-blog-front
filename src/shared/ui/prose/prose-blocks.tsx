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
