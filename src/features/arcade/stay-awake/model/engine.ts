import type {
  CellKind,
  DeathCause,
  HopDir,
  PhaseStayAwake,
  StayAwakeInput,
  StayAwakeStep,
} from "./types";

/**
 * Headless STAY AWAKE engine — an endless vertical climber: the sloth sits on a
 * fixed screen row and every hop (up-left / up-right; the WALLS ARE LETHAL —
 * hopping off the board ends the run, no bounce)
 * scrolls the tower down one row while a SLEEP WAVE rises from below on a timer.
 * All state + the sim + the canvas draw, with NO React (the Tetris/2048 split:
 * `useStayAwakeGame` owns one instance and the rAF loop; draw is imperative).
 * RNG is injected for deterministic tests.
 *
 * The LOGICAL world commits instantly on every hop; the short world-slide is
 * purely visual replay (`animate=false` — reduced motion — lands instantly).
 */

/** Well: 5 wide × 15 tall visible cells (owner playtest retunes: width
 *  13 → 10 → 11 → 9 → 7 → 5, height 20 → 15 → 12 → 15 — more look-ahead came
 *  back 2026-07-04). Odd width on purpose — a true centre column, so the
 *  start is symmetric: both LETHAL walls sit exactly START_COL hops away. */
export const COLS = 5;
export const ROWS = 15;
/** The sloth's fixed screen row (~3/4 down the well). */
export const PLAYER_ROW = 11;
export const START_COL = 2;

export const COFFEE_VALUE = 25;
/** Every RUSH_EVERY-th coffee freezes the wave for RUSH_MS. */
export const RUSH_EVERY = 3;
export const RUSH_MS = 3000;
/** Chamomile trap: the wave surges this many rows up. */
export const SURGE_ROWS = 3;

/** Wave cadence: one row per `waveMs`, accelerating with altitude (owner
 *  retune 2026-07-03: slowed from 1100/10/450 — a lazier lava). */
export const WAVE_MS_START = 1300;
export const WAVE_MS_ACCEL = 8;
export const WAVE_MS_FLOOR = 550;
/** The wave's top edge starts this many rows below the sloth… */
export const WAVE_START_GAP = 6;
/** …and hops can push it at most this far back (pressure never fully escapes). */
export const WAVE_MAX_GAP = 8;

export const CELL_EMPTY = 0 as CellKind;
export const CELL_CACTUS = 1 as CellKind;
export const CELL_COFFEE = 2 as CellKind;
export const CELL_CHAMOMILE = 3 as CellKind;
export const CELL_SHOT = 4 as CellKind;

/** The tequila shot arms cactus-proofing for this long… */
export const SHOT_MS = 3000;
/** …and the cacti blink error/accent for the last stretch as it wears off. */
const SHOT_WARN_MS = 1000;
const SHOT_BLINK_MS = 150;

// Difficulty ramp — cactus probability per cell, by altitude.
const CACTUS_P_BASE = 0.1;
const CACTUS_P_PER_ROW = 0.004;
const CACTUS_P_MAX = 0.32;
/** Chance a generated row carries one coffee. */
const COFFEE_ROW_P = 0.3;
/** Chance a generated row carries the chamomile trap (~1 per 40 rows). */
const CHAMOMILE_ROW_P = 1 / 40;
/** Chance a generated row carries the tequila shot — the RARE one. */
const SHOT_ROW_P = 1 / 60;
/** The first rows of a run are hazard-free — a gentle opening. */
const SAFE_OPENING_ROWS = 4;

/** Cap a single sim advance (a backgrounded tab hands us a huge dt on resume). */
const MAX_DT = 100;

/** Visual world-slide length (ms) after a hop — replay only, never logic. */
const SLIDE_MS = 90;

/**
 * The two cells a hop from column `c` aims at: `[left, right]` — RAW diagonals.
 * An out-of-bounds value (−1 or COLS) is the wall: hopping there is LETHAL
 * (owner retune — the earlier wall-bounce was cut). Callers filter or die.
 */
export function hopTargets(c: number): [number, number] {
  return [c - 1, c + 1];
}

/** The in-bounds subset of {@link hopTargets} — the cells that actually exist. */
export function landableTargets(c: number): number[] {
  return hopTargets(c).filter((t) => t >= 0 && t < COLS);
}

/**
 * Generate one new top row for the given altitude. Fairness invariant (the
 * head-exclusion analog): after generation, EVERY column keeps at least one
 * non-cactus IN-BOUNDS hop target in this row — with lethal walls that means a
 * wall-adjacent column's single inward diagonal (columns 1 and COLS−2) can
 * never be a cactus, so the sloth is never boxed between a wall and a spike.
 * Chamomile counts as landable (its cost is the surge, not death).
 */
export function generateRow(altitude: number, rng: () => number): CellKind[] {
  const row: CellKind[] = Array(COLS).fill(CELL_EMPTY);
  if (altitude < SAFE_OPENING_ROWS) return row;

  const p = Math.min(CACTUS_P_MAX, CACTUS_P_BASE + altitude * CACTUS_P_PER_ROW);
  for (let c = 0; c < COLS; c++) {
    if (rng() < p) row[c] = CELL_CACTUS;
  }
  // Fairness fix-up: clearing only ever REMOVES cactus, so one pass suffices.
  for (let c = 0; c < COLS; c++) {
    const targets = landableTargets(c);
    if (targets.every((t) => row[t] === CELL_CACTUS)) {
      row[targets[(rng() * targets.length) | 0]] = CELL_EMPTY;
    }
  }

  const free = () => {
    const cells: number[] = [];
    for (let c = 0; c < COLS; c++) {
      if (row[c] === CELL_EMPTY) cells.push(c);
    }
    return cells;
  };
  const coffeeCells = free();
  if (coffeeCells.length > 0 && rng() < COFFEE_ROW_P) {
    row[coffeeCells[(rng() * coffeeCells.length) | 0]] = CELL_COFFEE;
  }
  const trapCells = free();
  if (trapCells.length > 0 && rng() < CHAMOMILE_ROW_P) {
    row[trapCells[(rng() * trapCells.length) | 0]] = CELL_CHAMOMILE;
  }
  const shotCells = free();
  if (shotCells.length > 0 && rng() < SHOT_ROW_P) {
    row[shotCells[(rng() * shotCells.length) | 0]] = CELL_SHOT;
  }
  return row;
}

// ---------- palette ----------
//
// THEME-NATIVE (the Tetris/snake-classic pattern): the 2D context can't read CSS
// vars, so the hook resolves concrete colours from the live `--m-*` tokens and
// calls {@link StayAwakeEngine.setPalette} on mount + on every theme change.

export interface StayAwakePalette {
  /** Field fill ← `--m-bg`. */
  boardBg: string;
  /** Sloth body + landing-hint wash ← `--m-fg`. */
  fg: string;
  /** Coffee + chamomile petals (the trap MUST read pickup-friendly) ← `--m-accent`. */
  accent: string;
  /** Cactus ← `--m-error`. */
  error: string;
  /** Sleep-wave haze ← `--m-muted`. */
  muted: string;
  /** Steam / flower stem / dim details ← `--m-muted2`. */
  muted2: string;
  /** Faint cell grid ← `--m-fg` at a low alpha. */
  gridLine: string;
}

/** Dark-theme defaults so the first paint / SSR looks right before the hook
 *  resolves the live tokens. */
const DEFAULT_PALETTE: StayAwakePalette = {
  boardBg: "#181818",
  fg: "#dcdcdc",
  accent: "#cdff48",
  error: "#ff5d5d",
  muted: "#9a9a9a",
  muted2: "#7a7a7a",
  gridLine: "rgba(220,220,220,0.05)",
};

// ---------- sprites ----------
//
// Pixel bitmaps, rasterised with integer device-pixel blocks (the rabbit-snake
// discipline) so they stay crisp at any cell size. Char → colour is resolved
// per sprite; '.' = transparent. The bitmaps are AUTHORING SEEDS — tune pixels
// freely at playtest, keeping the char→colour mapping.

/** Sloth = the block-buddy read (owner reference 2026-07-03, the orange
 *  jelly-cube character): a rounded square, NO ears/limbs, with two BIG eyes
 *  (sclera + pupil) and a small open mouth. 12×12 so the face has room.
 *  '1' body ← fg, 'W' eye sclera + 'M' mouth ← boardBg, 'P' pupil ← fg. */
export const SLOTH_SIT = [
  "111......111",
  "111......111",
  "111......111",
  "111111111111",
  "111111111111",
  "111111111111",
  "111111111111",
  "11WWW11WWW11",
  "111111111111",
  "111111111111",
  "111111111111",
  "111111111111",
] as const;

/** Sloth, in flight: same face, mouth open WIDER — the "wheee" frame
 *  (symmetric, so no left/right mirror). */
const SLOTH_JUMP = [
  "............",
  "............",
  "............",
  "111......111",
  "111111111111",
  "111111111111",
  "111111111111",
  "111111111111",
  "11WWW11WWW11",
  "111111111111",
  "111111111111",
  "111111111111",
] as const;

/** Cactus: '1' ← error. */
export const CACTUS_SPRITE = [
  "..111..",
  "..111..",
  "1.111.1",
  "1.111.1",
  "1111111",
  "..111..",
  "..111..",
  "..111..",
] as const;

/** Coffee cup: '1' cup ← accent, 'S' steam ← muted2. */
export const COFFEE_SPRITE = [
  ".S..S..",
  "..S..S.",
  ".......",
  "111111.",
  "1111111",
  "111111.",
  ".11111.",
] as const;

/** Chamomile: 'P' petals ← accent (the trap reads as a pickup), 'C' core ← fg,
 *  'S' stem ← muted2. */
const CHAMOMILE_SPRITE = [
  "..P.P..",
  ".P.P.P.",
  "..PCP..",
  ".P.P.P.",
  "..P.P..",
  "...S...",
  "...S...",
] as const;

/** Tequila shot glass, third take (stemmed read martini; the solid taper read
 *  a blob): a straight tumbler drawn as GLASS WALLS around GREEN LIQUID —
 *  'G' glass ← muted2, 'T' tequila ← accent. The rare pickup: liquid courage —
 *  cacti go green and crushable for {@link SHOT_MS}. */
const SHOT_SPRITE = [
  "G.....G",
  "G.....G",
  "G.TTT.G",
  "G.TTT.G",
  "G.TTT.G",
  "G.TTT.G",
  ".GGGGG.",
] as const;

/** Figure box as a fraction of the cell — the ONE size knob (owner call
 *  2026-07-04: per-figure multipliers reset to 1; this alone sets how much
 *  air the figures keep, the way the rabbit board reads). */
export const SPRITE_FILL = 0.7;
/** Per-figure multipliers on top of {@link SPRITE_FILL} — kept as knobs,
 *  both at the neutral default (owner call). */
export const SLOTH_SCALE = 1;
export const CELL_SCALE = 1;

// Death burst — pixel debris when the sloth hits something (cactus / wall),
// so the run visibly ENDS instead of just stopping. Draw-only state, advanced
// per painted frame (the rAF loop keeps drawing after game over).
/** One debris chip; position/velocity in CELL units. */
interface Chip {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}
const CHIP_COUNT = 14;
const CHIP_LIFE_FRAMES = 36;
const CHIP_GRAVITY = 0.004;
const CHIP_SIZE = 0.1;
/** Sleep-haze alpha AT THE EDGE — the fill fades to 0 toward the bottom (the
 *  sparkline-gradient language). */
const WAVE_HAZE_ALPHA = 0.32;

/** `#rgb`/`#rrggbb` → `rgba(...)` at the given alpha (for canvas gradients —
 *  falls back to a light gray on anything odd). */
function hexToRgba(hex: string, alpha: number): string {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  if (h.length !== 6 || Number.isNaN(n)) return `rgba(220,220,220,${alpha})`;
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

export class StayAwakeEngine {
  /** rows[0] = the TOP visible row. The sloth lives at rows[PLAYER_ROW][col]. */
  private rows: CellKind[][] = [];

  private col = START_COL;
  private altitude = 0;
  private score = 0;
  private coffees = 0;
  private phase: PhaseStayAwake = "playing";
  private cause: DeathCause = null;

  /** Screen row index of the wave's top edge (below the field until it rises in). */
  private waveRow = PLAYER_ROW + WAVE_START_GAP;
  private waveAcc = 0;
  private rushMsLeft = 0;
  /** Cactus-proofing remaining (ms) from a tequila shot; 0 = unarmed. */
  private shotMsLeft = 0;
  /** Death-burst debris (draw-only). */
  private chips: Chip[] = [];

  // Visual world-slide replay after a hop.
  private slideT = SLIDE_MS;
  private slideFromCol = START_COL;

  /** Live theme palette; dark defaults until the hook resolves the tokens. */
  private palette: StayAwakePalette = DEFAULT_PALETTE;

  // Constructible = drawable (the Tetris/2048 contract): the hook paints the
  // menu screen before the first start(), so the field must exist from birth.
  constructor(private rng: () => number = Math.random) {
    this.reset();
  }

  /** Reset to a fresh run. Rows above the sloth generate at altitude 0 — i.e.
   *  hazard-free (the safe opening); rows below are cosmetic and stay empty. */
  reset() {
    this.rows = Array.from({ length: ROWS }, (_, r) =>
      r < PLAYER_ROW
        ? generateRow(0, this.rng)
        : (Array(COLS).fill(CELL_EMPTY) as CellKind[])
    );
    this.col = START_COL;
    this.altitude = 0;
    this.score = 0;
    this.coffees = 0;
    this.phase = "playing";
    this.cause = null;
    this.waveRow = PLAYER_ROW + WAVE_START_GAP;
    this.waveAcc = 0;
    this.rushMsLeft = 0;
    this.shotMsLeft = 0;
    this.chips = [];
    this.slideT = SLIDE_MS;
    this.slideFromCol = START_COL;
  }

  /** Swap the draw palette — the hook calls this on mount AND on every theme
   *  change (the rAF loop repaints every frame, so the next frame picks it up). */
  setPalette(palette: StayAwakePalette) {
    this.palette = palette;
  }

  /** Current wave cadence (ms per row) — accelerates with altitude to a floor. */
  private waveMs(): number {
    return Math.max(
      WAVE_MS_FLOOR,
      WAVE_MS_START - this.altitude * WAVE_MS_ACCEL
    );
  }

  /**
   * Advance by `dtMs`. Consumes the input's one-shot hop edge, then advances the
   * wave timer (frozen while an espresso rush runs). `animate` gates only the
   * decorative world-slide replay.
   */
  update(dtMs: number, input: StayAwakeInput, animate: boolean): StayAwakeStep {
    const dt = Math.min(dtMs, MAX_DT);

    if (input.dir) {
      const dir = input.dir;
      input.dir = null;
      if (this.phase === "playing") this.hop(dir, animate);
    }

    if (this.phase === "playing") {
      this.shotMsLeft = Math.max(0, this.shotMsLeft - dt);
      if (this.rushMsLeft > 0) {
        this.rushMsLeft = Math.max(0, this.rushMsLeft - dt);
      } else {
        this.waveAcc += dt;
        while (this.waveAcc >= this.waveMs() && this.phase === "playing") {
          this.waveAcc -= this.waveMs();
          this.waveRow -= 1;
          if (this.waveRow <= PLAYER_ROW) this.die("sleep");
        }
      }
    }

    if (this.slideT < SLIDE_MS)
      this.slideT = Math.min(SLIDE_MS, this.slideT + dt);

    return this.snapshot();
  }

  /** One hop: resolve the landing cell, then scroll the world down one row.
   *  Off the board = the LETHAL wall — the run ends, no bounce. */
  private hop(dir: HopDir, animate: boolean) {
    const [l, r] = hopTargets(this.col);
    const target = dir === "left" ? l : r;

    if (target < 0 || target >= COLS) {
      this.spawnBurst(target < 0 ? 0 : COLS, PLAYER_ROW + 0.5);
      this.die("wall");
      return;
    }

    const landing = this.rows[PLAYER_ROW - 1][target];
    if (landing === CELL_CACTUS && this.shotMsLeft === 0) {
      this.spawnBurst(target + 0.5, PLAYER_ROW - 0.5);
      this.die("cactus");
      return;
    }

    this.slideFromCol = this.col;
    this.col = target;
    this.altitude += 1;
    this.score += 1;
    this.rows.pop();
    this.rows.unshift(generateRow(this.altitude, this.rng));
    // The climb buys one row of distance (capped so pressure never fully escapes).
    this.waveRow = Math.min(this.waveRow + 1, PLAYER_ROW + WAVE_MAX_GAP);

    // The landed cell now sits at PLAYER_ROW (the world just scrolled).
    if (landing === CELL_COFFEE) {
      this.score += COFFEE_VALUE;
      this.coffees += 1;
      if (this.coffees % RUSH_EVERY === 0) this.rushMsLeft = RUSH_MS;
      this.rows[PLAYER_ROW][target] = CELL_EMPTY;
    } else if (landing === CELL_CHAMOMILE) {
      this.rows[PLAYER_ROW][target] = CELL_EMPTY;
      // The calming tea kills the caffeine: an active espresso rush ends NOW
      // (owner call 2026-07-03), on top of the wave surge.
      this.rushMsLeft = 0;
      this.waveRow -= SURGE_ROWS;
      if (this.waveRow <= PLAYER_ROW) {
        this.die("sleep");
        return;
      }
    } else if (landing === CELL_CACTUS) {
      // Shot-armored: the sloth crashes THROUGH the cactus.
      this.rows[PLAYER_ROW][target] = CELL_EMPTY;
    } else if (landing === CELL_SHOT) {
      this.shotMsLeft = SHOT_MS;
      this.rows[PLAYER_ROW][target] = CELL_EMPTY;
    }

    this.slideT = animate ? 0 : SLIDE_MS;
  }

  private die(cause: Exclude<DeathCause, null>) {
    this.phase = "over";
    this.cause = cause;
  }

  /** Scatter debris chips from a collision point (cell units) — the visible
   *  "you hit something" beat before the game-over overlay. */
  private spawnBurst(x: number, y: number) {
    for (let i = 0; i < CHIP_COUNT; i++) {
      const a = this.rng() * Math.PI * 2;
      const speed = 0.02 + this.rng() * 0.05;
      this.chips.push({
        x,
        y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed - 0.03,
        life: CHIP_LIFE_FRAMES * (0.6 + this.rng() * 0.4),
      });
    }
  }

  private snapshot(): StayAwakeStep {
    return {
      phase: this.phase,
      cause: this.cause,
      score: this.score,
      altitude: this.altitude,
      coffees: this.coffees,
      waveGap: Math.max(0, this.waveRow - PLAYER_ROW),
      rushMsLeft: this.rushMsLeft,
      shotMsLeft: this.shotMsLeft,
    };
  }

  // ---------- canvas draw ----------
  //
  // DPR-aware crisp rendering: the hook sizes the backing store = CSS size × dpr
  // and pre-scales the ctx, so we reason in CSS px; sprite blocks are computed in
  // device px and converted back (÷dpr) so every bit lands on whole device pixels.

  /** Faint interior cell grid (the outer frame is the canvas's 2px CSS border).
   *  The HORIZONTAL lines ride the world-slide offset, so on a hop the whole
   *  world — cells AND grid — settles down together (a static grid under
   *  moving sprites read confusing, owner call 2026-07-03; the same call cut
   *  the last hop-hint experiment, muted landing ledges — with the grid alive
   *  the motion explains itself. Earlier cut hints: 45° lattice, corner ticks,
   *  fg wash, hesitation-gated wash.) The grid is cell-periodic and the slide
   *  is exactly one cell, so it lands seamlessly on itself. */
  private drawGrid(
    ctx: CanvasRenderingContext2D,
    cssW: number,
    cssH: number,
    worldOff: number
  ) {
    const cell = cssW / COLS;
    ctx.strokeStyle = this.palette.gridLine;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < COLS; i++) {
      const p = Math.round(i * cell) + 0.5;
      ctx.moveTo(p, 0);
      ctx.lineTo(p, cssH);
    }
    // One extra index (ROWS) keeps the bottom covered mid-slide; edge-riding
    // lines just sit on the border, invisibly.
    for (let i = 1; i <= ROWS; i++) {
      const p = Math.round(i * cell + worldOff) + 0.5;
      if (p <= 0 || p >= cssH) continue;
      ctx.moveTo(0, p);
      ctx.lineTo(cssW, p);
    }
    ctx.stroke();
  }

  /**
   * One pixel-bitmap sprite centred in cell (x, y) — integer device-pixel block
   * per bit (≥1) so the figure is always crisp and never rounds away. `x`/`y`
   * accept fractions (the hop/world-slide interpolation).
   */
  private drawSprite(
    ctx: CanvasRenderingContext2D,
    cell: number,
    dpr: number,
    x: number,
    y: number,
    sprite: readonly string[],
    resolve: (ch: string) => string | null,
    scale = 1
  ) {
    const sw = sprite[0].length;
    const sh = sprite.length;
    const boxDev = cell * SPRITE_FILL * scale * dpr;
    const block = Math.max(1, Math.floor(boxDev / Math.max(sw, sh)));
    const cellDev = cell * dpr;
    const leftDev = Math.round(x * cellDev + (cellDev - block * sw) / 2);
    const topDev = Math.round(y * cellDev + (cellDev - block * sh) / 2);
    ctx.imageSmoothingEnabled = false;
    for (let r = 0; r < sh; r++) {
      for (let c = 0; c < sw; c++) {
        const color = resolve(sprite[r][c]);
        if (!color) continue;
        ctx.fillStyle = color;
        ctx.fillRect(
          (leftDev + c * block) / dpr,
          (topDev + r * block) / dpr,
          block / dpr,
          block / dpr
        );
      }
    }
  }

  private cellResolver(kind: CellKind): {
    sprite: readonly string[];
    resolve: (ch: string) => string | null;
  } | null {
    const p = this.palette;
    if (kind === CELL_CACTUS) {
      // Shot-armored cacti go accent (safe to crush); they blink back toward
      // error for the last second as the shot wears off.
      const armed =
        this.shotMsLeft > 0 &&
        (this.shotMsLeft >= SHOT_WARN_MS ||
          Math.floor(this.shotMsLeft / SHOT_BLINK_MS) % 2 === 1);
      return {
        sprite: CACTUS_SPRITE,
        resolve: (ch) => (ch === "1" ? (armed ? p.accent : p.error) : null),
      };
    }
    if (kind === CELL_SHOT) {
      return {
        sprite: SHOT_SPRITE,
        resolve: (ch) => (ch === "T" ? p.accent : ch === "G" ? p.muted2 : null),
      };
    }
    if (kind === CELL_COFFEE) {
      return {
        sprite: COFFEE_SPRITE,
        resolve: (ch) => (ch === "1" ? p.accent : ch === "S" ? p.muted2 : null),
      };
    }
    if (kind === CELL_CHAMOMILE) {
      return {
        sprite: CHAMOMILE_SPRITE,
        resolve: (ch) =>
          ch === "P"
            ? p.accent
            : ch === "C"
              ? p.fg
              : ch === "S"
                ? p.muted2
                : null,
      };
    }
    return null;
  }

  /** Advance + paint the death-burst debris (draw-only; runs after game over
   *  because the rAF loop keeps painting). Reduced motion: no burst at all. */
  private drawBurst(
    ctx: CanvasRenderingContext2D,
    cell: number,
    animate: boolean
  ) {
    if (this.chips.length === 0) return;
    if (!animate) {
      this.chips = [];
      return;
    }
    const s = Math.max(2, cell * CHIP_SIZE);
    ctx.fillStyle = this.palette.error;
    for (const c of this.chips) {
      c.x += c.vx;
      c.y += c.vy;
      c.vy += CHIP_GRAVITY;
      c.life -= 1;
      ctx.globalAlpha = Math.max(0, Math.min(1, c.life / 18));
      ctx.fillRect(c.x * cell - s / 2, c.y * cell - s / 2, s, s);
    }
    ctx.globalAlpha = 1;
    this.chips = this.chips.filter((c) => c.life > 0);
  }

  /** The sleep wave: a translucent haze from its (sub-row interpolated) edge to
   *  the bottom. Rush = accent edge. */
  private drawWave(
    ctx: CanvasRenderingContext2D,
    cell: number,
    cssW: number,
    cssH: number,
    worldOff: number,
    animate: boolean
  ) {
    const p = this.palette;
    // Smooth rise between ticks with animation; discrete steps without.
    const progress =
      animate && this.rushMsLeft === 0 ? this.waveAcc / this.waveMs() : 0;
    const edgeY = (this.waveRow - progress) * cell + worldOff;
    if (edgeY >= cssH) return;

    // The advancing wall is DANGER-coloured like the lethal side walls and the
    // cactus (owner call) — and fades like a sparkline fill: strongest at the
    // edge, dissolving to transparent toward the bottom (owner call, the chart
    // gradient language). Never a solid block.
    const top = Math.max(0, edgeY);
    const haze = ctx.createLinearGradient(0, top, 0, cssH);
    haze.addColorStop(0, hexToRgba(p.error, WAVE_HAZE_ALPHA));
    haze.addColorStop(1, hexToRgba(p.error, 0));
    ctx.fillStyle = haze;
    ctx.fillRect(0, top, cssW, cssH - top);

    // The edge line — accent while an espresso rush freezes the wave (the one
    // "frozen/safe" signal), danger red otherwise. (The drifting Z glyphs that
    // rode the edge were cut by owner call 2026-07-03 — visual noise.)
    ctx.fillStyle = this.rushMsLeft > 0 ? p.accent : p.error;
    ctx.fillRect(0, Math.round(top), cssW, 2);
  }

  /** Paint the board: field → grid → cells → sloth → wave haze. */
  draw(
    ctx: CanvasRenderingContext2D,
    cssW: number,
    cssH: number,
    dpr: number,
    animate: boolean
  ) {
    const cell = cssW / COLS; // === cssH / ROWS (square cells, pinned aspect)
    const p = this.palette;
    ctx.fillStyle = p.boardBg;
    ctx.fillRect(0, 0, cssW, cssH);

    // World-slide replay: rows, the GRID and the wave settle DOWN into place
    // together; the sloth eases across from its previous column with a small
    // hop bob.
    const t = this.slideT >= SLIDE_MS ? 1 : this.slideT / SLIDE_MS;
    const ease = 1 - (1 - t) ** 3;
    const worldOff = -(1 - ease) * cell;

    this.drawGrid(ctx, cssW, cssH, worldOff);

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const drawn = this.cellResolver(this.rows[r][c]);
        if (!drawn) continue;
        this.drawSprite(
          ctx,
          cell,
          dpr,
          c,
          r + worldOff / cell,
          drawn.sprite,
          drawn.resolve,
          CELL_SCALE
        );
      }
    }

    const slothX = this.slideFromCol + (this.col - this.slideFromCol) * ease;
    const bob = t < 1 ? -0.22 * Math.sin(Math.PI * ease) : 0;
    const pose = t < 1 ? SLOTH_JUMP : SLOTH_SIT;
    this.drawSprite(
      ctx,
      cell,
      dpr,
      slothX,
      PLAYER_ROW + bob,
      pose,
      (ch) =>
        ch === "1" || ch === "P"
          ? p.fg
          : ch === "W" || ch === "M"
            ? p.boardBg
            : null,
      SLOTH_SCALE
    );

    this.drawWave(ctx, cell, cssW, cssH, worldOff, animate);
    this.drawBurst(ctx, cell, animate);
  }

  // ---------- test access ----------

  /** Deep-copied state for tests/debug. */
  inspect() {
    return {
      rows: this.rows.map((row) => [...row]),
      col: this.col,
      altitude: this.altitude,
      score: this.score,
      coffees: this.coffees,
      phase: this.phase,
      cause: this.cause,
      waveRow: this.waveRow,
      waveMs: this.waveMs(),
      rushMsLeft: this.rushMsLeft,
      shotMsLeft: this.shotMsLeft,
    };
  }

  /** Test seam: overwrite one visible row (e.g. plant a cactus on a hop target). */
  debugSetRow(r: number, row: CellKind[]) {
    this.rows[r] = [...row];
  }

  /** Test seam: pin the wave's top edge to a screen row. */
  debugSetWaveRow(row: number) {
    this.waveRow = row;
  }
}
