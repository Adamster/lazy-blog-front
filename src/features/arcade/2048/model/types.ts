export type Direction = "left" | "right" | "up" | "down";

/** Engine phase. "won" = first 2048 reached, awaiting continue/restart. */
export type Phase2048 = "playing" | "won" | "over";

/** UI screen — phase plus the pre-game menu. */
export type Screen = "menu" | "playing" | "won" | "over";

/** One-shot direction edge the loop feeds the engine; consumed (nulled) per move. */
export interface Input2048 {
  dir: Direction | null;
}

/** One sim-tick outcome, projected to React state on change. */
export interface Step2048 {
  phase: Phase2048;
  score: number;
  moves: number;
}

export interface HistoryPoint {
  label: string;
  count: number;
}

export interface ScoreRow {
  name: string;
  score: number;
  you?: boolean;
  userName?: string;
}

export interface RankedRow extends ScoreRow {
  /** Zero-padded position, e.g. "01". */
  rank: string;
  /** Locale-formatted score, e.g. "12,400". */
  scoreLabel: string;
  /** True for a padding placeholder slot. */
  empty?: boolean;
}

export interface Game2048State {
  screen: Screen;
  score: number;
  moves: number;
  /** Viewer's server-truth personal best. */
  best: number;
  isNewBest: boolean;
  /** 1-based board rank; 0 = off the board. */
  rank: number;
}

export interface Game2048Api {
  state: Game2048State;
  /** The 4×4 board canvas — centered alone in the band (run stats live in the top
   *  stats band, not beside the game). */
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  history: HistoryPoint[];
  start: () => void;
  /** Resume endless play from the win overlay. */
  continueRun: () => void;
}

export interface Use2048GameOptions {
  /** The viewer's server-truth best — for the new-best test on game over. */
  best?: number;
  /** Fired ONCE per finished run with its final score. */
  onGameOver?: (score: number) => void;
  /** Fired ONCE per run when 2048 is first reached (score submitted early so a
   *  player who walks away after winning still lands on the board). */
  onWin?: (score: number) => void;
}
