import { describe, expect, it } from "vitest";
import {
  FOOD_VALUE,
  GRID_H,
  GRID_W,
  SPEED_MS,
  SnakeClassicEngine,
} from "./engine";

function freshEngine(rng: () => number = () => 0.99) {
  // rng 0.99 → food spawns far bottom-right, clear of the centre-spawned snake.
  const e = new SnakeClassicEngine("classic", rng);
  e.reset();
  return e;
}

describe("SnakeClassicEngine — reset", () => {
  it("opens with a 3-long snake at centre heading right, score 0, one food off the snake", () => {
    const e = freshEngine();
    const d = e.inspect();
    expect(d.snake).toHaveLength(3);
    expect(d.snake[0]).toEqual({
      x: Math.floor(GRID_W / 2),
      y: Math.floor(GRID_H / 2),
    });
    expect(d.dir).toEqual({ x: 1, y: 0 });
    expect(d.score).toBe(0);
    expect(d.snake.some((s) => s.x === d.food.x && s.y === d.food.y)).toBe(
      false
    );
  });

  it("starts at the preset step interval", () => {
    const e = freshEngine();
    expect(e.stepInterval).toBe(SPEED_MS.classic);
  });
});

describe("SnakeClassicEngine — movement", () => {
  it("advances the head one cell per step and holds length on a plain move", () => {
    const e = freshEngine();
    const before = e.inspect().snake[0];
    const result = e.step();
    const after = e.inspect().snake[0];
    expect(after).toEqual({ x: before.x + 1, y: before.y });
    expect(result.dead).toBe(false);
    expect(result.length).toBe(3);
  });

  it("rejects a 180° reverse", () => {
    const e = freshEngine();
    e.steer(-1, 0); // reverse into the neck — ignored
    e.step();
    expect(e.inspect().dir).toEqual({ x: 1, y: 0 });
  });

  it("buffers two quick turns within one tick (both register)", () => {
    const e = freshEngine();
    e.steer(0, -1); // up
    e.steer(-1, 0); // then left — legal relative to the queued up-turn
    e.step();
    expect(e.inspect().dir).toEqual({ x: 0, y: -1 });
    e.step();
    expect(e.inspect().dir).toEqual({ x: -1, y: 0 });
  });
});

describe("SnakeClassicEngine — eating", () => {
  it("grows +1, scores +FOOD_VALUE and speeds up on eat, then respawns food off the snake", () => {
    const e = freshEngine();
    const head = e.inspect().snake[0];
    e.debugPlaceFood({ x: head.x + 1, y: head.y });
    const slow = e.stepInterval;
    const result = e.step();
    expect(result.ate).toBe(true);
    expect(result.score).toBe(FOOD_VALUE);
    expect(result.length).toBe(4);
    expect(e.stepInterval).toBeLessThan(slow);
    const d = e.inspect();
    expect(d.snake.some((s) => s.x === d.food.x && s.y === d.food.y)).toBe(
      false
    );
  });

  it("reports eaten as 0 before any food is eaten", () => {
    const e = freshEngine();
    const result = e.step();
    expect(result.eaten).toBe(0);
  });

  it("reports eaten as 1 after the first food is eaten", () => {
    const e = freshEngine();
    const head = e.inspect().snake[0];
    e.debugPlaceFood({ x: head.x + 1, y: head.y });
    const result = e.step();
    expect(result.eaten).toBe(1);
  });
});

describe("SnakeClassicEngine — death", () => {
  it("dies at the wall (no wrap)", () => {
    const e = freshEngine();
    let dead = false;
    // Heading right from centre — must hit the right wall within a grid width.
    for (let i = 0; i <= GRID_W && !dead; i++) {
      dead = e.step().dead;
    }
    expect(dead).toBe(true);
  });

  it("dies on self-collision", () => {
    const e = freshEngine();
    // Grow to 5 by feeding the two cells straight ahead.
    for (let i = 0; i < 2; i++) {
      const head = e.inspect().snake[0];
      e.debugPlaceFood({ x: head.x + 1, y: head.y });
      expect(e.step().ate).toBe(true);
    }
    // Tight loop: down, left, up turns back into the body.
    e.steer(0, 1);
    expect(e.step().dead).toBe(false);
    e.steer(-1, 0);
    expect(e.step().dead).toBe(false);
    e.steer(0, -1);
    expect(e.step().dead).toBe(true);
  });

  it("may land on the cell the tail is vacating this step", () => {
    const e = freshEngine();
    // Grow to exactly 4 (a 2×2 loop revisits the tail cell on the 4th move).
    const head = e.inspect().snake[0];
    e.debugPlaceFood({ x: head.x + 1, y: head.y });
    e.step();
    e.steer(0, 1);
    e.step();
    e.steer(-1, 0);
    e.step();
    e.steer(0, -1);
    // Head now enters the cell the tail vacates this same step — legal.
    expect(e.step().dead).toBe(false);
  });
});
