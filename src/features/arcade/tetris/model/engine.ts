import type {
  ClearEvent,
  ClearKind,
  PieceType,
  TetrisInput,
  TetrisStep,
} from "./types";

/**
 * Headless MODERN-GUIDELINE TETRIS engine — all mutable state + the fixed-timestep
 * sim (gravity / DAS / lock / line-clear) + the imperative canvas draw, with NO React
 * (mirrors the Snake/Hollow-Sloth split: `useTetrisGame` owns one instance and the
 * rAF loop; state flows out only on discrete changes).
 *
 * Ruleset is the MODERN GUIDELINE (spec: docs/superpowers/specs/
 * 2026-07-05-tetris-modern-guideline-design.md): 10×20 well, SRS rotation with the
 * full tetris.wiki kick tables, 7-bag randomizer, hard drop (instant lock) + ghost,
 * hold (one swap per piece), 500ms move-reset lock delay (15-reset cap), 133/25 DAS,
 * T-spins (3-corner rule, mini + 5th-kick upgrade), guideline scoring (100/300/500/
 * 800, T-spin 400–1600, B2B ×1.5, combos, 1/2 pts per soft/hard-drop cell) — on the
 * web-tuned NES gravity curve (50ms floor). ONE next preview.
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
 *  the NEXT piece must not balloon with the well cell — it tracks the well
 *  only up to this ceiling (≈ its normal-page size). */
export const NEXT_CELL_MAX = 14;
/** FULLSCREEN ceiling on the preview cell (px). In fullscreen the well cell
 *  grows large and the panel type/glyphs scale up with it (PanelLabel 11→18,
 *  PanelReadout 18→32, panel column w-20→w-32 via FULLSCREEN_PANEL), so the
 *  normal 14px cap would leave HOLD/NEXT disproportionately tiny. This relaxed
 *  2× ceiling lets the glyph track the well while still fitting the widened
 *  column (nCell·NEXT_COLS = 28·4 = 112 ≤ the 128px w-32 panel). */
export const NEXT_CELL_MAX_FS = 28;

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

/** DAS (Delayed Auto-Shift): first held-move fires immediately, then auto-repeat
 *  waits {@link DAS_DELAY} and repeats every {@link DAS_REPEAT} — modern-tuned. */
const DAS_DELAY = 133;
const DAS_REPEAT = 25;

/** Lock delay (guideline move-reset): a landed piece locks after this grace, but a
 *  successful move/rotate restarts the timer — at most {@link LOCK_RESETS_MAX}
 *  times per piece, so there's no infinite stalling. */
const LOCK_DELAY = 500;
const LOCK_RESETS_MAX = 15;

/** Line-clear freeze: the completed rows flash for this long before they collapse
 *  (classic). Under reduced motion the hook passes `animate=false` → instant clear. */
const CLEAR_FLASH_MS = 300;
/** Flash blink half-period (ms) during the freeze. */
const FLASH_BLINK_MS = 70;

/** Cap a single sim advance (a backgrounded tab hands us a huge dt on resume). */
const MAX_DT = 100;

// ---------- scoring (guideline) ----------

/** Guideline line-clear base points by lines cleared (× (level + 1)). */
const LINE_SCORES = [0, 100, 300, 500, 800];
/** T-spin base points by lines cleared (0 = the no-line spin itself). */
const TSPIN_SCORES = [400, 800, 1200, 1600];
/** Mini T-spin base points by lines cleared. Tops out at a double — anything beyond
 *  falls back to the full T-spin table in lockPiece (defensive: a legal mini triple
 *  shouldn't exist, but NaN must be impossible). */
const TSPIN_MINI_SCORES = [100, 200, 400];
/** Back-to-back bonus on "difficult" clears (Tetris / any T-spin clear). */
const B2B_MULT = 1.5;
/** Per-combo-step bonus (× combo count × (level + 1)). */
const COMBO_POINTS = 50;

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
  /** Ghost (drop-preview) silhouette ← `--m-accent` at low alpha. */
  ghostFill: string;
}

/** Dark-theme defaults (mirror the dark `--m-*` values) so the first paint / SSR looks
 *  right before the hook resolves the live tokens. */
const DEFAULT_PALETTE: TetrisPalette = {
  boardBg: "#181818",
  gridLine: "rgba(220,220,220,0.05)",
  pieceFill: "#cdff48",
  flashAccent: "#cdff48",
  lockedFill: "#7a7a7a",
  ghostFill: "rgba(205,255,72,0.18)",
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

// ---------- SRS kick tables ----------
//
// tetris.wiki/Super_Rotation_System tables VERBATIM: offsets are (x, y) with +y UP,
// applied as `x + dx, y - dy` (our grid's +y is down). Rotation states: 0 spawn,
// 1 = R (one CW), 2 = two rotations, 3 = L (one CCW). Key = "from>to". First
// offset that fits wins. O never kicks (its rotation is the identity).

type Kick = readonly [number, number];

const kickKey = (from: number, to: number) => `${from}>${to}`;

const JLSTZ_KICKS: Record<string, readonly Kick[]> = {
  "0>1": [
    [0, 0],
    [-1, 0],
    [-1, 1],
    [0, -2],
    [-1, -2],
  ],
  "1>0": [
    [0, 0],
    [1, 0],
    [1, -1],
    [0, 2],
    [1, 2],
  ],
  "1>2": [
    [0, 0],
    [1, 0],
    [1, -1],
    [0, 2],
    [1, 2],
  ],
  "2>1": [
    [0, 0],
    [-1, 0],
    [-1, 1],
    [0, -2],
    [-1, -2],
  ],
  "2>3": [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, -2],
    [1, -2],
  ],
  "3>2": [
    [0, 0],
    [-1, 0],
    [-1, -1],
    [0, 2],
    [-1, 2],
  ],
  "3>0": [
    [0, 0],
    [-1, 0],
    [-1, -1],
    [0, 2],
    [-1, 2],
  ],
  "0>3": [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, -2],
    [1, -2],
  ],
};

const I_KICKS: Record<string, readonly Kick[]> = {
  "0>1": [
    [0, 0],
    [-2, 0],
    [1, 0],
    [-2, -1],
    [1, 2],
  ],
  "1>0": [
    [0, 0],
    [2, 0],
    [-1, 0],
    [2, 1],
    [-1, -2],
  ],
  "1>2": [
    [0, 0],
    [-1, 0],
    [2, 0],
    [-1, 2],
    [2, -1],
  ],
  "2>1": [
    [0, 0],
    [1, 0],
    [-2, 0],
    [1, -2],
    [-2, 1],
  ],
  "2>3": [
    [0, 0],
    [2, 0],
    [-1, 0],
    [2, 1],
    [-1, -2],
  ],
  "3>2": [
    [0, 0],
    [-2, 0],
    [1, 0],
    [-2, -1],
    [1, 2],
  ],
  "3>0": [
    [0, 0],
    [1, 0],
    [-2, 0],
    [1, -2],
    [-2, 1],
  ],
  "0>3": [
    [0, 0],
    [-1, 0],
    [2, 0],
    [-1, 2],
    [2, -1],
  ],
};

/** 7-bag randomizer: shuffle all seven piece indices, deal in order, refill when
 *  empty — the guideline randomizer (no droughts, no floods). RNG is injectable
 *  for tests (mirrors Engine2048). */
export class SevenBag {
  private bag: number[] = [];

  constructor(private rng: () => number = Math.random) {}

  next(): number {
    if (this.bag.length === 0) this.refill();
    return this.bag.pop()!;
  }

  reset() {
    this.bag = [];
  }

  private refill() {
    const b = PIECE_TYPES.map((_, i) => i);
    for (let i = b.length - 1; i > 0; i--) {
      const j = (this.rng() * (i + 1)) | 0;
      [b[i], b[j]] = [b[j], b[i]];
    }
    this.bag = b;
  }
}

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
  /** Held piece index (−1 = empty box) + the one-swap-per-piece latch. */
  private holdIndex = -1;
  private holdUsed = false;
  private bag: SevenBag;

  private phase: Phase = "falling";

  private score = 0;
  private lines = 0;
  private level = 0;
  private gravityMs = GRAVITY_FRAMES[0] * MS_PER_FRAME;

  // Timers (ms).
  private dropTimer = 0;
  private lockTimer = 0;
  private lockResets = 0;
  /** Previous frame's softDrop — detects the press EDGE (see the gravity clamp). */
  private prevSoft = false;
  private dasDir = 0;
  private dasTimer = 0;
  private clearTimer = 0;
  private clearingRows: number[] = [];

  /** Last successful action — T-spin detection needs "was the final maneuver a rotate". */
  private lastAction: "none" | "move" | "rotate" | "drop" = "none";
  /** Kick-table index of the applied rotation offset (−1 = none) — the 5th (index 4)
   *  upgrades a mini T-spin to full. */
  private lastKickIndex = -1;

  /** Combo counter: −1 idle; each consecutive clearing lock increments (bonus from 1). */
  private combo = -1;
  /** Last clearing lock was "difficult" (Tetris / T-spin) — arms the B2B bonus. */
  private b2bArmed = false;

  /** Live theme palette; starts on the dark defaults until the hook resolves the
   *  ambient `--m-*` tokens (see {@link setPalette}). */
  private palette: TetrisPalette = DEFAULT_PALETTE;

  constructor(rng: () => number = Math.random) {
    this.grid = TetrisEngine.emptyGrid();
    this.bag = new SevenBag(rng);
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
    this.lockResets = 0;
    this.prevSoft = false;
    this.dasDir = 0;
    this.dasTimer = 0;
    this.clearTimer = 0;
    this.clearingRows = [];
    this.lastAction = "none";
    this.lastKickIndex = -1;
    this.combo = -1;
    this.b2bArmed = false;
    this.holdIndex = -1;
    this.holdUsed = false;
    this.bag.reset();
    // Draw the first piece and queue the next from the bag.
    const first = this.bag.next();
    this.nextIndex = this.bag.next();
    this.spawn(first);
  }

  private gravityMsFor(level: number): number {
    const f = GRAVITY_FRAMES[Math.min(level, GRAVITY_FRAMES.length - 1)];
    return Math.max(GRAVITY_FLOOR_MS, Math.round(f * MS_PER_FRAME));
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
    this.lastAction = "none";
    this.lastKickIndex = -1;
    if (!this.fits(piece.type, piece.rot, piece.x, piece.y)) {
      this.piece = piece; // keep it visible on the game-over frame
      this.phase = "over";
      return false;
    }
    this.piece = piece;
    this.dropTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    return true;
  }

  private spawnNext(): boolean {
    const index = this.nextIndex;
    this.nextIndex = this.bag.next();
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

  /** How many rows the piece can fall before resting — the ghost/hard-drop distance. */
  private dropDistance(): number {
    const p = this.piece!;
    let d = 0;
    while (this.fits(p.type, p.rot, p.x, p.y + d + 1)) d++;
    return d;
  }

  private tryMove(dx: number): boolean {
    const p = this.piece;
    if (!p) return false;
    if (this.fits(p.type, p.rot, p.x + dx, p.y)) {
      p.x += dx;
      this.noteShift("move");
      return true;
    }
    return false;
  }

  /** Record a successful move/rotate: it becomes the "last action" (T-spin detection)
   *  and, if the piece is inside its lock-delay grace, restarts the timer — at most
   *  {@link LOCK_RESETS_MAX} times per piece (guideline move-reset). */
  private noteShift(action: "move" | "rotate") {
    this.lastAction = action;
    if (this.lockTimer > 0 && this.lockResets < LOCK_RESETS_MAX) {
      this.lockTimer = 0;
      this.lockResets += 1;
    }
  }

  /** SRS rotation: try the target state at each kick offset from the wiki tables
   *  (first fit wins — includes wall AND floor kicks). `dir` +1 = CW, −1 = CCW. */
  private tryRotate(dir: number): boolean {
    const p = this.piece;
    if (!p || p.type === "O") return false;
    const to = (p.rot + dir + 4) % 4;
    const kicks = (p.type === "I" ? I_KICKS : JLSTZ_KICKS)[kickKey(p.rot, to)];
    for (let i = 0; i < kicks.length; i++) {
      const [dx, dy] = kicks[i];
      const nx = p.x + dx;
      const ny = p.y - dy; // wiki +y is up; our +y is down
      if (this.fits(p.type, to, nx, ny)) {
        p.rot = to;
        p.x = nx;
        p.y = ny;
        this.lastKickIndex = i;
        this.noteShift("rotate");
        return true;
      }
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

    // Hold (one-shot edge): swap the falling piece with the box, once per piece.
    if (input.hold) {
      input.hold = false;
      if (!this.holdUsed && this.piece) {
        const cur = PIECE_TYPES.indexOf(this.piece.type);
        const stored = this.holdIndex;
        this.holdIndex = cur;
        this.holdUsed = true;
        const alive = stored >= 0 ? this.spawn(stored) : this.spawnNext();
        if (!alive) return this.snapshot(true);
      }
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

    // Hard drop (one-shot edge): teleport to the drop position and lock NOW — zero
    // frames, no lock-delay grace. +2 points per cell. A drop of 0 keeps the last
    // action (a rotate stays a T-spin); any fall overwrites it.
    if (input.hardDrop) {
      input.hardDrop = false;
      const d = this.dropDistance();
      if (d > 0) {
        this.piece!.y += d;
        this.score += d * 2;
        this.lastAction = "drop";
      }
      return this.lockPiece();
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
        this.lastAction = "drop";
        if (soft) this.score += 1; // classic soft-drop point per cell
      } else {
        this.dropTimer = 0; // landed — don't bank gravity while resting
        break;
      }
    }

    // Lock delay — guideline move-reset: the timer runs from landing; a successful
    // move/rotate restarts it via noteShift (≤ LOCK_RESETS_MAX per piece). If the
    // piece can fall again (moved over a gap) the timer clears and it keeps dropping.
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

  /** 3-corner T-spin test at lock time: T piece, last action a rotate, ≥3 of the
   *  piece box's diagonal corners occupied (walls/floor count). Mini when the two
   *  FRONT corners (the side the nose points to) aren't both filled — unless the
   *  rotation used the 5th kick offset, which upgrades to a full T-spin. */
  private tSpinKind(): "none" | "mini" | "full" {
    const p = this.piece!;
    if (p.type !== "T" || this.lastAction !== "rotate") return "none";
    const occupied = (gx: number, gy: number) =>
      gx < 0 ||
      gx >= COLS ||
      gy >= ROWS ||
      (gy >= 0 && this.grid[gy][gx] !== 0);
    const corners = [
      occupied(p.x, p.y), // 0 top-left
      occupied(p.x + 2, p.y), // 1 top-right
      occupied(p.x, p.y + 2), // 2 bottom-left
      occupied(p.x + 2, p.y + 2), // 3 bottom-right
    ];
    if (corners.filter(Boolean).length < 3) return "none";
    // Front corner pair by rotation state (0 nose-up, 1 right, 2 down, 3 left).
    const FRONT = [
      [0, 1],
      [1, 3],
      [2, 3],
      [0, 2],
    ][p.rot];
    if (corners[FRONT[0]] && corners[FRONT[1]]) return "full";
    return this.lastKickIndex === 4 ? "full" : "mini";
  }

  /**
   * Merge the landed piece into the stack, score/clear any completed rows, and either
   * enter the line-clear freeze (rows to flash) or spawn the next piece immediately.
   * Score + lines + level update NOW (at lock) so the HUD reflects it instantly; the
   * visual collapse follows the flash. The T-spin test runs BEFORE the merge — the
   * corner probe must not read the piece's own (about-to-be-placed) cells.
   */
  private lockPiece(): TetrisStep {
    const p = this.piece!;
    const tspin = this.tSpinKind();
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
    const n = full.length;

    // Guideline scoring at the CURRENT level; lines/level advance after.
    const base =
      tspin === "full"
        ? TSPIN_SCORES[n]
        : tspin === "mini"
          ? (TSPIN_MINI_SCORES[n] ?? TSPIN_SCORES[n])
          : LINE_SCORES[n];
    const difficult = n > 0 && (tspin !== "none" || n === 4);
    const b2b = difficult && this.b2bArmed;
    let pts = base * (this.level + 1);
    if (b2b) pts = Math.floor(pts * B2B_MULT);
    if (n > 0) {
      this.combo += 1;
      if (this.combo >= 1) pts += COMBO_POINTS * this.combo * (this.level + 1);
      this.b2bArmed = difficult; // a non-difficult clear breaks the chain
    } else {
      this.combo = -1; // a dry lock breaks the combo (B2B survives)
    }
    this.score += pts;

    let event: ClearEvent | null = null;
    if (n > 0 || tspin !== "none") {
      const kind: ClearKind =
        tspin === "full"
          ? "tspin"
          : tspin === "mini"
            ? "tspin-mini"
            : (["single", "double", "triple", "tetris"] as const)[n - 1];
      event = { kind, lines: n, b2b, combo: Math.max(this.combo, 0) };
    }

    this.holdUsed = false;

    if (n > 0) {
      this.lines += n;
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
      return this.snapshot(false, event);
    }

    // No clear — spawn immediately (may top out → dead).
    this.piece = null;
    const alive = this.spawnNext();
    return this.snapshot(!alive, event);
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

  private snapshot(dead: boolean, event: ClearEvent | null = null): TetrisStep {
    return {
      dead,
      score: this.score,
      lines: this.lines,
      level: this.level,
      event,
    };
  }

  // ---------- test-only debug surface ----------

  debugSetGrid(grid: number[][]) {
    this.grid = grid.map((r) => [...r]);
  }

  debugSetPiece(type: PieceType, rot: number, x: number, y: number) {
    this.piece = { type, rot, x, y };
    this.phase = "falling";
    this.dropTimer = 0;
    this.lockTimer = 0;
  }

  debugPiece() {
    return this.piece ? { ...this.piece } : null;
  }

  debugGrid(): number[][] {
    return this.grid.map((r) => [...r]);
  }

  debugInspect() {
    return {
      score: this.score,
      lines: this.lines,
      level: this.level,
      holdType: this.holdIndex >= 0 ? PIECE_TYPES[this.holdIndex] : null,
      holdUsed: this.holdUsed,
      nextType: PIECE_TYPES[this.nextIndex],
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
      // Ghost silhouette at the drop position (skipped when resting on it).
      const ghostD = this.dropDistance();
      if (ghostD > 0) {
        for (let r = 0; r < m.length; r++) {
          for (let c = 0; c < m.length; c++) {
            if (!m[r][c]) continue;
            const gy = this.piece.y + r + ghostD;
            if (gy < 0) continue;
            this.fillCell(
              ctx,
              cell,
              dpr,
              this.piece.x + c,
              gy,
              this.palette.ghostFill
            );
          }
        }
      }
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

  /**
   * Paint a piece centred in a (square) preview canvas. Used by drawNext and drawHold.
   * If type is null, fills the bg and returns (empty hold box).
   */
  private drawPreviewCanvas(
    ctx: CanvasRenderingContext2D,
    type: PieceType | null,
    fill: string,
    cssW: number,
    cssH: number,
    dpr: number
  ) {
    const cell = cssW / NEXT_COLS; // === cssH / NEXT_ROWS (square canvas → fills flush)
    ctx.fillStyle = this.palette.boardBg;
    ctx.fillRect(0, 0, cssW, cssH);

    if (!type) return;

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
        this.fillCell(ctx, cell, dpr, c + offX, r + offY, fill);
      }
    }
  }

  /** Paint the ONE next piece, centred in the preview canvas. */
  drawNext(
    ctx: CanvasRenderingContext2D,
    cssW: number,
    cssH: number,
    dpr: number
  ) {
    this.drawPreviewCanvas(
      ctx,
      PIECE_TYPES[this.nextIndex],
      this.palette.pieceFill,
      cssW,
      cssH,
      dpr
    );
  }

  /** Paint the HOLD box: empty bg when nothing held; dimmed once used this piece. */
  drawHold(
    ctx: CanvasRenderingContext2D,
    cssW: number,
    cssH: number,
    dpr: number
  ) {
    const type = this.holdIndex >= 0 ? PIECE_TYPES[this.holdIndex] : null;
    const fill = this.holdUsed
      ? this.palette.lockedFill
      : this.palette.pieceFill;
    this.drawPreviewCanvas(ctx, type, fill, cssW, cssH, dpr);
  }
}
