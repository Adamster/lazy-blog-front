/**
 * The hub-card mark = a CROP OF REAL GAMEPLAY, at the engine's own render math:
 * each segment is an inset square in its cell ({@link GLYPH_BG_INSET}-mirroring
 * SEG_INSET — distinct blocks, not a solid worm), the body fades head → tail
 * (the engine's lerp-toward-field + alpha floor, folded into one opacity ramp
 * over the ambient bg), and the `--m-fg` food square sits a couple of cells
 * ahead at its in-game {@link FOOD_FILL} size. Theme-native like the game.
 */

/** Mirror of the engine's draw constants (`GLYPH_BG_INSET` / `GLYPH_TAIL_ALPHA`
 *  / the `lerpHex(accent, bg, 0.55) · t*0.9` colour pull — approximated as an
 *  extra alpha factor over the ambient field). */
const SEG_INSET = 0.18;
const TAIL_ALPHA = 0.3;
const BG_PULL = 0.55 * 0.9;
const FOOD_FILL = 0.62;

/** Segments HEAD FIRST — the same L-bend chase as the Rabbit card, one empty
 *  cell of tension before the food. */
const SEGMENTS: readonly [number, number][] = [
  [2, 1],
  [1, 1],
  [1, 0],
  [0, 0],
];
const FOOD: readonly [number, number] = [4, 1];
const COLS = 5;
const ROWS = 2;

export function SnakeMark({
  size = 16,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const last = SEGMENTS.length - 1;
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
      {SEGMENTS.map(([x, y], i) => {
        // `t` is 0 at the head, 1 at the tail — the in-game dim + fade.
        const t = i / last;
        return (
          <rect
            key={`${x}-${y}`}
            x={x + SEG_INSET}
            y={y + SEG_INSET}
            width={1 - 2 * SEG_INSET}
            height={1 - 2 * SEG_INSET}
            style={{ fill: "var(--m-accent)" }}
            fillOpacity={(1 - (1 - TAIL_ALPHA) * t) * (1 - BG_PULL * t)}
          />
        );
      })}
      <rect
        x={FOOD[0] + (1 - FOOD_FILL) / 2}
        y={FOOD[1] + (1 - FOOD_FILL) / 2}
        width={FOOD_FILL}
        height={FOOD_FILL}
        style={{ fill: "var(--m-fg)" }}
      />
    </svg>
  );
}
