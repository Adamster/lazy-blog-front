import { useSubmitArcadeScore } from "@/features/arcade/shared";
import { arcadeKeys, GAME_2048, LEADERBOARD_TAKE } from "./arcade-keys";

export function useSubmitScore() {
  return useSubmitArcadeScore(GAME_2048, arcadeKeys, LEADERBOARD_TAKE);
}
