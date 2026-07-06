import { useSubmitArcadeScore } from "@/features/arcade/shared";
import { arcadeKeys, LEADERBOARD_TAKE, TETRIS_GAME } from "./arcade-keys";

export function useSubmitScore() {
  return useSubmitArcadeScore(TETRIS_GAME, arcadeKeys, LEADERBOARD_TAKE);
}
