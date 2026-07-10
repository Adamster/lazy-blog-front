import { describe, expect, it } from "vitest";
import type { UpdateResult } from "./engine";
import {
  DEBUFF_MS,
  FUSE_MS,
  GRID_H,
  GRID_W,
  INITIAL_LIVES,
  LEVEL_TIME_MS,
  PLAYER_STEP_MS,
  SCORE_KILL,
  SCORE_LEVEL_CLEAR,
  SCORE_PICKUP,
  ShortFuseEngine,
  TILE_EMPTY,
  TILE_PILLAR,
  TILE_SOFT,
  TIME_BONUS_PER_S,
} from "./engine";

function fresh(rng: () => number = mulberry(42)) {
  // The constructor already reset()s ("constructible = drawable") — an extra
  // reset here would burn a level's worth of rng draws and shift the seed map.
  return new ShortFuseEngine(rng);
}

/** Drive the engine in 16ms frames (update clamps dt; big single calls are unreal). */
function advance(e: ShortFuseEngine, ms: number) {
  for (let t = 0; t < ms; t += 16) e.update(16);
}

/** Mirrors the engine's own hop-accumulator math (an immediate first hop the
 *  frame a direction goes from none→held, then one hop every `stepMs` while
 *  it stays held) over the SAME 16ms-frame loop {@link advance} drives, so a
 *  test can assert an exact expected cell count instead of hand-counting
 *  frames. Any drift between this and `ShortFuseEngine`'s private
 *  `stepPlayer` would show up as a test failure, not silently pass. */
function expectedHops(totalMs: number, stepMs: number, frameMs = 16): number {
  let hops = 0;
  let hopMs = 0;
  let held = false;
  for (let t = 0; t < totalMs; t += frameMs) {
    if (!held) {
      held = true;
      hopMs = stepMs;
      hops++;
      continue;
    }
    hopMs -= frameMs;
    while (hopMs <= 0) {
      hops++;
      hopMs += stepMs;
    }
  }
  return hops;
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

/** A ctx stub whose every property/method access resolves to a no-op — the
 *  stay-awake lesson: enough to prove the draw call graph never throws
 *  without a real `<canvas>` 2D context. */
function stubCtx(): CanvasRenderingContext2D {
  const noop = () => {};
  return new Proxy(
    {},
    { get: () => noop, set: () => true }
  ) as unknown as CanvasRenderingContext2D;
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

describe("ShortFuseEngine — movement (discrete cell-hop)", () => {
  it("hops one cell per step interval while held, firing the first hop immediately", () => {
    const e = fresh();
    e.debugClearEnemies();
    // clear a runway so procedurally-generated soft blocks can't interfere.
    for (let x = 1; x <= 8; x++) e.debugSetTile(x, 0, TILE_EMPTY);
    e.setMove(1, 0);
    const totalMs = 1000;
    advance(e, totalMs);
    const p = e.inspect().player;
    expect(p.x).toBe(expectedHops(totalMs, PLAYER_STEP_MS));
    expect(p.y).toBe(0);
  });

  it("rejects a hop whose target cell is solid — the player stays put", () => {
    const e = fresh();
    e.debugClearEnemies();
    e.debugSetTile(1, 0, TILE_SOFT);
    e.setMove(1, 0);
    advance(e, 2000); // many step intervals' worth of held input against the wall
    const p = e.inspect().player;
    expect(p.x).toBe(0);
    expect(p.y).toBe(0);
  });

  it("applies a direction change on the NEXT scheduled hop, not immediately", () => {
    const e = fresh();
    e.debugClearEnemies();
    for (let x = 1; x <= 3; x++) e.debugSetTile(x, 0, TILE_EMPTY);
    e.debugSetTile(1, 1, TILE_EMPTY); // (1,1) is a pillar by default (odd,odd) — clear the down-hop target

    e.setMove(1, 0);
    e.update(16); // fresh press: immediate hop (0,0) -> (1,0)
    expect(e.inspect().player.x).toBe(1);

    e.setMove(0, 1); // change direction mid-hold — must NOT hop immediately
    e.update(16);
    const mid = e.inspect().player;
    expect(mid.x).toBe(1);
    expect(mid.y).toBe(0); // the new direction hasn't taken effect yet

    advance(e, PLAYER_STEP_MS); // let the already-scheduled hop fire
    const after = e.inspect().player;
    expect(after.x).toBe(1); // no further rightward hop
    expect(after.y).toBe(1); // the scheduled hop used the NEW held direction
  });

  it("a slow debuff stretches the hop interval by the slow multiplier", () => {
    const e = fresh(() => 0.4); // < 0.5 -> the "slow" debuff kind on pickup
    e.debugClearEnemies();
    for (let x = 1; x <= 8; x++) e.debugSetTile(x, 0, TILE_EMPTY);
    e.debugPlacePowerup(0, 0, "skull");
    e.update(16); // picks up the skull at spawn, arms the "slow" debuff
    expect(e.inspect().player.debuff?.kind).toBe("slow");

    e.setMove(1, 0);
    const totalMs = 1000;
    advance(e, totalMs);
    const p = e.inspect().player;
    // slow multiplies the interval, not the raw base — mirror it via the
    // same stretched stepMs the engine computes internally.
    expect(p.x).toBe(expectedHops(totalMs, PLAYER_STEP_MS * 1.5));
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

  it("a bomb becomes solid once the player's cell no longer matches its own", () => {
    const e = fresh();
    e.debugClearEnemies();
    for (let x = 0; x <= 3; x++) e.debugSetTile(x, 0, TILE_EMPTY);
    e.debugPlacePlayer(0, 0);
    e.placeBomb();

    e.setMove(1, 0);
    e.update(16); // bombs are stepped BEFORE the player hop each frame, so
    // this frame still sees the player on the bomb's cell...
    expect(e.inspect().bombs[0].walkable).toBe(true);
    expect(e.inspect().player.x).toBe(1); // ...even though the hop already fired

    e.update(16); // next frame: bombs now see the player off the bomb's cell
    expect(e.inspect().bombs[0].walkable).toBe(false);

    e.setMove(-1, 0); // direction change mid-hold, takes effect on schedule
    advance(e, PLAYER_STEP_MS * 2); // long enough for the reverse hop to fire
    expect(e.inspect().player.x).toBe(1); // rejected — can't re-enter the now-solid bomb cell
  });

  it("detonates after FUSE_MS and the cross stops at pillars", () => {
    const e = fresh();
    e.debugClearEnemies();
    e.debugPlacePlayer(10, 5); // out of the blast's reach (Task 5 adds blast-on-player death)
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
    e.debugPlacePlayer(10, 5); // out of the blast's reach (Task 5 adds blast-on-player death)
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
    e.debugPlacePlayer(10, 5); // out of the blast's reach (Task 5 adds blast-on-player death)
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
    // Park the player in the corner diagonally opposite the bomb — a blast
    // reaching the spawn would kill + regenerate the level and reset
    // exitRevealed in the same frame (same guard as the sibling bomb tests).
    e.debugPlacePlayer(
      bx < GRID_W / 2 ? GRID_W - 1 : 0,
      ey < GRID_H / 2 ? GRID_H - 1 : 0
    );
    e.debugPlaceBomb(bx, ey, 1);
    advance(e, FUSE_MS + 16);
    expect(e.inspect().exitRevealed).toBe(true);
  });

  it("drops a powerup at DROP_RATE and burns exposed powerups in a later blast", () => {
    const e = fresh(() => 0.0); // forces the drop-rate roll and the skull branch
    e.debugClearEnemies();
    e.debugPlacePlayer(10, 5); // out of the blast's reach (Task 5 adds blast-on-player death)
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

describe("ShortFuseEngine — enemies, deaths, exit, game over", () => {
  it("keeps a wanderer inside a walled room, never on a solid tile", () => {
    const e = fresh(mulberry(11));
    e.debugClearEnemies();
    // 5x5 room: pillar perimeter, empty 3x3 interior — bounds the wander.
    for (let y = 0; y <= 4; y++) {
      for (let x = 0; x <= 4; x++) {
        const wall = x === 0 || x === 4 || y === 0 || y === 4;
        e.debugSetTile(x, y, wall ? TILE_PILLAR : TILE_EMPTY);
      }
    }
    e.debugSpawnEnemy("wanderer", 2, 2);
    for (let t = 0; t < 5000; t += 16) {
      e.update(16);
      const en = e.inspect().enemies[0];
      const cx = Math.round(en.x);
      const cy = Math.round(en.y);
      expect(cx).toBeGreaterThanOrEqual(1);
      expect(cx).toBeLessThanOrEqual(3);
      expect(cy).toBeGreaterThanOrEqual(1);
      expect(cy).toBeLessThanOrEqual(3);
      expect(e.inspect().grid[cy * GRID_W + cx]).toBe(TILE_EMPTY);
    }
  });

  it("chaser greedily closes manhattan distance to a reachable, stationary player", () => {
    const e = fresh();
    e.debugClearEnemies();
    for (let x = 0; x <= 10; x++) e.debugSetTile(x, 0, TILE_EMPTY);
    e.debugPlacePlayer(10, 0);
    e.debugSpawnEnemy("chaser", 2, 0);
    const before = e.inspect().enemies[0];
    const beforeDist = Math.abs(before.x - 10) + Math.abs(before.y - 0);
    advance(e, 800);
    const s = e.inspect();
    expect(s.enemies.length).toBe(1); // never got close enough to contact-kill the player
    const after = s.enemies[0];
    const afterDist = Math.abs(after.x - 10) + Math.abs(after.y - 0);
    expect(afterDist).toBeLessThan(beforeDist);
  });

  it("a blast kills an enemy in its cells and scores by kind", () => {
    for (const kind of ["wanderer", "chaser", "skitter"] as const) {
      const e = fresh();
      e.debugClearEnemies();
      // dead-end box (pillar on all 4 sides) — the enemy can never leave (2,2).
      e.debugSetTile(2, 2, TILE_EMPTY);
      e.debugSetTile(1, 2, TILE_PILLAR);
      e.debugSetTile(3, 2, TILE_PILLAR);
      e.debugSetTile(2, 1, TILE_PILLAR);
      e.debugSetTile(2, 3, TILE_PILLAR);
      e.debugSpawnEnemy(kind, 2, 2);
      e.debugPlaceBomb(2, 2, 1);
      advance(e, FUSE_MS + 16);
      const s = e.inspect();
      expect(s.enemies.length).toBe(0);
      expect(s.score).toBe(SCORE_KILL[kind]);
    }
  });

  it("enemy contact kills the player: lives drop, level regenerates, powerups/score persist", () => {
    const e = fresh();
    e.debugClearEnemies();
    e.debugPlacePlayer(0, 0);
    e.debugPlacePowerup(0, 0, "bomb");
    advance(e, 16); // pick up: maxBombs 1 -> 2, score += SCORE_PICKUP
    const before = e.inspect();
    expect(before.player.maxBombs).toBe(2);
    expect(before.score).toBe(SCORE_PICKUP);

    e.debugClearEnemies();
    e.debugSpawnEnemy("wanderer", 0, 0); // same cell as the player -> contact
    const r = e.update(16);
    const after = e.inspect();

    expect(r.gameOver).toBe(false);
    expect(after.lives).toBe(INITIAL_LIVES - 1);
    expect(after.score).toBe(SCORE_PICKUP); // score persists across the death
    expect(after.player.maxBombs).toBe(2); // collected powerup stat persists
    expect(after.player.x).toBe(0); // position reset by the regen
    expect(after.player.y).toBe(0);
    expect(after.bombs.length).toBe(0);
    expect(after.blasts.length).toBe(0);
    expect(after.powerups.length).toBe(0); // floor powerups reset
    expect(after.level).toBe(1); // same level, not advanced
  });

  it("enemy contact death requires the SAME cell — a merely-adjacent enemy is not lethal", () => {
    const e = fresh();
    e.debugClearEnemies();
    e.debugPlacePlayer(5, 5);
    e.debugSpawnEnemy("wanderer", 6, 5); // adjacent, one cell away — not co-located
    const before = e.inspect().lives;
    const r = e.update(16); // well under the wanderer's own hop interval — it can't have moved yet
    expect(r.gameOver).toBe(false);
    expect(e.inspect().lives).toBe(before);
    expect(e.inspect().enemies.length).toBe(1);
  });

  it("the third death sets gameOver true exactly once, then freezes the engine", () => {
    const e = fresh();
    const results: UpdateResult[] = [];
    for (let i = 0; i < INITIAL_LIVES; i++) {
      e.debugClearEnemies();
      e.debugSpawnEnemy("wanderer", 0, 0); // player is always back at spawn after a regen
      results.push(e.update(16));
    }
    expect(results[0].gameOver).toBe(false);
    expect(results[1].gameOver).toBe(false);
    expect(results[2].gameOver).toBe(true);
    expect(e.inspect().lives).toBe(0);

    // frozen: further updates return the identical cached result, no re-simulation.
    const r4 = e.update(16);
    expect(r4).toEqual(results[2]);
    const r5 = e.update(1000);
    expect(r5).toEqual(results[2]);
  });

  it("timer expiry costs a life and regenerates the level", () => {
    const e = fresh();
    e.debugClearEnemies();
    e.debugSetTimeLeft(10); // less than one frame's dt
    const r = e.update(16);
    expect(r.gameOver).toBe(false);
    expect(e.inspect().lives).toBe(INITIAL_LIVES - 1);
    expect(e.inspect().timeLeftMs).toBe(LEVEL_TIME_MS); // fresh level's full timer
  });

  it("keeps the exit closed while any enemy remains, even revealed with the player on it", () => {
    const e = fresh();
    e.debugClearEnemies();
    const s0 = e.inspect();
    const ex = s0.exitIndex % GRID_W;
    const ey = (s0.exitIndex / GRID_W) | 0;
    let fx = GRID_W - 1;
    const fy = GRID_H - 1;
    if (fx === ex && fy === ey) fx -= 1; // keep the guard enemy off the exit cell
    e.debugSpawnEnemy("wanderer", fx, fy); // far away — no contact/blast risk
    e.debugRevealExit();
    e.debugPlacePlayer(ex, ey);
    const scoreBefore = e.inspect().score;
    e.update(16);
    const s = e.inspect();
    expect(s.level).toBe(1);
    expect(s.score).toBe(scoreBefore);
  });

  it("opens the exit once enemies are cleared and advances the level on contact", () => {
    const e = fresh();
    e.debugClearEnemies();
    const s0 = e.inspect();
    const ex = s0.exitIndex % GRID_W;
    const ey = (s0.exitIndex / GRID_W) | 0;
    e.debugRevealExit();
    e.debugPlacePlayer(ex, ey);
    e.debugSetTimeLeft(12_345);
    const scoreBefore = e.inspect().score;
    const levelBefore = e.inspect().level;
    e.update(16);
    const s = e.inspect();
    expect(s.level).toBe(levelBefore + 1);
    const timeLeftAfterTick = 12_345 - 16; // the timer ticks once before the exit check
    const bonus = Math.floor(timeLeftAfterTick / 1000) * TIME_BONUS_PER_S;
    expect(s.score).toBe(scoreBefore + SCORE_LEVEL_CLEAR + bonus);
  });

  it("the exit needs an EXACT cell match — standing one cell away doesn't trigger it", () => {
    const e = fresh();
    e.debugClearEnemies();
    const s0 = e.inspect();
    const ex = s0.exitIndex % GRID_W;
    const ey = (s0.exitIndex / GRID_W) | 0;
    e.debugRevealExit();
    const nx = ex > 0 ? ex - 1 : ex + 1; // adjacent cell, not the exit cell itself
    e.debugPlacePlayer(nx, ey);
    const levelBefore = e.inspect().level;
    e.update(16);
    expect(e.inspect().level).toBe(levelBefore);
  });
});

describe("ShortFuseEngine — canvas draw", () => {
  it("draw is safe on a freshly constructed engine (the menu paints before start)", () => {
    // No explicit reset() — the constructor itself must seed a drawable
    // level (the "constructible = drawable" contract this arcade family
    // settled on), so drawGame never sees an empty grid.
    const e = new ShortFuseEngine(mulberry(1));
    const ctx = stubCtx();
    expect(() => e.drawIdle(ctx, 300, 240)).not.toThrow();
    expect(() => e.drawGame(ctx, 300, 240, 1)).not.toThrow();
  });

  it("draws every sprite/tile/HUD branch without throwing", () => {
    const e = fresh();
    e.debugClearEnemies();
    e.debugSpawnEnemy("wanderer", 12, 8);
    e.debugSpawnEnemy("chaser", 11, 7);
    e.debugSpawnEnemy("skitter", 10, 6);
    e.debugPlacePowerup(0, 0, "skull"); // under the player's spawn cell
    e.debugPlacePowerup(4, 2, "range");
    e.debugPlacePowerup(5, 2, "bomb");
    e.debugPlacePowerup(6, 3, "speed");
    e.debugPlaceBomb(2, 2);
    e.debugFuse(2, 2, 0); // detonates on the next update — exercises the blast draw path
    e.debugPlaceBomb(6, 6);
    e.debugFuse(6, 6, FUSE_MS - 300); // odd 250ms bucket → spark-off on the next draw
    e.debugRevealExit();
    e.update(16); // applies the skull pickup (debuff) AND detonates the first bomb (blast)

    const s = e.inspect();
    expect(s.player.debuff).not.toBeNull(); // sanity: the debuff sprite branch is actually live
    expect(s.blasts.length).toBeGreaterThan(0); // sanity: the blast branch is actually live

    const ctx = stubCtx();
    for (const reduced of [true, false]) {
      e.setReducedMotion(reduced);
      expect(() => e.drawGame(ctx, 300, 240, 2)).not.toThrow();
    }

    // All enemies down → the exit flips to its "open" sprite variant.
    e.debugClearEnemies();
    expect(() => e.drawGame(ctx, 300, 240, 2)).not.toThrow();
  });
});
