import { describe, expect, it } from "vitest";
import {
  DEBUFF_MS,
  FUSE_MS,
  GRID_H,
  GRID_W,
  INITIAL_LIVES,
  PLAYER_RADIUS,
  SCORE_PICKUP,
  ShortFuseEngine,
  TILE_EMPTY,
  TILE_PILLAR,
  TILE_SOFT,
} from "./engine";

function fresh(rng: () => number = mulberry(42)) {
  const e = new ShortFuseEngine(rng);
  e.reset();
  return e;
}

/** Drive the engine in 16ms frames (update clamps dt; big single calls are unreal). */
function advance(e: ShortFuseEngine, ms: number) {
  for (let t = 0; t < ms; t += 16) e.update(16);
}

/** Deterministic seeded rng for reproducible generation. */
function mulberry(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("ShortFuseEngine — level generation", () => {
  it("places pillars at every odd,odd cell and nowhere else", () => {
    const e = fresh();
    const s = e.inspect();
    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        const t = s.grid[y * GRID_W + x];
        if (x % 2 === 1 && y % 2 === 1) expect(t).toBe(TILE_PILLAR);
        else expect(t).not.toBe(TILE_PILLAR);
      }
    }
  });

  it("keeps the spawn pocket clear: (0,0) (1,0) (0,1) are empty", () => {
    const s = fresh().inspect();
    expect(s.grid[0]).toBe(TILE_EMPTY);
    expect(s.grid[1]).toBe(TILE_EMPTY);
    expect(s.grid[GRID_W]).toBe(TILE_EMPTY);
  });

  it("spawns the player at cell (0,0) with base stats and full lives", () => {
    const s = fresh().inspect();
    expect(Math.round(s.player.x)).toBe(0);
    expect(Math.round(s.player.y)).toBe(0);
    expect(s.lives).toBe(INITIAL_LIVES);
    expect(s.level).toBe(1);
    expect(s.score).toBe(0);
    expect(s.player.maxBombs).toBe(1);
    expect(s.player.range).toBe(1);
  });

  it("generates a reasonable soft-block count and hides the exit under one", () => {
    const s = fresh().inspect();
    const softs = s.grid.filter((t) => t === TILE_SOFT).length;
    expect(softs).toBeGreaterThanOrEqual(15);
    expect(s.grid[s.exitIndex]).toBe(TILE_SOFT);
    expect(s.exitRevealed).toBe(false);
  });

  it("spawns level-1 enemies on empty cells, all at distance ≥ 6 from spawn", () => {
    const s = fresh().inspect();
    expect(s.enemies.length).toBeGreaterThanOrEqual(3);
    for (const en of s.enemies) {
      const cx = Math.round(en.x);
      const cy = Math.round(en.y);
      expect(s.grid[cy * GRID_W + cx]).toBe(TILE_EMPTY);
      expect(cx + cy).toBeGreaterThanOrEqual(6);
    }
  });

  it("is deterministic under a seeded rng", () => {
    const a = new ShortFuseEngine(mulberry(7));
    const b = new ShortFuseEngine(mulberry(7));
    a.reset();
    b.reset();
    expect(a.inspect().grid).toEqual(b.inspect().grid);
  });
});

describe("ShortFuseEngine — movement", () => {
  it("moves right at player speed on held input", () => {
    const e = fresh();
    e.debugClearEnemies();
    // clear a runway so procedurally-generated soft blocks can't interfere.
    for (let x = 1; x <= 5; x++) e.debugSetTile(x, 0, TILE_EMPTY);
    e.setMove(1, 0);
    advance(e, 500);
    const p = e.inspect().player;
    // 500ms of 16ms frames = 32 update calls; base speed 4.5 cells/s, unobstructed.
    const expectedDist = 4.5 * ((Math.ceil(500 / 16) * 16) / 1000);
    expect(p.x).toBeCloseTo(expectedDist, 5);
    expect(p.y).toBeCloseTo(0, 5);
  });

  it("stops at a soft block edge", () => {
    const e = fresh();
    e.debugClearEnemies();
    e.debugSetTile(1, 0, TILE_SOFT);
    e.setMove(1, 0);
    advance(e, 2000);
    const p = e.inspect().player;
    // blocked: player center clamps flush to the wall face (cell 1's left edge minus radius).
    expect(p.x).toBeCloseTo(0.5 - PLAYER_RADIUS, 5);
  });

  it("lane-centers the perpendicular axis while moving", () => {
    const e = fresh();
    e.debugClearEnemies();
    e.debugSetTile(1, 0, TILE_EMPTY);
    e.debugSetTile(2, 0, TILE_EMPTY);
    e.debugPlacePlayer(0, 0.3); // off lane center
    e.setMove(1, 0);
    advance(e, 600);
    expect(Math.abs(e.inspect().player.y)).toBeLessThan(0.05);
  });

  it("corner-assists around a blocking cell when nearly aligned with the open lane", () => {
    const e = fresh();
    e.debugClearEnemies();
    e.debugSetTile(1, 0, TILE_SOFT); // forward cell solid
    e.debugSetTile(1, 1, TILE_EMPTY); // diagonal near-side lane open
    e.debugPlacePlayer(0, 0.4); // near lane y=0, drifted toward y=1
    e.setMove(1, 0);
    advance(e, 500);
    const p = e.inspect().player;
    // assist redirected motion past the half-cell mark — the lane flipped to y=1.
    expect(p.y).toBeGreaterThan(0.5);
  });

  it("ticks the level timer down during update", () => {
    const e = fresh();
    e.debugClearEnemies();
    const before = e.inspect().timeLeftMs;
    advance(e, 500);
    expect(e.inspect().timeLeftMs).toBeLessThan(before);
  });
});

describe("ShortFuseEngine — bombs & blasts", () => {
  it("plants a bomb at the player's cell, capped by maxBombs", () => {
    const e = fresh();
    e.debugClearEnemies();
    e.placeBomb();
    expect(e.inspect().bombs.length).toBe(1);
    e.placeBomb(); // rejected: default maxBombs is 1 (also same-cell)
    expect(e.inspect().bombs.length).toBe(1);
    const b = e.inspect().bombs[0];
    expect(b.x).toBe(0);
    expect(b.y).toBe(0);
  });

  it("bomb becomes solid after the player walks off it", () => {
    const e = fresh();
    e.debugClearEnemies();
    for (let x = 0; x <= 3; x++) e.debugSetTile(x, 0, TILE_EMPTY);
    e.debugPlacePlayer(0, 0);
    e.placeBomb();
    e.setMove(1, 0);
    advance(e, 320); // moves well clear of the bomb's body radius
    expect(e.inspect().bombs[0].walkable).toBe(false);
    e.setMove(-1, 0);
    advance(e, 200); // walk back toward (0,0); should be blocked by the solid bomb
    const p = e.inspect().player;
    expect(p.x).toBeCloseTo(0.5 + PLAYER_RADIUS, 5);
  });

  it("detonates after FUSE_MS and the cross stops at pillars", () => {
    const e = fresh();
    e.debugClearEnemies();
    for (let x = 0; x <= 4; x++) e.debugSetTile(x, 0, TILE_EMPTY);
    e.debugPlaceBomb(1, 0, 3); // (1,1) is a pillar — the down arm must stop dead
    advance(e, FUSE_MS + 16);
    const s = e.inspect();
    expect(s.bombs.length).toBe(0);
    expect(s.blasts.length).toBe(1);
    const cells = new Set(s.blasts[0].cells);
    expect(cells.has(0 * GRID_W + 1)).toBe(true); // bomb's own cell
    expect(cells.has(0 * GRID_W + 2)).toBe(true);
    expect(cells.has(0 * GRID_W + 3)).toBe(true);
    expect(cells.has(0 * GRID_W + 4)).toBe(true); // right arm reaches full range
    expect(cells.has(1 * GRID_W + 1)).toBe(false); // the pillar cell itself, excluded
    expect(cells.has(2 * GRID_W + 1)).toBe(false); // beyond the pillar — arm never got there
    expect(s.grid[1 * GRID_W + 1]).toBe(TILE_PILLAR); // pillar survives the blast
  });

  it("destroys the first soft block per arm and stops there", () => {
    const e = fresh();
    e.debugClearEnemies();
    for (let x = 0; x <= 5; x++) e.debugSetTile(x, 0, TILE_EMPTY);
    e.debugSetTile(4, 0, TILE_SOFT);
    e.debugSetTile(5, 0, TILE_SOFT);
    e.debugPlaceBomb(2, 0, 3);
    advance(e, FUSE_MS + 16);
    const grid = e.debugGrid();
    expect(grid[4]).toBe(TILE_EMPTY); // broken
    expect(grid[5]).toBe(TILE_SOFT); // the arm stopped at the block it broke
  });

  it("chains other bombs in the blast", () => {
    const e = fresh();
    e.debugClearEnemies();
    for (let x = 0; x <= 5; x++) e.debugSetTile(x, 0, TILE_EMPTY);
    e.debugPlaceBomb(1, 0, 2);
    e.debugPlaceBomb(3, 0, 2);
    e.debugFuse(3, 0, 10_000); // long fuse — must be chain-detonated, not tick out itself
    advance(e, FUSE_MS + 16);
    const s = e.inspect();
    expect(s.bombs.length).toBe(0);
    expect(s.blasts.length).toBe(1); // one merged blast for the whole chain
    const cells = new Set(s.blasts[0].cells);
    expect(cells.has(0 * GRID_W + 5)).toBe(true); // second bomb's own range extends the arm
  });

  it("reveals the exit when its block is destroyed", () => {
    const e = fresh();
    e.debugClearEnemies();
    const s0 = e.inspect();
    const ex = s0.exitIndex % GRID_W;
    const ey = (s0.exitIndex / GRID_W) | 0;
    const bx = ex > 0 ? ex - 1 : ex + 1; // adjacent cell so a single-range blast hits the exit
    e.debugPlaceBomb(bx, ey, 1);
    advance(e, FUSE_MS + 16);
    expect(e.inspect().exitRevealed).toBe(true);
  });

  it("drops a powerup at DROP_RATE and burns exposed powerups in a later blast", () => {
    const e = fresh(() => 0.0); // forces the drop-rate roll and the skull branch
    e.debugClearEnemies();
    for (let x = 0; x <= 5; x++) e.debugSetTile(x, 0, TILE_EMPTY);
    e.debugSetTile(3, 0, TILE_SOFT);
    e.debugPlaceBomb(1, 0, 2);
    advance(e, FUSE_MS + 16);
    expect(e.inspect().powerups).toEqual([{ index: 3, type: "skull" }]);
    e.debugPlaceBomb(1, 0, 2); // second blast arm passes over the pickup cell
    advance(e, FUSE_MS + 16);
    expect(e.inspect().powerups.length).toBe(0);
  });

  it("applies pickups: bomb/range/speed increment, skull sets a timed debuff", () => {
    const e = fresh();
    e.debugClearEnemies();

    e.debugPlacePlayer(0, 0);
    e.debugPlacePowerup(0, 0, "bomb");
    advance(e, 16);
    expect(e.inspect().player.maxBombs).toBe(2);
    expect(e.inspect().score).toBe(SCORE_PICKUP);

    e.debugPlacePlayer(1, 0);
    e.debugPlacePowerup(1, 0, "range");
    advance(e, 16);
    expect(e.inspect().player.range).toBe(2);

    e.debugPlacePlayer(0, 1);
    e.debugPlacePowerup(0, 1, "speed");
    advance(e, 16);
    expect(e.inspect().player.speedLevel).toBe(1);

    e.debugPlacePlayer(2, 0);
    e.debugPlacePowerup(2, 0, "skull");
    advance(e, 16);
    const debuff = e.inspect().player.debuff;
    expect(debuff).not.toBeNull();
    expect(["slow", "shortRange"]).toContain(debuff?.kind);
    expect(debuff?.ttlMs).toBe(DEBUFF_MS);

    advance(e, DEBUFF_MS + 16);
    expect(e.inspect().player.debuff).toBeNull();
  });
});
