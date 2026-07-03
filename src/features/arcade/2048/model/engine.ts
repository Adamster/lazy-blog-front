import type { Direction, Input2048, Phase2048, Step2048 } from "./types";

/**
 * Headless CLASSIC 2048 engine — grid state + the slide/merge/spawn sim, with NO React
 * (mirrors the Tetris split: `use2048Game` owns one instance and the rAF loop; the
 * canvas draw is imperative — added alongside in this file — so React never re-renders
 * per frame; state flows out only on discrete changes: score / moves / phase).
 *
 * Ruleset is the purest classic: 4×4, two starting tiles, each move spawns one tile
 * (2 at 90% / 4 at 10%), equal tiles merge once per move resolved from the target
 * edge, score = sum of merged values, win at the first 2048 (endless continue),
 * over when no move changes the board. RNG is injected for deterministic tests.
 *
 * The LOGICAL grid commits instantly on every move; the slide/pop/spawn animation is
 * purely visual replay data — a new move mid-animation just replaces it, so fast play
 * is never input-blocked.
 */

export const GRID = 4;
export const WIN_VALUE = 2048;

/** Chance a spawned tile is a 4 (else 2) — the classic 10%. */
const SPAWN_FOUR_CHANCE = 0.1;

// Animation timings (ms) — visual only; `animate=false` (reduced motion) zeroes both.
const SLIDE_MS = 110;
const POP_MS = 90;
/** Merge-pop scale bulge (fraction of cell). */
const POP_BULGE = 0.08;

/** Cap a single sim advance (a backgrounded tab hands us a huge dt on resume). */
const MAX_DT = 100;

// ---------- palette ----------
//
// THEME-NATIVE (like Tetris, unlike Snake/Hollow-Sloth): the board follows the ambient
// theme. The 2D context can't read CSS vars, so `use2048Game` resolves concrete colours
// from the live `--m-*` tokens and calls {@link Engine2048.setPalette} on mount + on
// every theme change; the engine precomputes one fill per tile value from this object.

/** Concrete draw colours + the display font stack (all literal, resolved from tokens
 *  by the hook). */
export interface Palette2048 {
  /** Field fill ← `--m-bg`. */
  boardBg: string;
  /** 1px aim-grid hairline — an rgba derived from `--m-fg` at low alpha. */
  gridLine: string;
  /** Numeral colour on gray/tinted tiles ← `--m-fg`. */
  fg: string;
  /** Low-tile ramp start ← `--m-dim`. */
  dim: string;
  /** Low-tile ramp end / high-tile ramp start ← `--m-muted2`. */
  muted2: string;
  /** High-tile ramp end + the 2048 tile ← `--m-accent`. */
  accent: string;
  /** Resolved `--font-display` stack for the canvas numerals. */
  displayFont: string;
}

/** Dark-theme defaults (mirror the dark `--m-*` values) so the first paint / SSR looks
 *  right before the hook resolves the live tokens. */
const DEFAULT_PALETTE: Palette2048 = {
  boardBg: "#181818",
  gridLine: "rgba(220,220,220,0.05)",
  fg: "#dcdcdc",
  dim: "#383838",
  muted2: "#7a7a7a",
  accent: "#cdff48",
  displayFont: '"Space Grotesk", system-ui, sans-serif',
};

/**
 * "TRANSPARENT" cell border — every tile is drawn inset by {@link TILE_INSET} (a
 * FRACTION of the cell, per side — proportional like the Tetris/snake block language,
 * owner pick over the old fixed 2 CSS px that left the big 2048 tiles nearly flush
 * with the grid), so the field background (and the hairline grid) shows through as a
 * uniform frame of air around each tile. Deliberately lighter than Tetris's 0.18 —
 * the tile carries a numeral and stays the dominant fill.
 */
const TILE_INSET = 0.06;

/** Highest precomputed tile exponent (2^17 = 131072 — the endless-mode ceiling). */
const MAX_EXP = 17;

/** Parse `#rgb` / `#rrggbb` → `[r,g,b]`; falls back to a light gray on anything odd. */
export function parseHexRgb(hex: string): [number, number, number] {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  if (h.length !== 6 || Number.isNaN(n)) return [220, 220, 220];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** `[r,g,b]` (0–255, clamped/rounded) → `#rrggbb`. */
function rgbToHex([r, g, b]: [number, number, number]): string {
  const c = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** Linear mix of two hex colours, `t` 0 → a, 1 → b. Returns `#rrggbb` so the
 *  result round-trips back through {@link parseHexRgb}. Used for the grey pair. */
function mixHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = parseHexRgb(a);
  const [br, bg, bb] = parseHexRgb(b);
  const m = (x: number, y: number) => x + (y - x) * t;
  return rgbToHex([m(ar, br), m(ag, bg), m(ab, bb)]);
}

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

/** sRGB `[r,g,b]` (0–255) → HSL `[h(0–360), s(0–1), l(0–1)]`. */
function rgbToHsl([r, g, b]: [number, number, number]): [
  number,
  number,
  number,
] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === rn) h = ((gn - bn) / d) % 6;
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return [h, s, l];
}

/** HSL `[h(0–360), s(0–1), l(0–1)]` → sRGB `[r,g,b]` (0–255, unrounded). */
function hslToRgb([h, s, l]: [number, number, number]): [
  number,
  number,
  number,
] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const seg = Math.floor(h / 60) % 6;
  const [r1, g1, b1] =
    seg === 0
      ? [c, x, 0]
      : seg === 1
        ? [x, c, 0]
        : seg === 2
          ? [0, c, x]
          : seg === 3
            ? [0, x, c]
            : seg === 4
              ? [x, 0, c]
              : [c, 0, x];
  return [(r1 + m) * 255, (g1 + m) * 255, (b1 + m) * 255];
}

/** Linear interpolate two HSL triples (hue treated as plain scalar — the ramp
 *  holds a single accent hue on both ends, so there's no wrap to reason about). */
function lerpHsl(
  a: [number, number, number],
  b: [number, number, number],
  t: number
): [number, number, number] {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

/** WCAG relative luminance of an sRGB `[r,g,b]` (0–255), gamma-corrected. */
function relLuminance([r, g, b]: [number, number, number]): number {
  const lin = (c: number) => {
    const cn = c / 255;
    return cn <= 0.03928 ? cn / 12.92 : ((cn + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG contrast ratio between two relative luminances. */
function contrastRatio(l1: number, l2: number): number {
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

/** Pick whichever of the two candidate text colours yields the higher WCAG
 *  contrast against `fill` — so the numeral is legible on the ACTUAL resolved
 *  tile colour in either theme (no value-threshold guessing). */
function pickTextColour(fill: string, fg: string, bg: string): string {
  const lf = relLuminance(parseHexRgb(fill));
  const cFg = contrastRatio(lf, relLuminance(parseHexRgb(fg)));
  const cBg = contrastRatio(lf, relLuminance(parseHexRgb(bg)));
  return cBg > cFg ? bg : fg;
}

/** Ease-out cubic for the slide (fast start, gentle landing). */
function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

// ---------- pure line slide ----------

export interface LineResult {
  /** Resulting line, compacted toward index 0 (the edge being moved toward). */
  values: number[];
  /** Score gained from merges in this line. */
  gained: number;
  /** True when any tile moved or merged. */
  moved: boolean;
  /** Per SOURCE index: the destination index its tile ends at (null for empty cells). */
  dest: (number | null)[];
  /** Per DESTINATION index: true when a merge landed there (pop animation). */
  mergedAt: boolean[];
}

/**
 * Slide one line toward index 0 with classic single-merge semantics: tiles compact,
 * equal neighbours merge once per destination (a fresh merge result is not mergeable
 * again this move), pairs resolve from the target edge outward.
 */
export function slideLine(values: readonly number[]): LineResult {
  const n = values.length;
  const out: number[] = Array(n).fill(0);
  const dest: (number | null)[] = Array(n).fill(null);
  const mergedAt: boolean[] = Array(n).fill(false);
  let gained = 0;
  let w = 0;
  let mergeable = -1; // write index still eligible to absorb a merge

  for (let i = 0; i < n; i++) {
    const v = values[i];
    if (v === 0) continue;
    if (mergeable >= 0 && out[mergeable] === v) {
      out[mergeable] = v * 2;
      gained += v * 2;
      mergedAt[mergeable] = true;
      dest[i] = mergeable;
      mergeable = -1; // single merge per destination tile
    } else {
      out[w] = v;
      dest[i] = w;
      mergeable = w;
      w++;
    }
  }

  const moved = values.some((v, i) => v !== out[i]);
  return { values: out, gained, moved, dest, mergedAt };
}

// ---------- animation records (visual only) ----------

interface SlidingTile {
  fromR: number;
  fromC: number;
  toR: number;
  toC: number;
  /** Pre-merge value — what the tile shows WHILE it travels. */
  value: number;
}

interface CellRef {
  r: number;
  c: number;
}

export class Engine2048 {
  /** grid[row][col]: 0 = empty, else the tile value (a power of two). */
  private grid: number[][] = Engine2048.emptyGrid();

  private phase: Phase2048 = "playing";
  private score = 0;
  private moves = 0;
  /** 2048 reached at least once this run — win fires only the first time (endless). */
  private won = false;

  private rng: () => number;

  // Visual animation state (the logical grid is already final).
  private sliding: SlidingTile[] = [];
  private slideT = SLIDE_MS;
  private pops: CellRef[] = [];
  private spawned: CellRef | null = null;
  private popT = POP_MS;

  /** Live theme palette; starts on the dark defaults until the hook resolves the
   *  ambient `--m-*` tokens (see {@link setPalette}). */
  private palette: Palette2048 = DEFAULT_PALETTE;
  /** Precomputed fill per tile value (rebuilt on every palette swap). */
  private fills = new Map<number, string>();
  /** Precomputed numeral colour per tile value — chosen from the fill's real
   *  luminance (rebuilt alongside {@link fills} on every palette swap). */
  private texts = new Map<number, string>();

  constructor(rng: () => number = Math.random) {
    this.rng = rng;
    this.buildFills();
  }

  private static emptyGrid(): number[][] {
    return Array.from({ length: GRID }, () => Array(GRID).fill(0));
  }

  // ---------- lifecycle ----------

  /** Start a fresh game: empty grid, two spawned tiles, score/moves 0. */
  reset() {
    this.grid = Engine2048.emptyGrid();
    this.phase = "playing";
    this.score = 0;
    this.moves = 0;
    this.won = false;
    this.sliding = [];
    this.slideT = SLIDE_MS;
    this.pops = [];
    this.spawned = null;
    this.popT = POP_MS;
    this.spawnTile();
    this.spawnTile();
  }

  /** Resume endless play from the win screen. A winning move can also dead-lock the
   *  board (its spawn fills the last hole with no merges left) — the over check in
   *  `move()` was skipped by the win branch, so re-check here instead of resuming
   *  into an unplayable board. */
  continueRun() {
    if (this.phase !== "won") return;
    this.phase = this.hasMoves() ? "playing" : "over";
  }

  // ---------- the sim ----------

  /**
   * Advance by `dtMs`. Consumes the input's one-shot direction edge (mirrors the
   * Tetris rotate-edge handling). `animate` gates the decorative slide/pop replay
   * only — false (reduced motion) lands every move instantly.
   */
  update(dtMs: number, input: Input2048, animate: boolean): Step2048 {
    const dt = Math.min(dtMs, MAX_DT);

    if (input.dir) {
      const dir = input.dir;
      input.dir = null;
      if (this.phase === "playing") this.move(dir, animate);
    }

    this.tickAnim(dt);

    return this.snapshot();
  }

  /** Advance only the visual timers — the hook calls this while an overlay screen
   *  (menu/won/over) is up so a landing slide/pop still finishes behind the scrim. */
  tickAnim(dtMs: number) {
    const dt = Math.min(dtMs, MAX_DT);
    if (this.slideT < SLIDE_MS) {
      this.slideT = Math.min(SLIDE_MS, this.slideT + dt);
    } else if (this.popT < POP_MS) {
      this.popT = Math.min(POP_MS, this.popT + dt);
    }
  }

  /** Grid coords of line `li` for `dir`, ordered from the edge tiles slide toward. */
  private static lineCoords(dir: Direction, li: number): [number, number][] {
    const coords: [number, number][] = [];
    for (let i = 0; i < GRID; i++) {
      if (dir === "left") coords.push([li, i]);
      else if (dir === "right") coords.push([li, GRID - 1 - i]);
      else if (dir === "up") coords.push([i, li]);
      else coords.push([GRID - 1 - i, li]);
    }
    return coords;
  }

  /** Apply one move. Returns false (and changes nothing) when it's a no-op. */
  private move(dir: Direction, animate: boolean): boolean {
    const sliding: SlidingTile[] = [];
    const pops: CellRef[] = [];
    const next = Engine2048.emptyGrid();
    let movedAny = false;
    let gainedTotal = 0;

    for (let li = 0; li < GRID; li++) {
      const coords = Engine2048.lineCoords(dir, li);
      const res = slideLine(coords.map(([r, c]) => this.grid[r][c]));
      if (res.moved) movedAny = true;
      gainedTotal += res.gained;

      res.values.forEach((v, i) => {
        if (v === 0) return;
        const [r, c] = coords[i];
        next[r][c] = v;
        if (res.mergedAt[i]) pops.push({ r, c });
      });
      res.dest.forEach((d, i) => {
        if (d === null) return;
        const [fromR, fromC] = coords[i];
        const [toR, toC] = coords[d];
        sliding.push({
          fromR,
          fromC,
          toR,
          toC,
          value: this.grid[fromR][fromC],
        });
      });
    }

    if (!movedAny) return false;

    this.grid = next;
    this.score += gainedTotal;
    this.moves += 1;
    this.spawned = this.spawnTile();
    this.sliding = sliding;
    this.pops = pops;
    this.slideT = animate ? 0 : SLIDE_MS;
    this.popT = animate ? 0 : POP_MS;

    if (!this.won && this.grid.some((row) => row.some((v) => v >= WIN_VALUE))) {
      this.won = true;
      this.phase = "won";
    } else if (!this.hasMoves()) {
      this.phase = "over";
    }
    return true;
  }

  /** Spawn a 2 (90%) / 4 (10%) in a random empty cell. Null when the board is full
   *  (can't happen right after a legal move — defensive). */
  private spawnTile(): CellRef | null {
    const empties: CellRef[] = [];
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        if (!this.grid[r][c]) empties.push({ r, c });
      }
    }
    if (empties.length === 0) return null;
    const cell = empties[(this.rng() * empties.length) | 0];
    this.grid[cell.r][cell.c] = this.rng() < SPAWN_FOUR_CHANCE ? 4 : 2;
    return cell;
  }

  /** Any empty cell, or any equal orthogonal neighbours → a move still exists. */
  private hasMoves(): boolean {
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        const v = this.grid[r][c];
        if (v === 0) return true;
        if (c + 1 < GRID && this.grid[r][c + 1] === v) return true;
        if (r + 1 < GRID && this.grid[r + 1][c] === v) return true;
      }
    }
    return false;
  }

  private snapshot(): Step2048 {
    return { phase: this.phase, score: this.score, moves: this.moves };
  }

  // ---------- palette + draw state ----------

  /** Swap the draw palette — the hook calls this on mount AND on every theme change,
   *  then forces a redraw so even the static menu/won/over screens repaint. */
  setPalette(palette: Palette2048) {
    this.palette = palette;
    this.buildFills();
  }

  /**
   * Two-tier value ramp: **2 / 4** stay a plain GREY pair (`--m-dim` → `--m-muted2`,
   * no accent tint yet — "not colourful" tiles); **8 → 1024** climb a single-hue
   * accent ramp; **2048+** is the pure accent (the composer active-step treatment).
   *
   * The colour tier interpolates in **HSL, linearly**, NOT in raw RGB channels —
   * RGB-channel mixing between two low-luminance greens (the old `oliveDark`→accent
   * path) compressed almost the whole dark range into the first two steps on the
   * LIGHT theme, so 8/16 came out near-identical. Working in HSL and starting the
   * ramp a fixed **lightness spread** away from the accent (darker when the accent is
   * light → dark theme; lighter when the accent is dark → light theme) gives a wide,
   * even lightness climb in BOTH themes, so every step reads as distinct. Saturation
   * eases up from ~55% of the accent's at 8 (a muted olive "pop" off the grey pair)
   * to the full accent by 1024. A perceptual-distance check for both token sets lives
   * in the throwaway verification script (see the task report), not shipped.
   *
   * Numeral colour is chosen per tile from the fill's REAL WCAG luminance (see
   * {@link pickTextColour}) — never a hardcoded tile-value threshold, which broke on
   * the light theme where even the high tiles are a dark olive.
   */
  private buildFills() {
    const p = this.palette;
    const fills = new Map<number, string>();
    const texts = new Map<number, string>();
    const GREY_EXPS = 2; // values 2, 4
    const RAMP_TOP_EXP = 10; // value 1024 reaches the pure accent
    /** Lightness gap between the ramp's first colour and the accent (HSL L). */
    const SPREAD_L = 0.45;
    /** Ramp-start saturation as a fraction of the accent's (muted olive at 8). */
    const SAT_START = 0.55;

    const [aH, aS, aL] = rgbToHsl(parseHexRgb(p.accent));
    const startHsl: [number, number, number] = [
      aH,
      aS * SAT_START,
      clamp01(aL >= 0.5 ? aL - SPREAD_L : aL + SPREAD_L),
    ];
    const accentHsl: [number, number, number] = [aH, aS, aL];

    for (let exp = 1; exp <= MAX_EXP; exp++) {
      const value = 2 ** exp;
      let fill: string;
      if (exp <= GREY_EXPS) {
        fill = mixHex(p.dim, p.muted2, (exp - 1) / (GREY_EXPS - 1));
      } else if (exp <= RAMP_TOP_EXP) {
        const t = (exp - GREY_EXPS - 1) / (RAMP_TOP_EXP - GREY_EXPS - 1);
        fill = rgbToHex(hslToRgb(lerpHsl(startHsl, accentHsl, t)));
      } else {
        fill = p.accent;
      }
      fills.set(value, fill);
      texts.set(value, pickTextColour(fill, p.fg, p.boardBg));
    }
    this.fills = fills;
    this.texts = texts;
  }

  private fillFor(value: number): string {
    return this.fills.get(value) ?? this.palette.accent;
  }

  /** Numeral colour for a tile — precomputed from the fill's real luminance so it
   *  stays legible on the actual resolved colour in either theme. */
  private textFor(value: number): string {
    return this.texts.get(value) ?? this.palette.fg;
  }

  // ---------- test access ----------

  /** Deep-copied state for tests/debug. */
  inspect() {
    return {
      grid: this.grid.map((row) => [...row]),
      score: this.score,
      moves: this.moves,
      phase: this.phase,
    };
  }

  /** Test seam: overwrite the grid (phase/score untouched). */
  debugSetGrid(grid: number[][]) {
    this.grid = grid.map((row) => [...row]);
  }

  // ---------- canvas draw ----------
  //
  // DPR-aware crisp rendering (same discipline as the Tetris well): the hook sizes the
  // backing store = CSS size × dpr and pre-scales the ctx by `dpr`, so we reason in CSS
  // px here. The canvas is an exact 4×4 multiple of a square cell. Tiles are solid,
  // device-pixel-snapped squares with the uniform TILE_INSET "transparent border".

  /** The 1px hairline aim grid — interior lines only (the outer frame is the 2px
   *  `--m-dim` CSS border on the canvas). Each line is CENTERED on the same
   *  device-pixel boundary the tile fills snap to (`round(i·cell·dpr)`), so the gap
   *  each side of a tile is identical — the old CSS-px `round(i·cell) + 0.5` drifted
   *  from the fill edges and hung the line on one side of the boundary (the Tetris
   *  well had the same skew). */
  private drawGridLines(
    ctx: CanvasRenderingContext2D,
    cell: number,
    cssW: number,
    cssH: number,
    dpr: number
  ) {
    ctx.strokeStyle = this.palette.gridLine;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < GRID; i++) {
      const p = Math.round(i * cell * dpr) / dpr;
      ctx.moveTo(p, 0);
      ctx.lineTo(p, cssH);
      ctx.moveTo(0, p);
      ctx.lineTo(cssW, p);
    }
    ctx.stroke();
  }

  /**
   * One tile: a device-pixel-snapped inset square + the centred numeral. `scale`
   * grows/shrinks the rect about its centre (merge pop / spawn fade-in); the numeral
   * font steps down with digit count (canvas-internal sizes — exempt from the DOM
   * type scale, like SVG internals).
   */
  private drawTile(
    ctx: CanvasRenderingContext2D,
    cell: number,
    dpr: number,
    cx: number,
    cy: number,
    value: number,
    scale: number
  ) {
    const cellDev = cell * dpr;
    const pad = Math.max(1, Math.round(cellDev * TILE_INSET));
    let x0 = Math.round(cx * cellDev) + pad;
    let y0 = Math.round(cy * cellDev) + pad;
    let x1 = Math.round((cx + 1) * cellDev) - pad;
    let y1 = Math.round((cy + 1) * cellDev) - pad;
    if (scale !== 1) {
      const dw = ((x1 - x0) * (scale - 1)) / 2;
      const dh = ((y1 - y0) * (scale - 1)) / 2;
      x0 -= dw;
      x1 += dw;
      y0 -= dh;
      y1 += dh;
    }
    ctx.fillStyle = this.fillFor(value);
    ctx.fillRect(x0 / dpr, y0 / dpr, (x1 - x0) / dpr, (y1 - y0) / dpr);

    const digits = String(value).length;
    const px =
      cell *
      (digits <= 2 ? 0.42 : digits === 3 ? 0.34 : digits === 4 ? 0.28 : 0.22) *
      scale;
    ctx.font = `700 ${px}px ${this.palette.displayFont}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = this.textFor(value);
    ctx.fillText(String(value), (cx + 0.5) * cell, (cy + 0.5) * cell);
  }

  /** Paint the board: field → hairline grid → tiles (sliding replay OR settled grid
   *  with merge-pop / spawn-in scaling). */
  draw(ctx: CanvasRenderingContext2D, cssW: number, cssH: number, dpr: number) {
    const cell = cssH / GRID; // canvas is square and an exact 4-cell multiple
    ctx.fillStyle = this.palette.boardBg;
    ctx.fillRect(0, 0, cssW, cssH);
    this.drawGridLines(ctx, cell, cssW, cssH, dpr);

    // Slide replay: draw every surviving tile travelling from → to at its PRE-merge
    // value; merged results + the spawn appear when the slide lands.
    if (this.slideT < SLIDE_MS) {
      const t = easeOutCubic(this.slideT / SLIDE_MS);
      for (const m of this.sliding) {
        this.drawTile(
          ctx,
          cell,
          dpr,
          m.fromC + (m.toC - m.fromC) * t,
          m.fromR + (m.toR - m.fromR) * t,
          m.value,
          1
        );
      }
      return;
    }

    const pt = this.popT < POP_MS ? this.popT / POP_MS : 1;
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        const v = this.grid[r][c];
        if (!v) continue;
        let scale = 1;
        if (pt < 1) {
          if (this.spawned && this.spawned.r === r && this.spawned.c === c) {
            scale = 0.4 + 0.6 * pt; // spawn grows in
          } else if (this.pops.some((p) => p.r === r && p.c === c)) {
            scale = 1 + POP_BULGE * Math.sin(Math.PI * pt); // merge bulge
          }
        }
        this.drawTile(ctx, cell, dpr, c, r, v, scale);
      }
    }
  }
}
