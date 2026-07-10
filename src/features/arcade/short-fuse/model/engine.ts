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
  x: number; // cell coords (float, center-based)
  y: number;
  dx: -1 | 0 | 1;
  dy: -1 | 0 | 1;
  speed: number;
}

interface PlayerState {
  x: number; // cell coords (float, center-based)
  y: number;
  maxBombs: number;
  range: number;
  speedLevel: number; // 0-based, speed = base + step*level capped
  debuff: { kind: "slow" | "shortRange"; ttlMs: number } | null;
}

/** Theme-native draw colours for the canvas renderer (Task 6), resolved from
 *  the live `--m-*` tokens the same way {@link SnakeClassicPalette} is — kept
 *  here as a placeholder shape so downstream tasks have a stable name to
 *  extend/import; no consumer wires this yet. */
export interface ShortFusePalette {
  /** Field fill ← `--m-bg`. */
  boardBg: string;
  /** Faint cell grid ← `--m-fg` at a low alpha. */
  gridLine: string;
  /** Indestructible pillar tile ← `--m-dim`. */
  pillar: string;
  /** Destructible soft-block tile ← `--m-line`. */
  soft: string;
  /** Player glyph ← `--m-accent`. */
  player: string;
  /** Per-kind enemy glyph colour. */
  enemy: Record<EnemyKind, string>;
  /** Armed bomb ← `--m-fg`. */
  bomb: string;
  /** Blast/explosion cell ← `--m-error`. */
  blast: string;
  /** Revealed exit tile ← `--m-accent`. */
  exit: string;
  /** HUD strip text ← `--m-muted`. */
  hudText: string;
}

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
 * state, bombs/blasts, scoring; no React. `rng` is injectable so tests get
 * deterministic level generation. Movement/bombs/enemies land in Tasks 3–5;
 * this task ships constants, level generation, reset/inspect, and the
 * `debug*` test hooks.
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

  constructor(private rng: () => number = Math.random) {}

  private basePlayer(): PlayerState {
    return { x: 0, y: 0, maxBombs: 1, range: 1, speedLevel: 0, debuff: null };
  }

  /** Fresh RUN: level 1, base powerups, full lives, score 0. */
  reset() {
    this.score = 0;
    this.level = 1;
    this.lives = INITIAL_LIVES;
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
    return { kind, x, y, dx: 0, dy: 0, speed: this.enemySpeed(kind) };
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
}
