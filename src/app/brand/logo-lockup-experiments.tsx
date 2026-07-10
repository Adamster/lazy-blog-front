"use client";

import type { CSSProperties, ReactNode } from "react";
import { GlitchText, MatrixText } from "@/shared/ui/effects";
import { Section } from "./_helpers";

// EXPLORATION ONLY — these do NOT touch the live header (header.tsx /
// header-lockup.tsx). The problem: on the Blog route the header reads
// "[ TEAM ] NOT LAZY   [ BLOG ]   ARCADE" — two bracket-decorated elements in
// one row read as tautological. Each row below pairs a candidate LOGO lockup
// with a real active/inactive NAV treatment so the "does it collide with the
// active-nav bracket?" question is answerable at a glance.

const MONO = { fontFamily: "var(--font-mono)" };
const NAV_ITEM =
  "text-[11px] leading-none font-medium tracking-[0.12em] uppercase";

// ── Shared logo parts ──────────────────────────────────────────────────────

function Wordmark() {
  return (
    <span className="font-display text-[14px] leading-none font-semibold text-[var(--m-fg)]">
      NOT <span className="text-[var(--m-accent)]">LAZY</span>
    </span>
  );
}

// The live filled-accent badge.
function FilledBadge({ label = "team" }: { label?: string }) {
  return (
    <span
      style={MONO}
      className="bg-[var(--m-accent)] px-2 py-2 text-[11px] leading-none font-medium tracking-[0.12em] text-[var(--m-bg)] uppercase"
    >
      [ {label} ]
    </span>
  );
}

// ── NAV treatments (each renders Blog=active, Arcade=inactive) ──────────────

// The live header nav: brackets appear on the active item; the inactive item
// keeps them at opacity-0 to reserve layout width.
function BracketNav() {
  return (
    <nav style={MONO} className="flex items-center gap-4">
      {[
        { label: "Blog", active: true },
        { label: "Arcade", active: false },
      ].map(({ label, active }) => (
        <span
          key={label}
          className={`${NAV_ITEM} ${
            active ? "text-[var(--m-accent)]" : "text-[var(--m-muted)]"
          }`}
        >
          <span className={active ? "opacity-100" : "opacity-0"}>{"[ "}</span>
          {label}
          <span className={active ? "opacity-100" : "opacity-0"}>{" ]"}</span>
        </span>
      ))}
    </nav>
  );
}

// Active item gets a leading 2px accent square (the system is square, not a dot).
function SquareMarkerNav() {
  return (
    <nav style={MONO} className="flex items-center gap-4">
      <span
        className={`${NAV_ITEM} flex items-center gap-2 text-[var(--m-accent)]`}
      >
        <span className="size-2 bg-[var(--m-accent)]" aria-hidden="true" />
        Blog
      </span>
      <span className={`${NAV_ITEM} text-[var(--m-muted)]`}>Arcade</span>
    </nav>
  );
}

// Active item ends in the shared blinking caret (a nod to the old typewriter).
function CaretNav() {
  return (
    <nav style={MONO} className="flex items-center gap-4">
      <span className={`${NAV_ITEM} flex items-center text-[var(--m-accent)]`}>
        Blog
        <span className="mono-caret" aria-hidden="true" />
      </span>
      <span className={`${NAV_ITEM} text-[var(--m-muted)]`}>Arcade</span>
    </nav>
  );
}

// Colour-only active state — no glyph, no box, just accent vs muted.
function PlainNav() {
  return (
    <nav style={MONO} className="flex items-center gap-4">
      <span className={`${NAV_ITEM} text-[var(--m-accent)]`}>Blog</span>
      <span className={`${NAV_ITEM} text-[var(--m-muted)]`}>Arcade</span>
    </nav>
  );
}

// ── Row harness ────────────────────────────────────────────────────────────

function Row({
  n,
  name,
  logo,
  nav = <BracketNav />,
}: {
  n: string;
  name: string;
  logo: ReactNode;
  nav?: ReactNode;
}) {
  return (
    <div className="bg-[var(--m-card)] p-7">
      <div className="mb-6 text-[11px] leading-none tracking-[0.12em] text-[var(--m-muted2)]">
        {n} — {name}
      </div>
      {/* gap-10 logo→nav + gap-4 nav mirror the live header row */}
      <div className="flex flex-wrap items-center gap-x-10 gap-y-6">
        {logo}
        {nav}
      </div>
    </div>
  );
}

// A diagonal "\" lit across a 3×3 monospace dot-matrix.
const LED_DIAGONAL = [
  true,
  false,
  false,
  false,
  true,
  false,
  false,
  false,
  true,
];
// A mostly-full HUD progress bar (deadpan: "not lazy" = almost done).
const HUD_SEGMENTS = [true, true, true, true, true, false, false];

// ── Sleepy "zzz" drift ──────────────────────────────────────────────────────
// Ambient "the brand is dozing off" tic: little z's float up-and-right off the
// end of LAZY, each on its OWN duration/delay/angle so the cluster reads chaotic
// rather than synchronised. Decorative icon glyphs (like the ✕ / icon carve-out
// in CLAUDE.md) — off the closed type scale, small (8–11px), aria-hidden.
// Loops continuously; under prefers-reduced-motion it freezes into a static,
// legible resting cluster (no motion), per the repo's effect convention.
const ZDRIFT_CSS = `
@keyframes mono-zdrift {
  0%   { opacity: 0; transform: translate(0,0) rotate(var(--z-rot)) scale(0.75); }
  18%  { opacity: 1; }
  100% { opacity: 0; transform: translate(var(--z-dx), var(--z-dy)) rotate(var(--z-rot2)) scale(1.1); }
}
.mono-zdrift {
  position: absolute;
  line-height: 1;
  animation-name: mono-zdrift;
  animation-duration: var(--z-dur, 2.4s);
  animation-delay: var(--z-delay, 0s);
  animation-timing-function: ease-out;
  animation-iteration-count: infinite;
}
@media (prefers-reduced-motion: reduce) {
  .mono-zdrift { animation: none; opacity: 1; transform: none; }
}
`;

type ZGlyph = {
  glyph: string;
  size: number;
  dur: string;
  delay: string;
  dx: string;
  dy: string;
  rot: string;
  rot2: string;
  left: string;
  bottom: string;
};

// Variant 16 — tight, quick accent z's.
const ZZZ_ACCENT: ZGlyph[] = [
  { glyph: "z", size: 8, dur: "1.9s", delay: "0s", dx: "10px", dy: "-12px", rot: "10deg", rot2: "28deg", left: "0px", bottom: "4px" }, // prettier-ignore
  { glyph: "z", size: 9, dur: "2.2s", delay: "0.6s", dx: "14px", dy: "-16px", rot: "-8deg", rot2: "16deg", left: "3px", bottom: "6px" }, // prettier-ignore
  { glyph: "Z", size: 11, dur: "2.8s", delay: "1.2s", dx: "20px", dy: "-24px", rot: "6deg", rot2: "-14deg", left: "6px", bottom: "8px" }, // prettier-ignore
];

// Variant 17 — wider, slower muted z's.
const ZZZ_MUTED: ZGlyph[] = [
  { glyph: "z", size: 8, dur: "3.2s", delay: "0s", dx: "18px", dy: "-14px", rot: "12deg", rot2: "-20deg", left: "0px", bottom: "5px" }, // prettier-ignore
  { glyph: "Z", size: 11, dur: "2.6s", delay: "0.8s", dx: "26px", dy: "-22px", rot: "-6deg", rot2: "18deg", left: "4px", bottom: "9px" }, // prettier-ignore
  { glyph: "z", size: 9, dur: "3.6s", delay: "1.5s", dx: "14px", dy: "-28px", rot: "4deg", rot2: "-26deg", left: "8px", bottom: "7px" }, // prettier-ignore
];

function SleepyLogo({
  config,
  color,
  badge = false,
}: {
  config: ZGlyph[];
  color: string;
  badge?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      {badge ? <FilledBadge /> : null}
      <span className="relative inline-block">
        <Wordmark />
        <span
          className="pointer-events-none absolute top-0 right-0"
          aria-hidden="true"
        >
          {config.map((z, i) => (
            <span
              key={i}
              className={`mono-zdrift font-display font-bold ${color}`}
              style={
                {
                  left: z.left,
                  bottom: z.bottom,
                  fontSize: `${z.size}px`,
                  "--z-dur": z.dur,
                  "--z-delay": z.delay,
                  "--z-dx": z.dx,
                  "--z-dy": z.dy,
                  "--z-rot": z.rot,
                  "--z-rot2": z.rot2,
                } as CSSProperties
              }
            >
              {z.glyph}
            </span>
          ))}
        </span>
      </span>
    </span>
  );
}

// ── Section ────────────────────────────────────────────────────────────────

export function LogoLockupExperiments() {
  return (
    <Section
      index="02"
      title="LOGO LOCKUP EXPERIMENTS"
      intro="Exploration only — the live header is untouched. On the Blog route it reads “[ TEAM ] NOT LAZY  [ BLOG ]  ARCADE”: two bracket-decorated elements in one row read as tautological. Each cell pairs a candidate logo lockup with a real active/inactive nav treatment so the collision (or its absence) is visible at a glance. Blog = active, Arcade = inactive."
    >
      <div className="flex flex-col gap-7">
        <style dangerouslySetInnerHTML={{ __html: ZDRIFT_CSS }} />
        {/* ── KEPT (restyle the NAV indicator, or effect-driven marks) ── */}
        <Row
          n="01"
          name="badge stays · nav active = leading accent square"
          logo={
            <span className="inline-flex items-center gap-2">
              <FilledBadge />
              <Wordmark />
            </span>
          }
          nav={<SquareMarkerNav />}
        />
        <Row
          n="02"
          name="badge stays · nav active = blinking caret"
          logo={
            <span className="inline-flex items-center gap-2">
              <FilledBadge />
              <Wordmark />
            </span>
          }
          nav={<CaretNav />}
        />
        <Row
          n="03"
          name="ironic badge · [ probably ] NOT LAZY"
          logo={
            <span className="inline-flex items-center gap-2">
              <FilledBadge label="probably" />
              <Wordmark />
            </span>
          }
        />
        <Row
          n="04"
          name="terminal prompt · ~/not-lazy $ + caret"
          logo={
            <span
              style={MONO}
              className="inline-flex items-center text-[14px] leading-none font-medium text-[var(--m-fg)]"
            >
              ~/not-lazy&nbsp;
              <span className="text-[var(--m-accent)]">$</span>
              <span className="mono-caret" aria-hidden="true" />
            </span>
          }
          nav={<PlainNav />}
        />
        <Row
          n="05"
          name="GlitchText on LAZY (hover) · bracket-free"
          logo={
            <span className="font-display text-[14px] leading-none font-semibold text-[var(--m-fg)]">
              NOT{" "}
              <GlitchText className="font-display text-[var(--m-accent)]">
                LAZY
              </GlitchText>
            </span>
          }
        />
        <Row
          n="06"
          name="MatrixText scramble on NOT LAZY (hover) · no badge"
          logo={
            <MatrixText
              text="NOT LAZY"
              trigger="hover"
              className="font-display cursor-default text-[14px] leading-none font-semibold text-[var(--m-fg)]"
            />
          }
          nav={<PlainNav />}
        />

        {/* ── NEW · more designed — graphic/geometric devices & scale play ── */}

        {/* Vertical filled tab: "TEAM" as an index tab, not an inline badge. */}
        <Row
          n="07"
          name="vertical TEAM tab · rotated index tab"
          logo={
            <span className="inline-flex items-center gap-2.5">
              <span
                style={MONO}
                className="rotate-180 bg-[var(--m-accent)] px-1 py-2 text-[11px] leading-none font-medium tracking-[0.12em] text-[var(--m-bg)] uppercase [writing-mode:vertical-rl]"
              >
                team
              </span>
              <Wordmark />
            </span>
          }
        />

        {/* Crop / registration marks: an L at two opposite corners frames the
            wordmark without ever drawing a full [ ] bracket. */}
        <Row
          n="08"
          name="crop-mark frame · accent L corners (no full bracket)"
          logo={
            <span className="relative inline-block px-2.5 py-2">
              <span
                aria-hidden="true"
                className="absolute top-0 left-0 size-2.5 border-t-2 border-l-2 border-[var(--m-accent)]"
              />
              <span
                aria-hidden="true"
                className="absolute right-0 bottom-0 size-2.5 border-r-2 border-b-2 border-[var(--m-accent)]"
              />
              <Wordmark />
            </span>
          }
        />

        {/* Scale contrast: a big accent monogram beside a tiny stacked label. */}
        <Row
          n="09"
          name="NL monogram + micro-label · scale contrast"
          logo={
            <span className="inline-flex items-center gap-2.5">
              <span className="font-display text-[32px] leading-none font-bold tracking-[-0.02em] text-[var(--m-accent)]">
                NL
              </span>
              <span
                style={MONO}
                className="flex flex-col gap-1 text-[11px] leading-none font-medium tracking-[0.12em] text-[var(--m-muted)] uppercase"
              >
                <span>not</span>
                <span>lazy</span>
              </span>
            </span>
          }
        />

        {/* Duotone misregistration: a 2px-offset accent ghost — a designed,
            static take on the glitch identity. */}
        <Row
          n="10"
          name="duotone misregistration · 2px accent offset"
          logo={
            <span
              className="font-display relative inline-block text-[14px] leading-none font-semibold"
              aria-label="NOT LAZY"
            >
              <span
                aria-hidden="true"
                className="absolute top-0 left-0 translate-x-[2px] translate-y-[2px] text-[var(--m-accent)]"
              >
                NOT LAZY
              </span>
              <span aria-hidden="true" className="relative text-[var(--m-fg)]">
                NOT LAZY
              </span>
            </span>
          }
        />

        {/* Dot-matrix mark: a monospace LED grid lights a diagonal. */}
        <Row
          n="11"
          name="dot-matrix LED mark · lit diagonal"
          logo={
            <span className="inline-flex items-center gap-2.5">
              <span className="grid grid-cols-3 gap-1" aria-hidden="true">
                {LED_DIAGONAL.map((on, i) => (
                  <span
                    key={i}
                    className={`size-1 ${
                      on ? "bg-[var(--m-accent)]" : "bg-[var(--m-dim)]"
                    }`}
                  />
                ))}
              </span>
              <Wordmark />
            </span>
          }
        />

        {/* Redaction: "LAZY" struck under a solid classified bar. */}
        <Row
          n="12"
          name="redacted mark · NOT ▮▮▮ (classified bar)"
          logo={
            <span
              className="font-display inline-flex items-center gap-2 text-[14px] leading-none font-semibold text-[var(--m-fg)]"
              aria-label="NOT LAZY"
            >
              <span aria-hidden="true">NOT</span>
              <span
                aria-hidden="true"
                className="inline-block h-3.5 w-16 bg-[var(--m-fg)]"
              />
            </span>
          }
        />

        {/* Editorial masthead: a 2px accent rule + eyebrow over the wordmark. */}
        <Row
          n="13"
          name="editorial masthead · accent rule + eyebrow"
          logo={
            <span className="inline-flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="h-8 w-0.5 bg-[var(--m-accent)]"
              />
              <span className="flex flex-col gap-1">
                <span
                  style={MONO}
                  className="text-[11px] leading-none tracking-[0.12em] text-[var(--m-muted2)] uppercase"
                >
                  {"// team"}
                </span>
                <Wordmark />
              </span>
            </span>
          }
        />

        {/* Stacked scale drama: tiny "NOT" perched over a big accent "LAZY". */}
        <Row
          n="14"
          name="stacked scale drama · tiny NOT / big LAZY"
          logo={
            <span className="inline-flex flex-col items-start gap-1">
              <span
                style={MONO}
                className="text-[11px] leading-none font-medium tracking-[0.12em] text-[var(--m-muted)] uppercase"
              >
                not
              </span>
              <span className="font-display text-[32px] leading-none font-bold tracking-[-0.02em] text-[var(--m-accent)]">
                LAZY
              </span>
            </span>
          }
        />

        {/* HUD device: a segmented progress bar under the wordmark. */}
        <Row
          n="15"
          name="HUD segment bar · nearly-full progress device"
          logo={
            <span className="inline-flex flex-col gap-2">
              <Wordmark />
              <span className="flex gap-1" aria-hidden="true">
                {HUD_SEGMENTS.map((on, i) => (
                  <span
                    key={i}
                    className={`h-1 w-4 ${
                      on ? "bg-[var(--m-accent)]" : "bg-[var(--m-dim)]"
                    }`}
                  />
                ))}
              </span>
            </span>
          }
        />

        {/* ── NEW · ambient sleepy "zzz" drift (loops; reduced-motion static) ── */}

        {/* Favourite pairing: filled badge + leading-square active nav. */}
        <Row
          n="16"
          name="sleepy zzz drift · accent z's · badge + square nav"
          logo={
            <SleepyLogo
              config={ZZZ_ACCENT}
              color="text-[var(--m-accent)]"
              badge
            />
          }
          nav={<SquareMarkerNav />}
        />

        {/* Calmer take: bracket-free wordmark, muted wider z's, plain nav. */}
        <Row
          n="17"
          name="sleepy zzz drift · muted z's · bracket-free + plain nav"
          logo={<SleepyLogo config={ZZZ_MUTED} color="text-[var(--m-muted)]" />}
          nav={<PlainNav />}
        />
      </div>
    </Section>
  );
}
