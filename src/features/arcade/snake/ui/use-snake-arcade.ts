"use client";

import { useSnakeGame } from "../model/use-snake-game";
import type { SnakeGameApi, UseSnakeGameOptions } from "../model/types";

export interface SnakeArcadeApi {
  game: SnakeGameApi;
}

/**
 * Page-level orchestrator: wraps the game engine hook so the route page stays
 * pure layout (it only arranges the shared pieces).
 */
export function useSnakeArcade(options?: UseSnakeGameOptions): SnakeArcadeApi {
  const game = useSnakeGame(options);
  return { game };
}
