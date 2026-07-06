import type { BindingMap } from "@/features/arcade/shared";
import type { TetrisAction } from "./bindings";

export type PieceType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";

export type Screen = "menu" | "playing" | "over";

/** Live input the loop feeds the engine each frame. `left`/`right`/`softDrop` are HELD
 *  booleans (the engine runs DAS off them); `rotateCW`/`rotateCCW`/`hardDrop`/`hold`
 *  are one-shot press EDGES the engine consumes (clears) so a held key triggers once
 *  per press. */
export interface TetrisInput {
  left: boolean;
  right: boolean;
  softDrop: boolean;
  rotateCW: boolean;
  rotateCCW: boolean;
  hardDrop: boolean;
  hold: boolean;
}

export type ClearKind =
  | "single"
  | "double"
  | "triple"
  | "tetris"
  | "tspin"
  | "tspin-mini";

/** Reported once, on the lock tick that cleared lines or scored a T-spin. */
export interface ClearEvent {
  kind: ClearKind;
  lines: number;
  b2b: boolean;
  /** Combo count (≥1 means a combo bonus was paid). */
  combo: number;
}

/** One sim-tick outcome, projected to React state on change. */
export interface TetrisStep {
  dead: boolean;
  score: number;
  lines: number;
  level: number;
  event: ClearEvent | null;
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
  /** Transient clear-event caption (e.g. "TETRIS", "B2B · T-SPIN DOUBLE"). */
  eventLabel: string | null;
}

export interface TetrisGameApi {
  state: TetrisGameState;
  /** The 10×20 well canvas. */
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** The NEXT-piece preview canvas. */
  nextCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** The HOLD-piece preview canvas. */
  holdCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** The stats side-panel — measured so the well is sized to fit the leftover width. */
  panelRef: React.RefObject<HTMLDivElement | null>;
  history: HistoryPoint[];
  start: () => void;
  togglePause: () => void;
  /** Live remappable-key map — read by the keyboard handler, edited by CONTROLS. */
  bindings: BindingMap<TetrisAction>;
  setBindings: (next: BindingMap<TetrisAction>) => void;
  /** Live remappable-gamepad-button map — read by the gamepad poller, edited by
   *  CONTROLS. Independent of `bindings` (keyboard); rebinding one never touches
   *  the other. */
  padBindings: BindingMap<TetrisAction>;
  setPadBindings: (next: BindingMap<TetrisAction>) => void;
  /** True while a modal (e.g. CONTROLS) owns the keyboard — game keys go inert. */
  setKeysSuspended: (suspended: boolean) => void;
}

export interface UseTetrisGameOptions {
  /** The viewer's server-truth best — for the new-best test on game over. */
  best?: number;
  /** Fired ONCE per finished run with its final score. */
  onGameOver?: (score: number) => void;
  /** localStorage identity scope for the run log — username or guest bucket. */
  historyScope?: string;
}
