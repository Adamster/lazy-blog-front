"use client";

import { RevealMark, AsciiDivider } from "@/shared/ui/prose";
import { Section, Panel, State } from "./_helpers";

/* ------------------------------ post fx ------------------------------ */

function PostFxSection() {
  return (
    <Section
      index="01"
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

export function LabTab() {
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
        The in-post effect marks kept for a later lib migration — each
        round-trips as a remark directive and renders here exactly as in the
        read view. Every animation degrades under reduced-motion. Theme follows
        the header toggle. (Text FX — GlitchText / MatrixText — live on the
        Components tab; the glyph-rain experiments on the Glyph Rain tab.)
      </p>

      <div className="mt-7 border-l-2 border-[var(--m-accent)] bg-[var(--m-card)] p-4 text-[14px] leading-[1.6] text-[var(--m-muted)]">
        Toys, not chrome. Same accent, same glyphs, same square 2px geometry —
        just having fun.
      </div>

      <div className="mt-10 flex flex-col gap-10">
        <PostFxSection />
      </div>
    </>
  );
}
