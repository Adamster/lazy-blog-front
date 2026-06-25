"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import {
  ConsoleTitleBar,
  GlitchText,
  MatrixRain,
  MatrixRainOverlay,
  MatrixText,
  RevealMark,
  Kbd,
  ScanText,
  AsciiDivider,
  PullQuote,
  Callout,
  Transcript,
  AsciiArt,
  BootSequence,
  GlyphCursorTrail,
  CiteTooltip,
  MarginRef,
  CountUp,
  WaveHighlight,
  ScanLink,
  DiffBlock,
  PollBlock,
  AnsiBlock,
  FoldBlock,
  CompareSlider,
  DitherCam,
  SpotlightDecode,
  Marquee,
  DatamoshHeadline,
  AsciiBox,
  GravityWell,
  ChannelSurf,
  WeightWave,
  BootSplash,
} from "@/shared/ui";
import { Section, Panel, Spec, State } from "./_helpers";
import { addToastSuccess } from "@/shared/lib/toasts";

/* ------------------------------- shared bits ------------------------------- */

/** Screen-black terminal panel frame (the documented canvas/terminal exception). */
const SCREEN = "border-2 border-[var(--m-dim)] bg-[#0d0d0d]";

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

/* ---------------------------- 02 · glitch on hover ---------------------------- */

function GlitchHoverSection() {
  return (
    <Section
      index="02"
      title="RGB GLITCH ON HOVER"
      intro="Hover (or focus) the headline for a chromatic-split datamosh — accent + error ghosts tear off the baseline. Pure CSS, theme-aware; reduced motion holds a single static split."
    >
      <Panel caption="// HOVER THE HEADLINE">
        <div className="flex justify-center py-7">
          <GlitchText
            hover
            className="font-display text-[40px] leading-none font-bold tracking-[-0.02em] text-[var(--m-fg)]"
          >
            STAY LAZY
          </GlitchText>
        </div>
        <Spec label="primitive" value="GlitchText · hover" />
      </Panel>
    </Section>
  );
}

/* ------------------------------ 03 · text fx ------------------------------ */

function TextFxSection() {
  return (
    <Section
      index="03"
      title="TEXT FX"
      intro="The base text-effect primitives the rest of the lab sits on. GlitchText (jitter + accent/error chromatic ghosts + caret — the error-page headline) auto-beats on its own; MatrixText decodes a string from scrambled glyphs and loops. Both are theme-aware and hold a single static frame under reduced-motion."
    >
      <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
        <Panel caption="// GLITCHTEXT — auto beat">
          <State caption="jitter + accent/error ghosts + caret (error pages)">
            <span className="font-display text-[32px] leading-none font-bold tracking-[-0.02em] text-[var(--m-fg)]">
              <GlitchText caret>Glitch</GlitchText>
            </span>
          </State>
        </Panel>
        <Panel caption="// MATRIXTEXT — decode loop">
          <State caption="scrambled → resolved · respects reduced-motion">
            <MatrixText
              text="// SIGNAL SENT ... NO REPLY YET"
              className="mono-label"
            />
          </State>
        </Panel>
      </div>
    </Section>
  );
}

/* ------------------------------ 05 · terminal ------------------------------ */

interface TermLine {
  text: string;
  tone: "muted" | "muted2" | "fg" | "accent" | "error";
}

const TONE_CLASS: Record<TermLine["tone"], string> = {
  muted: "text-[var(--m-muted)]",
  muted2: "text-[var(--m-muted2)]",
  fg: "text-[var(--m-fg)]",
  accent: "text-[var(--m-accent)]",
  error: "text-[var(--m-error)]",
};

function TerminalSection({
  onTheme,
  onMatrix,
}: {
  onTheme: () => void;
  onMatrix: () => void;
}) {
  const [lines, setLines] = useState<TermLine[]>([
    {
      text: "NOT LAZY terminal v2.0 — type `help` and hit Enter",
      tone: "muted2",
    },
  ]);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const run = (raw: string) => {
    const trimmed = raw.trim();
    const echo: TermLine = { text: `guest@notlazy:~$ ${trimmed}`, tone: "fg" };
    const [cmd, ...rest] = trimmed.split(/\s+/);
    const arg = rest.join(" ");
    let out: TermLine[] = [];
    switch ((cmd || "").toLowerCase()) {
      case "":
        break;
      case "help":
        out = [
          {
            text: "available: help · ls · whoami · theme · matrix · glitch · sloth · date · echo <x> · clear",
            tone: "muted",
          },
        ];
        break;
      case "ls":
        out = [
          {
            text: "Field.tsx  Select.tsx  GlitchText.tsx  MatrixText.tsx  MatrixRain.tsx  index.ts",
            tone: "accent",
          },
        ];
        break;
      case "whoami":
        out = [
          {
            text: "guest@notlazy — clearance: visitor — vibe: unbothered",
            tone: "muted",
          },
        ];
        break;
      case "theme":
        onTheme();
        out = [{ text: "toggled theme.", tone: "accent" }];
        break;
      case "matrix":
        onMatrix();
        out = [{ text: "entering the construct…", tone: "accent" }];
        break;
      case "glitch":
        out = [{ text: "S̷T̴A̶Y̷ ̴L̶A̷Z̸Y̷ — signal corrupted", tone: "error" }];
        break;
      case "sloth":
        out = [
          { text: "(•ᴥ•)  zzz… (still faster than your CI)", tone: "accent" },
        ];
        break;
      case "date":
        out = [{ text: new Date().toString(), tone: "muted" }];
        break;
      case "echo":
        out = [{ text: arg, tone: "fg" }];
        break;
      case "clear":
        setLines([]);
        setInput("");
        return;
      default:
        out = [
          { text: `command not found: ${cmd} — try \`help\``, tone: "error" },
        ];
    }
    setLines((prev) => [...prev, echo, ...out].slice(-40));
    setInput("");
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") run(input);
  };

  return (
    <Section
      index="05"
      title="FAKE TERMINAL (it talks back)"
      intro="A real prompt. Type help and hit Enter. Knows: help, ls, whoami, theme, matrix, glitch, sloth, date, echo, clear."
    >
      <Panel caption="// guest@notlazy ~ %">
        <button
          type="button"
          onClick={() => inputRef.current?.focus()}
          aria-label="Focus terminal"
          className={`block w-full cursor-text text-left ${SCREEN}`}
        >
          <ConsoleTitleBar title="guest@notlazy ~ %" />
          <div className="mono-scrollbar max-h-[280px] min-h-[180px] overflow-auto p-5 text-[14px] leading-[1.6]">
            {lines.map((line, i) => (
              <div
                key={i}
                className={`break-words whitespace-pre-wrap ${TONE_CLASS[line.tone]}`}
              >
                {line.text}
              </div>
            ))}
            <div className="flex items-center gap-2">
              <span className="flex-none text-[var(--m-accent)]">
                guest@notlazy:~$
              </span>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="type a command…"
                spellCheck={false}
                autoComplete="off"
                aria-label="Terminal command"
                className="flex-1 border-0 bg-transparent text-[14px] text-[var(--m-accent)] caret-[var(--m-accent)] outline-none placeholder:text-[var(--m-muted2)]"
              />
            </div>
          </div>
        </button>
      </Panel>
    </Section>
  );
}

/* ----------------------- 06 · post inline effects ----------------------- */

function PostInlineFxSection() {
  return (
    <Section
      index="06"
      title="POST INLINE FX"
      intro="The inline marks you can drop straight into an article — each round-trips as a remark directive (`:redact[…]`, `:spoiler[…]`, `:type[…]`, `:kbd[…]`, `:scan[…]`) and renders here exactly as it does in the read view. All are bounded and reading-safe; the animated ones hold their legible end-state under reduced-motion."
    >
      <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
        <Panel caption="// :redact — censor bar">
          <State caption="hover / focus to wipe the bar away L→R">
            <p className="text-[14px] leading-[1.6] text-[var(--m-fg)]">
              The launch date is{" "}
              <RevealMark variant="redact">June 30th</RevealMark> — keep it
              quiet.
            </p>
          </State>
        </Panel>
        <Panel caption="// :spoiler — signal blur">
          <State caption="click to sharpen (stays revealed)">
            <p className="text-[14px] leading-[1.6] text-[var(--m-fg)]">
              In the finale,{" "}
              <RevealMark variant="blur">the sloth wins</RevealMark>.
            </p>
          </State>
        </Panel>
        <Panel caption="// :type — decode on scroll">
          <State caption="one decode pass when scrolled into view">
            <p className="text-[14px] leading-[1.6] text-[var(--m-fg)]">
              <MatrixText text="DECODING TRANSMISSION" trigger="scroll" />
            </p>
          </State>
        </Panel>
        <Panel caption="// :kbd — keycap">
          <State caption="static key cap">
            <p className="flex flex-wrap items-center gap-2 text-[14px] leading-[1.6] text-[var(--m-fg)]">
              Press <Kbd>ESC</Kbd> then <Kbd>⌘ K</Kbd> to search.
            </p>
          </State>
        </Panel>
        <Panel
          caption="// :scan — scanline highlight"
          className="lg:col-span-2"
        >
          <State caption="resting accent wash + a one-shot sweep on scroll-in / hover">
            <p className="text-[14px] leading-[1.6] text-[var(--m-fg)]">
              This is the <ScanText>single most important line</ScanText> in the
              whole brief.
            </p>
          </State>
        </Panel>
      </div>
    </Section>
  );
}

/* ----------------------- 07 · post block effects ----------------------- */

const TRANSCRIPT_LINES = [
  { text: "$ npm run deploy --stay-lazy", tone: "prompt" as const },
  { text: "→ building brutalist bundle…", tone: "output" as const },
  { text: "→ mounting /sloth", tone: "output" as const },
  { text: "! warning: too much effort detected", tone: "error" as const },
  { text: "✓ shipped. went back to sleep.", tone: "prompt" as const },
];

function PostBlockFxSection() {
  return (
    <Section
      index="07"
      title="POST BLOCK FX"
      intro="The block-level directives for longer-form structure — an ASCII section break (`::divider`), a terminal pull-quote (`:::quote`), a console callout (`:::callout`) and a read-only transcript (`:::terminal`). Each reuses the documented prose recipe (hr rhythm, blockquote chrome, info-box, console), so they read as part of the article, not chrome."
    >
      <div className="flex flex-col gap-7">
        <Panel caption="// ::divider — ASCII section break">
          <div className="mono-prose">
            <AsciiDivider variant="dots" />
            <AsciiDivider variant="slash" />
            <AsciiDivider variant="mark" />
          </div>
        </Panel>
        <Panel caption="// :::quote — terminal pull-quote">
          <div className="mono-prose">
            <PullQuote cite="@sloth">
              Why rush? The branch isn’t going anywhere.
            </PullQuote>
          </div>
        </Panel>
        <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
          <Panel caption="// :::callout{note}">
            <div className="mono-prose">
              <Callout type="note">
                Drafts never reach the home feed — the overlay only shows to
                you.
              </Callout>
            </div>
          </Panel>
          <Panel caption="// :::callout{warn}">
            <div className="mono-prose">
              <Callout type="warn">
                Deleting a post is permanent. There is no undo.
              </Callout>
            </div>
          </Panel>
        </div>
        <Panel caption="// :::terminal — transcript">
          <Transcript title="deploy.log" lines={TRANSCRIPT_LINES} />
          <Spec label="lines reveal" value="stagger on scroll-in" />
        </Panel>
      </div>
    </Section>
  );
}

/* -------------------------- 08 · ASCII sloth-cam -------------------------- */

function AsciiCamSection() {
  return (
    <Section
      index="08"
      title="ASCII SLOTH-CAM"
      intro="The sloth mark rendered as a density-glyph grid in the live accent on the screen-black panel, with a slow ‘developing’ reveal the first time it scrolls into view. LAB-only. Reduced motion paints the finished portrait at once."
    >
      <Panel caption="// /dev/video0">
        <AsciiArt />
        <Spec label="render" value="density ramp · 14×12 grid" />
        <Spec label="reduced motion" value="instant final frame" />
      </Panel>
    </Section>
  );
}

/* --------------------------- 09 · boot sequence --------------------------- */

function BootSection() {
  return (
    <Section
      index="09"
      title="BOOT SEQUENCE"
      intro="A fake BIOS log that types itself out line by line on scroll-in, at the MatrixText cadence, with a blinking caret on the active line. LAB-only. Reduced motion prints the whole log instantly."
    >
      <Panel caption="// /dev/sloth0">
        <BootSequence />
        <Spec label="cadence" value="~360ms / line" />
        <Spec label="reduced motion" value="full log, no typing" />
      </Panel>
    </Section>
  );
}

/* -------------------------- 10 · glyph cursor trail -------------------------- */

function CursorTrailSection() {
  return (
    <Section
      index="10"
      title="GLYPH CURSOR TRAIL"
      intro="Move the pointer across the panel — it spawns fading matrix glyphs in the accent that drift up and vanish in ~200ms, scoped to this box. LAB-only and disabled entirely under reduced-motion."
    >
      <Panel caption="// MOVE THE POINTER">
        <GlyphCursorTrail className="flex h-[220px] items-center justify-center border-2 border-[var(--m-dim)] bg-[#0d0d0d]">
          <span className="pointer-events-none text-[11px] tracking-[0.12em] text-[var(--m-muted2)] uppercase">
            drag the cursor through here
          </span>
        </GlyphCursorTrail>
        <Spec label="glyph life" value="~200ms · accent" />
        <Spec label="reduced motion" value="disabled" />
      </Panel>
    </Section>
  );
}

/* ----------------------- 11 · post inline FX II ----------------------- */

const DIFF_BODY = `function ship() {
- while (perfect) { polish(); }
+ if (goodEnough) return deploy();
  return nap();
}`;

function PostInlineFx2Section() {
  return (
    <Section
      index="11"
      title="POST INLINE FX — BATCH II"
      intro="The new inline marks for an article — each round-trips as a remark directive (`:cite[…]{note}`, `:ref[n]`, `:stat[n]`, `:strike[…]`, `:wave[…]`, `:link[…]{href}`) and renders here exactly as in the read view. All bounded and reading-safe; the animated ones hold their legible end-state under reduced-motion."
    >
      <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
        <Panel caption="// :cite — footnote decode tooltip">
          <State caption="hover / focus the term — the note decodes once">
            <p className="text-[14px] leading-[1.6] text-[var(--m-fg)]">
              The stack is{" "}
              <CiteTooltip note="Feature-Sliced Design — app / widgets / features / entities / shared.">
                FSD
              </CiteTooltip>{" "}
              all the way down.
            </p>
          </State>
        </Panel>
        <Panel caption="// :ref — margin ledger number">
          <State caption="hover scans a rule toward the note · jump-links">
            <p className="text-[14px] leading-[1.6] text-[var(--m-fg)]">
              Sloths sleep ~15h a day
              <MarginRef n="1" />, which is frankly aspirational.
            </p>
          </State>
        </Panel>
        <Panel caption="// :stat — counting readout">
          <State caption="rolls 0 → value on scroll-in">
            <p className="text-[14px] leading-[1.6] text-[var(--m-fg)]">
              The container measures <CountUp value={1240} />
              px wide.
            </p>
          </State>
        </Panel>
        <Panel caption="// :strike — self-redacting edit">
          <State caption="the strike draws L→R on scroll-in">
            <p className="text-[14px] leading-[1.6] text-[var(--m-fg)]">
              Ship it <RevealMark variant="strike">tomorrow</RevealMark> now.
            </p>
          </State>
        </Panel>
        <Panel caption="// :wave — caret sweep highlight">
          <State caption="a block-caret sweeps under, leaving the phrase accent">
            <p className="text-[14px] leading-[1.6] text-[var(--m-fg)]">
              Read <WaveHighlight>this part twice</WaveHighlight> before you
              merge.
            </p>
          </State>
        </Panel>
        <Panel caption="// :link — scanline hover link">
          <State caption="muted → accent + a 2px underline sweep on hover">
            <p className="text-[14px] leading-[1.6] text-[var(--m-fg)]">
              Full reference at{" "}
              <ScanLink href="https://example.com">the brand page</ScanLink>.
            </p>
          </State>
        </Panel>
      </div>
      <div className="mt-7">
        <Panel caption="// :stat{hero} — big readout">
          <State caption="Space Grotesk 46/700, tabular — same primitive, hero variant">
            <CountUp value={9001} variant="hero" />
          </State>
        </Panel>
      </div>
    </Section>
  );
}

/* ----------------------- 12 · post block FX II ----------------------- */

const POLL_ROWS = [
  { label: "Ship less", value: 62 },
  { label: "Ship more", value: 23 },
  { label: "Refactor forever", value: 15 },
];

function PostBlockFx2Section() {
  return (
    <Section
      index="12"
      title="POST BLOCK FX — BATCH II"
      intro="Block-level directives for longer-form structure — a redline patch (`:::diff`), an ASCII poll readout (`:::poll`), a colour-token swatch block (`::ansi`), a terminal spoiler (`:::fold`) and a before/after text slider (`:::compare`). Each is bounded (never full-bleed) and reuses the documented chrome."
    >
      <div className="flex flex-col gap-7">
        <Panel caption="// :::diff — redline / patch block">
          <div className="mono-prose">
            <DiffBlock body={DIFF_BODY} />
          </div>
        </Panel>
        <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
          <Panel caption="// :::poll — ASCII bar readout">
            <div className="mono-prose">
              <PollBlock rows={POLL_ROWS} />
            </div>
            <Spec label="bars fill" value="L→R on scroll-in" />
          </Panel>
          <Panel caption="// ::ansi — colour-token swatches">
            <div className="mono-prose">
              <AnsiBlock tokens="accent error muted fg" />
            </div>
            <Spec label="whitelist" value="accent · error · muted · fg" />
          </Panel>
        </div>
        <Panel caption="// :::fold — terminal spoiler">
          <div className="mono-prose">
            <FoldBlock
              summary="SHOW THE SECRET"
              decode="The sloth was the real MVP the whole time."
            />
          </div>
        </Panel>
        <Panel caption="// :::compare — before / after slider">
          <div className="mono-prose">
            <CompareSlider
              before={
                "const x = veryLongName\n  .filter(Boolean)\n  .map(toThing);"
              }
              after={"const x = items.map(toThing);"}
            />
          </div>
          <Spec label="handle" value="drag · ◂▸ · arrow-key ±4%" />
        </Panel>
      </div>
    </Section>
  );
}

/* ----------------------- 13 · ASCII dithercam ----------------------- */

function DitherCamSection() {
  return (
    <Section
      index="13"
      title="ASCII DITHERCAM"
      intro="Drop (or click to pick) an image and it renders as a live density-glyph portrait in the accent on the screen-black panel. Canvas-sampled to a luminance grid mapped onto the @%#*+=-:. ramp. LAB-only. The output is a static frame — nothing animates."
    >
      <Panel caption="// /dev/video1">
        <DitherCam />
        <Spec label="sample grid" value="64 cols · luminance ramp" />
      </Panel>
    </Section>
  );
}

/* ----------------------- 14 · pointer spotlight ----------------------- */

function SpotlightSection() {
  return (
    <Section
      index="14"
      title="POINTER SPOTLIGHT DECODE"
      intro="A scrambling glyph field that resolves the hidden message ONLY inside a circular mask following your cursor. LAB-only (pointer-global). Reduced motion resolves the whole field at once, no mask."
    >
      <Panel caption="// MOVE THE POINTER">
        <SpotlightDecode text="// STAY LAZY · SHIP LESS" />
        <Spec label="mask" value="radial · 64px · follows pointer" />
        <Spec label="reduced motion" value="whole field resolved" />
      </Panel>
    </Section>
  );
}

/* ----------------------- 15 · terminal marquee ----------------------- */

const TICKER = [
  "// STAY LAZY",
  "SHIP LESS",
  "SQUARE CORNERS",
  "2PX BORDERS",
  "LIME ACCENT",
  "DARK GREY, NEVER BLACK",
];

function MarqueeSection() {
  return (
    <Section
      index="15"
      title="TERMINAL MARQUEE TICKER"
      intro="An infinite horizontal band of phrases separated by middle-dots, scrolling right→left and pausing on hover. Full-bleed card band, 2px top/bottom rule, label scale. Reduced motion freezes it into a static, scrollable strip."
    >
      <Panel caption="// hover to pause">
        <Marquee items={TICKER} />
        <Spec label="loop" value="seamless · 22s · pause on hover" />
        <Spec label="reduced motion" value="static scroll strip" />
      </Panel>
    </Section>
  );
}

/* ----------------------- 16 · datamosh scroll smear ----------------------- */

function DatamoshSection() {
  return (
    <Section
      index="16"
      title="DATAMOSH SCROLL SMEAR"
      intro="Scroll the page FAST and this headline I-frame-smears — accent + error channels tear off in opposite slices — then self-heals the instant you slow down. Built on the GlitchText ghost markup, driven by scroll velocity. LAB-only. Reduced motion: never smears."
    >
      <Panel caption="// SCROLL FAST PAST ME">
        <div className="flex justify-center py-7">
          <DatamoshHeadline className="font-display text-[40px] leading-none font-bold tracking-[-0.02em] text-[var(--m-fg)]">
            SHIP LESS
          </DatamoshHeadline>
        </div>
        <Spec label="trigger" value="scroll velocity > 26px/frame" />
      </Panel>
    </Section>
  );
}

/* ----------------------- 17 · ASCII box constructor ----------------------- */

function AsciiBoxSection() {
  return (
    <Section
      index="17"
      title="ANSI BOX-DRAW CONSTRUCTOR"
      intro="A framed ASCII diagram (the FSD layer stack) that builds itself one line at a time on scroll-in, with the accent-marked rows in the live accent. Reuses the BootSequence stagger. LAB-only. Reduced motion: the full diagram prints at once."
    >
      <Panel caption="// fsd ~ stack.draw">
        <AsciiBox />
        <Spec label="cadence" value="~120ms / line" />
        <Spec label="reduced motion" value="instant full diagram" />
      </Panel>
    </Section>
  );
}

/* ----------------------- 18 · glyph gravity well ----------------------- */

function GravityWellSection() {
  return (
    <Section
      index="18"
      title="GLYPH GRAVITY WELL"
      intro="A static mono-glyph grid that bends toward your cursor — glyphs near the pointer pull in, swap to random characters and light up accent, settling back to a muted rest grid on leave. LAB-only (pointer-global). Reduced motion: an inert static grid."
    >
      <Panel caption="// MOVE THE POINTER">
        <GravityWell />
        <Spec label="pull" value="≤16px · radius 130px" />
        <Spec label="reduced motion" value="inert static grid" />
      </Panel>
    </Section>
  );
}

/* ----------------------- 19 · CRT channel-surf ----------------------- */

function ChannelSurfSection() {
  return (
    <Section
      index="19"
      title="CRT CHANNEL-SURF"
      intro="A contained ‘TV’ panel with a scoped scanline drape; the button hard-cuts to the next channel with a one-frame static roll-bar. Uses the `.mono-tv-*` scanline recipe at panel scale. LAB-only. Reduced motion: an instant cut, no roll."
    >
      <Panel caption="// sloth tv">
        <ChannelSurf />
        <Spec label="roll" value="one-frame · 160ms" />
        <Spec label="reduced motion" value="instant cut" />
      </Panel>
    </Section>
  );
}

/* ----------------------- 20 · weight-swap headline ----------------------- */

function WeightWaveSection() {
  return (
    <Section
      index="20"
      title="WEIGHT-SWAP HEADLINE"
      intro="Hover the headline and a wave runs L→R, each character snapping between REAL Space Grotesk weights (rest 700 → 500 on the crest, accent while lit) — NO fake variable axis, the project ships static weights. Display 40/-0.02em. Reduced motion: rests at 700, no wave."
    >
      <Panel caption="// HOVER THE HEADLINE">
        <div className="flex justify-center py-7">
          <WeightWave>STAY LAZY</WeightWave>
        </div>
        <Spec label="weights" value="700 ↔ 500 (loaded)" />
      </Panel>
    </Section>
  );
}

/* ----------------------- 21 · boot-to-blog splash ----------------------- */

function BootSplashSection() {
  return (
    <Section
      index="21"
      title="BOOT-TO-BLOG SPLASH"
      intro="A short boot log that, on completion, view-transition-morphs into the masthead (a shared view-transition-name ties them). Square 2px chrome, accent caret, a Replay link. LAB-only. Falls back to a plain cut where View Transitions are unsupported; reduced motion renders the masthead directly."
    >
      <Panel caption="// /dev/blog0 → masthead">
        <BootSplash />
        <Spec label="morph" value="View Transitions · cut fallback" />
        <Spec label="reduced motion" value="masthead direct" />
      </Panel>
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

  // Terminal `theme` command — reuse the documented theme model directly.
  const onTermTheme = useCallback(() => {
    const html = document.documentElement;
    const next = html.classList.contains("dark") ? "light" : "dark";
    html.setAttribute("data-theme", next);
    html.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem("theme", next);
    } catch {
      // storage unavailable — class still applies
    }
  }, []);

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
        A shelf of toys built on the same accent, glyph set and 2px geometry as
        the rest of the system — plus the effect primitives they sit on. They
        react to hover, click or your keyboard, and every animation degrades
        under reduced-motion. Theme follows the header toggle.
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
        <GlitchHoverSection />
        <TextFxSection />
        <TerminalSection onTheme={onTermTheme} onMatrix={openRain} />
        <PostInlineFxSection />
        <PostBlockFxSection />
        <AsciiCamSection />
        <BootSection />
        <CursorTrailSection />
        <PostInlineFx2Section />
        <PostBlockFx2Section />
        <DitherCamSection />
        <SpotlightSection />
        <MarqueeSection />
        <DatamoshSection />
        <AsciiBoxSection />
        <GravityWellSection />
        <ChannelSurfSection />
        <WeightWaveSection />
        <BootSplashSection />
      </div>

      <MatrixRainOverlay isOpen={rainOpen} onClose={closeRain} />
    </>
  );
}
