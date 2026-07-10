import type { Cell, Speed } from "./types";

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

/** Score per food. */
export const FOOD_VALUE = 10;

/** Starting snake length — also the baseline `eaten` (food-eaten count) subtracts from `length`. */
export const INITIAL_LENGTH = 3;

// ---------- palette ----------

// THEME-NATIVE (like Tetris, unlike the always-dark rabbit Snake): the board follows
// the ambient theme. The 2D context can't resolve CSS vars, so the HOOK resolves the
// concrete colours from the live `--m-*` tokens and calls {@link SnakeClassicEngine.setPalette}
// on mount + on every theme change; the engine reads every draw colour from this object.

export interface SnakeClassicPalette {
  /** Field fill ← `--m-bg`. */
  boardBg: string;
  /** Snake head ← `--m-accent`; the body lerps head → tail down its length. */
  snakeHead: string;
  /** Tail tint — the accent pulled toward the field (`lerpHex(accent, bg, 0.55)`). */
  snakeTail: string;
  /** Food ← `--m-fg` (dark blocks on the light screen, white on dark). */
  food: string;
  /** Faint cell grid ← `--m-fg` at a low alpha. */
  gridLine: string;
  /** Board-edge frame — stronger than the inner grid so the rim always reads.
   *  Doubly load-bearing here: the walls are LETHAL, so the frame IS the hazard. */
  frameLine: string;
}

/** Dark-theme reference colours. Exported for {@link SnakeMark} — the hub card is an
 *  always-dark "screen" (`DarkCard`), so the mark keys off the DARK palette; they also
 *  seed {@link DEFAULT_PALETTE} so the first paint / SSR looks right before the hook
 *  resolves the ambient tokens. */
export const GLYPH_BODY = "#cdff48";
export const GLYPH_TAIL = "#5f7a23";
export const FOOD_WHITE = "#e6e6e6";

const DEFAULT_PALETTE: SnakeClassicPalette = {
  boardBg: "#181818",
  snakeHead: GLYPH_BODY,
  snakeTail: GLYPH_TAIL,
  food: FOOD_WHITE,
  gridLine: "rgba(220,220,220,0.05)",
  frameLine: "#ff5d5d",
};

/** Opacity floor at the tail end (head = 1). */
const GLYPH_TAIL_ALPHA = 0.3;
/** Per-side inset of each body SQUARE so segments read as distinct blocks, not one
 *  solid worm; snapped to the device-pixel grid. */
const GLYPH_BG_INSET = 0.18;

/** Food sprite fill — fraction of a cell its bounding box targets. Static
 *  (no pulse — an earlier size-throb read as distracting and was dropped). */
export const FOOD_FILL = 0.7;

/** Food sprite — the rabbit pickup ported from the retired "Follow the
 *  Rabbit" game (`RABBIT_PLAIN`, positive/+10 variant only — classic
 *  Snake has one food type, no striped penalty rabbit). `"1"` = body
 *  pixel, anything else = transparent. */
export const RABBIT_PLAIN: readonly string[] = [
  ".11.11.",
  ".11.11.",
  ".11.11.",
  ".11.11.",
  ".11.11.",
  ".11.11.",
  ".11.11.",
  "1111111",
  "1011101",
  "1110111",
  "1111111",
  "0111110",
  "0100010",
];

/** Parse `#rrggbb` OR `rgb(...)` (the form {@link lerpHex} itself emits) → `[r,g,b]`. */
function parseColor(c: string): [number, number, number] {
  if (c[0] === "#") {
    const i = parseInt(c.slice(1), 16);
    return [(i >> 16) & 255, (i >> 8) & 255, i & 255];
  }
  const m = c.match(/-?\d+/g);
  return m ? [Number(m[0]), Number(m[1]), Number(m[2])] : [0, 0, 0];
}

/** Exported for {@link SnakeMark}, which mirrors the in-game gradient. */
export function lerpHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = parseColor(a);
  const [br, bg, bb] = parseColor(b);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r},${g},${bl})`;
}

export interface StepResult {
  dead: boolean;
  ate: boolean;
  score: number;
  length: number;
  /** Food items eaten this run — derived as `length - INITIAL_LENGTH`. */
  eaten: number;
}

/** Test-only window into the live state (copies — mutating them changes nothing). */
export interface EngineSnapshot {
  snake: Cell[];
  dir: Cell;
  food: Cell;
  score: number;
}

/**
 * Headless CLASSIC Snake engine — the no-twist ruleset: ONE food (+{@link FOOD_VALUE},
 * +1 growth, slight speed-up), WALLS ARE LETHAL (no wrap — the classic difference from
 * Follow the White Rabbit), self-collision is lethal. All mutable game state + the
 * step + the canvas draw, with NO React; `useSnakeClassicGame` owns one instance.
 * `rng` is injectable so tests place food deterministically.
 */
export class SnakeClassicEngine {
  private snake: Cell[] = [];

  private dir: Cell = { x: 1, y: 0 };
  /** Buffered direction changes (FIFO). step() consumes one per tick, so two
   *  quick turns within a single tick (e.g. up→left around a corner) BOTH
   *  register instead of the second being dropped or mis-rejected as a reverse. */
  private dirQueue: Cell[] = [];
  /** Max buffered turns; extra inputs within one tick are ignored. */
  private readonly dirQueueMax = 2;

  private food: Cell = { x: 0, y: 0 };

  private stepMs = SPEED_MS.classic;

  private score = 0;

  /** Live theme palette; starts on the dark defaults until the hook resolves the
   *  ambient `--m-*` tokens (see {@link setPalette}). */
  private palette: SnakeClassicPalette = DEFAULT_PALETTE;

  constructor(
    private speed: Speed = "classic",
    private rng: () => number = Math.random
  ) {}

  get stepInterval(): number {
    return this.stepMs;
  }

  setSpeed(speed: Speed) {
    this.speed = speed;
  }

  /** Swap the draw palette — the hook calls this on mount AND on every theme change
   *  (the rAF loop repaints every frame, so the next frame picks it up). */
  setPalette(palette: SnakeClassicPalette) {
    this.palette = palette;
  }

  /** Reset to a fresh run (centre snake + one fresh food). */
  reset() {
    const cx = Math.floor(GRID_W / 2);
    const cy = Math.floor(GRID_H / 2);
    this.snake = Array.from({ length: INITIAL_LENGTH }, (_, i) => ({
      x: cx - i,
      y: cy,
    }));
    this.dir = { x: 1, y: 0 };
    this.dirQueue = [];
    this.stepMs = SPEED_MS[this.speed];
    this.score = 0;
    this.food = this.freeCell();
  }

  /** Live-state copies for tests/debug — never hand out the internal arrays. */
  inspect(): EngineSnapshot {
    return {
      snake: this.snake.map((s) => ({ ...s })),
      dir: { ...this.dir },
      food: { ...this.food },
      score: this.score,
    };
  }

  /** Test hook — pin the food to a known cell (deterministic eat scenarios). */
  debugPlaceFood(cell: Cell) {
    this.food = { ...cell };
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

  /** Pick a random free cell for the food — never on the snake. Guards the retry
   *  loop so a near-full board can't spin forever; on exhaustion it falls back to
   *  the last sampled cell (acceptable: the board is huge vs the snake). */
  private freeCell(): Cell {
    const occupied = new Set(this.snake.map((s) => `${s.x},${s.y}`));
    let x = 0;
    let y = 0;
    let guard = 0;
    do {
      x = (this.rng() * GRID_W) | 0;
      y = (this.rng() * GRID_H) | 0;
      guard++;
    } while (occupied.has(`${x},${y}`) && guard < 400);
    return { x, y };
  }

  /** Advance one tick. Returns the outcome for the hook to project to state. */
  step(): StepResult {
    if (this.dirQueue.length) this.dir = this.dirQueue.shift()!;
    const head = this.snake[0];
    const nx = head.x + this.dir.x;
    const ny = head.y + this.dir.y;

    // Classic walls: stepping off the field ends the run — no wrap.
    if (nx < 0 || ny < 0 || nx >= GRID_W || ny >= GRID_H) {
      return this.dead();
    }

    const ate = this.food.x === nx && this.food.y === ny;

    // Self-collision. The new head must miss the body that will REMAIN this step.
    // The tail FREES UP only when the snake does NOT grow: on an eat the snake
    // grows +1 (the tail stays put — its last cell is still occupied and IS a
    // collision); on a plain move the tail pops one cell — that freed cell is a
    // legal landing. So we exclude the trailing cell from the check on a plain
    // move, and check the whole body on an eat.
    const bodyToCheck = ate
      ? this.snake
      : this.snake.slice(0, this.snake.length - 1);
    if (bodyToCheck.some((s) => s.x === nx && s.y === ny)) {
      return this.dead();
    }

    this.snake.unshift({ x: nx, y: ny });

    if (ate) {
      this.score += FOOD_VALUE;
      // The classic per-pellet accel — every food ramps the step timer a touch.
      this.stepMs = Math.max(STEP_FLOOR, this.stepMs - STEP_ACCEL);
      this.food = this.freeCell();
    } else {
      // Plain move: pop the tail (length holds).
      this.snake.pop();
    }

    return {
      dead: false,
      ate,
      score: this.score,
      length: this.snake.length,
      eaten: this.snake.length - INITIAL_LENGTH,
    };
  }

  private dead(): StepResult {
    return {
      dead: true,
      ate: false,
      score: this.score,
      length: this.snake.length,
      eaten: this.snake.length - INITIAL_LENGTH,
    };
  }

  // ---------- canvas draw ----------

  /** Faint muted cell grid so the player can gauge distance / line up moves,
   *  plus the outer frame — here the frame marks the LETHAL walls. */
  private drawGrid(ctx: CanvasRenderingContext2D, cssW: number, cssH: number) {
    const cell = cssW / GRID_W; // === cssH / GRID_H (square cells, pinned aspect)
    ctx.strokeStyle = this.palette.gridLine;
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
    // 2px lethal-wall frame — matches the CSS `border-2` used everywhere else
    // (incl. the sibling Snake/"Follow the Rabbit" board's own red frame),
    // was a stray 1px inherited from the grid-line width above.
    ctx.strokeStyle = this.palette.frameLine;
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, cssW - 2, cssH - 2);
  }

  /**
   * Paint one square centred in cell `at`, snapped to the device-pixel grid so the
   * fill stays crisp (no blur). `fill` is the square's side as a fraction of the
   * cell; floored to ≥1 device px so it never rounds away at small cell sizes.
   */
  private drawSquare(
    ctx: CanvasRenderingContext2D,
    cell: number,
    dpr: number,
    at: Cell,
    color: string,
    fill: number,
    alpha = 1
  ) {
    if (alpha <= 0) return;
    const cellDev = cell * dpr;
    const sizeDev = Math.max(1, Math.round(fill * cellDev));
    const leftDev = Math.round(at.x * cellDev + (cellDev - sizeDev) / 2);
    const topDev = Math.round(at.y * cellDev + (cellDev - sizeDev) / 2);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    // Device px → CSS px (the ctx is pre-scaled by `dpr`).
    ctx.fillRect(leftDev / dpr, topDev / dpr, sizeDev / dpr, sizeDev / dpr);
    ctx.globalAlpha = 1;
  }

  /**
   * Draw the snake as a STREAM OF SQUARES: the HEAD is a bright accent square at
   * full opacity; toward the tail the square BOTH dims in colour (lerps to
   * {@link GLYPH_TAIL}) AND fades in opacity (down to {@link GLYPH_TAIL_ALPHA}).
   * Every square is a static fill — identical with or without animation, so
   * nothing needs freezing under reduced motion. Painted TAIL→HEAD so the
   * brighter near-head squares land on top at any overlap.
   */
  private drawSnake(ctx: CanvasRenderingContext2D, cell: number, dpr: number) {
    const len = this.snake.length;
    for (let i = len - 1; i >= 0; i--) {
      const seg = this.snake[i];
      // `t` is 0 at the head, 1 at the tail.
      const t = len <= 1 ? 0 : i / (len - 1);
      const color = lerpHex(
        this.palette.snakeHead,
        this.palette.snakeTail,
        t * 0.9
      );
      const alpha = 1 - (1 - GLYPH_TAIL_ALPHA) * t;
      this.drawSquare(
        ctx,
        cell,
        dpr,
        seg,
        color,
        1 - GLYPH_BG_INSET * 2,
        alpha
      );
    }
  }

  /** The food — a rabbit pixel-sprite, fixed size. */
  private drawFood(ctx: CanvasRenderingContext2D, cell: number, dpr: number) {
    this.drawFoodSprite(ctx, cell, dpr, this.food, FOOD_FILL);
  }

  /** 1px-per-bit offscreen render of {@link RABBIT_PLAIN} in the current food
   *  colour — `drawFoodSprite` scales it via `drawImage` (nearest-neighbour,
   *  continuous scale) instead of a manual per-bit `fillRect` loop. A
   *  `fillRect` loop needs an INTEGER device-pixel block size (floored),
   *  which steps the sprite's on-screen size in coarse jumps as that integer
   *  crosses a threshold; `drawImage` scales continuously, so `fill` tuning
   *  reads as continuous instead of snapping between sizes. Cached and only
   *  rebuilt when the food colour changes (theme flip). */
  private foodSpriteCanvas: HTMLCanvasElement | null = null;
  private foodSpriteColor: string | null = null;

  private getFoodSpriteCanvas(): HTMLCanvasElement {
    if (this.foodSpriteCanvas && this.foodSpriteColor === this.palette.food) {
      return this.foodSpriteCanvas;
    }
    const sw = RABBIT_PLAIN[0].length;
    const sh = RABBIT_PLAIN.length;
    const off = document.createElement("canvas");
    off.width = sw;
    off.height = sh;
    const octx = off.getContext("2d")!;
    octx.fillStyle = this.palette.food;
    for (let y = 0; y < sh; y++) {
      const row = RABBIT_PLAIN[y];
      for (let x = 0; x < sw; x++) {
        if (row[x] === "1") octx.fillRect(x, y, 1, 1);
      }
    }
    this.foodSpriteCanvas = off;
    this.foodSpriteColor = this.palette.food;
    return off;
  }

  /**
   * Paint the food as the {@link RABBIT_PLAIN} pixel-sprite, scaled so its
   * bounding box fills `fill` fraction of the cell.
   */
  private drawFoodSprite(
    ctx: CanvasRenderingContext2D,
    cell: number,
    dpr: number,
    at: Cell,
    fill: number
  ) {
    const sprite = this.getFoodSpriteCanvas();
    const sw = sprite.width;
    const sh = sprite.height;
    const cellDev = cell * dpr;
    const boxDev = cellDev * fill;
    const scale = boxDev / Math.max(sw, sh);
    const spriteWdev = sw * scale;
    const spriteHdev = sh * scale;
    const leftDev = at.x * cellDev + (cellDev - spriteWdev) / 2;
    const topDev = at.y * cellDev + (cellDev - spriteHdev) / 2;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      sprite,
      leftDev / dpr,
      topDev / dpr,
      spriteWdev / dpr,
      spriteHdev / dpr
    );
    ctx.imageSmoothingEnabled = true;
  }

  /** Paint the opaque theme field + grid behind the overlay. */
  drawIdle(ctx: CanvasRenderingContext2D, cssW: number, cssH: number) {
    ctx.fillStyle = this.palette.boardBg;
    ctx.fillRect(0, 0, cssW, cssH);
    this.drawGrid(ctx, cssW, cssH);
  }

  /** Draw the live game: clear field → food → snake. */
  drawGame(
    ctx: CanvasRenderingContext2D,
    cssW: number,
    cssH: number,
    dpr: number
  ) {
    const cell = cssW / GRID_W; // === cssH / GRID_H (square cells)
    ctx.fillStyle = this.palette.boardBg;
    ctx.fillRect(0, 0, cssW, cssH);
    this.drawGrid(ctx, cssW, cssH);
    this.drawFood(ctx, cell, dpr);
    this.drawSnake(ctx, cell, dpr);
  }
}
