import { useSubmitArcadeScore } from "@/features/arcade/shared";
import { arcadeKeys, LEADERBOARD_TAKE, SHORT_FUSE_GAME } from "./arcade-keys";

export function useSubmitScore() {
  return useSubmitArcadeScore(SHORT_FUSE_GAME, arcadeKeys, LEADERBOARD_TAKE);
}
