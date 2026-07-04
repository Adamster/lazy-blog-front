export type HopDir = "left" | "right";

/** Engine phase — the climber has no win state, only the run and its end. */
export type PhaseStayAwake = "playing" | "over";

/** UI screen — phase plus the pre-game menu. */
export type Screen = "menu" | "playing" | "over";

/** What ended the run: a cactus landing, the sleep wave, or the lethal wall. */
export type DeathCause = "cactus" | "sleep" | "wall" | null;

/** One tower cell. 0 empty · 1 cactus (lethal) · 2 coffee (+25, rush fuel) ·
 *  3 chamomile (landable trap — wave surge) · 4 tequila shot (rare — arms
 *  3s of cactus-proofing). */
export type CellKind = 0 | 1 | 2 | 3 | 4;

/** One-shot hop edge the loop feeds the engine; consumed (nulled) per hop. */
export interface StayAwakeInput {
  dir: HopDir | null;
}

/** One sim-tick outcome, projected to React state on change. */
export interface StayAwakeStep {
  phase: PhaseStayAwake;
  cause: DeathCause;
  score: number;
  /** Rows climbed this run (also the +1/row score component). */
  altitude: number;
  coffees: number;
  /** Rows between the wave's top edge and the sloth. 0 = caught. */
  waveGap: number;
  /** Espresso rush remaining (ms); 0 = no rush. */
  rushMsLeft: number;
  /** Tequila-shot cactus-proofing remaining (ms); 0 = unarmed. */
  shotMsLeft: number;
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

export interface StayAwakeState {
  screen: Screen;
  paused: boolean;
  score: number;
  altitude: number;
  coffees: number;
  cause: DeathCause;
  waveGap: number;
  /** Coarse rush flag (NOT the ms countdown — state must not change every frame). */
  rushActive: boolean;
  /** Whole seconds of shot armor left (coarse — ticks 3→2→1→0, never per frame). */
  shotSecondsLeft: number;
  /** Viewer's server-truth personal best. */
  best: number;
  isNewBest: boolean;
  /** 1-based board rank; 0 = off the board. */
  rank: number;
}

export interface StayAwakeGameApi {
  state: StayAwakeState;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** The two side panels — measured so the well is sized to the leftover width. */
  leftPanelRef: React.RefObject<HTMLDivElement | null>;
  rightPanelRef: React.RefObject<HTMLDivElement | null>;
  history: HistoryPoint[];
  start: () => void;
  /** One hop (keyboard and the board's tap zones both call this). */
  hop: (dir: HopDir) => void;
  /** Space and the mobile pause button both call this. */
  togglePause: () => void;
}

export interface UseStayAwakeGameOptions {
  /** The viewer's server-truth best — for the new-best test on game over. */
  best?: number;
  /** Fired ONCE per finished run with its final score. */
  onGameOver?: (score: number) => void;
  /** Storage scope for score history (defaults to guest if unspecified). */
  historyScope?: string;
}
