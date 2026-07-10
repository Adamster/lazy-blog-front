import {
  BOMB_FILL,
  BOMB_SPRITE,
  FYZE_FILL,
  FYZE_SPRITE,
} from "../model/engine";

/**
 * The hub-card mark = a CROP OF REAL GAMEPLAY on the shared cell grid (the
 * family convention — see {@link SlothMark}/{@link SnakeMark}): a COARSE
 * 1-unit-per-cell viewBox matching the card's declared field span (3×2), with
 * the engine's own fine pixel bitmaps nested INSIDE their cells at the exact
 * in-game cell fill ({@link FYZE_FILL}/{@link BOMB_FILL}, imported — never a
 * separately-tuned size). Fyze sits bottom-left, his planted bomb bottom-right,
 * one empty cell of fuse-length tension between them; the top row stays grid
 * air. Sprites import straight from the engine ({@link FYZE_SPRITE} /
 * {@link BOMB_SPRITE}), so the mark can never drift from what the game
 * renders. Char → colour mirrors the engine's own live-palette resolution
 * (`"1"` body ← `--m-fg`, `"2"` accent band ← `--m-accent`, `"3"` wick spark ←
 * `--m-error`, `"0"` knockout ← `--m-bg`) — theme-native like the game, not
 * the hardcoded dark-reference hexes (those only seed the engine's first
 * paint).
 */

const COLS = 3;
const ROWS = 2;

const CHAR_FILL: Record<string, string> = {
  "1": "var(--m-fg)",
  "2": "var(--m-accent)",
  "3": "var(--m-error)",
  "0": "var(--m-bg)",
};

/** One engine pixel-bitmap as SVG rects, centred in cell (cellX, cellY) of
 *  the 1-unit-per-cell viewBox at the engine's own `fill` fraction — the same
 *  bounding-box math as the canvas `drawSprite` (larger dimension fills
 *  `fill` of the cell, the narrower one scales proportionally). */
function Sprite({
  cellX,
  cellY,
  sprite,
  fill,
}: {
  cellX: number;
  cellY: number;
  sprite: readonly string[];
  fill: number;
}) {
  const sw = sprite[0].length;
  const sh = sprite.length;
  const px = fill / Math.max(sw, sh);
  const left = cellX + (1 - px * sw) / 2;
  const top = cellY + (1 - px * sh) / 2;
  return (
    <>
      {sprite.flatMap((row, r) =>
        [...row].map((ch, c) => {
          const rectFill = CHAR_FILL[ch];
          return rectFill ? (
            <rect
              key={`${r}-${c}`}
              x={left + c * px}
              y={top + r * px}
              width={px}
              height={px}
              style={{ fill: rectFill }}
            />
          ) : null;
        })
      )}
    </>
  );
}

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
      {/* Fyze @ [0,1] — bottom-left */}
      <Sprite cellX={0} cellY={1} sprite={FYZE_SPRITE} fill={FYZE_FILL} />
      {/* planted bomb @ [2,1] — bottom-right, one empty cell of fuse between */}
      <Sprite cellX={2} cellY={1} sprite={BOMB_SPRITE} fill={BOMB_FILL} />
    </svg>
  );
}
