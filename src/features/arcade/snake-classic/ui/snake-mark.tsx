import { FOOD_FILL, RABBIT_PLAIN } from "../model/engine";

/**
 * The hub-card mark = a CROP OF REAL GAMEPLAY, at the engine's own render math:
 * each segment is an inset square in its cell ({@link GLYPH_BG_INSET}-mirroring
 * SEG_INSET — distinct blocks, not a solid worm), the body fades head → tail
 * (the engine's lerp-toward-field + alpha floor, folded into one opacity ramp
 * over the ambient bg), and the `--m-fg` food sits a couple of cells ahead as
 * the SAME {@link RABBIT_PLAIN} pixel-sprite the engine draws, at its in-game
 * {@link FOOD_FILL} size — not a placeholder square. Theme-native like the game.
 */

/** Mirror of the engine's draw constants (`GLYPH_BG_INSET` / `GLYPH_TAIL_ALPHA`
 *  / the `lerpHex(accent, bg, 0.55) · t*0.9` colour pull — approximated as an
 *  extra alpha factor over the ambient field). */
const SEG_INSET = 0.18;
const TAIL_ALPHA = 0.3;
const BG_PULL = 0.55 * 0.9;

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

/** Rabbit-sprite fit, mirroring the engine's `drawFoodSprite` box math: the
 *  sprite's LARGER dimension (its 13-row height) fills `FOOD_FILL` of the
 *  cell, and the narrower 7-col width scales proportionally — never a
 *  separately-tuned size. */
const RABBIT_COLS = RABBIT_PLAIN[0].length;
const RABBIT_ROWS = RABBIT_PLAIN.length;
const RABBIT_UNIT = FOOD_FILL / Math.max(RABBIT_COLS, RABBIT_ROWS);
const RABBIT_W = RABBIT_COLS * RABBIT_UNIT;
const RABBIT_H = RABBIT_ROWS * RABBIT_UNIT;

export function SnakeMark({
  size = 16,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const last = SEGMENTS.length - 1;
  const rabbitX = FOOD[0] + (1 - RABBIT_W) / 2;
  const rabbitY = FOOD[1] + (1 - RABBIT_H) / 2;
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
      {RABBIT_PLAIN.flatMap((row, y) =>
        row
          .split("")
          .map((ch, x) =>
            ch === "1" ? (
              <rect
                key={`rabbit-${x}-${y}`}
                x={rabbitX + x * RABBIT_UNIT}
                y={rabbitY + y * RABBIT_UNIT}
                width={RABBIT_UNIT}
                height={RABBIT_UNIT}
                style={{ fill: "var(--m-fg)" }}
              />
            ) : null
          )
      )}
    </svg>
  );
}
