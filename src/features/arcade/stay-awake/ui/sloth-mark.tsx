import {
  CACTUS_SPRITE,
  CELL_SCALE,
  COFFEE_SPRITE,
  SLOTH_SCALE,
  SLOTH_SIT,
  SPRITE_FILL,
} from "../model/engine";

/**
 * The hub-card mark = a CROP OF REAL GAMEPLAY on the shared cell grid, drawn
 * with the ACTUAL game sprites (owner call 2026-07-03 — the abstract squares
 * are gone): a cactus cell, the sitting sloth, and a coffee one hop ahead.
 * Sprites, fill and scales import straight from the engine, so the mark can
 * never drift from what the game renders. Theme-native like the game.
 */

const COLS = 5;
const ROWS = 4;

/** One engine pixel-bitmap as SVG rects, centred in cell (cellX, cellY) of
 *  the 1-unit-per-cell viewBox — the same SPRITE_FILL × scale box the canvas
 *  uses (a full-cell take was tried and reverted — owner call).
 *  `colorFor` maps a bitmap char to a CSS colour (null = transparent). */
function Sprite({
  cellX,
  cellY,
  sprite,
  scale,
  colorFor,
}: {
  cellX: number;
  cellY: number;
  sprite: readonly string[];
  scale: number;
  colorFor: (ch: string) => string | null;
}) {
  const sw = sprite[0].length;
  const sh = sprite.length;
  const px = (SPRITE_FILL * scale) / Math.max(sw, sh);
  const left = cellX + (1 - px * sw) / 2;
  const top = cellY + (1 - px * sh) / 2;
  return (
    <>
      {sprite.flatMap((row, r) =>
        [...row].map((ch, c) => {
          const fill = colorFor(ch);
          return fill ? (
            <rect
              key={`${r}-${c}`}
              x={left + c * px}
              y={top + r * px}
              width={px}
              height={px}
              style={{ fill }}
            />
          ) : null;
        })
      )}
    </>
  );
}

export function SlothMark({
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
      {/* cactus @ [1,1] */}
      <Sprite
        cellX={1}
        cellY={1}
        sprite={CACTUS_SPRITE}
        scale={CELL_SCALE}
        colorFor={(ch) => (ch === "1" ? "var(--m-error)" : null)}
      />
      {/* sloth @ [2,2] — the engine's char→colour mapping (body fg, face bg) */}
      <Sprite
        cellX={2}
        cellY={2}
        sprite={SLOTH_SIT}
        scale={SLOTH_SCALE}
        colorFor={(ch) =>
          ch === "1" || ch === "P"
            ? "var(--m-fg)"
            : ch === "W" || ch === "M"
              ? "var(--m-bg)"
              : null
        }
      />
      {/* coffee @ [3,1] — up and ahead */}
      <Sprite
        cellX={3}
        cellY={1}
        sprite={COFFEE_SPRITE}
        scale={CELL_SCALE}
        colorFor={(ch) =>
          ch === "1" ? "var(--m-accent)" : ch === "S" ? "var(--m-muted2)" : null
        }
      />
    </svg>
  );
}
