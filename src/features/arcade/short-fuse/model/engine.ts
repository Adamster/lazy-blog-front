/** Play-field grid (cells). The board is NOT square-cell-pinned like Snake —
 *  Short Fuse reserves a HUD row above the play grid, so the canvas aspect is
 *  `GRID_W / CANVAS_ROWS`, not `GRID_W / GRID_H`. */
export const GRID_W = 15;
export const GRID_H = 11;
/** Rows of HUD chrome drawn above the play grid (score/lives/timer strip). */
export const HUD_ROWS = 1;
/** Total canvas rows the renderer allocates — play grid + HUD. */
export const CANVAS_ROWS = GRID_H + HUD_ROWS;

export const TILE_EMPTY = 0;
export const TILE_PILLAR = 1;
export const TILE_SOFT = 2;
export type Tile = typeof TILE_EMPTY | typeof TILE_PILLAR | typeof TILE_SOFT;

export type PowerupType = "bomb" | "range" | "speed" | "skull";
export type EnemyKind = "wanderer" | "chaser" | "skitter";

export const INITIAL_LIVES = 3;
/** Per-level countdown (ms) — hitting zero costs a life and regenerates the level. */
export const LEVEL_TIME_MS = 180_000;
/** Time between a bomb being placed and it detonating (ms). */
export const FUSE_MS = 2000;
/** How long a blast cell stays lethal/lit (ms). */
export const BLAST_MS = 400;
/** Duration of a skull-powerup debuff (ms). */
export const DEBUFF_MS = 10_000;
/** Chance a destroyed soft block leaves a powerup behind. */
export const DROP_RATE = 0.3;
/** Share of drops that are the negative "skull" powerup (vs. the three positive kinds). */
export const SKULL_SHARE = 0.25;
export const SCORE_SOFT = 10;
export const SCORE_PICKUP = 50;
export const SCORE_LEVEL_CLEAR = 500;
export const TIME_BONUS_PER_S = 5;
export const SCORE_KILL: Record<EnemyKind, number> = {
  wanderer: 100,
  chaser: 200,
  skitter: 300,
};

/** Cells/second. */
const ENEMY_SPEED: Record<EnemyKind, number> = {
  wanderer: 2.2,
  chaser: 1.8,
  skitter: 3.2,
};

/** Base ms between player hops before speed-powerup levels (owner retune:
 *  classic cell-hop movement, replacing the earlier smooth sub-cell glide —
 *  "по клеточное — проще и визуально приятнее"). Exported so tests can
 *  derive expected hop counts without duplicating the tuning numbers. */
export const PLAYER_STEP_MS = 180;
/** ms shaved off the hop interval per `speed` powerup level. */
const PLAYER_STEP_ACCEL_MS = 15;
/** Fastest the player's hop interval can get regardless of stacked powerups (ms). */
const PLAYER_STEP_FLOOR_MS = 110;
/** Hop-interval multiplier while a `slow` skull debuff is active (bigger
 *  interval ⇒ slower hops). */
const PLAYER_SLOW_MUL = 1.5;
/** Per-`update()` dt ceiling (ms) — guards against huge dt after a tab stall. */
const DT_CLAMP_MS = 50;

/** The four axis-aligned step directions — shared by blast-arm traversal
 *  (`detonate`) and enemy pathing (`stepEnemy`), one source per DRY. */
const DIRECTIONS: ReadonlyArray<readonly [-1 | 0 | 1, -1 | 0 | 1]> = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

interface Bomb {
  x: number; // cell coords (int)
  y: number;
  fuseMs: number;
  range: number;
  /** Passable until the player leaves its cell, then solid. */
  walkable: boolean;
}

interface Blast {
  cells: number[]; // grid indexes
  ttlMs: number;
}

interface Enemy {
  kind: EnemyKind;
  x: number; // cell coords (int)
  y: number;
  /** Current heading — kept for the straight-preference decision (wanderer/
   *  skitter prefer to keep going the way they were going); no longer a
   *  tween target now that movement is a discrete cell-hop. */
  dx: -1 | 0 | 1;
  dy: -1 | 0 | 1;
  /** ms per hop, fixed at spawn from the per-kind {@link ENEMY_SPEED} + level ramp. */
  stepMs: number;
  /** Countdown to the next hop; decremented by dt each update, hops (and
   *  re-decides direction) when it reaches zero. */
  hopMs: number;
}

interface PlayerState {
  x: number; // cell coords (int)
  y: number;
  maxBombs: number;
  range: number;
  speedLevel: number; // 0-based, hop interval = base - accel*level floored
  debuff: { kind: "slow" | "shortRange"; ttlMs: number } | null;
}

// ---------- palette ----------
//
// THEME-NATIVE (the Tetris/snake-classic/stay-awake pattern): the 2D context
// can't read CSS vars, so the hook resolves concrete colours from the live
// `--m-*` tokens and calls {@link ShortFuseEngine.setPalette} on mount + on
// every theme change (the rAF loop repaints every frame, so the next frame
// picks it up).

export interface ShortFusePalette {
  /** Field fill ← `--m-bg`. */
  boardBg: string;
  /** Indestructible pillar tile ← `--m-fg` lerped 0.75 toward `--m-bg`
   *  (quiet solids — read as background structure). */
  pillar: string;
  /** Destructible soft-block tile ← `--m-fg` lerped 0.45 toward `--m-bg`
   *  (breakable reads louder than pillar — it's the thing worth bombing). */
  soft: string;
  /** Fyze's body ← `--m-fg`. */
  player: string;
  /** Belly band / good-powerup / exit / blast core ← `--m-accent`. */
  accent: string;
  /** Wick spark / skull-powerup / blast rim / frame / the ONE debuff signal
   *  ← `--m-error`. */
  spark: string;
  /** Faint interior cell grid ← `--m-fg` at a low alpha. */
  gridLine: string;
  /** Board-edge frame ← `--m-error`. */
  frameLine: string;
  /** HUD timer text ← `--m-fg`. */
  hudText: string;
  /** HUD level label ← `--m-muted`. */
  muted: string;
}

/** Dark-theme reference colours for Fyze — they seed {@link DEFAULT_PALETTE}
 *  so the first paint / SSR looks right before the hook resolves the live
 *  tokens. (The hub's `FyzeMark` renders with live CSS-var fills instead, so
 *  these are palette-seeds only — not exported.) */
const FYZE_BODY = "#dcdcdc";
const FYZE_ACCENT = "#cdff48";
const FYZE_SPARK = "#ff6b6b";

const DEFAULT_PALETTE: ShortFusePalette = {
  boardBg: "#181818",
  pillar: "#494949", // fg(#dcdcdc) lerped 0.75 → bg(#181818)
  soft: "#848484", // fg(#dcdcdc) lerped 0.45 → bg(#181818)
  player: FYZE_BODY,
  accent: FYZE_ACCENT,
  spark: FYZE_SPARK,
  gridLine: "rgba(220,220,220,0.05)",
  frameLine: FYZE_SPARK,
  hudText: FYZE_BODY,
  muted: "#9a9a9a",
};

/** Canvas 2D `font` can't resolve `var(--font-mono)` (same constraint noted
 *  at `shared/ui/effects/glyph-rain.tsx`) — name the real stack directly.
 *  Font-family is theme-invariant (unlike colour), so this stays a plain
 *  constant rather than a palette field. */
const HUD_FONT = 'ui-monospace, "JetBrains Mono", "Courier New", monospace';

// ---------- sprites ----------
//
// Pixel bitmaps, rasterised onto a cached offscreen canvas at 1px/bit and
// scaled onto the live canvas via `drawImage` (continuous scale — mirrors
// {@link SnakeClassicEngine}'s `RABBIT_PLAIN`/`getFoodSpriteCanvas`, see
// {@link ShortFuseEngine.getSprite}). Char → colour is resolved per sprite:
// "1" = primary body, "2" = accent band, "3" = spark, "0" = background
// knockout (opaque `boardBg`, e.g. eye sockets), "." = transparent.

/** Fyze — the walking bomb: round body, stub legs, wick + spark ("3"),
 *  belly band ("2", swaps accent → spark while debuffed — the ONE debuff
 *  signal), knockout eyes ("0"). */
export const FYZE_SPRITE: readonly string[] = [
  "....3....",
  "....1....",
  "..11111..",
  ".1111111.",
  ".1101011.",
  ".1111111.",
  ".2222222.",
  ".1111111.",
  "..11111..",
  "..1...1..",
];

/** Wanderer — a round blob with stub feet, no wick (calmest silhouette). */
const ENEMY_WANDERER_SPRITE: readonly string[] = [
  ".........",
  "..11111..",
  ".1111111.",
  "111010111",
  "111111111",
  ".1111111.",
  "..11111..",
  "..1...1..",
];

/** Chaser — a pointed hood (apex top), reads as the "aiming at you" shape. */
const ENEMY_CHASER_SPRITE: readonly string[] = [
  "....1....",
  "...111...",
  "..11111..",
  ".1111111.",
  "111010111",
  "111111111",
  "111111111",
  "..1...1..",
];

/** Skitter — corner spikes top and bottom, the jitteriest silhouette. */
const ENEMY_SKITTER_SPRITE: readonly string[] = [
  "1.......1",
  ".1.....1.",
  "..11111..",
  ".1101011.",
  ".1111111.",
  "..11111..",
  ".1.....1.",
  "1.......1",
];

/** Distinct per-kind silhouettes, keyed by {@link EnemyKind}. */
const ENEMY_SPRITES: Record<EnemyKind, readonly string[]> = {
  wanderer: ENEMY_WANDERER_SPRITE,
  chaser: ENEMY_CHASER_SPRITE,
  skitter: ENEMY_SKITTER_SPRITE,
};

/** A planted bomb — a plain round bomb (no belly band/eyes/feet — that's
 *  what visually distinguishes it from Fyze himself), wick spark ("3")
 *  blinking on the sim's fuse clock. */
export const BOMB_SPRITE: readonly string[] = [
  "....3....",
  "....1....",
  "..11111..",
  ".1111111.",
  ".1111111.",
  ".1111111.",
  ".1111111.",
  "..11111..",
];

const POWERUP_BOMB_SPRITE: readonly string[] = [
  "...3...",
  "...1...",
  ".11111.",
  "1111111",
  "1111111",
  ".11111.",
  ".......",
];

/** Cross — reads as "blast range" at a glance. */
const POWERUP_RANGE_SPRITE: readonly string[] = [
  "...1...",
  "...1...",
  "...1...",
  "1111111",
  "...1...",
  "...1...",
  "...1...",
];

/** Fast-forward chevrons. */
const POWERUP_SPEED_SPRITE: readonly string[] = [
  "1...1..",
  "11..11.",
  "111.111",
  "1111111",
  "111.111",
  "11..11.",
  "1...1..",
];

/** Skull — the ONE negative drop, drawn in `spark` so it reads as a trap. */
const POWERUP_SKULL_SPRITE: readonly string[] = [
  ".11111.",
  "1111111",
  "1101101",
  "1111111",
  ".10101.",
  "..111..",
  ".......",
];

/** 7×7 pickup icons, keyed by {@link PowerupType}. */
const POWERUP_SPRITES: Record<PowerupType, readonly string[]> = {
  bomb: POWERUP_BOMB_SPRITE,
  range: POWERUP_RANGE_SPRITE,
  speed: POWERUP_SPEED_SPRITE,
  skull: POWERUP_SKULL_SPRITE,
};

/** Door outline — the exit before every enemy on the level is cleared. */
const EXIT_CLOSED_SPRITE: readonly string[] = [
  ".11111.",
  "1.....1",
  "1.....1",
  "1.....1",
  "1.....1",
  "1.....1",
  "1.....1",
  "1.....1",
  "1111111",
];

/** Filled doorway — the exit once the level's enemies are all down, inviting
 *  the player through. */
const EXIT_OPEN_SPRITE: readonly string[] = [
  ".11111.",
  "1111111",
  "1111111",
  "1111111",
  "1111111",
  "1111111",
  "1111111",
  "1111111",
  "1111111",
];

/** Sprite bounding-box fill (fraction of a cell) — one knob per figure kind,
 *  mirroring {@link SnakeClassicEngine}'s `FOOD_FILL`. `FYZE_FILL`/`BOMB_FILL`
 *  are exported for the hub-card mark (same as snake's `FOOD_FILL`, stay-awake's
 *  `SPRITE_FILL`) so the mark nests its sprites at the exact in-game cell fill. */
export const FYZE_FILL = 0.82;
const ENEMY_FILL = 0.78;
export const BOMB_FILL = 0.7;
const POWERUP_FILL = 0.6;
const EXIT_FILL = 0.88;
/** Pillar/soft solid-fill tiles (a `drawSquare`, not a sprite) — leaves a
 *  hairline gap so adjacent blocks still read as distinct cells. */
const TILE_FILL = 0.9;

/** Bomb wick-spark blink period, ticked off the bomb's OWN `fuseMs` (sim
 *  time), never `Date.now()` — deterministic and immune to tab throttling. */
const BOMB_BLINK_MS = 250;
/** Blast fill: full for the opening stretch, then shrinks toward the inner
 *  knockout's fill over the last stretch of its `ttlMs` (fades out instead
 *  of popping). */
const BLAST_FILL_FULL = 0.86;
const BLAST_FILL_MIN = 0.4;
const BLAST_INNER_FILL = 0.4;
const BLAST_SHRINK_MS = 150;
/** HUD timer flips to `spark` under this many ms left. */
const HUD_LOW_TIME_MS = 30_000;

export interface UpdateResult {
  gameOver: boolean;
  score: number;
  level: number;
  lives: number;
  timeLeftMs: number;
}

/** Test-only window into the live state (copies — mutating them changes nothing). */
export interface EngineSnapshot {
  grid: Tile[];
  player: PlayerState;
  enemies: Enemy[];
  bombs: Bomb[];
  blasts: Blast[];
  powerups: { index: number; type: PowerupType }[];
  exitIndex: number;
  exitRevealed: boolean;
  score: number;
  level: number;
  lives: number;
  timeLeftMs: number;
}

/**
 * Headless Short Fuse (Bomberman-like) engine — grid generation, player/enemy
 * state, bombs/blasts, scoring, AND the canvas draw layer; no React. `rng` is
 * injectable so tests get deterministic level generation. The constructor
 * calls {@link reset} (the "constructible = drawable" contract this arcade
 * family settled on — `drawGame` must never see an empty grid, even before
 * the hook's first explicit `reset()`/`start()`).
 */
export class ShortFuseEngine {
  private grid: Tile[] = [];
  private player: PlayerState = this.basePlayer();
  private enemies: Enemy[] = [];
  private bombs: Bomb[] = [];
  private blasts: Blast[] = [];
  private powerups = new Map<number, PowerupType>();
  private exitIndex = 0;
  private exitRevealed = false;
  private score = 0;
  private level = 1;
  private lives = INITIAL_LIVES;
  private timeLeftMs = LEVEL_TIME_MS;
  private moveX: -1 | 0 | 1 = 0;
  private moveY: -1 | 0 | 1 = 0;
  /** True while a held direction has already fired its "fresh press" hop —
   *  cleared the moment both axes go idle so the NEXT press hops immediately
   *  again (see {@link stepPlayer}). */
  private playerMoveHeld = false;
  /** Countdown (ms) to the player's next hop while a direction is held. */
  private playerHopMs = 0;
  /** Set once the last life is lost — `update` then freezes the sim and
   *  keeps returning `lastResult` instead of re-simulating. */
  private dead = false;
  private lastResult: UpdateResult | null = null;

  /** Live theme palette; starts on the dark defaults until the hook resolves
   *  the ambient `--m-*` tokens (see {@link setPalette}). */
  private palette: ShortFusePalette = DEFAULT_PALETTE;
  /** Set by the hook from `prefersReducedMotion()`; the engine only reads it
   *  (no `matchMedia` in here — no React/DOM assumptions in the sim). */
  private reducedMotion = false;
  /** Offscreen sprite bitmaps, keyed by a small id (e.g. `"fyze-debuff"`,
   *  `"enemy-chaser"`) — cleared whole on every {@link setPalette} so a
   *  theme flip can't serve a stale-coloured bitmap. Caches `null` too (the
   *  "no 2D canvas context available" case) so a jsdom test environment
   *  doesn't retry `getContext` — and warn — every frame. */
  private spriteCache = new Map<string, HTMLCanvasElement | null>();

  constructor(private rng: () => number = Math.random) {
    this.reset();
  }

  private basePlayer(): PlayerState {
    return { x: 0, y: 0, maxBombs: 1, range: 1, speedLevel: 0, debuff: null };
  }

  /** Fresh RUN: level 1, base powerups, full lives, score 0. */
  reset() {
    this.score = 0;
    this.level = 1;
    this.lives = INITIAL_LIVES;
    this.dead = false;
    this.lastResult = null;
    this.player = this.basePlayer();
    this.generateLevel();
  }

  /** Rebuild the arena for the CURRENT level; player keeps powerups. */
  private generateLevel() {
    this.bombs = [];
    this.blasts = [];
    this.powerups.clear();
    this.exitRevealed = false;
    this.timeLeftMs = LEVEL_TIME_MS;
    this.player.x = 0;
    this.player.y = 0;
    this.player.debuff = null;
    this.moveX = 0;
    this.moveY = 0;
    this.playerMoveHeld = false;
    this.playerHopMs = 0;
    // 1. pillars
    this.grid = Array.from({ length: GRID_W * GRID_H }, (_, i) => {
      const x = i % GRID_W;
      const y = (i / GRID_W) | 0;
      return x % 2 === 1 && y % 2 === 1 ? TILE_PILLAR : TILE_EMPTY;
    });
    // 2. soft blocks (skip spawn pocket)
    const density = Math.min(0.65, 0.45 + (this.level - 1) * 0.02);
    const spawnSafe = new Set([0, 1, GRID_W]);
    const softIndexes: number[] = [];
    for (let i = 0; i < this.grid.length; i++) {
      if (this.grid[i] !== TILE_EMPTY || spawnSafe.has(i)) continue;
      if (this.rng() < density) {
        this.grid[i] = TILE_SOFT;
        softIndexes.push(i);
      }
    }
    // ensure enough cover for the exit + drops (degenerate rng guard)
    // (with density ≥ 0.45 over ~100 candidate cells this only fires in tests)
    let guard = 0;
    while (softIndexes.length < 15 && guard++ < 200) {
      const i = (this.rng() * this.grid.length) | 0;
      if (this.grid[i] === TILE_EMPTY && !spawnSafe.has(i)) {
        this.grid[i] = TILE_SOFT;
        softIndexes.push(i);
      }
    }
    // 3. exit under a random soft block
    this.exitIndex = softIndexes[(this.rng() * softIndexes.length) | 0];
    // 4. enemies on far empty cells
    this.enemies = [];
    const roster = this.levelRoster();
    let spawnGuard = 0;
    while (this.enemies.length < roster.length && spawnGuard++ < 500) {
      const i = (this.rng() * this.grid.length) | 0;
      const x = i % GRID_W;
      const y = (i / GRID_W) | 0;
      if (this.grid[i] !== TILE_EMPTY) continue;
      if (x + y < 6) continue; // manhattan distance from (0,0)
      if (
        this.enemies.some((e) => Math.round(e.x) === x && Math.round(e.y) === y)
      )
        continue;
      const kind = roster[this.enemies.length];
      this.enemies.push(this.makeEnemy(kind, x, y));
    }
  }

  /** One construction site for enemies — generation + the debug spawner. */
  private makeEnemy(kind: EnemyKind, x: number, y: number): Enemy {
    const stepMs = this.enemyStepMs(kind);
    return { kind, x, y, dx: 0, dy: 0, stepMs, hopMs: stepMs };
  }

  /** Enemy mix ramps with level: wanderers always; chasers from 2; skitters from 4. */
  private levelRoster(): EnemyKind[] {
    const count = Math.min(8, 3 + Math.floor((this.level - 1) / 2));
    const kinds: EnemyKind[] = [];
    for (let i = 0; i < count; i++) {
      if (this.level >= 4 && i % 3 === 2) kinds.push("skitter");
      else if (this.level >= 2 && i % 2 === 1) kinds.push("chaser");
      else kinds.push("wanderer");
    }
    return kinds;
  }

  private enemySpeed(kind: EnemyKind): number {
    // +4%/level, capped at +60%
    return ENEMY_SPEED[kind] * Math.min(1.6, 1 + (this.level - 1) * 0.04);
  }

  /** Cells/second → ms-per-hop for the discrete enemy step. */
  private enemyStepMs(kind: EnemyKind): number {
    return 1000 / this.enemySpeed(kind);
  }

  /** Held movement direction (one axis at a time — the input hook resolves
   *  precedence before calling this). */
  setMove(dx: -1 | 0 | 1, dy: -1 | 0 | 1) {
    this.moveX = dx;
    this.moveY = dy;
  }

  /** Drop a bomb at the player's current cell. Rejected if a bomb already
   *  sits there, or the player is already at their `maxBombs` cap. Range is
   *  pinned to 1 while a `shortRange` debuff is active, regardless of the
   *  player's own upgraded range. */
  placeBomb() {
    const x = this.player.x;
    const y = this.player.y;
    if (this.bombs.some((b) => b.x === x && b.y === y)) return;
    if (this.bombs.length >= this.player.maxBombs) return;
    const range =
      this.player.debuff?.kind === "shortRange" ? 1 : this.player.range;
    this.bombs.push(this.makeBomb(x, y, range));
  }

  /** One construction site for bombs — `placeBomb` + the debug placer. */
  private makeBomb(x: number, y: number, range: number): Bomb {
    return { x, y, fuseMs: FUSE_MS, range, walkable: true };
  }

  /** Solid FOR THE PLAYER at cell (cx,cy)? Bombs solidify after the player
   *  leaves their cell (Task 4 sets `walkable` false on exit). */
  private solidForPlayer(cx: number, cy: number): boolean {
    if (cx < 0 || cy < 0 || cx >= GRID_W || cy >= GRID_H) return true;
    const t = this.grid[cy * GRID_W + cx];
    if (t !== TILE_EMPTY) return true;
    return this.bombs.some((b) => b.x === cx && b.y === cy && !b.walkable);
  }

  /** ms between player hops: the base minus the speed-powerup ramp, floored,
   *  then stretched ×{@link PLAYER_SLOW_MUL} while a `slow` skull debuff is
   *  active (the debuff widens the interval rather than fighting the floor). */
  private playerStepMs(): number {
    const base = Math.max(
      PLAYER_STEP_FLOOR_MS,
      PLAYER_STEP_MS - PLAYER_STEP_ACCEL_MS * this.player.speedLevel
    );
    return this.player.debuff?.kind === "slow" ? base * PLAYER_SLOW_MUL : base;
  }

  /** Discrete cell-hop movement (owner retune, replacing the old smooth
   *  glide): a held direction hops the player exactly one cell every
   *  {@link playerStepMs}. The FIRST hop after a direction goes from
   *  none→held fires immediately (`playerMoveHeld` gates this — no waiting a
   *  full interval before the very first step registers); every hop after
   *  that is gated by the `playerHopMs` countdown. A direction CHANGE while
   *  already held does NOT reset the countdown or fire early — it only
   *  changes which way the next scheduled hop goes (we read `moveX`/`moveY`
   *  fresh at the moment the hop fires, never a direction cached earlier).
   *  The `while` catch-up guards a stalled-tab dt spike; in practice
   *  `DT_CLAMP_MS` (50) is always well under the step floor (110) so at most
   *  one hop ever fires per call. */
  private stepPlayer(dt: number) {
    const dx = this.moveX;
    const dy = this.moveX !== 0 ? 0 : this.moveY; // one axis; X wins ties
    if (dx === 0 && dy === 0) {
      this.playerMoveHeld = false;
      return;
    }
    if (!this.playerMoveHeld) {
      this.playerMoveHeld = true;
      this.playerHopMs = this.playerStepMs();
      this.hopPlayer(dx, dy);
      return;
    }
    this.playerHopMs -= dt;
    while (this.playerHopMs <= 0) {
      this.hopPlayer(dx, dy);
      this.playerHopMs += this.playerStepMs();
    }
  }

  /** Hop the player exactly one cell toward (dx,dy); a no-op if the target
   *  cell is solid — no corner assist, no partial slide, a clean reject. */
  private hopPlayer(dx: -1 | 0 | 1, dy: -1 | 0 | 1) {
    const p = this.player;
    const tx = p.x + dx;
    const ty = p.y + dy;
    if (this.solidForPlayer(tx, ty)) return;
    p.x = tx;
    p.y = ty;
  }

  /** Solid FOR AN ENEMY at cell (cx,cy)? Unlike the player, ALL bombs block
   *  (walkable or not) — enemies never share a bomb's cell. The exit cell,
   *  once revealed, is plain floor (its tile is TILE_EMPTY by then) and
   *  needs no special case. */
  private solidForEnemy(cx: number, cy: number): boolean {
    if (cx < 0 || cy < 0 || cx >= GRID_W || cy >= GRID_H) return true;
    const t = this.grid[cy * GRID_W + cx];
    if (t !== TILE_EMPTY) return true;
    return this.bombs.some((b) => b.x === cx && b.y === cy);
  }

  /** Manhattan distance from (x,y) to the player's current cell — the
   *  chaser's greedy pathing metric. */
  private manhattan(x: number, y: number): number {
    return Math.abs(x - this.player.x) + Math.abs(y - this.player.y);
  }

  /** Discrete cell-hop enemy movement: decide-then-move happens in ONE step,
   *  gated by the enemy's own `hopMs` countdown (decision logic that used to
   *  run "on arrival at a cell center" now runs at each hop). Chaser picks
   *  the open neighbor that greedily minimizes manhattan distance to the
   *  player; wanderer/skitter continue straight unless a per-kind
   *  `turnChance` roll fires or the straight lane is blocked, in which case
   *  a random open option is picked. A dead end (no open neighbor) parks the
   *  enemy in place for one more interval — it re-decides next hop in case a
   *  blast opened a lane. Moves one axis at a time by construction (only one
   *  of dx/dy is ever nonzero), so enemies can't cut corners. The `while`
   *  catch-up mirrors {@link stepPlayer}'s stalled-tab guard. */
  private stepEnemy(en: Enemy, dt: number) {
    en.hopMs -= dt;
    while (en.hopMs <= 0) {
      en.hopMs += en.stepMs;
      const options = DIRECTIONS.filter(
        ([dx, dy]) => !this.solidForEnemy(en.x + dx, en.y + dy)
      );
      if (options.length === 0) {
        en.dx = 0;
        en.dy = 0;
        continue; // dead end — wait out this interval, re-decide next hop
      }
      let pick: readonly [-1 | 0 | 1, -1 | 0 | 1];
      if (en.kind === "chaser") {
        pick = options.reduce((best, o) =>
          this.manhattan(en.x + o[0], en.y + o[1]) <
          this.manhattan(en.x + best[0], en.y + best[1])
            ? o
            : best
        );
      } else {
        const straight = options.find(
          ([dx, dy]) => dx === en.dx && dy === en.dy
        );
        const turnChance = en.kind === "skitter" ? 0.4 : 0.15;
        pick =
          straight && this.rng() >= turnChance
            ? straight
            : options[(this.rng() * options.length) | 0];
      }
      en.dx = pick[0];
      en.dy = pick[1];
      en.x += pick[0];
      en.y += pick[1];
    }
  }

  /** Lose a life; game over at 0 (caller short-circuits the frame),
   *  otherwise regenerate the level: same level number, fresh layout. The
   *  player's collected powerup stats (maxBombs/range/speedLevel/score)
   *  persist — only position/bombs/blasts/floor-powerups reset. */
  private killPlayer(): boolean {
    this.lives -= 1;
    if (this.lives <= 0) return true;
    this.generateLevel();
    return false;
  }

  /** Clear the level: score the clear bonus + a time-left bonus, bump the
   *  level counter, then regenerate a fresh (harder) layout. */
  private advanceLevel() {
    this.score +=
      SCORE_LEVEL_CLEAR + Math.floor(this.timeLeftMs / 1000) * TIME_BONUS_PER_S;
    this.level += 1;
    this.generateLevel();
  }

  /** Solidify bombs the player has walked off (cell-exact — the player's
   *  cell simply no longer matches the bomb's), then tick fuses and detonate
   *  any that reach zero. Iterates a snapshot of `this.bombs` because
   *  `detonate` mutates the live array (chain reactions remove bombs
   *  mid-loop) — a bomb already exploded via chaining is skipped rather
   *  than double-detonated. */
  private stepBombs(dt: number) {
    const p = this.player;
    for (const b of this.bombs) {
      if (!b.walkable) continue;
      if (p.x !== b.x || p.y !== b.y) b.walkable = false;
    }
    for (const b of [...this.bombs]) {
      if (!this.bombs.includes(b)) continue; // already gone via chaining
      b.fuseMs -= dt;
      if (b.fuseMs <= 0) this.detonate(b);
    }
  }

  /** Chain-safe, queue-based detonation: a bomb caught in another's blast is
   *  queued rather than exploded twice (`exploded` set), and every arm's
   *  cells collapse into ONE merged blast for the whole chain. */
  private detonate(first: Bomb) {
    const queue = [first];
    const exploded = new Set<Bomb>();
    const blastCells = new Set<number>();
    while (queue.length) {
      const bomb = queue.pop()!;
      if (exploded.has(bomb)) continue;
      exploded.add(bomb);
      blastCells.add(bomb.y * GRID_W + bomb.x);
      for (const [ax, ay] of DIRECTIONS) {
        for (let i = 1; i <= bomb.range; i++) {
          const cx = bomb.x + ax * i;
          const cy = bomb.y + ay * i;
          if (cx < 0 || cy < 0 || cx >= GRID_W || cy >= GRID_H) break;
          const idx = cy * GRID_W + cx;
          if (this.grid[idx] === TILE_PILLAR) break;
          const hitBomb = this.bombs.find(
            (b) => b.x === cx && b.y === cy && !exploded.has(b)
          );
          if (hitBomb) queue.push(hitBomb); // chain — its own cross resolves in-loop
          blastCells.add(idx);
          if (this.grid[idx] === TILE_SOFT) {
            this.destroySoft(idx);
            break; // the arm stops AT the block it broke
          }
          if (this.powerups.has(idx)) {
            this.powerups.delete(idx); // blasts burn exposed pickups
            break;
          }
        }
      }
    }
    this.bombs = this.bombs.filter((b) => !exploded.has(b));
    this.blasts.push({ cells: [...blastCells], ttlMs: BLAST_MS });
  }

  /** Break a soft block: score, maybe drop a powerup. The exit cell is the
   *  ONE exception — revealing it never also drops a pickup. */
  private destroySoft(idx: number) {
    this.grid[idx] = TILE_EMPTY;
    this.score += SCORE_SOFT;
    if (idx === this.exitIndex) {
      this.exitRevealed = true;
      return;
    }
    if (this.rng() < DROP_RATE) {
      const r = this.rng();
      const type: PowerupType =
        r < SKULL_SHARE
          ? "skull"
          : r < SKULL_SHARE + 0.25
            ? "bomb"
            : r < SKULL_SHARE + 0.5
              ? "range"
              : "speed";
      this.powerups.set(idx, type);
    }
  }

  /** Tick blast lifetimes and drop the ones that finished lighting. */
  private stepBlasts(dt: number) {
    for (const b of this.blasts) b.ttlMs -= dt;
    this.blasts = this.blasts.filter((b) => b.ttlMs > 0);
  }

  /** Apply the powerup under the player's cell, if any, deleting it on pickup.
   *  The three positive kinds score `SCORE_PICKUP` and increment a capped
   *  stat; `skull` is a trap — no score, sets a timed debuff instead. */
  private applyPickup() {
    const idx = this.player.y * GRID_W + this.player.x;
    const type = this.powerups.get(idx);
    if (!type) return;
    this.powerups.delete(idx);
    const p = this.player;
    switch (type) {
      case "bomb":
        p.maxBombs = Math.min(6, p.maxBombs + 1);
        this.score += SCORE_PICKUP;
        break;
      case "range":
        p.range = Math.min(6, p.range + 1);
        this.score += SCORE_PICKUP;
        break;
      case "speed":
        p.speedLevel = Math.min(5, p.speedLevel + 1);
        this.score += SCORE_PICKUP;
        break;
      case "skull":
        p.debuff = {
          kind: this.rng() < 0.5 ? "slow" : "shortRange",
          ttlMs: DEBUFF_MS,
        };
        break;
    }
  }

  /** Advance the simulation by `dtMs`: timer (expiry costs a life) → debuff
   *  → bombs → blasts → player movement → pickups → enemy pathing → deaths
   *  (blast-on-enemy scoring, blast-on-player, enemy contact) → exit check.
   *  Frozen once `dead`: further calls return the cached final result
   *  instead of re-simulating. */
  update(dtMs: number): UpdateResult {
    if (this.dead) return this.lastResult!;
    const dt = Math.min(dtMs, DT_CLAMP_MS);

    this.timeLeftMs = Math.max(0, this.timeLeftMs - dt);
    if (this.timeLeftMs <= 0 && this.killPlayer()) return this.finish(true);

    if (this.player.debuff) {
      this.player.debuff.ttlMs -= dt;
      if (this.player.debuff.ttlMs <= 0) this.player.debuff = null;
    }

    this.stepBombs(dt);
    this.stepBlasts(dt);
    this.stepPlayer(dt);
    this.applyPickup();

    for (const en of this.enemies) this.stepEnemy(en, dt);

    const blastCells = new Set<number>();
    for (const b of this.blasts) for (const c of b.cells) blastCells.add(c);

    this.enemies = this.enemies.filter((en) => {
      const idx = en.y * GRID_W + en.x;
      if (!blastCells.has(idx)) return true;
      this.score += SCORE_KILL[en.kind];
      return false;
    });

    // Cell-exact: contact death and the exit both key off an EQUAL cell, not
    // a proximity radius — the discrete grid makes "same cell" the only
    // meaningful notion of collision (see the retune's movement rewrite).
    const p = this.player;
    const playerIdx = p.y * GRID_W + p.x;
    const playerDied =
      blastCells.has(playerIdx) ||
      this.enemies.some((en) => en.x === p.x && en.y === p.y);
    if (playerDied) return this.finish(this.killPlayer());

    if (
      this.exitRevealed &&
      this.enemies.length === 0 &&
      p.x === this.exitIndex % GRID_W &&
      p.y === ((this.exitIndex / GRID_W) | 0)
    ) {
      this.advanceLevel();
    }

    return this.finish(false);
  }

  /** Build the frame's result; on game over, cache it and flip `dead` so
   *  subsequent `update` calls stop simulating and just replay it. */
  private finish(gameOver: boolean): UpdateResult {
    const r = this.result(gameOver);
    if (gameOver) {
      this.dead = true;
      this.lastResult = r;
    }
    return r;
  }

  private result(gameOver: boolean): UpdateResult {
    return {
      gameOver,
      score: this.score,
      level: this.level,
      lives: this.lives,
      timeLeftMs: this.timeLeftMs,
    };
  }

  /** Live-state copies for tests/debug — never hand out the internal
   *  arrays/objects/map (mirrors {@link SnakeClassicEngine.inspect}). */
  inspect(): EngineSnapshot {
    return {
      grid: [...this.grid],
      player: {
        ...this.player,
        debuff: this.player.debuff ? { ...this.player.debuff } : null,
      },
      enemies: this.enemies.map((e) => ({ ...e })),
      bombs: this.bombs.map((b) => ({ ...b })),
      blasts: this.blasts.map((b) => ({ ...b, cells: [...b.cells] })),
      powerups: Array.from(this.powerups, ([index, type]) => ({ index, type })),
      exitIndex: this.exitIndex,
      exitRevealed: this.exitRevealed,
      score: this.score,
      level: this.level,
      lives: this.lives,
      timeLeftMs: this.timeLeftMs,
    };
  }

  // ---------- canvas draw ----------
  //
  // DPR-aware crisp rendering: the hook sizes the backing store = CSS size ×
  // dpr and pre-scales the ctx, so we reason in CSS px; sprite/grid geometry
  // is computed in device px and converted back (÷dpr) so every bit lands on
  // a whole device pixel. Canvas grid = GRID_W × CANVAS_ROWS: row 0 is the
  // HUD strip, arena rows 1..GRID_H live below it — every arena draw call
  // routes its row through {@link arenaY}.

  /** Swap the draw palette — the hook calls this on mount AND on every theme
   *  change; drops the sprite cache so no stale-coloured bitmap survives. */
  setPalette(palette: ShortFusePalette) {
    this.palette = palette;
    this.spriteCache.clear();
  }

  /** The hook resolves `prefersReducedMotion()` and pushes the flag in; the
   *  engine just reads it (no `matchMedia` here — the sim stays DOM-free). */
  setReducedMotion(flag: boolean) {
    this.reducedMotion = flag;
  }

  /** Arena row → canvas row (offsets past the HUD strip). */
  private arenaY(gy: number): number {
    return gy + HUD_ROWS;
  }

  /**
   * Offscreen 1px-per-bit render of a multi-colour pixel-map, cached by
   * `id`. Scaled onto the live canvas via `drawImage` (continuous scale —
   * the same reasoning as {@link SnakeClassicEngine}'s food sprite: a manual
   * per-bit `fillRect` loop needs an INTEGER device-pixel block size, which
   * steps the on-screen size in coarse jumps as that integer crosses a
   * threshold; `drawImage` scales continuously). Returns `null` when the
   * runtime has no 2D canvas context (e.g. jsdom without the optional
   * `canvas` package in tests) — callers skip the paint rather than throw.
   */
  private getSprite(
    id: string,
    map: readonly string[],
    colors: Partial<Record<"0" | "1" | "2" | "3", string>>
  ): HTMLCanvasElement | null {
    const cached = this.spriteCache.get(id);
    if (cached !== undefined) return cached;
    const sw = map[0].length;
    const sh = map.length;
    const off = document.createElement("canvas");
    off.width = sw;
    off.height = sh;
    const octx = off.getContext("2d");
    if (!octx) {
      this.spriteCache.set(id, null);
      return null;
    }
    for (let y = 0; y < sh; y++) {
      const row = map[y];
      for (let x = 0; x < sw; x++) {
        const color = colors[row[x] as "0" | "1" | "2" | "3"];
        if (!color) continue;
        octx.fillStyle = color;
        octx.fillRect(x, y, 1, 1);
      }
    }
    this.spriteCache.set(id, off);
    return off;
  }

  /** Paint a cached sprite (see {@link getSprite}) centred in cell (`atX`,
   *  `atY`), scaled so its bounding box fills `fill` fraction of the cell.
   *  A cache miss (no 2D context) is a silent no-op. */
  private paintSprite(
    ctx: CanvasRenderingContext2D,
    cell: number,
    dpr: number,
    atX: number,
    atY: number,
    id: string,
    map: readonly string[],
    colors: Partial<Record<"0" | "1" | "2" | "3", string>>,
    fill: number
  ) {
    const sprite = this.getSprite(id, map, colors);
    if (!sprite) return;
    const sw = sprite.width;
    const sh = sprite.height;
    const cellDev = cell * dpr;
    const boxDev = cellDev * fill;
    const scale = boxDev / Math.max(sw, sh);
    const wDev = sw * scale;
    const hDev = sh * scale;
    const leftDev = atX * cellDev + (cellDev - wDev) / 2;
    const topDev = atY * cellDev + (cellDev - hDev) / 2;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sprite, leftDev / dpr, topDev / dpr, wDev / dpr, hDev / dpr);
    ctx.imageSmoothingEnabled = true;
  }

  /**
   * Paint one solid square centred in cell (`atX`, `atY`), snapped to the
   * device-pixel grid so the fill stays crisp (no blur) — used for the
   * plain-colour pillar/soft tiles and the blast cross (mirrors
   * {@link SnakeClassicEngine.drawSquare}). `fill` is the square's side as a
   * fraction of the cell; floored to ≥1 device px so it never rounds away.
   */
  private drawSquare(
    ctx: CanvasRenderingContext2D,
    cell: number,
    dpr: number,
    atX: number,
    atY: number,
    color: string,
    fill: number
  ) {
    const cellDev = cell * dpr;
    const sizeDev = Math.max(1, Math.round(fill * cellDev));
    const leftDev = Math.round(atX * cellDev + (cellDev - sizeDev) / 2);
    const topDev = Math.round(atY * cellDev + (cellDev - sizeDev) / 2);
    ctx.fillStyle = color;
    ctx.fillRect(leftDev / dpr, topDev / dpr, sizeDev / dpr, sizeDev / dpr);
  }

  /** Faint interior cell grid PLUS the one HUD/arena separator line (both
   *  are the same 1px `gridLine` rule — the separator is just the arena's
   *  top edge, `i = HUD_ROWS`, so one loop draws both). */
  private drawGrid(ctx: CanvasRenderingContext2D, cssW: number, cssH: number) {
    const cell = cssW / GRID_W;
    ctx.strokeStyle = this.palette.gridLine;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < GRID_W; i++) {
      const p = Math.round(i * cell) + 0.5;
      ctx.moveTo(p, HUD_ROWS * cell);
      ctx.lineTo(p, cssH);
    }
    for (let i = HUD_ROWS; i < CANVAS_ROWS; i++) {
      const p = Math.round(i * cell) + 0.5;
      ctx.moveTo(0, p);
      ctx.lineTo(cssW, p);
    }
    ctx.stroke();
  }

  /** 2px board-edge frame, drawn LAST so it never sits under the HUD text or
   *  any entity. */
  private drawFrame(ctx: CanvasRenderingContext2D, cssW: number, cssH: number) {
    ctx.strokeStyle = this.palette.frameLine;
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, cssW - 2, cssH - 2);
  }

  private drawExit(ctx: CanvasRenderingContext2D, cell: number, dpr: number) {
    const x = this.exitIndex % GRID_W;
    const y = (this.exitIndex / GRID_W) | 0;
    // "Open" = every enemy on the level is down — the same condition
    // `update()` checks before it lets the player walk through.
    const open = this.enemies.length === 0;
    this.paintSprite(
      ctx,
      cell,
      dpr,
      x,
      this.arenaY(y),
      open ? "exit-open" : "exit-closed",
      open ? EXIT_OPEN_SPRITE : EXIT_CLOSED_SPRITE,
      { "1": this.palette.accent },
      EXIT_FILL
    );
  }

  private drawPowerups(
    ctx: CanvasRenderingContext2D,
    cell: number,
    dpr: number
  ) {
    for (const [idx, type] of this.powerups) {
      const x = idx % GRID_W;
      const y = (idx / GRID_W) | 0;
      const colors =
        type === "skull"
          ? { "1": this.palette.spark, "0": this.palette.boardBg }
          : { "1": this.palette.accent };
      this.paintSprite(
        ctx,
        cell,
        dpr,
        x,
        this.arenaY(y),
        `powerup-${type}`,
        POWERUP_SPRITES[type],
        colors,
        POWERUP_FILL
      );
    }
  }

  /** Solid-fill tiles for one {@link Tile} kind — `TILE_SOFT` and
   *  `TILE_PILLAR` are drawn in two separate passes (soft first) so soft
   *  blocks always paint under/over consistently with the brief's draw
   *  order; there is no adjacency case where the two overlap. */
  private drawTiles(
    ctx: CanvasRenderingContext2D,
    cell: number,
    dpr: number,
    kind: Tile,
    color: string
  ) {
    for (let i = 0; i < this.grid.length; i++) {
      if (this.grid[i] !== kind) continue;
      const x = i % GRID_W;
      const y = (i / GRID_W) | 0;
      this.drawSquare(ctx, cell, dpr, x, this.arenaY(y), color, TILE_FILL);
    }
  }

  private drawBomb(
    ctx: CanvasRenderingContext2D,
    cell: number,
    dpr: number,
    b: Bomb
  ) {
    // Blink derived from the bomb's OWN sim-time fuse, never wall clock —
    // deterministic and immune to a throttled/background tab.
    const elapsed = FUSE_MS - b.fuseMs;
    const sparkOn =
      this.reducedMotion || Math.floor(elapsed / BOMB_BLINK_MS) % 2 === 0;
    const colors: Partial<Record<"0" | "1" | "2" | "3", string>> = {
      "1": this.palette.player,
    };
    if (sparkOn) colors["3"] = this.palette.spark;
    this.paintSprite(
      ctx,
      cell,
      dpr,
      b.x,
      this.arenaY(b.y),
      sparkOn ? "bomb-on" : "bomb-off",
      BOMB_SPRITE,
      colors,
      BOMB_FILL
    );
  }

  /** Hollow-cross blast cell: an `accent` fill with a smaller `boardBg`
   *  knockout on top. The outer fill is full for the opening stretch, then
   *  shrinks toward the knockout's own fill over the closing stretch (the
   *  cross visually "closes up" as the blast dies) — a static single fill
   *  under {@link reducedMotion}. */
  private drawBlast(
    ctx: CanvasRenderingContext2D,
    cell: number,
    dpr: number,
    blast: Blast
  ) {
    const outerFill = this.reducedMotion
      ? BLAST_FILL_FULL
      : blast.ttlMs > BLAST_SHRINK_MS
        ? BLAST_FILL_FULL
        : BLAST_FILL_MIN +
          (BLAST_FILL_FULL - BLAST_FILL_MIN) * (blast.ttlMs / BLAST_SHRINK_MS);
    for (const idx of blast.cells) {
      const x = idx % GRID_W;
      const ay = this.arenaY((idx / GRID_W) | 0);
      this.drawSquare(ctx, cell, dpr, x, ay, this.palette.accent, outerFill);
      this.drawSquare(
        ctx,
        cell,
        dpr,
        x,
        ay,
        this.palette.boardBg,
        BLAST_INNER_FILL
      );
    }
  }

  private drawEnemy(
    ctx: CanvasRenderingContext2D,
    cell: number,
    dpr: number,
    en: Enemy
  ) {
    const body =
      en.kind === "wanderer"
        ? this.palette.soft
        : en.kind === "chaser"
          ? this.palette.player
          : this.palette.spark;
    this.paintSprite(
      ctx,
      cell,
      dpr,
      en.x,
      this.arenaY(en.y),
      `enemy-${en.kind}`,
      ENEMY_SPRITES[en.kind],
      { "1": body, "0": this.palette.boardBg },
      ENEMY_FILL
    );
  }

  private drawPlayer(ctx: CanvasRenderingContext2D, cell: number, dpr: number) {
    const p = this.player;
    // The belly band is the ONE debuff signal: accent while clean, spark
    // while a skull debuff is live.
    const band = p.debuff ? this.palette.spark : this.palette.accent;
    this.paintSprite(
      ctx,
      cell,
      dpr,
      p.x,
      this.arenaY(p.y),
      p.debuff ? "fyze-debuff" : "fyze-normal",
      FYZE_SPRITE,
      {
        "1": this.palette.player,
        "2": band,
        "3": this.palette.spark,
        "0": this.palette.boardBg,
      },
      FYZE_FILL
    );
  }

  /** Row 0: lives (left, small spark squares) · `LVL {n}` (centre, muted) ·
   *  `m:ss` timer (right, hudText — flips to spark under 30s left). */
  private drawHud(ctx: CanvasRenderingContext2D, cssW: number, cell: number) {
    const midY = cell / 2;
    const fontPx = 11 * (cell / 20);
    ctx.font = `bold ${fontPx}px ${HUD_FONT}`;
    ctx.textBaseline = "middle";

    const padX = cell * 0.3;
    const iconSize = cell * 0.34;
    const iconGap = cell * 0.18;
    ctx.fillStyle = this.palette.spark;
    for (let i = 0; i < this.lives; i++) {
      const x = Math.round(padX + i * (iconSize + iconGap));
      const y = Math.round(midY - iconSize / 2);
      ctx.fillRect(x, y, Math.round(iconSize), Math.round(iconSize));
    }

    ctx.fillStyle = this.palette.muted;
    ctx.textAlign = "center";
    ctx.fillText(`LVL ${this.level}`, cssW / 2, midY);

    const totalS = Math.max(0, Math.ceil(this.timeLeftMs / 1000));
    const m = Math.floor(totalS / 60);
    const s = totalS % 60;
    ctx.fillStyle =
      this.timeLeftMs < HUD_LOW_TIME_MS
        ? this.palette.spark
        : this.palette.hudText;
    ctx.textAlign = "right";
    ctx.fillText(`${m}:${s.toString().padStart(2, "0")}`, cssW - padX, midY);

    ctx.textAlign = "left"; // don't leak alignment state to any later draw call
  }

  /** Opaque field + grid + frame, no HUD/entities — the menu/pause overlay
   *  paints on top (mirrors {@link SnakeClassicEngine.drawIdle}). Also what
   *  a freshly-constructed engine renders before the hook's first
   *  `reset()`/`start()` — safe because the constructor already seeded a
   *  full level (see the class doc). */
  drawIdle(ctx: CanvasRenderingContext2D, cssW: number, cssH: number) {
    ctx.fillStyle = this.palette.boardBg;
    ctx.fillRect(0, 0, cssW, cssH);
    this.drawGrid(ctx, cssW, cssH);
    this.drawFrame(ctx, cssW, cssH);
  }

  /** Draw order: bg → grid → exit (if revealed) → powerups → soft → pillars
   *  → bombs → blasts → enemies → player → HUD → frame. */
  drawGame(
    ctx: CanvasRenderingContext2D,
    cssW: number,
    cssH: number,
    dpr: number
  ) {
    const cell = cssW / GRID_W;

    ctx.fillStyle = this.palette.boardBg;
    ctx.fillRect(0, 0, cssW, cssH);
    this.drawGrid(ctx, cssW, cssH);

    if (this.exitRevealed) this.drawExit(ctx, cell, dpr);
    this.drawPowerups(ctx, cell, dpr);
    this.drawTiles(ctx, cell, dpr, TILE_SOFT, this.palette.soft);
    this.drawTiles(ctx, cell, dpr, TILE_PILLAR, this.palette.pillar);

    for (const b of this.bombs) this.drawBomb(ctx, cell, dpr, b);
    for (const blast of this.blasts) this.drawBlast(ctx, cell, dpr, blast);
    for (const en of this.enemies) this.drawEnemy(ctx, cell, dpr, en);
    this.drawPlayer(ctx, cell, dpr);

    this.drawHud(ctx, cssW, cell);
    this.drawFrame(ctx, cssW, cssH);
  }

  // ---------- test hooks ----------

  debugGrid(): Tile[] {
    return [...this.grid];
  }

  debugSetTile(x: number, y: number, kind: Tile) {
    this.grid[y * GRID_W + x] = kind;
  }

  debugPlacePlayer(x: number, y: number) {
    this.player.x = x;
    this.player.y = y;
  }

  debugClearEnemies() {
    this.enemies = [];
  }

  debugSpawnEnemy(kind: EnemyKind, x: number, y: number) {
    this.enemies.push(this.makeEnemy(kind, x, y));
  }

  /** Place a bomb directly, bypassing `placeBomb`'s occupancy/cap checks. */
  debugPlaceBomb(x: number, y: number, range = this.player.range) {
    this.bombs.push(this.makeBomb(x, y, range));
  }

  /** Force a bomb's remaining fuse (used to pin/skip detonation timing). */
  debugFuse(x: number, y: number, ms: number) {
    const b = this.bombs.find((bomb) => bomb.x === x && bomb.y === y);
    if (b) b.fuseMs = ms;
  }

  debugPlacePowerup(x: number, y: number, type: PowerupType) {
    this.powerups.set(y * GRID_W + x, type);
  }

  /** Pin the level countdown (used to force/avoid timer-expiry death and to
   *  pin the exit's time bonus in tests). */
  debugSetTimeLeft(ms: number) {
    this.timeLeftMs = ms;
  }

  /** Reveal the exit and clear its tile to floor, bypassing the "destroy the
   *  soft block that hides it" path. */
  debugRevealExit() {
    this.grid[this.exitIndex] = TILE_EMPTY;
    this.exitRevealed = true;
  }
}
