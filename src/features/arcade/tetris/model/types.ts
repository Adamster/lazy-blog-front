export type PieceType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";

export type Screen = "menu" | "playing" | "over";

/** Live input the loop feeds the engine each frame. `left`/`right`/`softDrop` are HELD
 *  booleans (the engine runs DAS off them); `rotateCW`/`rotateCCW` are one-shot press
 *  EDGES the engine consumes (clears) so a held key rotates once per press. */
export interface TetrisInput {
  left: boolean;
  right: boolean;
  softDrop: boolean;
  rotateCW: boolean;
  rotateCCW: boolean;
}

/** One sim-tick outcome, projected to React state on change. */
export interface TetrisStep {
  dead: boolean;
  score: number;
  lines: number;
  level: number;
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

export interface TetrisGameState {
  screen: Screen;
  paused: boolean;
  score: number;
  lines: number;
  level: number;
  /** Viewer's server-truth personal best. */
  best: number;
  isNewBest: boolean;
  /** 1-based board rank; 0 = off the board. */
  rank: number;
}

export interface TetrisGameApi {
  state: TetrisGameState;
  /** The 10×20 well canvas. */
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** The NEXT-piece preview canvas. */
  nextCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** The stats side-panel — measured so the well is sized to fit the leftover width. */
  panelRef: React.RefObject<HTMLDivElement | null>;
  history: HistoryPoint[];
  start: () => void;
  togglePause: () => void;
}

export interface UseTetrisGameOptions {
  /** The viewer's server-truth best — for the new-best test on game over. */
  best?: number;
  /** Fired ONCE per finished run with its final score. */
  onGameOver?: (score: number) => void;
}
