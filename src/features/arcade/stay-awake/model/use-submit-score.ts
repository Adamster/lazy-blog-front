import { useSubmitArcadeScore } from "@/features/arcade/shared";
import { arcadeKeys, GAME_STAY_AWAKE, LEADERBOARD_TAKE } from "./arcade-keys";

export function useSubmitScore() {
  return useSubmitArcadeScore(GAME_STAY_AWAKE, arcadeKeys, LEADERBOARD_TAKE);
}
