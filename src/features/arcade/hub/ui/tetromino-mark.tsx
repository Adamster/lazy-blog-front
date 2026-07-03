/**
 * A tiny canvas-free Tetris motif for the hub card — a single accent T-piece on a
 * 3×2 unit grid, each block inset 0.18/side (the in-game CELL_INSET block language,
 * 1:1 with the well render). Colour comes from the `--m-accent` token (resolved via
 * `style`, since an SVG `fill` presentation attribute won't evaluate `var()`).
 */
const CELLS: { x: number; y: number }[] = [
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: 1, y: 1 },
  { x: 2, y: 1 },
];

const COLS = 3;
const ROWS = 2;

export function TetrominoMark({ size = 48 }: { size?: number }) {
  return (
    <svg
      width={(size * COLS) / ROWS}
      height={size}
      viewBox={`0 0 ${COLS} ${ROWS}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      {CELLS.map((c, i) => (
        <rect
          key={i}
          x={c.x + 0.18}
          y={c.y + 0.18}
          width={0.64}
          height={0.64}
          style={{ fill: "var(--m-accent)" }}
        />
      ))}
    </svg>
  );
}
