import { RABBIT_PLAIN } from "@/features/arcade/snake";

/**
 * The Rabbit hub-card scene AT IN-GAME PROPORTIONS: the accent snake takes an
 * L-bend toward the white rabbit, which — exactly as in the game — is a
 * ONE-CELL pickup: the 7×13 {@link RABBIT_PLAIN} bitmap fit into a single cell
 * at the engine's ~0.96 cell fill. One empty cell of chase tension between
 * head and rabbit. The SAME chase composition as the Snake card (segments =
 * inset squares fading head → tail), only the prey differs. Colours via
 * `style` (SVG presentation attributes won't evaluate `var()`); the rabbit
 * reads via `--m-fg` (in-game white, theme-following on the card).
 */
/** Segment render — mirrors the snake cards' shared stylization (inset block
 *  squares, head→tail fade over the ambient field). */
const SEG_INSET = 0.18;
const TAIL_ALPHA = 0.3;
const BG_PULL = 0.55 * 0.9;
/** Segments HEAD FIRST. */
const SNAKE_CELLS: readonly [number, number][] = [
  [2, 1],
  [1, 1],
  [1, 0],
  [0, 0],
];
const RABBIT_CELL: [number, number] = [4, 1];
const COLS = 5;
const ROWS = 2;
/** The engine's rabbit box: RABBIT_BODY_SCALE ≈ 0.96 of the cell. */
const RABBIT_FILL = 0.96;

export function RabbitChaseMark({ size = 40 }: { size?: number }) {
  const rows = RABBIT_PLAIN.length;
  const cols = RABBIT_PLAIN[0].length;
  const px = RABBIT_FILL / rows; // one bitmap pixel, in cell units
  const x0 = RABBIT_CELL[0] + (1 - cols * px) / 2;
  const y0 = RABBIT_CELL[1] + (1 - RABBIT_FILL) / 2;

  return (
    <svg
      width={(size * COLS) / ROWS}
      height={size}
      viewBox={`0 0 ${COLS} ${ROWS}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      {SNAKE_CELLS.map(([x, y], i) => {
        // `t` is 0 at the head, 1 at the tail — the in-game dim + fade.
        const t = i / (SNAKE_CELLS.length - 1);
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
                key={`r-${x}-${y}`}
                x={x0 + x * px}
                y={y0 + y * px}
                width={px}
                height={px}
                style={{ fill: "var(--m-fg)" }}
              />
            ) : null
          )
      )}
    </svg>
  );
}
