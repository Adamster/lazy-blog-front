import type { BindingMap } from "@/features/arcade/shared";
import type { ShortFuseAction } from "./gamepad-bindings";

export type Screen = "menu" | "playing" | "over";

export interface ScoreRow {
  name: string;
  score: number;
  you?: boolean;
  userName?: string;
}

export interface HistoryPoint {
  label: string;
  count: number;
}

export interface RankedRow extends ScoreRow {
  rank: string;
  scoreLabel: string;
  empty?: boolean;
}

export interface ShortFuseGameState {
  screen: Screen;
  paused: boolean;
  score: number;
  best: number;
  /** Current level (1-based) — HUD + game-over detail. */
  level: number;
  lives: number;
  isNewBest: boolean;
  rank: number;
}

export interface ShortFuseGameApi {
  state: ShortFuseGameState;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  history: HistoryPoint[];
  start: () => void;
  togglePause: () => void;
  padBindings: BindingMap<ShortFuseAction>;
  setPadBindings: (next: BindingMap<ShortFuseAction>) => void;
  setKeysSuspended: (suspended: boolean) => void;
}

export interface UseShortFuseGameOptions {
  best?: number;
  onGameOver?: (score: number) => void;
  historyScope?: string;
}
