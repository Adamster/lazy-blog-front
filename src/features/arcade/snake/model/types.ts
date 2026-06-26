/**
 * Snake Arcade — shared engine types. The game logic is a `useSnakeGame` hook
 * (model) feeding a `<SnakeBoard>` canvas (ui); these types are the contract
 * between them and the variant pages.
 */

/** Tuning preset → step interval in ms (lower = faster). */
export type Speed = "chill" | "classic" | "fast";

/** Which overlay the board is currently showing. */
export type Screen = "menu" | "playing" | "over";

/** A grid cell (column index 0..GRID_W-1, row index 0..GRID_H-1). */
export interface Cell {
  x: number;
  y: number;
}

/** One leaderboard entry. `you` flags the local run's row for highlighting. */
export interface ScoreRow {
  name: string;
  score: number;
  you?: boolean;
  /** Raw handle (no `@`) for the profile link; absent on padding placeholders. */
  userName?: string;
}

/** One recent-runs sparkline bucket: a run's order label + its final score. */
export interface HistoryPoint {
  /** Play-order tag, e.g. "#1" — the rightmost is the latest run. */
  label: string;
  /** That run's final score (the y value). */
  count: number;
}

/** A ranked, display-ready leaderboard row (rank padded, score formatted). */
export interface RankedRow extends ScoreRow {
  /** Zero-padded position string, e.g. "01". */
  rank: string;
  /** Locale-formatted score, e.g. "1,280". */
  scoreLabel: string;
  /** True for a padding placeholder — an unfilled slot (`··` / 0, muted). */
  empty?: boolean;
}

/** The reactive snapshot the hook exposes to the UI each state change. */
export interface SnakeGameState {
  screen: Screen;
  paused: boolean;
  score: number;
  best: number;
  /** Snake length (cells). */
  length: number;
  /** True when this run set a new personal best. */
  isNewBest: boolean;
  /** 1-based rank of the local run on the board, 0 = off the board. */
  rank: number;
}

/** Everything the engine hook returns — live run state + canvas ref + controls. */
export interface SnakeGameApi {
  state: SnakeGameState;
  /** Wire onto the `<canvas>`. */
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** Recent-runs sparkline series (last N final scores, newest on the right). */
  history: HistoryPoint[];
  start: () => void;
  togglePause: () => void;
  /** Steer; ignored if it would reverse into the neck. */
  steer: (x: number, y: number) => void;
}

export interface UseSnakeGameOptions {
  speed?: Speed;
  /** When true (the DEFAULT), edges wrap (pass-through) instead of killing. */
  wrapWalls?: boolean;
  /**
   * The viewer's server-truth personal best — used for the optimistic
   * new-best test on game over. Fed by the data layer (`useMyArcadeStats`).
   */
  best?: number;
  /** Fired ONCE per finished run with its final score (the data layer submits). */
  onGameOver?: (score: number) => void;
}
