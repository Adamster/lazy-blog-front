"use client";

import { motion } from "framer-motion";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from "@heroicons/react/24/outline";
import { GlitchText } from "@/shared/ui/effects";
import { prefersReducedMotion } from "@/shared/lib/prefers-reduced-motion";
import { formatScore } from "../model/format-score";
import { keyLabel } from "../model/key-bindings";

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
// overlay; the 15% left inset is the shared anchor for the rail block (mobile
// drops to the p-5 stage inset — 15% of a phone board is nothing).
export const overlayLayout =
  "absolute inset-0 z-[1] flex flex-col items-start justify-center pr-5 pl-5 backdrop-blur sm:pr-10 sm:pl-[15%]";
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

/** Left accent rail + 40px gap; content stacks at a uniform 24px rhythm.
 *  Mobile compacts to the 16px rhythm + 20px rail gap — the phone-width board
 *  is ~210px tall, the desktop scale overflowed it (owner catch). */
export function OverlayRail({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-stretch">
      <div className="w-0.5 shrink-0 bg-[var(--m-accent)]" aria-hidden />
      <div className="flex flex-col items-start gap-4 pl-5 text-left sm:gap-6 sm:pl-10">
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
 *  32px display, `leading-none`; the H3 18 on mobile (both endpoints in-set —
 *  the responsive-step pattern). */
export function OverlayTitle({ children }: { children: string }) {
  return (
    <GlitchText className="font-display text-[18px] leading-none font-bold tracking-[-0.02em] text-[var(--m-fg)] sm:text-[32px]">
      {children}
    </GlitchText>
  );
}

/** One rendered piece of a key-hint value: either a boxed key (`badge`) or a
 *  plain separator — the `·` (two DIFFERENT actions on one row) or the "—"
 *  unbound placeholder. The `/` (alternate key, SAME action) is dropped in
 *  {@link parseHint} — same-action keys just sit gap-1 apart, no glyph. */
type HintToken = { text: string; badge: boolean };

/** Multi-char key labels → single glyphs, so every badge holds ONE glyph and
 *  renders as a uniform square (no wide word-boxes). Scoped to the hint overlay
 *  ONLY — `keyLabel()`/`KEY_LABELS` (CONTROLS modal chips, tooltips) keep the full
 *  spelled word, which is correct there. Keyed on the UPPERCASED label so both
 *  `SPACE` and 2048's mixed-case `Space`/`Enter` resolve. Right-hand modifiers
 *  (`R-SHIFT` …) are composed in {@link keyGlyph} as base glyph + subscript-r. */
const HINT_GLYPHS: Record<string, string> = {
  ENTER: "⏎",
  ESC: "⎋",
  SHIFT: "⇧",
  CTRL: "⌃",
  ALT: "⌥",
};

/** The four directional arrows arrive as raw Unicode codepoints from `keyLabel()`
 *  (`← → ↑ ↓`, U+2190–2193). Those codepoints DON'T share x-height/weight across
 *  fonts — the horizontal pair renders visibly bigger/bolder than the vertical
 *  pair inside identical squares — so we swap them for one Heroicons family, all
 *  sized by the SAME `size-*` class → guaranteed-uniform. */
const ARROW_ICONS: Record<
  string,
  React.ComponentType<React.SVGProps<SVGSVGElement>>
> = {
  "←": ArrowLeftIcon,
  "→": ArrowRightIcon,
  "↑": ArrowUpIcon,
  "↓": ArrowDownIcon,
};

/** Modifier symbol glyphs (`⏎ ⎋ ⇧ ⌃ ⌥`) render too thin & small at the 11px
 *  badge size next to the letter keys. They're ICON glyphs, not body/label text,
 *  so the type scale's icon-exemption (same license as the `✕` close glyph) lets
 *  us size them up: {@link ModGlyph} pins them to 15px semibold so their ink
 *  weight matches a letter badge. (SPACE is NOT here — it renders as an inline
 *  SVG, {@link SpaceGlyph}, not a font glyph.) */
const MOD_GLYPHS = new Set(Object.values(HINT_GLYPHS));

/** The SPACE key's glyph. The Unicode `␣` (U+2423 OPEN BOX) is drawn low in its
 *  em-box across the font stack, so a flex-centered badge leaves the ink stuck to
 *  the BOTTOM instead of visually centered — the same font-metrics class of bug
 *  the arrow-glyph → Heroicons swap already fixed. We draw the open-box "spacebar"
 *  mark as an inline SVG instead: we own the bounding box, so it's guaranteed
 *  visually centered and sized exactly like the arrow icons (`size-3.5`,
 *  `currentColor`, no {@link ModGlyph} wrapper). */
function SpaceGlyph({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className={className}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 9v6h15V9" />
    </svg>
  );
}

/** Up-weight a modifier glyph to match the letter badges' ink (icon-exempt from
 *  the 11px type-scale floor). `compact` (CONTROLS-modal chips) drops the ink from
 *  15px → 13px to match the smaller 12px icon glyphs there. */
function ModGlyph({
  children,
  compact = false,
}: {
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <span
      className={`${compact ? "text-[13px]" : "text-[15px]"} leading-none font-semibold`}
    >
      {children}
    </span>
  );
}

/** Render one key label as a compact glyph node that fits the 20px square:
 *  directional arrows → a uniform Heroicons SVG ({@link ARROW_ICONS}); the SPACE
 *  key → the inline {@link SpaceGlyph} SVG; other modifier symbols → the
 *  up-weighted {@link ModGlyph}. Right-hand modifiers
 *  (`R-SHIFT`/`R-CTRL`/`R-ALT`) render the base modifier glyph + a genuinely
 *  subscript-sized `r` (the `⇧ᵣ` hand-indicator the owner specced). Unknown labels
 *  (single letters) pass through unchanged. */
function keyGlyph(label: string, compact = false): React.ReactNode {
  const iconSize = compact ? "size-3" : "size-3.5";
  const Arrow = ARROW_ICONS[label];
  if (Arrow) return <Arrow className={iconSize} aria-hidden />;
  const up = label.toUpperCase();
  if (up === "SPACE") return <SpaceGlyph className={iconSize} />;
  const right = up.match(/^R-(SHIFT|CTRL|ALT)$/);
  if (right) {
    return (
      <ModGlyph compact={compact}>
        <span className="whitespace-nowrap">
          {HINT_GLYPHS[right[1]]}
          {/* decorative hand-indicator — relative-em sub-glyph, not a type-scale role */}
          <sub className="text-[0.6em] font-normal">r</sub>
        </span>
      </ModGlyph>
    );
  }
  const glyph = HINT_GLYPHS[up] ?? label;
  return MOD_GLYPHS.has(glyph) ? (
    <ModGlyph compact={compact}>{glyph}</ModGlyph>
  ) : (
    glyph
  );
}

/** Render one RAW binding code (`KeyboardEvent.code` / `"Pad<n>"`) as the same
 *  compact glyph node {@link keyGlyph} produces for a hint label — resolve the
 *  code to its human label via {@link keyLabel}, then feed it through the shared
 *  glyph substitution. The ONE glyph implementation for both surfaces (menu
 *  {@link KeyHints} rows + the CONTROLS-modal {@link CaptureChip} chips), so the
 *  two read as one design language instead of two copies of the table. `compact`
 *  (passed by the modal chips) shrinks the icon/mod glyphs one notch — arrows &
 *  SPACE `size-3.5 → size-3`, modifier ink `15px → 13px` — to sit in the modal's
 *  smaller 16px badge box; the menu rows keep the default 14/15px glyphs. */
export function codeGlyph(code: string, compact = false): React.ReactNode {
  return keyGlyph(keyLabel(code), compact);
}

/** One kbd key-badge — a uniform square glyph box (2px `--m-dim` border, 11px
 *  centered mono glyph). Two documented `size` variants:
 *  • **20px fixed square** (`size-5 min-w-5`, the default) — the menu-hint badge
 *    in {@link KeyHints}, which only ever holds single glyphs.
 *  • **20px keycap FLOOR** (`h-5 min-w-5 px-0.5`, passed by the CONTROLS-modal
 *    `CaptureChip` alongside `codeGlyph(code, true)` + `filled`) — a square FLOOR
 *    every SINGLE glyph lands on (letter OR the wider `size-3` arrow/SPACE icon:
 *    12px icon + 4px inner pad + 4px border = 20, so the icon reaches the floor
 *    instead of overshooting a smaller one and rendering wider than its letter
 *    neighbours — the sizing bug this floor fixes) that GROWS in width for the
 *    multi-char gamepad labels (`START`, `D-PAD ←`, `LB`) a fixed square would
 *    clip; the 2px inner pad gives those labels air while single glyphs stay a
 *    clean 20px square. `filled` adds the raised `--m-card` keycap fill (modal
 *    only — the chip container itself is transparent). Still fits Hold's
 *    three-up `C ⇧ ⇧ᵣ` default inside the 36px chip at the modal's `md` width.
 *  `min-w`/`shrink-0` keep a wide glyph (or a tight flex row) from deforming it. */
export function KbdBadge({
  children,
  size = "size-5 min-w-5",
  filled = false,
}: {
  children: React.ReactNode;
  size?: string;
  /** Raised `--m-card` keycap fill — the CONTROLS-modal badges only (their chip
   *  container is transparent, so the fill lives on the caps); menu badges stay
   *  unfilled. */
  filled?: boolean;
}) {
  return (
    <kbd
      className={`flex ${size} shrink-0 items-center justify-center border-2 border-[var(--m-dim)] font-mono text-[11px] leading-none text-[var(--m-fg)] ${
        filled ? "bg-[var(--m-card)]" : ""
      }`}
    >
      {children}
    </kbd>
  );
}

/** Parse a pre-joined hint value into badge tokens + plain separators, or return
 *  `null` for a PROSE row (a `GOAL` line like "Merge to 2048" — spaces but no key
 *  separator; rendered as-is, never boxed). Keys arrive whitespace-delimited
 *  (per-key across every game's format, incl. the space-clustered `↑ ↓ ← →` /
 *  `W A S D` rows and the `/`·`·`-joined Tetris rows). The `/` between SAME-action
 *  alternates is DROPPED (they render as adjacent gap-1 badges); the `·` between
 *  two DIFFERENT actions and the "—" unbound mark stay plain. Badge labels resolve
 *  to a single glyph via {@link keyGlyph} at render time. */
function parseHint(v: string): HintToken[] | null {
  if (/\s/.test(v) && !/[/·]/.test(v)) return null;
  return v
    .split(/\s+/)
    .filter((t) => t && t !== "/")
    .map((text) => ({ text, badge: text !== "·" && text !== "—" }));
}

/** Control reference — the menu overlay's key-hint table (11px/0.12em muted label
 *  + kbd-style key badges). Each key renders as a uniform 20px square glyph box
 *  (`size-5` + `min-w-5` so a wide glyph can never stretch it, 2px `--m-dim`
 *  border — the quiet secondary border, lighter than the 36px chips); same-action
 *  alternates sit `gap-1` apart, the `·` separator stays plain. Each game passes
 *  its own `[label, keys]` rows. */
export function KeyHints({
  hints,
}: {
  hints: readonly (readonly [string, string])[];
}) {
  return (
    <div className="flex flex-col gap-1">
      {hints.map(([k, v]) => {
        const tokens = parseHint(v);
        return (
          <div
            key={k}
            className="flex items-center gap-2.5 text-[11px] tracking-[0.12em] text-[var(--m-muted)] uppercase"
          >
            <span className="w-[76px] shrink-0 text-[var(--m-muted2)]">
              {k}
            </span>
            {tokens === null ? (
              <span className="tracking-normal text-[var(--m-fg)] normal-case">
                {v}
              </span>
            ) : (
              <span className="flex flex-wrap items-center gap-1 tracking-normal normal-case">
                {tokens.map((t, i) =>
                  t.badge ? (
                    <KbdBadge key={i}>{keyGlyph(t.text)}</KbdBadge>
                  ) : (
                    <span key={i} className="text-[var(--m-muted2)]">
                      {t.text}
                    </span>
                  )
                )}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Static overlay heading (pause / won screens) — the same 32px display line as
 *  {@link OverlayTitle}, without the glitch (18 on mobile, same step). */
export function OverlayHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-display text-[18px] leading-none font-bold tracking-[-0.02em] text-[var(--m-fg)] sm:text-[32px]">
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
  extra,
}: {
  title: string;
  onStart: () => void;
  /** Optional key-hint rows. Omitted on every game today (the on-menu hint list
   *  was removed — the CONTROLS modal is the single reference); kept optional so
   *  a future game can reintroduce the rows without re-threading the prop. */
  hints?: readonly (readonly [string, string])[];
  startLabel?: string;
  /** Optional slot under the key hints (e.g. the Tetris CONTROLS opener). */
  extra?: React.ReactNode;
}) {
  return (
    <div className={overlayBase}>
      <OverlayRail>
        <OverlayTitle>{title}</OverlayTitle>
        <ArcadeButton onClick={onStart}>{startLabel}</ArcadeButton>
        {hints && hints.length > 0 && <KeyHints hints={hints} />}
        {extra}
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
        {/* 32 on mobile / the 46 stat size from sm — both in-set endpoints. */}
        <div className="font-display text-[32px] leading-none font-bold text-[var(--m-accent)] tabular-nums sm:text-[46px]">
          {formatScore(score)}
        </div>
        <OverlayDetail>{detail}</OverlayDetail>
        <ArcadeButton onClick={onRestart}>Play again</ArcadeButton>
      </OverlayRail>
    </motion.div>
  );
}
