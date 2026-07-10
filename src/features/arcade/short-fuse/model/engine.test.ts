import { describe, expect, it } from "vitest";
import {
  GRID_H,
  GRID_W,
  INITIAL_LIVES,
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
