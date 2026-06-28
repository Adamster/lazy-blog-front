import { RABBIT_PLAIN, RABBIT_WHITE } from "../model/engine";

/**
 * The +10 white rabbit as a crisp SVG pixel grid for use OUTSIDE the canvas (the
 * header easter-egg). Reads the same {@link RABBIT_PLAIN} bitmap + {@link
 * RABBIT_WHITE} fill the engine paints, so it stays identical automatically —
 * never copy-paste the matrix. Each `"1"` → one 1×1 `<rect>`; `"0"`/`"."` stay
 * transparent (silhouette gaps + eye sockets).
 */
export function RabbitMark({
  size = 16,
  className,
  fill = RABBIT_WHITE,
}: {
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
