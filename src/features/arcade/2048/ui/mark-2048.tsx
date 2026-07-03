/**
 * A tiny canvas-free 2048 motif for the hub card — a 2×2 cluster of tiles spelling
 * 2·0·4·8, each block inset so the board's grid gap shows. The four fills walk the
 * IN-GAME value ramp (see `buildFills`): the low greys (`dim` → `muted2`), the
 * ramp's muted-olive start, then the pure accent — so the mark previews the board's
 * actual colour progression, not four identical accent tiles. Numeral colour flips
 * fg/bg per fill the way `pickTextColour` does. Colours come from the `--m-*` tokens
 * (via `style`, since SVG presentation attributes won't evaluate `var()`).
 */
const TILES: {
  x: number;
  y: number;
  label: string;
  fill: string;
  text: string;
}[] = [
  { x: 0, y: 0, label: "2", fill: "var(--m-dim)", text: "var(--m-fg)" },
  { x: 1, y: 0, label: "0", fill: "var(--m-muted2)", text: "var(--m-bg)" },
  {
    x: 0,
    y: 1,
    label: "4",
    // The HSL ramp's muted-olive start, approximated in tokens.
    fill: "color-mix(in srgb, var(--m-accent) 55%, var(--m-muted2))",
    text: "var(--m-bg)",
  },
  { x: 1, y: 1, label: "8", fill: "var(--m-accent)", text: "var(--m-bg)" },
];

export function Mark2048({ size = 48 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 2 2"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      {TILES.map((t) => (
        <g key={t.label}>
          <rect
            // 0.12/side — the OPTICAL match for the in-game TILE_INSET (0.06):
            // the preview cell is ~5× smaller than a board cell, so the raw
            // fraction reads flush here; doubled, the air matches the game.
            x={t.x + 0.12}
            y={t.y + 0.12}
            width={0.76}
            height={0.76}
            shapeRendering="crispEdges"
            style={{ fill: t.fill }}
          />
          <text
            x={t.x + 0.5}
            y={t.y + 0.52}
            textAnchor="middle"
            dominantBaseline="central"
            style={{
              fill: t.text,
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "0.44px",
            }}
          >
            {t.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
