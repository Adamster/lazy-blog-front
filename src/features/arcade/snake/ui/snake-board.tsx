"use client";

import { motion } from "framer-motion";
import { prefersReducedMotion } from "@/shared/lib/prefers-reduced-motion";
import { formatScore } from "../model/leaderboard";
import type { SnakeGameApi } from "../model/types";
import { Confetti } from "./confetti";

/**
 * Overlay scrim — a raw rgba BLACK, NOT `--m-bg/60`: the canvas field is always
 * dark `#141414` on every theme, but a theme-following `--m-bg/60` laid a white
 * film over the dark board on the light theme (read as washed-out gray). A
 * theme-neutral black darkens the field the same on every theme. The over-screen
 * override is a notch heavier (death is a harder stop).
 */
const overlayScrim = "bg-[rgba(8,8,8,0.10)]";
const overlayScrimOver = "bg-[rgba(8,8,8,0.62)]";
// Layout-only base — each overlay appends its own scrim (no duplicate `bg-*` with ambiguous Tailwind ordering).
const overlayLayout =
  "absolute inset-0 z-[1] flex flex-col items-start justify-center pr-10 pl-[15%] backdrop-blur-[1px]";
const overlayBase = `${overlayLayout} ${overlayScrim}`;

/** Left accent rail + 40px gap; content stacks at a uniform 24px rhythm. */
function OverlayRail({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-stretch">
      <div className="w-0.5 shrink-0 bg-[var(--m-accent)]" aria-hidden />
      <div className="flex flex-col items-start gap-6 pl-10 text-left">
        {children}
      </div>
    </div>
  );
}

function ArcadeButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-display mono-focus flex h-9 items-center justify-center bg-[var(--m-accent)] px-4 text-[14px] leading-none font-bold tracking-[0.06em] text-[var(--m-bg)] uppercase transition-[filter] hover:brightness-110"
    >
      {children}
    </button>
  );
}

function Eyebrow({ children, color }: { children: string; color: string }) {
  return (
    <div className="text-[11px] tracking-[0.12em] uppercase" style={{ color }}>
      {children}
    </div>
  );
}

/** The canvas play-field + its overlays (menu / pause / game-over). Pure
 *  presentation — the hook owns all logic; the board only renders `api`. */
export function SnakeBoard({ api }: { api: SnakeGameApi }) {
  const { state, canvasRef, start } = api;
  const reduce = prefersReducedMotion();

  const rankLine =
    state.rank > 0
      ? `Ranked #${state.rank} on the board`
      : "Off the board — eat more, grow longer";

  // Force the DARK palette: the field is always dark `#141414`, so overlay
  // text/accent must read the dark `--m-*`. Those vars are scoped `.dark .mono-scope`
  // (`.dark` on an ANCESTOR), so wrap the board in a `.dark` div with the board itself
  // the `.mono-scope`; `dark` ON the mono-scope element wouldn't match. `contents`
  // keeps the wrapper out of layout.
  return (
    <div className="dark contents">
      <div className="mono-scope relative aspect-[30/18] w-full bg-[var(--m-bg)]">
        <canvas
          ref={canvasRef}
          aria-label="Snake game board. Use the arrow keys to steer, Space to pause."
          role="img"
          className="block size-full [image-rendering:pixelated]"
        />

        {state.screen === "menu" && (
          <div className={overlayBase}>
            <OverlayRail>
              <div className="text-[11px] tracking-[0.12em] text-[var(--m-accent)] uppercase">
                {"// FREE YOUR MIND"}
              </div>
              <ArcadeButton onClick={start}>Start game</ArcadeButton>
              <div className="text-[12px] tracking-[0.06em] text-[var(--m-muted)]">
                press <span className="text-[var(--m-accent)]">ENTER</span> · or
                click
              </div>
            </OverlayRail>
          </div>
        )}

        {state.screen === "playing" && state.paused && (
          <div className={overlayBase}>
            <OverlayRail>
              <Eyebrow color="var(--m-accent)">{"// PAUSED"}</Eyebrow>
              <div className="font-display text-[32px] leading-none font-bold tracking-[-0.02em] text-[var(--m-fg)]">
                Take a breath
              </div>
              <div className="text-[12px] tracking-[0.06em] text-[var(--m-muted)]">
                Space to resume
              </div>
            </OverlayRail>
          </div>
        )}

        {state.screen === "over" && state.isNewBest && !reduce && <Confetti />}

        {state.screen === "over" && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }}
            className={`${overlayLayout} ${overlayScrimOver}`}
          >
            <OverlayRail>
              {state.isNewBest ? (
                <div className="font-display text-[18px] leading-none font-semibold text-[var(--m-fg)]">
                  New record
                </div>
              ) : (
                <Eyebrow color="var(--m-error)">{"// GAME OVER"}</Eyebrow>
              )}
              <div className="font-display text-[46px] leading-none font-bold text-[var(--m-accent)] tabular-nums">
                {formatScore(state.score)}
              </div>
              <div className="text-[12px] tracking-[0.06em] text-[var(--m-muted)]">
                {rankLine}
              </div>
              <ArcadeButton onClick={start}>Play again</ArcadeButton>
            </OverlayRail>
          </motion.div>
        )}
      </div>
    </div>
  );
}
