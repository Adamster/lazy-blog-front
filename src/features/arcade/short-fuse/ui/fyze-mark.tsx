import { FYZE_SPRITE } from "../model/engine";

/**
 * The hub-card mark = the engine's OWN {@link FYZE_SPRITE} bitmap, drawn as
 * inset-free `<rect>`s at 1px-per-cell (the {@link SnakeMark} principle:
 * mark ↔ in-game sprite pull from the SAME source, so they can never drift).
 * Char → colour mirrors the engine's own char→fill contract (`"1"` body,
 * `"2"` accent band, `"3"` wick spark, `"0"` background knockout, `"."`
 * transparent) — theme-native via the CSS tokens the engine's live palette
 * itself resolves to (`--m-fg` / `--m-accent` / `--m-error` / `--m-bg`), not
 * the hardcoded `FYZE_BODY`/`FYZE_ACCENT`/`FYZE_SPARK` dark-theme reference
 * hexes (those only seed the engine's first paint before the hook resolves
 * live tokens).
 */
const CHAR_FILL: Record<string, string> = {
  "1": "var(--m-fg)",
  "2": "var(--m-accent)",
  "3": "var(--m-error)",
  "0": "var(--m-bg)",
};

const COLS = FYZE_SPRITE[0].length;
const ROWS = FYZE_SPRITE.length;

export function FyzeMark({
  size = 16,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={(size * COLS) / ROWS}
      height={size}
      viewBox={`0 0 ${COLS} ${ROWS}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={className}
      style={{ display: "block" }}
    >
      {FYZE_SPRITE.flatMap((row, y) =>
        row.split("").map((ch, x) => {
          const fill = CHAR_FILL[ch];
          if (!fill) return null;
          return (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width={1}
              height={1}
              style={{ fill }}
            />
          );
        })
      )}
    </svg>
  );
}
