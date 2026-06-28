export type Speed = "chill" | "classic" | "fast";

export type Screen = "menu" | "playing" | "over";

export interface Cell {
  x: number;
  y: number;
}

export interface ScoreRow {
  name: string;
  score: number;
  you?: boolean;
  /** Raw handle (no `@`); absent on padding placeholders. */
  userName?: string;
}

export interface HistoryPoint {
  label: string;
  count: number;
}

export interface RankedRow extends ScoreRow {
  /** Zero-padded position, e.g. "01". */
  rank: string;
  /** Locale-formatted score, e.g. "1,280". */
  scoreLabel: string;
  /** True for a padding placeholder slot. */
  empty?: boolean;
}

export interface SnakeGameState {
  screen: Screen;
  paused: boolean;
  score: number;
  best: number;
  length: number;
  isNewBest: boolean;
  /** 1-based rank on the board; 0 = off the board. */
  rank: number;
}

export interface SnakeGameApi {
  state: SnakeGameState;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  history: HistoryPoint[];
  start: () => void;
  togglePause: () => void;
  /** Steer; ignored if it would reverse into the neck. */
  steer: (x: number, y: number) => void;
}

export interface UseSnakeGameOptions {
  speed?: Speed;
  /** When true (the DEFAULT), edges wrap instead of killing. */
  wrapWalls?: boolean;
  /** The viewer's server-truth best — for the new-best test on game over. */
  best?: number;
  /** Fired ONCE per finished run with its final score. */
  onGameOver?: (score: number) => void;
}
