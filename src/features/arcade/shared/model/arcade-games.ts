export interface ArcadeGameEntry {
  /** Backend leaderboard key — does NOT always match `title`/`href` (e.g.
   *  the "Snake" card is the classic-Snake feature, backend key
   *  `snake-classic`; the backend key `snake` belongs to "The Rabbit"). */
  game: string;
  title: string;
  href: string;
  /** Temporarily delisted from the hub (owner call) — the route stays live,
   *  but it's excluded from the hub grid AND from profile crowns (a crown
   *  linking to a delisted game would contradict the hub's own delisting
   *  call). Drop the flag to relist everywhere at once. */
  hidden?: boolean;
}

/**
 * The canonical arcade roster — the ONE list both the `/arcade` hub grid and
 * the profile "// ARCADE ACHIEVEMENTS" crowns derive from, so a roster change
 * (delist, relist, rename) only needs editing here instead of two
 * hand-duplicated lists staying in sync by comment discipline alone (which
 * already caused one manual double-edit, 2026-07-09 Stay Awake/Rabbit
 * delisting).
 */
export const ARCADE_GAMES: readonly ArcadeGameEntry[] = [
  { game: "tetris", title: "Tetris", href: "/arcade/tetris" },
  { game: "2048", title: "2048", href: "/arcade/2048" },
  { game: "snake-classic", title: "Snake", href: "/arcade/snake" },
  {
    game: "stay-awake",
    title: "Stay Awake",
    href: "/arcade/stay-awake",
    hidden: true,
  },
  {
    game: "snake",
    title: "The Rabbit",
    href: "/arcade/follow-the-rabbit",
    hidden: true,
  },
];
