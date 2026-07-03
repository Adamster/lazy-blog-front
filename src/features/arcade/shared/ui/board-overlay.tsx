"use client";

import { motion } from "framer-motion";
import { GlitchText } from "@/shared/ui/effects";
import { prefersReducedMotion } from "@/shared/lib/prefers-reduced-motion";
import { formatScore } from "../model/format-score";

/**
 * The ONE board-overlay kit shared by every arcade play surface (menu / pause /
 * game-over screens): the layout + scrim class strings and the rail / button /
 * eyebrow / title / key-hint pieces. Extracted so the overlay language is
 * byte-identical across games — same 15% left inset, same 24px rhythm, same
 * accent rail — instead of drifting per board.
 */

/**
 * Overlay scrim — a THEME-FOLLOWING veil of `--m-card` (matches the board band's
 * own fill, so the frost reads as "the band under glass" on BOTH themes). Menu /
 * pause is deliberately LIGHT (40%) so the field stays visible behind the title;
 * the over-screen scrim is heavier (death is a harder stop).
 */
export const overlayScrim = "bg-[var(--m-card)]/40";
export const overlayScrimOver = "bg-[var(--m-card)]/80";
// Layout-only base — each overlay appends its scrim (no duplicate `bg-*` with
// ambiguous Tailwind ordering). `backdrop-blur` (8px) frosts the field behind the
// overlay; the 15% left inset is the shared anchor for the rail block.
export const overlayLayout =
  "absolute inset-0 z-[1] flex flex-col items-start justify-center pr-10 pl-[15%] backdrop-blur";
export const overlayBase = `${overlayLayout} ${overlayScrim}`;
export const overlayBaseOver = `${overlayLayout} ${overlayScrimOver}`;

/** The four corner positions of {@link CornerBrackets} — each an L of two 2px edges. */
const BRACKET_CORNERS = [
  "top-0 left-0 border-t-2 border-l-2",
  "top-0 right-0 border-t-2 border-r-2",
  "bottom-0 left-0 border-b-2 border-l-2",
  "bottom-0 right-0 border-b-2 border-r-2",
] as const;

/** Viewfinder corner brackets framing the board CONTAINER (not the canvas) —
 *  four muted 24px L-marks flush at the corners, the quiet "stage" frame shared
 *  by every arcade board. Purely decorative; sits under the screen overlays. */
export function CornerBrackets() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {BRACKET_CORNERS.map((corner) => (
        <span
          key={corner}
          className={`absolute size-6 border-[var(--m-muted2)] ${corner}`}
        />
      ))}
    </div>
  );
}

/** Left accent rail + 40px gap; content stacks at a uniform 24px rhythm. */
export function OverlayRail({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-stretch">
      <div className="w-0.5 shrink-0 bg-[var(--m-accent)]" aria-hidden />
      <div className="flex flex-col items-start gap-6 pl-10 text-left">
        {children}
      </div>
    </div>
  );
}

/** The overlay's primary action (Start / Play again) — the 36px accent CTA. */
export function ArcadeButton({
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

/** Overlay eyebrow (`// PAUSED`, `// GAME OVER`) — 11px/0.12em in the given colour. */
export function OverlayEyebrow({
  children,
  color,
}: {
  children: string;
  color: string;
}) {
  return (
    <div className="text-[11px] tracking-[0.12em] uppercase" style={{ color }}>
      {children}
    </div>
  );
}

/** Menu headline — the page's H1, moved into the overlay with the arcade glitch.
 *  32px display, `leading-none`. */
export function OverlayTitle({ children }: { children: string }) {
  return (
    <GlitchText className="font-display text-[32px] leading-none font-bold tracking-[-0.02em] text-[var(--m-fg)]">
      {children}
    </GlitchText>
  );
}

/** Control reference — the menu overlay's key-hint table (11px/0.12em muted label
 *  + fg key glyphs). Each game passes its own `[label, keys]` rows. */
export function KeyHints({
  hints,
}: {
  hints: readonly (readonly [string, string])[];
}) {
  return (
    <div className="flex flex-col gap-1">
      {hints.map(([k, v]) => (
        <div
          key={k}
          className="flex gap-2.5 text-[11px] tracking-[0.12em] text-[var(--m-muted)] uppercase"
        >
          <span className="w-[76px] text-[var(--m-muted2)]">{k}</span>
          <span className="text-[var(--m-fg)] normal-case">{v}</span>
        </div>
      ))}
    </div>
  );
}

/** Static overlay heading (pause / won screens) — the same 32px display line as
 *  {@link OverlayTitle}, without the glitch. */
export function OverlayHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-display text-[32px] leading-none font-bold tracking-[-0.02em] text-[var(--m-fg)]">
      {children}
    </div>
  );
}

/** Overlay detail line — the 12px muted caption under a heading/score. */
export function OverlayDetail({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[12px] tracking-[0.06em] text-[var(--m-muted)]">
      {children}
    </div>
  );
}

/** The whole MENU overlay — glitch title, start CTA, key hints. */
export function MenuOverlay({
  title,
  onStart,
  hints,
  startLabel = "Start game",
}: {
  title: string;
  onStart: () => void;
  hints: readonly (readonly [string, string])[];
  startLabel?: string;
}) {
  return (
    <div className={overlayBase}>
      <OverlayRail>
        <OverlayTitle>{title}</OverlayTitle>
        <ArcadeButton onClick={onStart}>{startLabel}</ArcadeButton>
        <KeyHints hints={hints} />
      </OverlayRail>
    </div>
  );
}

/** The whole PAUSE overlay — straight to the 32px heading + resume hint (no
 *  eyebrow, owner call: pause/over mirror the menu's title-first layout). */
export function PauseOverlay({
  title = "Take a breath",
  hint,
}: {
  title?: string;
  hint: string;
}) {
  return (
    <div className={overlayBase}>
      <OverlayRail>
        <OverlayHeading>{title}</OverlayHeading>
        <OverlayDetail>{hint}</OverlayDetail>
      </OverlayRail>
    </div>
  );
}

/** The whole GAME-OVER overlay — the 32px "Game over" / "New record" heading
 *  (no eyebrow, owner call: pause/over mirror the menu's title-first layout),
 *  the 46px accent score, a detail line, and the restart CTA; slides in unless
 *  reduced motion asks otherwise. */
export function GameOverOverlay({
  isNewBest,
  score,
  detail,
  onRestart,
}: {
  isNewBest: boolean;
  score: number;
  detail: string;
  onRestart: () => void;
}) {
  const reduce = prefersReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }}
      className={overlayBaseOver}
    >
      <OverlayRail>
        <OverlayHeading>
          {isNewBest ? "New record" : "Game over"}
        </OverlayHeading>
        <div className="font-display text-[46px] leading-none font-bold text-[var(--m-accent)] tabular-nums">
          {formatScore(score)}
        </div>
        <OverlayDetail>{detail}</OverlayDetail>
        <ArcadeButton onClick={onRestart}>Play again</ArcadeButton>
      </OverlayRail>
    </motion.div>
  );
}
