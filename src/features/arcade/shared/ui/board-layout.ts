/**
 * Game-page column layout below the stats band: the board + the 360px
 * high-score rail. ONE layout for every viewer — signed in the rail holds the
 * leaderboard, signed out it holds the `BoardSignInTeaser` (play is fully
 * local there), so the board renders identically in both states.
 */
export const BOARD_GRID_RAIL =
  "mt-10 grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_360px]";
