"use client";

import {
  ArcadeButton,
  CornerBrackets,
  GameOverOverlay,
  MenuOverlay,
  overlayBase,
  OverlayDetail,
  OverlayHeading,
  OverlayRail,
  rankLine,
} from "@/features/arcade/shared";
import { Button } from "@/shared/ui";
import type { Game2048Api } from "../model/types";

/** Control reference — shown in the menu overlay. */
const KEY_HINTS: [string, string][] = [
  ["MOVE", "← ↑ ↓ →  /  WASD"],
  ["GOAL", "Merge to 2048"],
  ["START", "Enter / Space"],
];

/**
 * The CLASSIC 2048 play surface — the DPR-crisp square 4×4 canvas (inset tiles + 1px
 * grid), centered alone, + the DOM overlays (menu / won / game-over). Run stats live
 * in the top stats band, not beside the game. Pure presentation: the hook owns all
 * logic and the engine draws the canvas imperatively; this only renders `api`.
 *
 * THEME-NATIVE (like Tetris): NO forced `dark` scope — board, HUD and overlays read
 * the AMBIENT `--m-*` tokens; the canvas palette is resolved from them in the hook.
 */
export function Board2048({
  api,
  canRank = true,
}: {
  api: Game2048Api;
  /** False for a signed-out viewer — runs stay local, so no board/rank talk. */
  canRank?: boolean;
}) {
  const { state, canvasRef, start, continueRun } = api;

  const rankClause = rankLine(state.rank, canRank, "merge higher");

  return (
    // BARE play surface (owner call: no `--m-card` band, no inner padding) — the
    // bordered board IS the stage; the overlay scrims carry their own veil.
    <div className="mono-scope relative w-full overflow-hidden">
      {/* The board sits ALONE, centered — run stats live in the top stats band
          (owner call: no duplicated HUD beside the game). aspect-[30/18] = the
          snake boards' footprint, so every arcade board renders the same height
          at the same column width. */}
      {/* p-5 pulls the canvas in from the CornerBrackets (the frame reads as a
          stage around it) and centres the height-fit board in the footprint —
          40 read too far (the game shrank noticeably); 20 is the owner pick. */}
      <div className="flex aspect-[30/18] w-full items-stretch justify-center p-5">
        {/* The board: JS-sized to an EXACT 4×4 cell multiple (square). `touch-none`
            keeps swipes on the canvas from scrolling the page. */}
        <canvas
          ref={canvasRef}
          aria-label="2048 board. Arrow keys or WASD to slide tiles."
          role="img"
          className="block aspect-square h-full touch-none self-center border-2 border-[var(--m-dim)]"
        />
      </div>

      <CornerBrackets />

      {state.screen === "menu" && (
        <MenuOverlay title="2048" onStart={start} hints={KEY_HINTS} />
      )}

      {state.screen === "won" && (
        <div className={overlayBase}>
          <OverlayRail>
            <OverlayHeading>Merge complete</OverlayHeading>
            <OverlayDetail>Keep going for a higher score</OverlayDetail>
            {/* Secondary left, primary right — the project's button-order rule. */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={start}>
                New game
              </Button>
              <ArcadeButton onClick={continueRun}>Continue</ArcadeButton>
            </div>
          </OverlayRail>
        </div>
      )}

      {state.screen === "over" && (
        <GameOverOverlay
          isNewBest={state.isNewBest}
          score={state.score}
          detail={`${state.moves} moves · ${rankClause}`}
          onRestart={start}
        />
      )}
    </div>
  );
}
