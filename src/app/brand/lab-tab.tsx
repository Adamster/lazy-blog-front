"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RevealMark, AsciiDivider } from "@/shared/ui/prose";
import { MatrixRain, MatrixRainOverlay } from "@/shared/ui/effects";
import { Section, Panel, Spec, State } from "./_helpers";
import { addToastSuccess } from "@/shared/lib/toasts";

/* ------------------------------- 01 · rain ------------------------------- */

function RainSection({ onFullscreen }: { onFullscreen: () => void }) {
  return (
    <Section
      index="01"
      title="MATRIX RAIN"
      intro="Falling glyph columns on canvas, drawn in the LIVE accent (it tracks the theme). The loop is rAF-throttled and stops when this tab isn't shown; click Go fullscreen to drown the page in it (Esc / click to dismiss). Reduced motion paints a single static frame."
    >
      <Panel caption="// CANVAS — live accent">
        <div className="relative h-[260px] overflow-hidden border-2 border-[var(--m-dim)] bg-black">
          <MatrixRain />
          <button
            type="button"
            onClick={onFullscreen}
            className="absolute right-4 bottom-4 inline-flex h-9 items-center justify-center border-2 border-[var(--m-accent)] bg-black/40 px-4 text-[11px] font-semibold tracking-[0.12em] text-[var(--m-accent)] uppercase transition-colors hover:bg-[var(--m-accent)] hover:text-black"
          >
            Go fullscreen
          </button>
        </div>
        <Spec label="render loop" value="rAF · ~18fps · ResizeObserver" />
        <Spec label="reduced motion" value="one static frame" />
      </Panel>
    </Section>
  );
}

/* ------------------------------ 02 · post fx ------------------------------ */

function PostFxSection() {
  return (
    <Section
      index="02"
      title="POST FX"
      intro="The in-article marks kept for a later lib migration — each round-trips as a remark directive and renders here exactly as in the read view. Inline: `:spoiler`, `:strike`. Block: `::divider`. All bounded and reading-safe."
    >
      <div className="flex flex-col gap-7">
        {/* Inline marks */}
        <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
          <Panel caption="// :spoiler — signal blur">
            <State caption="click to sharpen (stays revealed)">
              <p className="text-[14px] leading-[1.6] text-[var(--m-fg)]">
                In the finale,{" "}
                <RevealMark variant="blur">the sloth wins</RevealMark>.
              </p>
            </State>
          </Panel>
          <Panel caption="// :strike — struck-out edit">
            <State caption="a permanent static strikethrough">
              <p className="text-[14px] leading-[1.6] text-[var(--m-fg)]">
                Ship it <RevealMark variant="strike">tomorrow</RevealMark> now.
              </p>
            </State>
          </Panel>
        </div>

        {/* Block directives */}
        <Panel caption="// ::divider — ASCII section break">
          <div className="mono-prose">
            <AsciiDivider variant="dots" />
            <AsciiDivider variant="slash" />
          </div>
        </Panel>
      </div>
    </Section>
  );
}

/* --------------------------------- the tab --------------------------------- */

const KONAMI = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

export function LabTab() {
  const [rainOpen, setRainOpen] = useState(false);
  const openRain = useCallback(() => setRainOpen(true), []);
  const closeRain = useCallback(() => setRainOpen(false), []);

  // Konami listener — `konIdx` tracks progress without re-rendering; `openRain`
  // is a stable useCallback so the listener binds once.
  const konIdx = useRef(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const want = KONAMI[konIdx.current];
      const hit =
        e.key === want || (want.length === 1 && e.key.toLowerCase() === want);
      if (hit) {
        konIdx.current++;
        if (konIdx.current === KONAMI.length) {
          konIdx.current = 0;
          openRain();
          addToastSuccess("↑↑↓↓←→←→ B A — cheat unlocked");
        }
      } else {
        konIdx.current = e.key === KONAMI[0] ? 1 : 0;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openRain]);

  return (
    <>
      {/* Masthead — mirrors ComponentsTab. */}
      <div className="text-[11px] tracking-[0.12em] text-[var(--m-accent)]">
        {"// NOT LAZY — LAB · EFFECTS & TOYS"}
      </div>
      <h1 className="font-display mt-7 text-[40px] leading-none font-bold tracking-[-0.02em]">
        Lab
      </h1>
      <p className="mt-5 text-[14px] leading-[1.7] text-[var(--m-muted)]">
        The effect primitives — the Matrix Rain canvas + the in-post marks kept
        for a later lib migration. They react to hover, click or your keyboard,
        and every animation degrades under reduced-motion. Theme follows the
        header toggle. (Text FX — GlitchText / MatrixText — live on the
        Components tab; the glyph-rain experiments on the Glyph Rain tab.)
      </p>

      <div className="mt-7 border-l-2 border-[var(--m-accent)] bg-[var(--m-card)] p-4 text-[14px] leading-[1.6] text-[var(--m-muted)]">
        Toys, not chrome. Same accent, same glyphs, same square 2px geometry —
        just having fun.{" "}
        <span className="text-[var(--m-accent)]">
          Psst — try the Konami code anywhere on this tab.
        </span>
      </div>

      <div className="mt-10 flex flex-col gap-10">
        <RainSection onFullscreen={openRain} />
        <PostFxSection />
      </div>

      <MatrixRainOverlay isOpen={rainOpen} onClose={closeRain} />
    </>
  );
}
