"use client";

import type { PointerEvent } from "react";
import {
  BoardFullscreenButton,
  BoardPauseButton,
  CornerBrackets,
  FULLSCREEN_ROOT,
  FULLSCREEN_STAGE,
  GameOverOverlay,
  MenuOverlay,
  PanelLabel,
  PanelReadout,
  PauseOverlay,
  rankLine,
  useBoardFullscreen,
} from "@/features/arcade/shared";
import { RUSH_EVERY, WAVE_MAX_GAP } from "../model/engine";
import type { StayAwakeGameApi, StayAwakeState } from "../model/types";

/** Control reference — shown in the menu overlay. The GOAL row doubles as the
 *  approved menu subtitle (owner copy). */
const KEY_HINTS: [string, string][] = [
  ["GOAL", "The floor is sleep. Keep hopping."],
  ["HOP", "← →  /  A D  ·  tap a side"],
  ["PAUSE", "SPACE"],
];

/** Approved game-over lines (owner copy, 2026-07-03; wall added with the
 *  lethal-walls retune). No trailing period — the detail row joins its parts
 *  with middle dots (owner call), so the cause reads as the first segment. */
const CAUSE_LINES = {
  cactus: "SAT ON A CACTUS",
  sleep: "CAUGHT NAPPING",
  wall: "HUGGED THE WALL",
} as const;

/** One square panel pip — accent when lit, dim outline otherwise. */
function Pip({ on }: { on: boolean }) {
  return (
    <span
      className={`block size-4 border-2 ${
        on
          ? "border-[var(--m-accent)] bg-[var(--m-accent)]"
          : "border-[var(--m-dim)]"
      }`}
    />
  );
}

/** A labelled vertical pip meter — the left panel's shared block shape. */
function PipMeter({
  label,
  total,
  filled,
}: {
  label: string;
  total: number;
  filled: number;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <PanelLabel>{label}</PanelLabel>
      <div className="flex flex-col gap-2">
        {Array.from({ length: total }, (_, i) => (
          <Pip key={i} on={i < filled} />
        ))}
      </div>
    </div>
  );
}

/** Left panel: coffee pips — fill toward the next espresso rush; all-accent
 *  while a rush runs. The label is ALWAYS "COFFEE" (owner call — no RUSH
 *  swap; the lit pips + the green ZZZ track already announce the rush). */
function CoffeePips({ state }: { state: StayAwakeState }) {
  const filled = state.rushActive ? RUSH_EVERY : state.coffees % RUSH_EVERY;
  return <PipMeter label="COFFEE" total={RUSH_EVERY} filled={filled} />;
}

/** Left panel, under COFFEE: tequila-shot armor — ONE pip (you drink ONE
 *  shot, unlike the three collected coffees — owner call), lit while the
 *  armor runs; the end-of-effect countdown is the cacti blinking on-board. */
function ShotTimer({ state }: { state: StayAwakeState }) {
  return (
    <PipMeter
      label="SHOT"
      total={1}
      filled={state.shotSecondsLeft > 0 ? 1 : 0}
    />
  );
}

/** Right panel: sleep-wave proximity meter — fills as the wave closes in;
 *  error when it's 2 rows out. A 3-coffee espresso rush FREEZES the wave, and
 *  the whole track flags it green: accent border + accent fill (the "frozen"
 *  signal, mirroring the wave edge on the board). */
function WaveMeter({ state }: { state: StayAwakeState }) {
  const closeness = Math.min(1, Math.max(0, 1 - state.waveGap / WAVE_MAX_GAP));
  const fill = state.rushActive
    ? "bg-[var(--m-accent)]"
    : state.waveGap <= 2
      ? "bg-[var(--m-error)]"
      : "bg-[var(--m-muted2)]";
  const track = state.rushActive
    ? "border-[var(--m-accent)]"
    : "border-[var(--m-dim)]";
  return (
    <div className="flex h-full flex-col items-center gap-2">
      <PanelLabel>ZZZ</PanelLabel>
      <div className={`relative w-4 flex-1 border-2 ${track}`}>
        <div
          className={`absolute right-0 bottom-0 left-0 ${fill}`}
          style={{ height: `${Math.round(closeness * 100)}%` }}
        />
      </div>
    </div>
  );
}

/**
 * The STAY AWAKE play surface — the DPR-crisp 5×15 well canvas centred in the
 * shared aspect-[30/18] board footprint, flanked by the sleep-wave ZZZ meter
 * (left) and the run readout — SCORE over the coffee/shot meters — (right),
 * + the DOM overlays. Tap zones: pointer-down on either half of the board = a
 * hop that way (tap, not swipe — zero gesture latency). Pure presentation:
 * the hook owns all logic.
 *
 * THEME-NATIVE: NO forced `dark` scope — board, panels and overlays read the
 * AMBIENT `--m-*` tokens; the canvas palette is resolved in the hook.
 */
export function StayAwakeBoard({
  api,
  canRank = true,
}: {
  api: StayAwakeGameApi;
  /** False for a signed-out viewer — runs stay local, so no board/rank talk. */
  canRank?: boolean;
}) {
  const {
    state,
    canvasRef,
    leftPanelRef,
    rightPanelRef,
    start,
    hop,
    togglePause,
  } = api;
  const {
    rootRef: fullscreenRootRef,
    isFullscreen,
    toggle: toggleFullscreen,
  } = useBoardFullscreen();

  const rankClause = rankLine(state.rank, canRank, "climb higher");
  const causeLine = state.cause ? CAUSE_LINES[state.cause] : "";
  // Fullscreen toggle lives on the OVERLAY screens only (menu / pause — owner
  // call): never a floating control over live gameplay.
  const showFullscreenToggle =
    state.screen === "menu" || (state.screen === "playing" && state.paused);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (state.screen !== "playing" || state.paused) return;
    const rect = e.currentTarget.getBoundingClientRect();
    hop(e.clientX - rect.left < rect.width / 2 ? "left" : "right");
  };

  return (
    <div
      ref={fullscreenRootRef}
      className={`mono-scope relative w-full overflow-hidden ${FULLSCREEN_ROOT}`}
    >
      {/* aspect-[30/18] = the shared arcade board footprint; p-5 stages the well
          inside the CornerBrackets; gap-10 = the Tetris panel separation. */}
      {/* min-h-0 is LOAD-BEARING for the fullscreen round-trip: aspect-ratio
          boxes get a content-based automatic minimum height, so after exiting
          fullscreen the still-large canvas would prop the stage open and the
          ResizeObserver would re-measure the propped size forever. min-h-0
          lets the aspect win; the observer then shrinks the canvas back. */}
      <div
        className={`flex aspect-[30/18] min-h-0 w-full touch-none items-stretch justify-center gap-10 p-5 ${FULLSCREEN_STAGE}`}
        onPointerDown={onPointerDown}
      >
        {/* Panels swapped (owner call 2026-07-04): ZZZ went LEFT so the RIGHT
            column could become the run readout — SCORE above the coffee/shot
            meters — visible in fullscreen, where the top stats band isn't.
            h-52 (208px) ≈ the right stack's height, and the SAME fixed w-20
            with centred content — the two flanks mirror each other, so the
            well-to-panel insets match on both sides (owner call). */}
        <div
          ref={leftPanelRef}
          className="flex h-52 w-20 shrink-0 justify-center self-center"
        >
          <WaveMeter state={state} />
        </div>

        {/* The well: JS-sized to an EXACT 5×15 cell multiple (odd width — a
            true centre start column); aspect/h-full are only the pre-hydration
            fallback — inline w/h override them. The side borders are the LETHAL
            walls, so they carry the danger colour (`--m-error`); top/bottom stay
            the neutral `--m-dim` frame. */}
        <canvas
          ref={canvasRef}
          aria-label="Stay Awake board. Left and Right arrows or A/D to hop; on touch, tap either side. Space to pause. Walls are lethal. Don't let the sleep wave catch the sloth."
          role="img"
          className="block [aspect-ratio:5/15] h-full self-center border-2 border-[var(--m-dim)] border-x-[var(--m-error)]"
        />

        {/* Fixed w-20: room for a 6-digit score, so growing digits never
            change the panel width and re-size the well mid-run. */}
        <div
          ref={rightPanelRef}
          className="flex w-20 shrink-0 flex-col items-center gap-6 self-center"
        >
          <PanelReadout label="SCORE" value={state.score} />
          <CoffeePips state={state} />
          <ShotTimer state={state} />
        </div>
      </div>

      <CornerBrackets />

      {state.screen === "menu" && (
        <MenuOverlay title="Stay Awake" onStart={start} hints={KEY_HINTS} />
      )}

      {state.screen === "playing" && state.paused && (
        <PauseOverlay hint="Space to resume — the wave waits, this once" />
      )}

      {state.screen === "over" && (
        <GameOverOverlay
          isNewBest={state.isNewBest}
          score={state.score}
          detail={`${causeLine} · ${state.altitude} rows · ${rankClause}`}
          onRestart={start}
        />
      )}

      {state.screen === "playing" && (
        <BoardPauseButton paused={state.paused} onToggle={togglePause} />
      )}

      {showFullscreenToggle && (
        <BoardFullscreenButton
          isFullscreen={isFullscreen}
          onToggle={toggleFullscreen}
        />
      )}
    </div>
  );
}
