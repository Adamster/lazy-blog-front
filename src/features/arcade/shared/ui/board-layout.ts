/**
 * Game-page column layout below the stats band: the board + the 360px
 * high-score rail. ONE layout for every viewer — the rail always holds the
 * `Leaderboard`; signed out it's already an all-placeholder board (the
 * leaderboard query is disabled, so `rankApiBoard([])` pads every row), so
 * the rail renders identically in both states with no separate sign-in
 * teaser.
 */
export const BOARD_GRID_RAIL =
  "mt-10 grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_360px]";
