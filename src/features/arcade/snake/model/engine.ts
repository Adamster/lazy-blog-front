import type { Cell, Speed } from "./types";

/**
 * RENDER MODE switch: `"glyph"` (default, the snake is a square stream — see
 * {@link drawSnakeGlyphs}) | `"sprite"` (the original grey-sentinel bitmaps). Only
 * the SNAKE body changes; the rabbits are ALWAYS bunny sprites (owner preference).
 * HMR won't re-instantiate the engine — a flag flip needs a HARD REFRESH.
 */
const SNAKE_RENDER: "glyph" | "sprite" = "glyph";

/** Play-field grid (cells). Cells stay SQUARE because the board's aspect is pinned
 *  to `GRID_W / GRID_H`, so `cssW / GRID_W === cssH / GRID_H`. */
export const GRID_W = 30;
export const GRID_H = 18;

/** Per-preset step interval (ms). */
export const SPEED_MS: Record<Speed, number> = {
  chill: 165,
  classic: 125,
  fast: 90,
};
const STEP_ACCEL = 1.5;
const STEP_FLOOR = 60;

const POSITIVE_VALUE = 10;

/** Negative penalty magnitudes; index = a negative's RANK (0..2) = its RED ear-stripe
 *  COUNT (`rank + 1` → 1/2/3 stripes). */
const RABBIT_VALUES = [10, 20, 30] as const;

/** Weighted rank roll, index-aligned with {@link RABBIT_VALUES}: bigger penalty = rarer
 *  (~60/30/10%). The two negative slots each draw INDEPENDENTLY (may coincide). */
const RABBIT_VALUE_WEIGHTS = [60, 30, 10] as const;

const POSITIVE_COUNT = 1;
const NEGATIVE_COUNT = 2;

/** Score can't go below 0 — a negative score breaks the leaderboard/sparkline (both
 *  assume non-negative). */
const SCORE_FLOOR = 0;

/** Cumulative-weight roll for a negative's rank; each negative draws independently (may coincide). */
function pickRank(): number {
  const total = RABBIT_VALUE_WEIGHTS.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < RABBIT_VALUE_WEIGHTS.length; i++) {
    r -= RABBIT_VALUE_WEIGHTS[i];
    if (r < 0) return i;
  }
  return RABBIT_VALUE_WEIGHTS.length - 1;
}

/** Cells an "avoid" rabbit (a negative or the killer) may never spawn into:
 *  `HEAD_AHEAD` blocks the reaction-zero path straight ahead, `HEAD_RADIUS` a ring
 *  around the head — so a penalty/death is always avoidable. The +10 skips this. */
const HEAD_AHEAD = 3;
const HEAD_RADIUS = 2;

/** Positive-rabbit twitch — the nav-bar `@keyframes mono-jiggle` (phase → degrees)
 *  reproduced verbatim for the canvas; {@link sampleTwitch} eases between the stops. */
const NAVBAR_TWITCH_KEYS: { t: number; deg: number }[] = [
  { t: 0, deg: 0 },
  { t: 0.2, deg: -7 },
  { t: 0.4, deg: 6 },
  { t: 0.6, deg: -4 },
  { t: 0.8, deg: 3 },
  { t: 1, deg: 0 },
];
const TWITCH_DUR_FRAMES = 24; // the 0.4s mono-jiggle loop at ~60fps
const TWITCH_PERIOD_FRAMES = 78; // wobble (24) + ~0.9s still beat between jerks

/** Negative-rabbit motion: a continuous vertical bob + an intermittent horizontal
 *  "ha-ha" laugh-shake (bursts via {@link burstWave}). */
const NEG_BOB_AMP = 0.1;
const NEG_BOB_FREQ = 0.18;
const LAUGH_SHAKE_AMP = 0.06;
const LAUGH_SHAKE_FREQ = 0.9;
/** Laugh-burst envelope: animate the first BURST frames of each CYCLE, hold still the rest. */
const SPECIAL_ANIM_CYCLE = 100;
const SPECIAL_ANIM_BURST = 35;

/** Killer "menace" pulse — a slow size throb (not the negatives' jittery bob). */
const KILLER_PULSE_AMP = 0.1;
const KILLER_PULSE_FREQ = 0.12;

/** Cubic smoothstep ≈ CSS `ease-in-out` between twitch stops. */
function easeInOut(t: number): number {
  return t * t * (3 - 2 * t);
}

function sampleTwitch(p: number): number {
  for (let i = 1; i < NAVBAR_TWITCH_KEYS.length; i++) {
    const a = NAVBAR_TWITCH_KEYS[i - 1];
    const b = NAVBAR_TWITCH_KEYS[i];
    if (p <= b.t) {
      const local = (p - a.t) / (b.t - a.t);
      return a.deg + (b.deg - a.deg) * easeInOut(local);
    }
  }
  return 0;
}

// Canvas palette — literal hex (the 2D context can't resolve CSS vars).

/** Board field gray. (A transparent / theme-following canvas was tried and reverted —
 *  the game palette is dark-tuned, so the board just stays this gray everywhere.) */
const BOARD_BG = "#141414";
/** = `--m-accent` (dark). */
const ACCENT = "#cdff48";
/** Dimmer accent for the tail tint. */
const ACCENT_DIM = "#5f7a23";
/** Sentinel grey (light head → dim tail) — deliberately not lime, kept distinctly
 *  greyer than the white rabbit so the two never blur. */
const SENTINEL = "#a8acb2";
const SENTINEL_DIM = "#565a60";
/** White rabbit (food) = `--m-fg` (dark). Exported so {@link RabbitMark} uses the exact game colour. */
export const RABBIT_WHITE = "#e6e6e6";
/** Red/danger = `--m-error` (dark): the negatives' ear stripes, the solid killer body, the red chips. */
const RABBIT_RED = "#ff6b6b";
/** Faint cell grid — a semi-transparent white so it adapts to any theme bg showing
 *  through the canvas (a fixed `#333` only suited one field). */
const GRID_LINE = "rgba(255,255,255,0.01)";
/** Board-edge frame — stronger than the inner grid so the rim always reads. */
const FRAME_LINE = "rgba(255,255,255,0.22)";

/** Square-stream snake colours (lime `--m-accent` family). HEAD bright → tail dims +
 *  fades. (For a grey stream, swap to {@link SENTINEL}/{@link SENTINEL_DIM}.) */
const GLYPH_BODY = ACCENT;
const GLYPH_TAIL = ACCENT_DIM;
/** Opacity floor at the tail end (head = 1). */
const GLYPH_TAIL_ALPHA = 0.3;
/** Per-side inset of each body SQUARE so segments read as distinct blocks, not one
 *  solid worm; snapped to the device-pixel grid. */
const GLYPH_BG_INSET = 0.18;

// Red-spark burst on every NEGATIVE grab + the KILLER death (nothing else explodes).
// Chips are ALWAYS pure red (owner rule); the magnitude maps ONLY to the chip COUNT,
// never the colour. Never seeded under reduced motion (the hook passes animate=false).

const EXPLOSION_COUNT_MAX = 26;
/** Spark-intensity reference (count = `magnitude / PENALTY_REF`). 50 is ABOVE the worst
 *  −30 on purpose, so the killer is the strictly biggest burst, not tied with −30. */
const PENALTY_REF = 50;
const KILLER_SPARK_MAGNITUDE = PENALTY_REF;
/** Floor so even −10 reads as a real little burst, not one or two stray chips. */
const EXPLOSION_COUNT_MIN = 6;
const EXPLOSION_MS = 700;
/** Bigger blasts throw chips a touch wider/larger (colour stays red). */
const SPARK_SPEED_BOOST = 0.6;

/** Normalised penalty intensity [0,1]; drives the size/spread scale, NOT colour. */
function penaltyIntensity(magnitude: number): number {
  const lo = RABBIT_VALUES[0];
  return Math.min(1, Math.max(0, (magnitude - lo) / (PENALTY_REF - lo)));
}

/** Magnitude → red-chip COUNT, scaled off PENALTY_REF and floored. Only negatives +
 *  the killer call this; every chip is red, only the count grows. */
function explosionCountFor(magnitude: number): number {
  const scaled = Math.round((EXPLOSION_COUNT_MAX * magnitude) / PENALTY_REF);
  return Math.max(EXPLOSION_COUNT_MIN, Math.min(EXPLOSION_COUNT_MAX, scaled));
}

/** One explosion chip. Position/velocity are in CELL units, resolved to CSS px at
 *  draw time against the live cell size — so the burst stays correct across a resize. */
interface Chip {
  ox: number;
  oy: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
}

const SPRITE_FILL = 0.85;
/** Body + tail render at ~0.9 cell fill (owner request); the HEAD stays at 0.85. */
const BODY_TAIL_SCALE = 0.9 / SPRITE_FILL;
/** All four rabbits share this fill — a hair larger so the thin EAR STRIPES stay
 *  legible; size is IDENTICAL (the killer stands out by colour, never size). */
const RABBIT_BODY_SCALE = 0.96 / SPRITE_FILL;

/**
 * In-game rabbit bitmap — all four rabbits share ONE white-bunny silhouette; only the
 * colouring differs. `1` = white body, `C` = a RED stripe pixel (supplied at draw time
 * by {@link stripeColor}), `.` = transparent. Stripes live IN the bitmap, so the
 * sprite transforms carry them — no separate overlay to keep in sync.
 */
const RABBIT_EAR_WHITE = ".11.11.";
const RABBIT_EAR_STRIPE = ".CC.CC.";
/** Stripe SLOT rows (bottom → top, three slots); a rank lights the first `rank + 1`,
 *  the alternating gap rows keep the bands countable at cell size. */
const RABBIT_STRIPE_SLOTS = [6, 4, 2] as const;
const RABBIT_EAR_ROWS = 7;
/** White face; eyes are the transparent `0` sockets. Used by {@link RABBIT_PLAIN}. */
const RABBIT_FACE = [
  "1111111",
  "1011101",
  "1110111",
  "1111111",
  "0111110",
  "0100010",
] as const;

/** Face with `EE` eye cells (2px, cols 1–2/4–5) under the ear stripes — red on the
 *  negatives, black on the killer. */
const RABBIT_FACE_EYES = [
  "1111111",
  "1EE1EE1",
  "1110111",
  "1111111",
  "0111110",
  "0100010",
] as const;

/** Build the striped (NEGATIVE) bitmap for `rank` (0..2): `rank + 1` red bands across
 *  both ears (bottom-anchored), then the red-eyed face. */
function stripedRabbit(rank: number): string[] {
  const lit = new Set<number>(RABBIT_STRIPE_SLOTS.slice(0, rank + 1));
  const rows: string[] = [];
  for (let r = 0; r < RABBIT_EAR_ROWS; r++) {
    rows.push(lit.has(r) ? RABBIT_EAR_STRIPE : RABBIT_EAR_WHITE);
  }
  for (const f of RABBIT_FACE_EYES) rows.push(f);
  return rows;
}

/** The POSITIVE (+10) silhouette — same geometry as the others, no stripes. Exported
 *  so {@link RabbitMark} renders the EXACT in-game bunny (`1` = body pixel, `0`/`.` = transparent). */
export const RABBIT_PLAIN: readonly string[] = [
  ...Array.from({ length: RABBIT_EAR_ROWS }, () => RABBIT_EAR_WHITE),
  ...RABBIT_FACE,
];

function stripeColor(stripe: string): (ch: string) => string | null {
  return (ch) =>
    ch === "1"
      ? RABBIT_WHITE
      : ch === "C"
        ? stripe
        : ch === "E"
          ? RABBIT_RED
          : null;
}

function solidColor(fill: string): (ch: string) => string | null {
  return (ch) => (ch === "1" ? fill : null);
}

/** Killer eye black — a red eye would vanish on the solid-red body. */
const KILLER_EYE = "#000000";

/** Killer bitmap — same geometry as {@link RABBIT_PLAIN} + the eye face; the body
 *  fills solid red and the eyes black ({@link killerColor}). */
const RABBIT_KILLER: readonly string[] = [
  ...Array.from({ length: RABBIT_EAR_ROWS }, () => RABBIT_EAR_WHITE),
  ...RABBIT_FACE_EYES,
];

function killerColor(ch: string): string | null {
  return ch === "1" ? RABBIT_RED : ch === "E" ? KILLER_EYE : null;
}

/**
 * Sentinel HEAD bitmap (7×8), AUTHORED FACING UP (the spiky `.M.M.M.` antennae row =
 * the front). `M` = body pixel (lime, deliberately NOT black so the sentinel reads on
 * the dark `#141414`), `R` = a red eye, `.` = transparent. Pre-rotated at draw time to
 * face {@link dir} (see {@link rotateSprite} / {@link headQuarters}).
 */
const HEAD_SPRITE = [
  ".M.M.M.",
  "MMMMMMM",
  "MMMRMMM",
  "MRMMMRM",
  "MMMRMMM",
  "MMMMMMM",
  ".MMMMM.",
  "..MMM..",
] as const;
const HEAD_COLORS: Record<string, string | null> = {
  M: SENTINEL,
  R: RABBIT_RED,
  ".": null,
};

/** Shared reference dim for ALL snake parts (head/body/tail, each 7×8) so every snake
 *  pixel is the SAME device-pixel block size — a per-part fit would desync the block
 *  size between segments. Rabbits pass nothing (fit their own box). */
const SNAKE_REF_DIM = 8;

/**
 * Sentinel BODY bitmap (7×8) — a 5-wide tube with a red seam, authored running DOWN
 * (`+y`). Rotated at draw time to align with travel (see {@link bodyQuarters}) and
 * drawn in `fillToCell` so consecutive segments butt end-to-end into one tube (on a
 * turn the perpendicular tubes overlap at the corner). `M` = body, `R` = seam, `.` = transparent.
 */
const BODY_SPRITE = [
  ".......",
  ".MMMMM.",
  ".MMMMM.",
  ".MMRMM.",
  ".MMRMM.",
  ".MMRMM.",
  ".MMMMM.",
  ".M...M.",
] as const;
/** CW 90° turns to align the DOWN-authored {@link BODY_SPRITE} with flow `dir` (`+y` = 0). */
function bodyQuarters(dir: Cell): number {
  if (dir.x === 1) return 3;
  if (dir.x === -1) return 1;
  if (dir.y === -1) return 2;
  return 0;
}

/**
 * Sentinel TAIL bitmap (7×8) — a wide cap (matching the body tube) splaying into
 * dangling tentacles, AUTHORED TIP-DOWN. Drawn in `fillToCell` so the wide cap
 * connects to the preceding body segment; rotated at draw time (see {@link
 * rotateSprite}) so the tentacles trail AWAY from the body. `M` = pixel, `.` = transparent.
 */
const TAIL_SPRITE = [
  ".MMMMM.",
  "MMMMMMM",
  "M.M.M.M",
  "M.M.M.M",
  "M.M.M.M",
  ".......",
  ".......",
  ".......",
] as const;
/** Bodyward tail nudge — 0 (the tail now fills the cell pitch itself; kept as a knob
 *  in case the taper authoring changes). */
const TAIL_CONNECT_SHIFT = 0;

/** Body char → fill, given the per-segment gradient `g`: `M` = grey body, `R` = the
 *  red seam (a fixed hazard red, NOT lerped, so it stays vivid on every segment), `.` = transparent. */
function bodyColors(g: string): (ch: string) => string | null {
  return (ch) => (ch === "M" ? g : ch === "R" ? RABBIT_RED : null);
}

function tailColors(g: string): (ch: string) => string | null {
  return (ch) => (ch === "M" ? g : null);
}

/** CW 90° turns to aim the TIP-DOWN tail along its trailing `dir`. (Head is authored
 *  UP, tail DOWN — opposite ends — so this mapping differs from {@link headQuarters}.) */
function tailQuarters(dir: Cell): number {
  if (dir.x === 1) return 3;
  if (dir.x === -1) return 1;
  if (dir.y === -1) return 2;
  return 0;
}

/**
 * Rotate a bitmap by `quarters` × 90° clockwise. Rotating the MATRIX (not the canvas)
 * keeps every bit on an integer device-pixel block — a canvas `rotate()` would resample
 * and smear. 7×8 → 8×7 on a 90/270 turn.
 */
function rotateSprite(
  sprite: readonly string[],
  quarters: number
): readonly string[] {
  const q = ((quarters % 4) + 4) % 4;
  let rows: string[] = sprite.map((r) => r);
  for (let n = 0; n < q; n++) {
    const h = rows.length;
    const w = rows[0].length;
    // 90° clockwise: new[c][h-1-r] = old[r][c] → column-major read, bottom-up.
    const next: string[] = [];
    for (let c = 0; c < w; c++) {
      let line = "";
      for (let r = h - 1; r >= 0; r--) line += rows[r][c];
      next.push(line);
    }
    rows = next;
  }
  return rows;
}

/** CW 90° turns mapping the UP-authored head onto a heading (up = 0). */
function headQuarters(dir: Cell): number {
  if (dir.x === 1) return 1;
  if (dir.x === -1) return 3;
  if (dir.y === 1) return 2;
  return 0;
}

/**
 * Unit step `a`→`b`, wrap-corrected: across a wrap seam two visually-adjacent
 * segments sit on OPPOSITE edges, so the raw delta is a huge wrong vector. If
 * `|delta|` > half the grid the move went the SHORT way, so the sign is flipped.
 */
function wrapStep(a: Cell, b: Cell): Cell {
  const step = (d: number, span: number) => {
    if (d > span / 2) return d - span;
    if (d < -span / 2) return d + span;
    return d;
  };
  const dx = step(b.x - a.x, GRID_W);
  const dy = step(b.y - a.y, GRID_H);
  return { x: Math.sign(dx), y: Math.sign(dy) };
}

export interface StepResult {
  dead: boolean;
  ate: boolean;
  score: number;
  length: number;
}

type RabbitKind = "positive" | "negative" | "killer";

/** One live rabbit. `value` = the SIGNED score delta (`+10` / `−10/−20/−30`; 0 &
 *  unused for the killer). `rank` (0..2) drives a negative's stripe count. */
interface Rabbit {
  cell: Cell;
  kind: RabbitKind;
  value: number;
  rank: number;
}

/** Parse `#rrggbb` OR `rgb(...)` (the form {@link lerpHex} itself emits) → `[r,g,b]`,
 *  so a lerp result can be fed back into another lerp. */
function parseColor(c: string): [number, number, number] {
  if (c[0] === "#") {
    const i = parseInt(c.slice(1), 16);
    return [(i >> 16) & 255, (i >> 8) & 255, i & 255];
  }
  const m = c.match(/-?\d+/g);
  return m ? [Number(m[0]), Number(m[1]), Number(m[2])] : [0, 0, 0];
}

function lerpHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = parseColor(a);
  const [br, bg, bb] = parseColor(b);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r},${g},${bl})`;
}

/**
 * Headless Snake engine — all mutable game state + the step + the canvas draw, with
 * NO React. `useSnakeGame` owns one instance. Kept out of React to avoid per-frame
 * re-renders (the canvas is imperative; React state changes only on discrete events:
 * eat / die / pause).
 */
export class SnakeEngine {
  private snake: Cell[] = [];

  private dir: Cell = { x: 1, y: 0 };
  /** Buffered direction changes (FIFO). step() consumes one per tick, so two
   *  quick turns within a single tick (e.g. up→left around a corner) BOTH
   *  register instead of the second being dropped or mis-rejected as a reverse. */
  private dirQueue: Cell[] = [];
  /** Max buffered turns; extra inputs within one tick are ignored. */
  private readonly dirQueueMax = 2;
  /**
   * The FOUR live rabbits — always exactly one POSITIVE, two NEGATIVE, and one
   * KILLER (see {@link Rabbit}). The whole array is replaced on EVERY eat by
   * {@link spawnField} (every rabbit, the killer included, relocates).
   */
  private rabbits: Rabbit[] = [];

  private stepMs = SPEED_MS.classic;
  private frame = 0;

  private score = 0;

  /** Live red-spark chips. Empty unless a NEGATIVE grab or the KILLER death just
   *  fired the burst; they animate out + down and fade, then clear. The positive
   *  never seeds chips. */
  private chips: Chip[] = [];
  /** Grid cell the explosion is centred on (chip offsets are relative to it). */
  private explosionCell: Cell | null = null;
  /** `performance.now()` the explosion started; 0 = no active explosion. */
  private explosionStart = 0;

  constructor(
    private speed: Speed = "classic",
    // Wrap-walls is the ACTIVE behavior: edges are pass-through (exit one edge,
    // re-enter the opposite). With wrapping the run ends from a self-hit OR eating
    // the lethal KILLER rabbit — never from a wall. The outer frame stays as the
    // visual board edge.
    private wrapWalls = true
  ) {}

  get stepInterval(): number {
    return this.stepMs;
  }

  setSpeed(speed: Speed) {
    this.speed = speed;
  }
  setWrap(wrap: boolean) {
    this.wrapWalls = wrap;
  }

  /** Reset to a fresh run (centre snake + a fresh trio of rabbits). */
  reset() {
    const cx = Math.floor(GRID_W / 2);
    const cy = Math.floor(GRID_H / 2);
    this.snake = [
      { x: cx, y: cy },
      { x: cx - 1, y: cy },
      { x: cx - 2, y: cy },
    ];
    this.dir = { x: 1, y: 0 };
    this.dirQueue = [];
    this.stepMs = SPEED_MS[this.speed];
    this.score = 0;
    this.chips = [];
    this.explosionCell = null;
    this.explosionStart = 0;
    // The board ALWAYS opens with the full field — 1 positive + 2 negative + the
    // always-present killer, the +10 fixed + the two negatives' ranks freshly rolled.
    this.spawnField();
  }

  /**
   * RE-GENERATE the whole rabbit field: place a brand-new FOUR — ONE positive (fixed
   * +10) + TWO negative (freshly-rolled ranks) + the always-present KILLER — on fresh
   * free cells. Called on {@link reset} and on EVERY eat (the owner's "any eaten rabbit
   * regenerates everything", killer included — it relocates on every bite).
   *
   * The single POSITIVE is placed FIRST with no head-path exclusion (a free target on
   * your path is fair) and is a FIXED {@link POSITIVE_VALUE} (no roll). The three AVOID
   * rabbits — both NEGATIVES (INDEPENDENT weighted ranks; they may land the SAME rank,
   * no de-dup) and the KILLER — are then placed avoiding the snake, the already-placed
   * rabbits, AND the {@link headExclusion}, so neither a −score grab nor an instant
   * DEATH can land on the head's unavoidable next cells. Each placement re-reads the
   * live {@link rabbitCells} so the four never overlap (nor sit on the snake); the
   * head-path block is computed ONCE (the head is fixed during a respawn).
   */
  private spawnField() {
    this.rabbits = [];
    const headBlock = this.headExclusion();
    for (let i = 0; i < POSITIVE_COUNT; i++) {
      const cell = this.freeCell(this.rabbitCells());
      this.rabbits.push({
        cell,
        kind: "positive",
        value: POSITIVE_VALUE,
        rank: 0, // unused — the +10 has no stripes
      });
    }
    for (let i = 0; i < NEGATIVE_COUNT; i++) {
      // Each negative rolls its rank INDEPENDENTLY (the two may coincide — no de-dup).
      const rank = pickRank();
      const cell = this.freeCell(this.rabbitCells(), headBlock);
      this.rabbits.push({
        cell,
        kind: "negative",
        value: -RABBIT_VALUES[rank],
        rank,
      });
    }
    // The KILLER — the always-present 4th slot. An "avoid" rabbit, so it honours the
    // same head-path exclusion (an instant death must never be unavoidable) and the
    // no-overlap placement; it relocates here on every eat like the rest.
    this.rabbits.push({
      cell: this.freeCell(this.rabbitCells(), headBlock),
      kind: "killer",
      value: 0,
      rank: 0,
    });
  }

  /** Queue a direction change. Validates against the LAST queued turn (or the
   *  live direction when the queue is empty), so a 180° reverse is rejected and
   *  an identical repeat is a no-op; buffers up to {@link dirQueueMax} turns so
   *  fast successive presses aren't lost. */
  steer(x: number, y: number) {
    const ref = this.dirQueue.length
      ? this.dirQueue[this.dirQueue.length - 1]
      : this.dir;
    if (x === ref.x && y === ref.y) return;
    if (x === -ref.x && y === -ref.y) return;
    if (this.dirQueue.length >= this.dirQueueMax) return;
    this.dirQueue.push({ x, y });
  }

  /**
   * Pick a random free cell, avoiding the snake, any `extra` cells (the other
   * rabbit), and any `blocked` keys (e.g. the head-path exclusion). Owner-
   * emphasized: rabbits never land on the snake or on each other. Guards the
   * retry loop so a near-full board can't spin forever — on exhaustion it falls
   * back to the last sampled cell (acceptable: the board is huge vs the snake).
   */
  private freeCell(extra: (Cell | null)[] = [], blocked?: Set<string>): Cell {
    const occupied = new Set(this.snake.map((s) => `${s.x},${s.y}`));
    for (const c of extra) if (c) occupied.add(`${c.x},${c.y}`);
    let x = 0;
    let y = 0;
    let guard = 0;
    do {
      x = (Math.random() * GRID_W) | 0;
      y = (Math.random() * GRID_H) | 0;
      guard++;
    } while (
      (occupied.has(`${x},${y}`) || blocked?.has(`${x},${y}`)) &&
      guard < 400
    );
    return { x, y };
  }

  /** All currently-occupied rabbit cells — passed as `extra` exclusions so no two
   *  of the four rabbits ever overlap. */
  private rabbitCells(): Cell[] {
    return this.rabbits.map((r) => r.cell);
  }

  /**
   * The set of cells an "AVOID" rabbit (a negative OR the lethal killer) is forbidden
   * to spawn into, keyed `"x,y"`: the next {@link HEAD_AHEAD} cells straight ahead of
   * the head on its current heading (the unavoidable path) PLUS a {@link HEAD_RADIUS}
   * Chebyshev ring around the head. Both are wrap-corrected (cells that fall off an
   * edge re-enter the opposite side) because walls are pass-through, so the "path
   * ahead" genuinely continues across the seam. This is what guarantees no unavoidable
   * −score grab — and, crucially, no unavoidable instant DEATH on the killer.
   */
  private headExclusion(): Set<string> {
    const head = this.snake[0];
    const blocked = new Set<string>();
    const add = (x: number, y: number) => {
      const wx = ((x % GRID_W) + GRID_W) % GRID_W;
      const wy = ((y % GRID_H) + GRID_H) % GRID_H;
      blocked.add(`${wx},${wy}`);
    };
    // Small radius around the head (includes the head itself).
    for (let dy = -HEAD_RADIUS; dy <= HEAD_RADIUS; dy++) {
      for (let dx = -HEAD_RADIUS; dx <= HEAD_RADIUS; dx++) {
        add(head.x + dx, head.y + dy);
      }
    }
    // The reaction-zero path directly ahead on the current heading.
    for (let i = 1; i <= HEAD_AHEAD; i++) {
      add(head.x + this.dir.x * i, head.y + this.dir.y * i);
    }
    return blocked;
  }

  /**
   * Advance one tick. Returns the outcome for the hook to project to state.
   * `animate` (default true) gates EVERY red-spark burst — the survivable NEGATIVE
   * grab "ouch" AND the KILLER death-burst — so under reduced motion the hook passes
   * `false` and both are silent (the static overlay carries it), matching the
   * project's reduced-motion contract. Death from a WALL (not wrapping) or a SELF hit
   * is always silent; the KILLER rabbit is the one lethal-on-eat hazard.
   */
  step(animate = true): StepResult {
    if (this.dirQueue.length) this.dir = this.dirQueue.shift()!;
    const head = this.snake[0];
    let nx = head.x + this.dir.x;
    let ny = head.y + this.dir.y;

    const out = nx < 0 || ny < 0 || nx >= GRID_W || ny >= GRID_H;
    if (out) {
      if (this.wrapWalls) {
        nx = (nx + GRID_W) % GRID_W;
        ny = (ny + GRID_H) % GRID_H;
      } else {
        return this.dead();
      }
    }

    // Which rabbit (if any) is on the cell the head is stepping into? At most one
    // rabbit per cell (spawn exclusions guarantee no overlap), so this resolves to
    // a single rabbit. `-1` = an empty cell (a plain move).
    let eatenIndex = -1;
    for (let i = 0; i < this.rabbits.length; i++) {
      const c = this.rabbits[i].cell;
      if (c.x === nx && c.y === ny) {
        eatenIndex = i;
        break;
      }
    }
    const ate = eatenIndex >= 0;

    // Self-collision. The new head must miss the body that will REMAIN this step.
    // The tail FREES UP only when the snake does NOT grow: on an eat the snake
    // grows +1 (the tail stays put — its last cell is still occupied and IS a
    // collision); on a normal move the tail pops one cell — that freed cell is a
    // legal landing. So we exclude the trailing cell from the check on a plain move,
    // and check the whole body on an eat.
    const bodyToCheck = ate
      ? this.snake
      : this.snake.slice(0, this.snake.length - 1);
    if (bodyToCheck.some((s) => s.x === nx && s.y === ny)) {
      return this.dead();
    }

    this.snake.unshift({ x: nx, y: ny });

    if (ate) {
      const r = this.rabbits[eatenIndex];

      // KILLER — eating the lethal red bunny is INSTANT game over, exactly like a
      // wall/self hit. Resolved HERE, BEFORE any scoring/growth/respawn (its `value`
      // is moot — the run ends). Fire the BIG red death-burst at the head cell (the
      // maximal spray, gated by `animate` like every burst → reduced motion = silent,
      // the static game-over overlay carries it) and return dead. The head was just
      // unshifted onto the killer cell, so the burst centres there. The hook flips to
      // "over" and fires `onGameOver` once with the final score (leaderboard intact).
      if (r.kind === "killer") {
        if (animate) this.explodeAt({ x: nx, y: ny }, KILLER_SPARK_MAGNITUDE);
        return this.dead();
      }

      // Apply the signed payload, clamped ≥0 (a penalty never underflows the floor).
      this.score = Math.max(SCORE_FLOOR, this.score + r.value);
      if (r.value > 0) {
        // The POSITIVE is the reward → it ramps the step timer (the classic
        // per-pellet accel). Negatives give no speed reward (eating one is a mistake).
        this.stepMs = Math.max(STEP_FLOOR, this.stepMs - STEP_ACCEL);
      } else if (animate) {
        // A NEGATIVE grab sparks a pure-red "ouch" whose chip COUNT scales with the
        // magnitude (the lone non-lethal thing that explodes).
        this.explodeAt({ x: nx, y: ny }, -r.value);
      }
      // ANY non-lethal eat RE-GENERATES the whole field — fresh cells for all four
      // (the killer relocates too) + fresh weighted ranks (the owner's "any eaten
      // rabbit regenerates everything"). Runs AFTER the head advanced, so the avoid
      // rabbits' head-path exclusion reads the new head.
      this.spawnField();
    } else {
      // Plain move: pop the tail (length holds). Every non-lethal EAT keeps the tail
      // (+1 growth) — positive AND negative; nothing ever shrinks the snake.
      this.snake.pop();
    }

    return {
      dead: false,
      ate,
      score: this.score,
      length: this.snake.length,
    };
  }

  /**
   * Seed a RED-SPARK burst centred on `cell` for a NEGATIVE grab (or the KILLER
   * death) of magnitude `magnitude`. Every chip is pure {@link RABBIT_RED} — the
   * magnitude maps ONLY to the chip COUNT ({@link explosionCountFor}): bigger →
   * more red sparks (the killer passes {@link KILLER_SPARK_MAGNITUDE} for the
   * maximal blast). A light size/spread scale ({@link SPARK_SPEED_BOOST}) lets a
   * bigger hit read bigger, but the colour is 100% red at every magnitude. The draw
   * loop animates + clears it; under reduced motion it never seeds (caller gates).
   */
  private explodeAt(cell: Cell, magnitude: number) {
    const count = explosionCountFor(magnitude);
    const intensity = penaltyIntensity(magnitude);
    const speedScale = 1 + SPARK_SPEED_BOOST * intensity;
    this.explosionCell = cell;
    this.explosionStart = 0; // stamped on the first draw frame
    this.chips = Array.from({ length: count }, () => {
      const ang = Math.random() * Math.PI * 2;
      const spd = (0.04 + Math.random() * 0.1) * speedScale; // cell-units / frame
      return {
        ox: 0,
        oy: 0,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 0.05, // a touch of initial lift
        // Bigger blasts throw slightly bigger chips too (colour stays red).
        size: (0.12 + Math.random() * 0.16) * (0.9 + 0.3 * intensity),
        color: RABBIT_RED, // ALWAYS red — no accent/white mix (owner rule)
      };
    });
  }

  private dead(): StepResult {
    return {
      dead: true,
      ate: false,
      score: this.score,
      length: this.snake.length,
    };
  }

  // ---------- canvas draw ----------

  /** Faint muted cell grid so the player can gauge distance / line up moves.
   *  Internal lines only (no outer frame — the board stays borderless). */
  private drawGrid(ctx: CanvasRenderingContext2D, cssW: number, cssH: number) {
    const cell = cssW / GRID_W; // === cssH / GRID_H (square cells, pinned aspect)
    ctx.strokeStyle = GRID_LINE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < GRID_W; i++) {
      const p = Math.round(i * cell) + 0.5; // +0.5 → crisp 1px line
      ctx.moveTo(p, 0);
      ctx.lineTo(p, cssH);
    }
    for (let i = 1; i < GRID_H; i++) {
      const p = Math.round(i * cell) + 0.5;
      ctx.moveTo(0, p);
      ctx.lineTo(cssW, p);
    }
    ctx.stroke();
    // Outer frame — the board edges (the lines above are internal only, so the
    // canvas rim would otherwise be unbordered). A stronger line than the inner
    // grid so the field boundary always reads, on any theme bg.
    ctx.strokeStyle = FRAME_LINE;
    ctx.strokeRect(0.5, 0.5, cssW - 1, cssH - 1);
  }

  /**
   * Generic pixel-art sprite rasteriser — centers any bitmap in `at`'s cell and
   * paints it crisp at any cell size. `sprite` is rows of equal-length strings;
   * `resolve(ch)` maps each character to a fill color (or `null` = transparent,
   * board shows through). Serves the rabbits (single-fill) AND the multi-color
   * snake head; `scale` (default 1) lets the killer pulse + sizes the rabbits.
   *
   * `yOffsetCells` (default 0) shifts the WHOLE figure vertically by a fraction
   * of a cell — used by the negatives' laughing BOB, so the other sprites (head /
   * body / tail) stay dead-centred. The offset is converted to device px and snapped
   * to the device-pixel grid (alongside the centring round) so the sprite stays crisp
   * even mid-bob.
   *
   * `refDim` (default 0 = "fit this sprite's own larger dim") overrides the
   * dimension the per-bit block is sized against. The SNAKE parts pass
   * {@link SNAKE_REF_DIM} (= 8) so head/body/tail share ONE block size and keep
   * their authored relative proportions (wide head, narrow body, short tail) —
   * see {@link SNAKE_REF_DIM}. The rabbits pass nothing, so each still fits its
   * own bounding box into the cell.
   *
   * The sprite is rasterised on the **device-pixel** grid: one sprite bit = an
   * INTEGER block of `dpr`-scaled pixels (floored, but never below 1), and the
   * whole figure is snapped to a device-pixel origin. This is the crux of the
   * "no sprite" trap — sizing each bit as a fractional CSS value
   * (`cell·0.82/SPRITE_W`) at small cells falls below one device pixel, so
   * `Math.round` collapses most rects to zero width/height and the figure
   * fragments into nothing. Forcing an integer ≥1 device-pixel block guarantees
   * every "on" bit paints a crisp, smoothing-free square at any cell size — hard
   * 8-bit pixels, never a smooth blob. The ctx carries a `dpr` transform, so we
   * convert device units back to CSS units (÷`dpr`) before filling. The fill
   * loop groups by color and re-fits the box to the (possibly rotated) bitmap's
   * own dimensions, so a 90°-rotated head (8×7) still centers correctly.
   */
  private drawSprite(
    ctx: CanvasRenderingContext2D,
    cell: number,
    dpr: number,
    at: Cell,
    sprite: readonly string[],
    resolve: (ch: string) => string | null,
    scale = 1,
    yOffsetCells = 0,
    refDim = 0,
    // BODY/TAIL connection mode: size the per-bit block via ceil-to-cell so the
    // figure span always covers the cell pitch and segments butt up with no gap
    // (see the block calc below). Used by the body + tail; head/rabbits keep the
    // ~0.85 floor-fit so the head stays the proud leading wedge.
    fillToCell = false,
    // Horizontal companion to `yOffsetCells` (fraction of a cell). Used by the
    // TAIL to nudge its WIDE end flush against the body cell border (so the body
    // overflow overlaps it and the tube connects); 0 for everything else.
    xOffsetCells = 0,
    // AXIS-TWITCH: a small rotation (degrees) about the sprite's own centre — the
    // nav-bar `mono-jiggle` feel on the canvas, used ONLY by the POSITIVE rabbit (its
    // "chase me" twitch). Rotating the canvas resamples slightly, but
    // `imageSmoothingEnabled=false` keeps the pixel edges hard, and the wobble is
    // small + intermittent, so it reads as a crisp twitching bunny, not a blur.
    // 0 = no rotation (every other sprite stays axis-aligned + pixel-exact).
    rotateDeg = 0
  ) {
    const sw = sprite[0].length;
    const sh = sprite.length;
    // Target figure box (square) in DEVICE pixels, then quantise to an integer
    // block per sprite bit (≥1) so the sprite is always crisp and never empty.
    const boxDev = cell * SPRITE_FILL * scale * dpr;
    // The block is sized against `refDim` when given (the snake parts share one
    // reference so every snake pixel is the same size and the authored
    // proportions hold), else against this sprite's OWN larger dim (rabbits fit
    // their own box into the cell). `refDim` is taken AFTER rotation-invariant
    // max(sw,sh) so a rotated 8×N snake part still keys off 8.
    const fitDim = refDim > 0 ? refDim : Math.max(sw, sh);
    // BODY: ceil(cell·dpr / refDim) so the span (block·refDim) is ALWAYS ≥ the
    // cell pitch — each segment slightly overflows its cell and connects to its
    // neighbours on every side (no staircase gap). Floor-fitting (the default)
    // would leave a sub-block gap. The overlap is invisible: adjacent body
    // segments share the lime fill.
    const block = fillToCell
      ? Math.max(1, Math.ceil((cell * dpr) / fitDim))
      : Math.max(1, Math.floor(boxDev / fitDim));
    const spriteWdev = block * sw;
    const spriteHdev = block * sh;
    // Center within the cell (in device px), snapped to a device-pixel origin.
    // The optional vertical bob is added (in device px) BEFORE the round, so the
    // shifted figure still lands on whole device pixels — crisp even mid-bob.
    const cellDev = cell * dpr;
    const yShiftDev = yOffsetCells * cellDev;
    const xShiftDev = xOffsetCells * cellDev;
    const leftDev = Math.round(
      at.x * cellDev + (cellDev - spriteWdev) / 2 + xShiftDev
    );
    const topDev = Math.round(
      at.y * cellDev + (cellDev - spriteHdev) / 2 + yShiftDev
    );

    ctx.imageSmoothingEnabled = false;
    const blockCss = block / dpr;
    // AXIS-JIGGLE: rotate the canvas about the figure's centre (in CSS px, since
    // the ctx is pre-scaled by dpr) before painting the blocks, then restore.
    // Only the red-ears rabbit passes a non-zero angle; the save/rotate is skipped
    // entirely otherwise so every other sprite paints on the untouched transform.
    const jiggling = rotateDeg !== 0;
    if (jiggling) {
      const cxCss = (leftDev + spriteWdev / 2) / dpr;
      const cyCss = (topDev + spriteHdev / 2) / dpr;
      ctx.save();
      ctx.translate(cxCss, cyCss);
      ctx.rotate((rotateDeg * Math.PI) / 180);
      ctx.translate(-cxCss, -cyCss);
    }
    for (let row = 0; row < sh; row++) {
      const bits = sprite[row];
      const yDev = topDev + row * block;
      for (let col = 0; col < sw; col++) {
        const color = resolve(bits[col]);
        if (!color) continue; // transparent → board shows through
        ctx.fillStyle = color;
        // Device px → CSS px (the ctx is pre-scaled by `dpr`).
        ctx.fillRect(
          (leftDev + col * block) / dpr,
          yDev / dpr,
          blockCss,
          blockCss
        );
      }
    }
    if (jiggling) ctx.restore();
  }

  /**
   * Intermittent "ha-ha-ha" laugh-burst envelope (the negatives' shake): returns a
   * sine that runs for the first {@link SPECIAL_ANIM_BURST} frames of each
   * {@link SPECIAL_ANIM_CYCLE}-frame cycle and is 0 (held still) the rest of the time
   * — so the shake reads as rhythmic bursts with still pauses, like laughter. Driven
   * off the shared render-frame counter so it free-runs the whole time the rabbit is
   * on the board. Returns 0 when `animate` is false (reduced motion → no shake).
   */
  private burstWave(animate: boolean, freq: number): number {
    if (!animate) return 0;
    const phase = this.frame % SPECIAL_ANIM_CYCLE;
    if (phase >= SPECIAL_ANIM_BURST) return 0;
    return Math.sin(phase * freq);
  }

  /**
   * Draw the single POSITIVE rabbit: a PLAIN WHITE bunny — the un-striped
   * {@link RABBIT_PLAIN} silhouette filled {@link RABBIT_WHITE}, no stripes, no rank
   * (it's the fixed +10 prize) — that TWITCHES about its own axis (the nav-bar
   * `.mono-jiggle` wobble ported to canvas, {@link sampleTwitch}, fired in periodic
   * jerks by {@link twitchDeg}). Same silhouette + size as every other rabbit; it's
   * the ONLY all-white one, so white = the thing to chase. Told apart from the snake by
   * SHAPE (a solid bunny vs a churning glyph stream). Frozen to a static white bunny
   * under reduced motion (deg → 0; the plain white body alone then says "chase me").
   */
  private drawPositive(
    ctx: CanvasRenderingContext2D,
    cell: number,
    dpr: number,
    at: Cell,
    animate: boolean
  ) {
    const deg = this.twitchDeg(animate);
    this.drawSprite(
      ctx,
      cell,
      dpr,
      at,
      RABBIT_PLAIN,
      solidColor(RABBIT_WHITE),
      RABBIT_BODY_SCALE,
      0,
      0,
      false,
      0,
      deg
    );
  }

  /**
   * Draw ONE of the two NEGATIVE rabbits: a WHITE bunny with `rank+1` RED ear stripes
   * (1–3 for −10/−20/−30) — the SAME silhouette + size as the plain-white +10, so the
   * ONLY difference is the RED stripes and their COUNT. It "laughs": a continuous
   * vertical BOB (never a rotation) plus an intermittent horizontal laugh-SHAKE (the
   * {@link burstWave} "ha-ha-ha"). The two negatives are DE-PHASED by their cell so they
   * never bob/shake in lockstep. Frozen to a static striped bunny under reduced motion
   * (the red stripes then carry the "dodge me").
   */
  private drawNegative(
    ctx: CanvasRenderingContext2D,
    cell: number,
    dpr: number,
    at: Cell,
    rank: number,
    animate: boolean
  ) {
    // De-phase per cell so the two negatives aren't synchronised.
    const phase = (at.x * 1.3 + at.y * 0.7) % (Math.PI * 2);
    const bob = animate
      ? NEG_BOB_AMP * Math.sin(this.frame * NEG_BOB_FREQ + phase)
      : 0;
    const shake = LAUGH_SHAKE_AMP * this.burstWave(animate, LAUGH_SHAKE_FREQ);
    this.drawSprite(
      ctx,
      cell,
      dpr,
      at,
      stripedRabbit(rank),
      stripeColor(RABBIT_RED),
      RABBIT_BODY_SCALE,
      bob,
      0,
      false,
      shake
    );
  }

  /**
   * Draw the KILLER: literally the white rabbit's OWN bunny — the SAME {@link
   * RABBIT_KILLER} geometry (identical to {@link RABBIT_PLAIN} / {@link stripedRabbit})
   * at the SAME {@link RABBIT_BODY_SCALE} — but the WHOLE body fills solid {@link
   * RABBIT_RED} with a pair of BLACK eyes ({@link killerColor}) in the SAME 2px cells
   * (cols 1–2 / 4–5) where the negatives carry their red eyes. So it is pixel-for-pixel
   * the same silhouette + size; the ONLY difference is the colour (solid red body +
   * black eyes). The black eyes make it read as one "dangerous" family with the
   * red-eyed negatives, while the solid red still screams death. Its standout is purely
   * that colour + a slow MENACE-pulse (a size throb about its own scale, NOT the
   * negatives' jittery laugh — a threat, not a joke), never a different shape or
   * footprint. Frozen to a static frame under reduced motion (the colour carries it).
   */
  private drawKiller(
    ctx: CanvasRenderingContext2D,
    cell: number,
    dpr: number,
    at: Cell,
    animate: boolean
  ) {
    const pulse = animate
      ? 1 + KILLER_PULSE_AMP * Math.sin(this.frame * KILLER_PULSE_FREQ)
      : 1;
    this.drawSprite(
      ctx,
      cell,
      dpr,
      at,
      RABBIT_KILLER,
      killerColor,
      RABBIT_BODY_SCALE * pulse
    );
  }

  /**
   * The positive's axis-TWITCH angle (degrees) this frame: play the nav-bar wobble
   * curve over the first {@link TWITCH_DUR_FRAMES} of each {@link TWITCH_PERIOD_FRAMES}
   * cycle, then HOLD at 0 — a periodic jerk, not a constant spin. 0 under reduced
   * motion (a static bunny).
   */
  private twitchDeg(animate: boolean): number {
    if (!animate) return 0;
    const phase = this.frame % TWITCH_PERIOD_FRAMES;
    if (phase >= TWITCH_DUR_FRAMES) return 0;
    return sampleTwitch(phase / TWITCH_DUR_FRAMES);
  }

  // ---------- glyph (square-stream) renderer (SNAKE_RENDER === "glyph") ----------

  /**
   * Paint one snake-body SQUARE for cell `at`, in `color`, at full opacity. A
   * slightly inset square (a {@link GLYPH_BG_INSET}-cell margin each side) so the
   * body reads as a stream of distinct squares on the dark {@link BOARD_BG}
   * rather than one solid block; the inset + box are snapped to the device-pixel
   * grid so the fill stays crisp (no blur), matching the sprite rasteriser's
   * discipline. The size is floored to ≥1 device px so the square never rounds
   * away to nothing at small cell sizes.
   */
  private drawSquare(
    ctx: CanvasRenderingContext2D,
    cell: number,
    dpr: number,
    at: Cell,
    color: string,
    alpha = 1
  ) {
    if (alpha <= 0) return;
    const cellDev = cell * dpr;
    const insetDev = Math.round(GLYPH_BG_INSET * cellDev);
    const leftDev = Math.round(at.x * cellDev) + insetDev;
    const topDev = Math.round(at.y * cellDev) + insetDev;
    const sizeDev = Math.round(cellDev) - insetDev * 2;
    if (sizeDev <= 0) return;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    // Device px → CSS px (the ctx is pre-scaled by `dpr`).
    ctx.fillRect(leftDev / dpr, topDev / dpr, sizeDev / dpr, sizeDev / dpr);
    ctx.globalAlpha = 1;
  }

  /**
   * Draw the snake as a STREAM OF SQUARES that follows its body. The HEAD is a
   * bright accent-green square ({@link GLYPH_BODY}) at full opacity; toward the
   * tail the square BOTH dims in colour (lerps to {@link GLYPH_TAIL}, deep green)
   * AND fades in opacity (down to {@link GLYPH_TAIL_ALPHA}), so the figure is
   * brightest where the creature is "now" and dissolves into its wake.
   *
   * No glyphs, no churn/flicker — every square is a static fill, so the body is
   * identical with or without animation (nothing to freeze under reduced motion).
   * Painted TAIL→HEAD so the brighter near-head squares land on top at any overlap.
   */
  private drawSnakeGlyphs(
    ctx: CanvasRenderingContext2D,
    cell: number,
    dpr: number
  ) {
    const len = this.snake.length;
    for (let i = len - 1; i >= 0; i--) {
      const seg = this.snake[i];
      // `t` is 0 at the head, 1 at the tail.
      const t = len <= 1 ? 0 : i / (len - 1);
      const color = lerpHex(GLYPH_BODY, GLYPH_TAIL, t * 0.9);
      const alpha = 1 - (1 - GLYPH_TAIL_ALPHA) * t;
      this.drawSquare(ctx, cell, dpr, seg, color, alpha);
    }
  }

  /**
   * Advance + paint the explosion chip burst (square brutalist chips), centred
   * on {@link explosionCell}, in CSS-px space. Chips spray out, fall under
   * gravity and fade over {@link EXPLOSION_MS}; then the burst self-clears. Time
   * is read from `performance.now()` (the burst is decoupled from the step
   * timer, so it plays at a steady wall-clock rate). No-op once cleared.
   */
  private drawExplosion(ctx: CanvasRenderingContext2D, cell: number) {
    if (!this.explosionCell || this.chips.length === 0) return;
    const now = performance.now();
    if (this.explosionStart === 0) this.explosionStart = now;
    const life = (now - this.explosionStart) / EXPLOSION_MS;
    if (life >= 1) {
      this.chips = [];
      this.explosionCell = null;
      this.explosionStart = 0;
      return;
    }

    const cx = (this.explosionCell.x + 0.5) * cell;
    const cy = (this.explosionCell.y + 0.5) * cell;
    ctx.globalAlpha = 1 - life * life; // ease-out fade
    for (const c of this.chips) {
      c.vy += 0.008; // gravity (cell-units / frame²)
      c.ox += c.vx;
      c.oy += c.vy;
      const px = cx + c.ox * cell;
      const py = cy + c.oy * cell;
      const s = c.size * cell;
      ctx.fillStyle = c.color;
      ctx.fillRect(px - s / 2, py - s / 2, s, s); // square chips, no rotation
    }
    ctx.globalAlpha = 1;
  }

  /** Paint the opaque gray field + grid behind the overlay. */
  drawIdle(ctx: CanvasRenderingContext2D, cssW: number, cssH: number) {
    ctx.fillStyle = BOARD_BG;
    ctx.fillRect(0, 0, cssW, cssH);
    this.drawGrid(ctx, cssW, cssH);
  }

  /**
   * Draw the live game: clear field → rabbit trio → body → head → sparks. `dpr` is
   * the canvas device-pixel ratio (the ctx is pre-scaled by it); the rabbit sprites
   * need it to rasterise on whole device pixels (see {@link drawSprite}).
   */
  drawGame(
    ctx: CanvasRenderingContext2D,
    cssW: number,
    cssH: number,
    dpr: number,
    animate: boolean
  ) {
    const cell = cssW / GRID_W; // === cssH / GRID_H (square cells)
    this.frame++;
    // Opaque gray field, repainted each frame, then the grid.
    ctx.fillStyle = BOARD_BG;
    ctx.fillRect(0, 0, cssW, cssH);
    this.drawGrid(ctx, cssW, cssH);

    // Rabbits — the field of FOUR (1 positive + 2 negative + the always-present
    // killer), ALWAYS the bunny-silhouette SPRITES in BOTH render modes (owner
    // preference — the pixel bunnies read better than glyph rabbits). All four are the
    // SAME white bunny silhouette + size; only the colour differs: the +10 is plain
    // WHITE (no stripes), a negative is white with 1–3 RED ear stripes + RED eyes
    // (= −10/−20/−30), the killer is SOLID RED with BLACK eyes. The motion tell (twitch
    // / laugh-bob / menace-pulse) is the subtler second channel. Readability is
    // non-negotiable — the player must LOOK.
    for (const r of this.rabbits) {
      if (r.kind === "killer") this.drawKiller(ctx, cell, dpr, r.cell, animate);
      else if (r.kind === "positive")
        this.drawPositive(ctx, cell, dpr, r.cell, animate);
      else this.drawNegative(ctx, cell, dpr, r.cell, r.rank, animate);
    }

    // Snake — the square stream (glyph mode) follows the body in one call
    // (head→tail colour gradient handled inside); skip the entire sprite path
    // below. Returns early after the body + explosion so the sprite head doesn't
    // double-draw.
    if (SNAKE_RENDER === "glyph") {
      this.drawSnakeGlyphs(ctx, cell, dpr);
      this.drawExplosion(ctx, cell);
      return;
    }

    // Body + tail — sentinel pixel sprites, dimming from head toward the tail
    // (the lime gradient). Indices 1..len-2 use the BODY sprite; the LAST segment
    // uses the TAIL sprite. Both share the head's reference block
    // ({@link SNAKE_REF_DIM}) so every snake pixel is one size and the creature
    // reads continuous (head, body and tail are all 7×8).
    //
    // The body is the sentinel tube (5-wide of 7, a red seam banding it) drawn in
    // `fillToCell` mode and ROTATED to align its long/fill axis with the
    // segment's direction of travel. So consecutive segments butt end-to-end into
    // one continuous tube on straight runs (no gap); on a turn the two
    // perpendicular tubes overlap at the shared corner cell (a tiny inner seam is
    // accepted). The red seam recurs down the body like a spine.
    //
    // The TAIL is the splaying multi-tentacle end: it is rotated so its tentacles
    // trail AWAY from the body, and (so it connects to the last body segment) it
    // ALSO draws in `fillToCell` — its wide cap fills the cell while the authored
    // tentacles dangle off the trailing edge. Painted tail→neck so the segments
    // nearer the head overlap on top.
    const bodyLen = this.snake.length - 1;
    for (let j = bodyLen; j >= 1; j--) {
      const seg = this.snake[j];
      const t = bodyLen <= 1 ? 0 : (j - 1) / (bodyLen - 1);
      const g = lerpHex(SENTINEL, SENTINEL_DIM, t * 0.85);
      if (j === bodyLen) {
        // Trailing direction: from the previous segment toward the tail tip
        // (wrap-corrected so a seam-crossing pair doesn't read as a huge jump).
        const trail = wrapStep(this.snake[j - 1], seg);
        const tailSprite = rotateSprite(TAIL_SPRITE, tailQuarters(trail));
        // The tail draws in `fillToCell` (its wide cap fills the cell, the
        // tentacles splay off the trailing edge) and is nudged BODYWARD by
        // TAIL_CONNECT_SHIFT (in the −trail direction) so its wide cap sits flush
        // at the body's cell border — the last body segment's overflow then
        // overlaps it, so body→tail connects with no gap and the tentacles trail.
        this.drawSprite(
          ctx,
          cell,
          dpr,
          seg,
          tailSprite,
          tailColors(g),
          BODY_TAIL_SCALE,
          -trail.y * TAIL_CONNECT_SHIFT,
          SNAKE_REF_DIM,
          false,
          -trail.x * TAIL_CONNECT_SHIFT
        );
      } else {
        // Middle segment: the sentinel tube (5-wide of 7, red-seamed) ROTATED to
        // run along the segment's FLOW — the toroidal step from this segment
        // toward the next one nearer the HEAD (`snake[j-1]`). In `fillToCell` the
        // long (flow) axis overflows the cell so consecutive segments butt
        // end-to-end into one continuous tube; the seam bands across the flow.
        // On a turn the perpendicular neighbour overlaps at the corner cell,
        // minimising the inner seam.
        const flow = wrapStep(seg, this.snake[j - 1]);
        const bodySprite = rotateSprite(BODY_SPRITE, bodyQuarters(flow));
        this.drawSprite(
          ctx,
          cell,
          dpr,
          seg,
          bodySprite,
          bodyColors(g),
          BODY_TAIL_SCALE,
          0,
          SNAKE_REF_DIM,
          false
        );
      }
    }

    // Head — the pixel-art sentinel head sprite (lime body + red eye-cluster +
    // spiky antennae), pre-rotated in 90° steps to face the current heading so
    // the spikes/eyes always point the way the creature moves. Pre-rotating the
    // BITMAP (not the canvas) keeps the pixels axis-aligned and crisp. Same
    // device-pixel-block rasteriser + ~0.85 cell fill as the rabbits, so the head
    // reads as the bright leading segment, cohesive with the body tube.
    const h = this.snake[0];
    const headSprite = rotateSprite(HEAD_SPRITE, headQuarters(this.dir));
    this.drawSprite(
      ctx,
      cell,
      dpr,
      h,
      headSprite,
      (ch) => HEAD_COLORS[ch] ?? null,
      1,
      0,
      SNAKE_REF_DIM
    );

    // Red-spark chips (a NEGATIVE "ouch" grab or the KILLER death) draw on top of the
    // snake. Only ever non-empty when a negative/killer was eaten and motion is
    // allowed (the engine gates seeding on `animate` → reduced motion = no burst).
    this.drawExplosion(ctx, cell);
  }
}
