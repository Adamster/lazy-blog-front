import type { PieceType, TetrisInput, TetrisStep } from "./types";

/**
 * Headless CLASSIC TETRIS engine — all mutable state + the fixed-timestep sim
 * (gravity / DAS / lock / line-clear) + the imperative canvas draw, with NO React
 * (mirrors the Snake/Hollow-Sloth split: `useTetrisGame` owns one instance and the
 * rAF loop; the canvas is imperative so React never re-renders per frame — state
 * flows out only on discrete changes: score / lines / level / game-over).
 *
 * Ruleset is the PUREST classic (NES / Game Boy era) — see the constants: 10×20
 * well, seven tetrominoes, NES-style single-reroll randomizer, simple
 * rotate-if-it-fits (NRS-style, NO wall-kicks), ONE next preview, soft drop only
 * (NO hold / ghost / hard drop), classic 40/100/300/1200 scoring, per-level gravity
 * from the NES frame table.
 */

// ---------- well geometry ----------

/** Classic well: 10 wide × 20 tall. The board's CSS aspect is pinned to `COLS/ROWS`
 *  (1:2), so cells stay square (`cssW / COLS === cssH / ROWS`). */
export const COLS = 10;
export const ROWS = 20;

/** NEXT-preview grid — a 4×4 tile area (fits the widest piece, I); its canvas is a
 *  square, so `cssW / NEXT_COLS === cssH / NEXT_ROWS`. */
export const NEXT_COLS = 4;
/** 2, not 4 (owner call 2026-07-04): every piece is ≤ 2 rows tall in spawn
 *  orientation, and the empty rows of a square canvas read as phantom margin
 *  around the preview — the panel's gap-6 rhythm looked broken. */
export const NEXT_ROWS = 2;
/** NEXT-preview cell = well cell × this — a notch under in-game scale (owner
 *  call: the 1:1 preview read too big beside the well). */
/** Owner retune 2026-07-04: 0.75 → 0.6 — the preview shrank when it gained
 *  the NEXT label and joined the readout column. */
export const NEXT_CELL_SCALE = 0.6;
/** Cap on the preview cell (px). The readout column is fixed-size type, so
 *  the NEXT piece must not balloon with the well cell in FULLSCREEN — it
 *  tracks the well only up to this ceiling (≈ its normal-page size). */
export const NEXT_CELL_MAX = 14;

// ---------- timing (ms) ----------

const MS_PER_FRAME = 1000 / 60;

/**
 * NES gravity table — frames-per-row by level (index = level, clamped to the last).
 * Level 0 = 48 frames ≈ 800ms; it accelerates to 6 frames (~100ms) by level 9 and
 * bottoms at 2 frames beyond level 19. We then apply {@link GRAVITY_FLOOR_MS} so the
 * web build never drops below ~50ms/row (raw NES reaches 33/17ms — unfair at 60fps
 * in a browser), matching the owner's "floor around 50ms" intent while keeping the
 * classic curve shape.
 */
const GRAVITY_FRAMES = [
  48, 43, 38, 33, 28, 23, 18, 13, 8, 6, 5, 5, 5, 4, 4, 4, 3, 3, 3, 2,
];
const GRAVITY_FLOOR_MS = 50;

/** Soft-drop cadence (ms/row) while ↓ is held — a fixed fast rate that awards 1
 *  point per cell (classic). Faster than gravity until the high-level floor. */
const SOFT_DROP_MS = 40;

/** DAS (Delayed Auto-Shift): first held-move fires immediately, then the auto-repeat
 *  waits {@link DAS_DELAY} and repeats every {@link DAS_REPEAT} — the classic feel. */
const DAS_DELAY = 170;
const DAS_REPEAT = 50;

/** Lock delay: a piece that has landed locks after this grace period. It is NOT
 *  reset by moves/rotations (the timer runs from the FIRST landing), so there is no
 *  infinite-spin — minimal and classic-feeling, just enough web fairness. */
const LOCK_DELAY = 120;

/** Line-clear freeze: the completed rows flash for this long before they collapse
 *  (classic). Under reduced motion the hook passes `animate=false` → instant clear. */
const CLEAR_FLASH_MS = 300;
/** Flash blink half-period (ms) during the freeze. */
const FLASH_BLINK_MS = 70;

/** Cap a single sim advance (a backgrounded tab hands us a huge dt on resume). */
const MAX_DT = 100;

// ---------- scoring ----------

/** Classic line-clear base points by lines cleared (× (level + 1)). Index 4 = a Tetris. */
const LINE_SCORES = [0, 40, 100, 300, 1200];

// ---------- palette ----------
//
// THEME-NATIVE: unlike Snake/Hollow-Sloth (always dark), the Tetris well follows the
// ambient theme — the classic Game Boy was a LIGHT screen with dark blocks, so light is
// on-canon. The 2D context can't read CSS vars, so `useTetrisGame` resolves concrete
// colours from the live `--m-*` tokens and calls {@link TetrisEngine.setPalette} on
// mount + on every theme change; the engine reads every draw colour from this object.

/** Concrete draw colours the engine reads (all literal, resolved from tokens by the hook). */
export interface TetrisPalette {
  /** Field fill ← `--m-bg` (light `#f4f4f4` / dark `#181818`). */
  boardBg: string;
  /** 1px aim-grid hairline — an rgba derived from `--m-fg` at low alpha. */
  gridLine: string;
  /** Falling piece + NEXT preview ← `--m-accent` (light `#4d7c0f` / dark `#cdff48`). */
  pieceFill: string;
  /** Line-clear blink ← `--m-accent` (same as the piece). */
  flashAccent: string;
  /** Settled stack ← `--m-muted2` (light `#8c8c8c` / dark `#7a7a7a`) — a mid gray that
   *  stays clearly distinct from BOTH the bg and the accent piece on either theme. */
  lockedFill: string;
}

/** Dark-theme defaults (mirror the dark `--m-*` values) so the first paint / SSR looks
 *  right before the hook resolves the live tokens. */
const DEFAULT_PALETTE: TetrisPalette = {
  boardBg: "#181818",
  gridLine: "rgba(220,220,220,0.05)",
  pieceFill: "#cdff48",
  flashAccent: "#cdff48",
  lockedFill: "#7a7a7a",
};

/**
 * "TRANSPARENT" cell border — every filled cell is drawn inset by {@link CELL_INSET}
 * (a FRACTION of the cell, per side — the snake-classic `GLYPH_BG_INSET` block
 * language, owner pick over the old fixed 2 CSS px), so the well background (and the
 * hairline aim grid) shows through as a uniform frame around each block — distinct
 * bricks, matching the hub card's TetrominoMark. Uniform-per-cell
 * (neighbour-independent) is deliberate: edge treatments that depended on which side
 * "owned" a seam left the visible fills of adjacent cells misaligned (a J-piece's top
 * cell read shifted vs its bottom row). Tinted contour strokes were tried and rejected.
 */
const CELL_INSET = 0.18;

// ---------- tetromino shapes ----------

export const PIECE_TYPES: readonly PieceType[] = [
  "I",
  "O",
  "T",
  "S",
  "Z",
  "J",
  "L",
];

/** Spawn matrices (standard orientations). Each is square; rotation states are
 *  derived by rotating the MATRIX (keeps every cell on an integer grid — the classic
 *  "simple rotation"). */
export const SHAPES: Record<PieceType, string[]> = {
  I: ["....", "XXXX", "....", "...."],
  O: ["XX", "XX"],
  T: [".X.", "XXX", "..."],
  S: [".XX", "XX.", "..."],
  Z: ["XX.", ".XX", "..."],
  J: ["X..", "XXX", "..."],
  L: ["..X", "XXX", "..."],
};

type Matrix = boolean[][];

function toMatrix(rows: string[]): Matrix {
  return rows.map((r) => r.split("").map((ch) => ch === "X"));
}

/** Rotate a square matrix 90° clockwise: `out[c][N-1-r] = in[r][c]`. */
function rotateCW(m: Matrix): Matrix {
  const n = m.length;
  const out: Matrix = Array.from({ length: n }, () => Array(n).fill(false));
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      out[c][n - 1 - r] = m[r][c];
    }
  }
  return out;
}

/** Precompute the 4 rotation states of every piece (O's four are identical). */
const ROTATIONS: Record<PieceType, Matrix[]> = (() => {
  const out = {} as Record<PieceType, Matrix[]>;
  for (const t of PIECE_TYPES) {
    const states: Matrix[] = [toMatrix(SHAPES[t])];
    for (let i = 1; i < 4; i++) states.push(rotateCW(states[i - 1]));
    out[t] = states;
  }
  return out;
})();

interface Piece {
  type: PieceType;
  rot: number;
  x: number;
  y: number;
}

type Phase = "falling" | "clearing" | "over";

export class TetrisEngine {
  /** Grid[row][col]: 0 = empty, else piece-index+1 (rendered as a uniform locked shade). */
  private grid: number[][] = [];

  private piece: Piece | null = null;
  private nextIndex = 0;
  /** Last piece rolled — the NES randomizer rerolls ONCE if a roll repeats it. */
  private prevPieceIndex = -1;

  private phase: Phase = "falling";

  private score = 0;
  private lines = 0;
  private level = 0;
  private gravityMs = GRAVITY_FRAMES[0] * MS_PER_FRAME;

  // Timers (ms).
  private dropTimer = 0;
  private lockTimer = 0;
  /** Previous frame's softDrop — detects the press EDGE (see the gravity clamp). */
  private prevSoft = false;
  private dasDir = 0;
  private dasTimer = 0;
  private clearTimer = 0;
  private clearingRows: number[] = [];

  /** Live theme palette; starts on the dark defaults until the hook resolves the
   *  ambient `--m-*` tokens (see {@link setPalette}). */
  private palette: TetrisPalette = DEFAULT_PALETTE;

  constructor() {
    this.grid = TetrisEngine.emptyGrid();
  }

  /** Swap the draw palette — the hook calls this on mount AND on every theme change,
   *  then forces a redraw so even the static menu/paused/over screens repaint. */
  setPalette(palette: TetrisPalette) {
    this.palette = palette;
  }

  private static emptyGrid(): number[][] {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  }

  get isOver(): boolean {
    return this.phase === "over";
  }

  // ---------- lifecycle ----------

  /** Start a fresh game: empty well, score/lines/level 0, a fresh current + next piece. */
  reset() {
    this.grid = TetrisEngine.emptyGrid();
    this.phase = "falling";
    this.score = 0;
    this.lines = 0;
    this.level = 0;
    this.gravityMs = this.gravityMsFor(0);
    this.dropTimer = 0;
    this.lockTimer = 0;
    this.prevSoft = false;
    this.dasDir = 0;
    this.dasTimer = 0;
    this.clearTimer = 0;
    this.clearingRows = [];
    this.prevPieceIndex = -1;
    // First piece has no reroll bias; queue up the following one.
    const first = this.rollType();
    this.nextIndex = this.rollType();
    this.spawn(first);
  }

  private gravityMsFor(level: number): number {
    const f = GRAVITY_FRAMES[Math.min(level, GRAVITY_FRAMES.length - 1)];
    return Math.max(GRAVITY_FLOOR_MS, Math.round(f * MS_PER_FRAME));
  }

  /** NES-style randomizer: uniform roll with ONE reroll if it repeats the previous
   *  piece (the reroll is final — it may still repeat). Cuts obvious streaks without
   *  the modern 7-bag. */
  private rollType(): number {
    let idx = (Math.random() * PIECE_TYPES.length) | 0;
    if (idx === this.prevPieceIndex) {
      idx = (Math.random() * PIECE_TYPES.length) | 0;
    }
    this.prevPieceIndex = idx;
    return idx;
  }

  /** Place `index`'s piece at the classic top-centre. Returns false (→ top-out /
   *  game over) if it collides on spawn. */
  private spawn(index: number): boolean {
    const type = PIECE_TYPES[index];
    const n = ROTATIONS[type][0].length;
    const piece: Piece = {
      type,
      rot: 0,
      x: Math.floor((COLS - n) / 2),
      y: 0,
    };
    if (!this.fits(piece.type, piece.rot, piece.x, piece.y)) {
      this.piece = piece; // keep it visible on the game-over frame
      this.phase = "over";
      return false;
    }
    this.piece = piece;
    this.dropTimer = 0;
    this.lockTimer = 0;
    return true;
  }

  private spawnNext(): boolean {
    const index = this.nextIndex;
    this.nextIndex = this.rollType();
    return this.spawn(index);
  }

  // ---------- collision ----------

  /** Does `type`'s rotation `rot` fit at grid (x, y)? Out-of-bounds (any side, or the
   *  floor) or overlapping a locked cell = no fit. Cells above the top (gy < 0) are
   *  allowed so a piece can rotate near the ceiling. */
  private fits(type: PieceType, rot: number, x: number, y: number): boolean {
    const m = ROTATIONS[type][rot];
    for (let r = 0; r < m.length; r++) {
      for (let c = 0; c < m.length; c++) {
        if (!m[r][c]) continue;
        const gx = x + c;
        const gy = y + r;
        if (gx < 0 || gx >= COLS || gy >= ROWS) return false;
        if (gy >= 0 && this.grid[gy][gx]) return false;
      }
    }
    return true;
  }

  private canMoveDown(): boolean {
    const p = this.piece;
    return !!p && this.fits(p.type, p.rot, p.x, p.y + 1);
  }

  private tryMove(dx: number): boolean {
    const p = this.piece;
    if (!p) return false;
    if (this.fits(p.type, p.rot, p.x + dx, p.y)) {
      p.x += dx;
      return true;
    }
    return false;
  }

  /** Simple classic rotation: rotate if the rotated cells fit as-is, otherwise DON'T
   *  (no SRS wall-kicks). `dir` +1 = clockwise, −1 = counter-clockwise. */
  private tryRotate(dir: number): boolean {
    const p = this.piece;
    if (!p) return false;
    const rot = (p.rot + dir + 4) % 4;
    if (this.fits(p.type, rot, p.x, p.y)) {
      p.rot = rot;
      return true;
    }
    return false;
  }

  // ---------- the sim ----------

  /**
   * Advance the game by `dtMs` (wall-clock ms since the last frame, capped). Owns ALL
   * timers (gravity, DAS, soft drop, lock, line-clear freeze). Consumes the input's
   * one-shot rotate edges (mirrors Hollow-Sloth's edge handling). `animate` gates the
   * decorative line-clear FLASH only — false (reduced motion) collapses cleared rows
   * instantly. Returns the outcome for the hook to project to React state.
   */
  update(dtMs: number, input: TetrisInput, animate: boolean): TetrisStep {
    const dt = Math.min(dtMs, MAX_DT);

    if (this.phase === "over") return this.snapshot(true);

    // Line-clear freeze: nothing falls; count down, then collapse + spawn.
    if (this.phase === "clearing") {
      this.clearTimer += dt;
      if (this.clearTimer >= (animate ? CLEAR_FLASH_MS : 0)) {
        this.collapse();
        this.clearingRows = [];
        this.phase = "falling";
        // The refilled well may top out the next piece → report dead this tick.
        const alive = this.spawnNext();
        return this.snapshot(!alive);
      }
      return this.snapshot(false);
    }

    // Horizontal DAS.
    this.handleHorizontal(dt, input);

    // Rotation (one-shot edges; consume so a held key rotates once per press).
    if (input.rotateCW) {
      this.tryRotate(1);
      input.rotateCW = false;
    }
    if (input.rotateCCW) {
      this.tryRotate(-1);
      input.rotateCCW = false;
    }

    // Gravity + soft drop.
    const soft = input.softDrop;
    const interval = soft
      ? Math.min(this.gravityMs, SOFT_DROP_MS)
      : this.gravityMs;
    // Soft-drop press EDGE: the timer can hold most of a slow gravity tick; measured
    // against the much smaller soft interval, that bank replayed as a burst of
    // catch-up steps — the piece TELEPORTED to the floor when the press landed late
    // in the gravity cycle, but merely accelerated when it landed early. Clamp the
    // bank so pressing Down always yields the same smooth soft-drop (at most one
    // immediate cell).
    if (soft && !this.prevSoft) {
      this.dropTimer = Math.min(this.dropTimer, interval);
    }
    this.prevSoft = soft;
    this.dropTimer += dt;
    let guard = ROWS + 1; // the well is 20 tall — bound the catch-up loop
    while (this.dropTimer >= interval && guard-- > 0) {
      this.dropTimer -= interval;
      if (this.canMoveDown()) {
        this.piece!.y += 1;
        if (soft) this.score += 1; // classic soft-drop point per cell
      } else {
        this.dropTimer = 0; // landed — don't bank gravity while resting
        break;
      }
    }

    // Lock delay — the timer runs from the FIRST landing and is NOT reset by
    // moves/rotations (no infinite spin). If the piece can fall again (moved over a
    // gap) the timer clears and it keeps dropping.
    if (!this.canMoveDown()) {
      this.lockTimer += dt;
      if (this.lockTimer >= LOCK_DELAY) {
        return this.lockPiece();
      }
    } else {
      this.lockTimer = 0;
    }

    return this.snapshot(false);
  }

  private handleHorizontal(dt: number, input: TetrisInput) {
    let dir = 0;
    if (input.left && !input.right) dir = -1;
    else if (input.right && !input.left) dir = 1;

    if (dir === 0) {
      this.dasDir = 0;
      this.dasTimer = 0;
      return;
    }
    if (dir !== this.dasDir) {
      // Fresh press / direction flip: move once immediately, then wait DAS_DELAY.
      this.dasDir = dir;
      this.tryMove(dir);
      this.dasTimer = DAS_DELAY;
    } else {
      this.dasTimer -= dt;
      if (this.dasTimer <= 0) {
        this.tryMove(dir);
        this.dasTimer += DAS_REPEAT;
      }
    }
  }

  /**
   * Merge the landed piece into the stack, score/clear any completed rows, and either
   * enter the line-clear freeze (rows to flash) or spawn the next piece immediately.
   * Score + lines + level update NOW (at lock) so the HUD reflects it instantly; the
   * visual collapse follows the flash.
   */
  private lockPiece(): TetrisStep {
    const p = this.piece!;
    const m = ROTATIONS[p.type][p.rot];
    const typeVal = PIECE_TYPES.indexOf(p.type) + 1;
    for (let r = 0; r < m.length; r++) {
      for (let c = 0; c < m.length; c++) {
        if (!m[r][c]) continue;
        const gy = p.y + r;
        const gx = p.x + c;
        if (gy >= 0 && gy < ROWS && gx >= 0 && gx < COLS) {
          this.grid[gy][gx] = typeVal;
        }
      }
    }

    const full: number[] = [];
    for (let r = 0; r < ROWS; r++) {
      if (this.grid[r].every((v) => v !== 0)) full.push(r);
    }

    if (full.length > 0) {
      // Classic scoring at the CURRENT level, then advance lines/level/gravity.
      this.score += LINE_SCORES[full.length] * (this.level + 1);
      this.lines += full.length;
      const newLevel = Math.floor(this.lines / 10);
      if (newLevel !== this.level) {
        this.level = newLevel;
        this.gravityMs = this.gravityMsFor(this.level);
      }
      this.piece = null;
      this.clearingRows = full;
      this.clearTimer = 0;
      this.phase = "clearing";
      // The collapse + next spawn happen when the freeze elapses (see the "clearing"
      // branch of update). Under reduced motion the freeze is 0ms → the row clears
      // on the next tick with no flash. No piece is falling meanwhile (not dead yet).
      return this.snapshot(false);
    }

    // No clear — spawn immediately (may top out → dead).
    this.piece = null;
    const alive = this.spawnNext();
    return this.snapshot(!alive);
  }

  /** Remove the flagged full rows and drop everything above them down. */
  private collapse() {
    if (this.clearingRows.length === 0) return;
    const removed = new Set(this.clearingRows);
    const kept = this.grid.filter((_, r) => !removed.has(r));
    const cleared = this.clearingRows.length;
    for (let i = 0; i < cleared; i++) kept.unshift(Array(COLS).fill(0));
    this.grid = kept;
  }

  private snapshot(dead: boolean): TetrisStep {
    return {
      dead,
      score: this.score,
      lines: this.lines,
      level: this.level,
    };
  }

  // ---------- canvas draw ----------
  //
  // DPR-aware crisp rendering (same discipline as the Snake board): the hook sizes
  // the backing store = CSS size × dpr and pre-scales the ctx by `dpr`, so we reason
  // in CSS px here. `cell = cssH / ROWS` (=== cssW / COLS, square). Cells are solid,
  // device-pixel-snapped squares with the uniform {@link CELL_INSET_PX} "transparent
  // border" — see {@link fillCell}. All colours come from the theme-native
  // {@link TetrisPalette}: the accent piece/next vs the mid-gray settled stack, on the
  // ambient bg, with the fg-derived aim-grid hairline.

  /**
   * Fill one grid cell (device-pixel-snapped so blocks stay crisp), inset by
   * {@link CELL_INSET} of the cell on all four sides — the uniform "transparent
   * border" (see the constant's doc). Neighbour-independent, so adjacent cells'
   * visible fills always align; between two filled cells the gap reads as inset×2
   * with the aim grid's hairline running through it.
   */
  private fillCell(
    ctx: CanvasRenderingContext2D,
    cell: number,
    dpr: number,
    cx: number,
    cy: number,
    fill: string
  ) {
    const cellDev = cell * dpr;
    const pad = Math.max(1, Math.round(cellDev * CELL_INSET));
    const x0 = Math.round(cx * cellDev) + pad;
    const y0 = Math.round(cy * cellDev) + pad;
    const x1 = Math.round((cx + 1) * cellDev) - pad;
    const y1 = Math.round((cy + 1) * cellDev) - pad;
    ctx.fillStyle = fill;
    ctx.fillRect(x0 / dpr, y0 / dpr, (x1 - x0) / dpr, (y1 - y0) / dpr);
  }

  /** The 1px hairline aim grid — interior lines only (the board's outer frame is the
   *  2px `--m-dim` CSS border on the canvas). Each line is CENTERED on the same
   *  device-pixel boundary {@link fillCell} snaps to (`round(c·cell·dpr)`), so the gap
   *  left and right of a block is IDENTICAL — the old CSS-px rounding (`round(c·cell)
   *  + 0.5`) drifted up to 2 device px from the fill edges and hung the whole line on
   *  one side of the boundary, which read as blocks sitting off-centre in their cells. */
  private drawGrid(
    ctx: CanvasRenderingContext2D,
    cell: number,
    cssW: number,
    cssH: number,
    dpr: number
  ) {
    ctx.strokeStyle = this.palette.gridLine;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let c = 1; c < COLS; c++) {
      const p = Math.round(c * cell * dpr) / dpr;
      ctx.moveTo(p, 0);
      ctx.lineTo(p, cssH);
    }
    for (let r = 1; r < ROWS; r++) {
      const p = Math.round(r * cell * dpr) / dpr;
      ctx.moveTo(0, p);
      ctx.lineTo(cssW, p);
    }
    ctx.stroke();
  }

  /** Paint the well: field → 1px grid → locked stack → falling piece → line flash. */
  drawWell(
    ctx: CanvasRenderingContext2D,
    cssW: number,
    cssH: number,
    dpr: number
  ) {
    // Derive the cell from the HEIGHT: the canvas is sized to an exact 10×20 multiple
    // (see the hook), so `cssH / ROWS === cssW / COLS`, and ROWS·cell === cssH means the
    // bottom row lands flush on the field's bottom edge — no leftover dead strip.
    const cell = cssH / ROWS;
    ctx.fillStyle = this.palette.boardBg;
    ctx.fillRect(0, 0, cssW, cssH);
    this.drawGrid(ctx, cell, cssW, cssH, dpr);

    // Locked stack — mid gray, uniform-inset cells.
    const g = this.grid;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!g[r][c]) continue;
        this.fillCell(ctx, cell, dpr, c, r, this.palette.lockedFill);
      }
    }

    // Falling piece (never during the clear freeze — it's already merged).
    if (this.piece && this.phase !== "clearing") {
      const m = ROTATIONS[this.piece.type][this.piece.rot];
      for (let r = 0; r < m.length; r++) {
        for (let c = 0; c < m.length; c++) {
          if (!m[r][c]) continue;
          const gy = this.piece.y + r;
          if (gy < 0) continue;
          this.fillCell(
            ctx,
            cell,
            dpr,
            this.piece.x + c,
            gy,
            this.palette.pieceFill
          );
        }
      }
    }

    // Line-clear flash — the completed rows blink the accent, cell by cell (the OFF half
    // of the blink is just the already-painted field, so only the ON half draws).
    if (this.phase === "clearing" && this.clearingRows.length) {
      const on = Math.floor(this.clearTimer / FLASH_BLINK_MS) % 2 === 0;
      if (on) {
        for (const row of this.clearingRows) {
          for (let c = 0; c < COLS; c++) {
            this.fillCell(ctx, cell, dpr, c, row, this.palette.flashAccent);
          }
        }
      }
    }
  }

  /** Paint the ONE next piece, centred in the (square) preview canvas. */
  drawNext(
    ctx: CanvasRenderingContext2D,
    cssW: number,
    cssH: number,
    dpr: number
  ) {
    const cell = cssW / NEXT_COLS; // === cssH / NEXT_ROWS (square canvas → fills flush)
    ctx.fillStyle = this.palette.boardBg;
    ctx.fillRect(0, 0, cssW, cssH);

    const type = PIECE_TYPES[this.nextIndex];
    const m = ROTATIONS[type][0];
    // Occupied-cell bounding box.
    let minR = m.length;
    let maxR = -1;
    let minC = m.length;
    let maxC = -1;
    for (let r = 0; r < m.length; r++) {
      for (let c = 0; c < m.length; c++) {
        if (!m[r][c]) continue;
        if (r < minR) minR = r;
        if (r > maxR) maxR = r;
        if (c < minC) minC = c;
        if (c > maxC) maxC = c;
      }
    }
    if (maxR < 0) return;
    const bw = maxC - minC + 1;
    const bh = maxR - minR + 1;
    // Centre the BOUNDING BOX optically on both axes: a FRACTIONAL cell offset (e.g.
    // a 3-wide piece in the 4-wide box → 0.5-cell margins). Fine because the preview
    // is GRIDLESS (owner call — a grid was tried and removed; the cells track the
    // well's at NEXT_CELL_SCALE, a notch under in-game scale); `fillCell` pixel-snaps
    // each edge, so the fractional offset stays crisp.
    const offX = (NEXT_COLS - bw) / 2 - minC;
    const offY = (NEXT_ROWS - bh) / 2 - minR;
    // Same uniform-inset cells as the falling piece.
    for (let r = 0; r < m.length; r++) {
      for (let c = 0; c < m.length; c++) {
        if (!m[r][c]) continue;
        this.fillCell(
          ctx,
          cell,
          dpr,
          c + offX,
          r + offY,
          this.palette.pieceFill
        );
      }
    }
  }
}
