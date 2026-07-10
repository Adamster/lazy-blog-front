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

/** Base player speed (cells/second) before speed-powerup levels. */
const PLAYER_SPEED_BASE = 4.5;
/** Speed gained per `speed` powerup pickup (cells/second). */
const PLAYER_SPEED_STEP = 0.5;
/** Max player speed regardless of stacked powerups (cells/second). */
const PLAYER_SPEED_CAP = 7;
/** Player collision half-size (cell units) — square body of side 2×radius. */
export const PLAYER_RADIUS = 0.38;
/** Perpendicular-offset window (cell units) within which a blocked forward
 *  move gets redirected into the open diagonal lane instead of stopping.
 *  At 0.5 it spans the whole half-lane: any offset toward an open diagonal
 *  redirects (|off| ≤ 0.5 by construction, so the gate reduces to the
 *  epsilon + open-diagonal checks — the named const stays for readability). */
const ASSIST = 0.5;
/** Per-`update()` dt ceiling (ms) — guards against huge dt after a tab stall. */
const DT_CLAMP_MS = 50;

/** Ease `v` toward `target`, moving at most `maxDelta`. */
function approach(v: number, target: number, maxDelta: number): number {
  if (v < target) return Math.min(target, v + maxDelta);
  if (v > target) return Math.max(target, v - maxDelta);
  return v;
}

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
    const x = Math.round(this.player.x);
    const y = Math.round(this.player.y);
    if (this.bombs.some((b) => b.x === x && b.y === y)) return;
    if (this.bombs.length >= this.player.maxBombs) return;
    const range =
      this.player.debuff?.kind === "shortRange" ? 1 : this.player.range;
    this.bombs.push({ x, y, fuseMs: FUSE_MS, range, walkable: true });
  }

  /** Solid FOR THE PLAYER at cell (cx,cy)? Bombs solidify after the player
   *  leaves their cell (Task 4 sets `walkable` false on exit). */
  private solidForPlayer(cx: number, cy: number): boolean {
    if (cx < 0 || cy < 0 || cx >= GRID_W || cy >= GRID_H) return true;
    const t = this.grid[cy * GRID_W + cx];
    if (t !== TILE_EMPTY) return true;
    return this.bombs.some((b) => b.x === cx && b.y === cy && !b.walkable);
  }

  /** Move the player along the held axis with lane-centering + corner assist. */
  private stepPlayer(dtS: number) {
    const speedMul = this.player.debuff?.kind === "slow" ? 0.6 : 1;
    const speed =
      Math.min(
        PLAYER_SPEED_CAP,
        PLAYER_SPEED_BASE + this.player.speedLevel * PLAYER_SPEED_STEP
      ) * speedMul;
    const dist = speed * dtS;
    const p = this.player;
    const dx = this.moveX;
    const dy = this.moveX !== 0 ? 0 : this.moveY; // one axis; X wins ties
    if (dx === 0 && dy === 0) return;

    const axis: "x" | "y" = dx !== 0 ? "x" : "y";
    const dir = axis === "x" ? dx : dy;

    // 1. decide blockage FIRST (before any perpendicular motion), so
    //    lane-centering never competes with the corner assist on a blocked
    //    frame — they'd cancel each other out and freeze the player.
    const perp = axis === "x" ? p.y : p.x;
    const lane = Math.round(perp);
    const fwd = axis === "x" ? p.x : p.y;
    const next = fwd + dir * dist;
    // leading edge enters the next cell once it crosses that cell's near face.
    const targetCell = Math.round(fwd) + dir;
    const enters =
      dir > 0
        ? next + PLAYER_RADIUS > targetCell - 0.5
        : next - PLAYER_RADIUS < targetCell + 0.5;
    const blocked =
      enters &&
      (axis === "x"
        ? this.solidForPlayer(targetCell, lane)
        : this.solidForPlayer(lane, targetCell));

    // 2. unblocked frame → normal path: lane-center + advance.
    if (!blocked) {
      if (axis === "x") {
        p.y = approach(p.y, lane, dist);
        p.x = next;
      } else {
        p.x = approach(p.x, lane, dist);
        p.y = next;
      }
      return;
    }

    // 3. blocked frame → clamp flush to the wall face…
    const face = targetCell - dir * 0.5;
    const limit = face - dir * PLAYER_RADIUS;
    const clamped = dir > 0 ? Math.min(next, limit) : Math.max(next, limit);
    if (axis === "x") p.x = clamped;
    else p.y = clamped;

    // 4. …then corner assist is the ONLY perpendicular motion this frame: if
    //    drifted toward an open neighboring lane, slide that way. Once perp
    //    crosses the half-cell mark the lane flips and step 2 takes over.
    const off = perp - lane;
    const side = off > 0 ? 1 : -1;
    if (Math.abs(off) > 0.01 && Math.abs(off) <= ASSIST) {
      const nLane = lane + side;
      const open =
        axis === "x"
          ? !this.solidForPlayer(targetCell, nLane)
          : !this.solidForPlayer(nLane, targetCell);
      if (open) {
        if (axis === "x") p.y = approach(p.y, nLane, dist);
        else p.x = approach(p.x, nLane, dist);
        return;
      }
    }

    // 5. blocked without assist (centered, or diagonal closed) → plain
    //    lane-centering keeps the body flush-aligned; nothing competes.
    if (axis === "x") p.y = approach(p.y, lane, dist);
    else p.x = approach(p.x, lane, dist);
  }

  /** Solidify bombs the player has walked off, then tick fuses and detonate
   *  any that reach zero. Iterates a snapshot of `this.bombs` because
   *  `detonate` mutates the live array (chain reactions remove bombs
   *  mid-loop) — a bomb already exploded via chaining is skipped rather
   *  than double-detonated. */
  private stepBombs(dt: number) {
    const p = this.player;
    for (const b of this.bombs) {
      if (!b.walkable) continue;
      const overlap =
        Math.abs(p.x - b.x) < 0.5 + PLAYER_RADIUS &&
        Math.abs(p.y - b.y) < 0.5 + PLAYER_RADIUS;
      if (!overlap) b.walkable = false;
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
      for (const [ax, ay] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ] as const) {
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
    const idx = Math.round(this.player.y) * GRID_W + Math.round(this.player.x);
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

  /** Advance the simulation by `dtMs` — timer, debuff, bombs/blasts,
   *  movement and pickups this task; enemies and death land in Task 5. */
  update(dtMs: number): UpdateResult {
    const dt = Math.min(dtMs, DT_CLAMP_MS);
    const dtS = dt / 1000;
    this.timeLeftMs = Math.max(0, this.timeLeftMs - dt);
    if (this.player.debuff) {
      this.player.debuff.ttlMs -= dt;
      if (this.player.debuff.ttlMs <= 0) this.player.debuff = null;
    }
    this.stepBombs(dt);
    this.stepBlasts(dt);
    this.stepPlayer(dtS);
    this.applyPickup();
    // Task 5 adds: enemies, deaths (incl. standing on a live blast), timer death
    return this.result(false);
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
    this.bombs.push({ x, y, fuseMs: FUSE_MS, range, walkable: true });
  }

  /** Force a bomb's remaining fuse (used to pin/skip detonation timing). */
  debugFuse(x: number, y: number, ms: number) {
    const b = this.bombs.find((bomb) => bomb.x === x && bomb.y === y);
    if (b) b.fuseMs = ms;
  }

  debugPlacePowerup(x: number, y: number, type: PowerupType) {
    this.powerups.set(y * GRID_W + x, type);
  }
}
