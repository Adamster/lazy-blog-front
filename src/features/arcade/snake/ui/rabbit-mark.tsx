import { RABBIT_PLAIN, RABBIT_WHITE } from "../model/engine";

/**
 * The game's white-rabbit (the +10 prize), rendered 1:1 as a crisp SVG pixel grid
 * for use OUTSIDE the canvas (the hidden header easter-egg entry to the arcade). It
 * reads the exact same {@link RABBIT_PLAIN} bitmap + {@link RABBIT_WHITE} fill the
 * engine paints on the board for the plain-white positive rabbit, so the mark stays
 * identical to the in-game sprite automatically — never copy-paste the matrix.
 *
 * Each `"1"` body pixel → one 1×1 `<rect>` on the bitmap's `cols × rows` viewBox;
 * `"0"` and `"."` cells are left transparent — the silhouette gaps + the eye sockets,
 * exactly like the board bg showing through in-game (the positive rabbit's eyes are
 * transparent sockets, same as the game). Square pixels, no anti-aliasing on the grid
 * edges — crisp at any DPR. Colour defaults to the game's white.
 */
export function RabbitMark({
  size = 16,
  className,
  fill = RABBIT_WHITE,
}: {
  /** Rendered height in px; width follows the bitmap aspect ratio. */
  size?: number;
  className?: string;
  fill?: string;
}) {
  const rows = RABBIT_PLAIN.length;
  const cols = RABBIT_PLAIN[0].length;
  const width = (size * cols) / rows;

  return (
    <svg
      width={width}
      height={size}
      viewBox={`0 0 ${cols} ${rows}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={className}
      style={{ display: "block" }}
    >
      {RABBIT_PLAIN.flatMap((row, y) =>
        row
          .split("")
          .map((ch, x) =>
            ch === "1" ? (
              <rect
                key={`${x}-${y}`}
                x={x}
                y={y}
                width={1}
                height={1}
                fill={fill}
              />
            ) : null
          )
      )}
    </svg>
  );
}
