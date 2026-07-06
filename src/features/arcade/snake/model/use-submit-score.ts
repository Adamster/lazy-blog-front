import { useSubmitArcadeScore } from "@/features/arcade/shared";
import { arcadeKeys, LEADERBOARD_TAKE, SNAKE_GAME } from "./arcade-keys";

export function useSubmitScore() {
  return useSubmitArcadeScore(SNAKE_GAME, arcadeKeys, LEADERBOARD_TAKE);
}
