/**
 * The game-over detail's rank clause — ONE wording across every arcade title.
 * Signed-out runs never rank (nothing submits — play is fully local), so
 * `canRank=false` swaps the off-board nudge for a sign-in one.
 */
export function rankLine(
  rank: number,
  canRank: boolean,
  offBoardHint: string
): string {
  if (!canRank) return "Sign in to get on the board";
  return rank > 0
    ? `Ranked #${rank} on the board`
    : `Off the board — ${offBoardHint}`;
}
