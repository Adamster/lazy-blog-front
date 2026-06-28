import type { CSSProperties } from "react";
import { InfoBox } from "@/shared/ui";
import { LogoSloth } from "./logo-sloth";
import { Section, Panel, Spec } from "./_helpers";

/* ----------------------------- palettes ----------------------------- */
// Explicit hex so the light/dark logo & colour demos render correctly
// regardless of the ambient page theme. Mirrors the tokens in tailwind.css.
type Pal = {
  bg: string;
  fg: string;
  accent: string;
  panel: string;
  muted2: string;
  border: string;
};
const LIGHT: Pal = {
  bg: "#f4f4f4",
  fg: "#161616",
  accent: "#4d7c0f",
  panel: "#e4e4e4",
  muted2: "#8c8c8c",
  border: "#161616",
};
const DARK: Pal = {
  bg: "#181818",
  fg: "#dcdcdc",
  accent: "#cdff48",
  panel: "#2a2a2a",
  muted2: "#7a7a7a",
  border: "#383838",
};

const SWATCHES = [
  "bg",
  "fg",
  "accent",
  "line",
  "panel",
  "card",
  "muted",
  "muted2",
  "dim",
  "error",
] as const;
const LIGHT_HEX: Record<string, string> = {
  bg: "#f4f4f4",
  fg: "#161616",
  accent: "#4d7c0f",
  line: "#161616",
  panel: "#e4e4e4",
  card: "#eaeaea",
  muted: "#6b6b6b",
  muted2: "#8c8c8c",
  dim: "#d6d6d6",
  error: "#b91c1c",
};
const DARK_HEX: Record<string, string> = {
  bg: "#181818",
  fg: "#dcdcdc",
  accent: "#cdff48",
  line: "#e6e6e6",
  panel: "#2a2a2a",
  card: "#232323",
  muted: "#9a9a9a",
  muted2: "#7a7a7a",
  dim: "#383838",
  error: "#ff6b6b",
};

/* ----------------------------- colour ----------------------------- */
function Palette({
  title,
  hex,
  pal,
}: {
  title: string;
  hex: Record<string, string>;
  pal: Pal;
}) {
  return (
    <div className="p-7" style={{ background: pal.bg }}>
      <div
        className="mb-5 text-[11px] tracking-[0.12em]"
        style={{ color: pal.accent }}
      >
        {title}
      </div>
      <div className="grid grid-cols-5 gap-3">
        {SWATCHES.map((name) => (
          <div key={name}>
            <div
              className="h-[72px] border-2"
              style={{ background: hex[name], borderColor: pal.border }}
            />
            <div
              className="mt-2 text-[12px] font-semibold"
              style={{ color: pal.fg }}
            >
              {name}
            </div>
            <div className="text-[11px]" style={{ color: pal.muted2 }}>
              {hex[name]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ logo ------------------------------ */
function LogoCard({ dark }: { dark: boolean }) {
  const p = dark ? DARK : LIGHT;
  return (
    <div
      className="flex flex-col gap-7 p-9"
      style={{ background: p.bg, color: p.fg }}
    >
      <div
        className="text-[11px] tracking-[0.12em]"
        style={{ color: p.accent }}
      >
        {dark ? "// DARK" : "// LIGHT"}
      </div>

      {/* [ TEAM ] NOT LAZY lockup */}
      <div className="flex flex-wrap items-center gap-5">
        <span
          className="px-4 py-2 text-[14px] tracking-[0.2em]"
          style={{ background: p.accent, color: p.bg }}
        >
          [ TEAM ]
        </span>
        <span className="font-display text-[40px] leading-none font-bold tracking-[-0.02em]">
          NOT <span style={{ color: p.accent }}>LAZY</span>
        </span>
      </div>

      {/* Sloth mark — MONO ONLY: dark on light, light on dark. Never accent. */}
      <div className="flex items-center gap-7">
        <LogoSloth className="h-16 w-16" />
        <span
          className="text-[12px]"
          style={{ color: dark ? "#9a9a9a" : "#6b6b6b" }}
        >
          {dark ? "light variant" : "dark variant"} — the sloth mark is mono
          only, no green
        </span>
      </div>
    </div>
  );
}

/* --------------------------- typography --------------------------- */
const TYPE: {
  spec: string;
  sample: string;
  display?: boolean;
  style: CSSProperties;
}[] = [
  {
    spec: "Display · 40 / 700 / -0.02em",
    sample: "NOT LAZY",
    display: true,
    style: {
      fontSize: 40,
      fontWeight: 700,
      letterSpacing: "-0.02em",
      lineHeight: 1.04,
    },
  },
  {
    spec: "H1 · 32 / 700 / -0.02em",
    sample: "Set a new password",
    display: true,
    style: {
      fontSize: 32,
      fontWeight: 700,
      letterSpacing: "-0.02em",
      lineHeight: 1.04,
    },
  },
  {
    spec: "H3 · 18 / 600 / 0",
    sample: "A new mode of self-debate",
    display: true,
    style: { fontSize: 18, fontWeight: 600, lineHeight: 1.18 },
  },
  {
    spec: "Prose · 14 / 400 · lh 1.85",
    sample: "Confidence isn't knowledge; it's style.",
    style: { fontSize: 14, fontWeight: 400, lineHeight: 1.85 },
  },
  {
    spec: "UI body · 14 / 400 · lh 1.6",
    sample: "Summaries, bios, buttons, inputs, comments — all at 14.",
    style: { fontSize: 14, fontWeight: 400, lineHeight: 1.6 },
  },
  {
    spec: "Caption · 12 / 400",
    sample: "Jun 15 · 4 min read · @lazy_ela",
    style: { fontSize: 12, fontWeight: 400, color: "var(--m-muted)" },
  },
  {
    spec: "Label · 11 / 500 / 0.12em",
    sample: "// MOST ACTIVE USER",
    style: {
      fontSize: 11,
      fontWeight: 500,
      letterSpacing: "0.12em",
      color: "var(--m-accent)",
    },
  },
];

/* ------------------------------ the tab ------------------------------ */
export function BrandTab() {
  return (
    <>
      {/* Masthead */}
      <div className="text-[11px] tracking-[0.12em] text-[var(--m-accent)]">
        {"// NOT LAZY — BRAND IDENTITY · BRUTALIST MONO"}
      </div>
      <div className="mt-6 flex items-center gap-5">
        <LogoSloth className="h-12 w-12 text-[var(--m-fg)]" />
        <div className="font-display text-[40px] leading-none font-bold tracking-[-0.02em] whitespace-nowrap">
          NOT <span className="text-[var(--m-accent)]">LAZY</span>
        </div>
      </div>
      <p className="mt-4 text-[14px] leading-[1.6] text-[var(--m-muted)]">
        Space Grotesk — for identity, headings and numbers; JetBrains Mono — for
        data, code, body and labels. Dark-grey base, never pure black. The
        project accent is{" "}
        <strong className="text-[var(--m-accent)]">lime</strong> (olive in
        light, acid-green in dark). Geometry: square corners, 2px borders, no
        rounding. Foundations live here; the ready-made primitives and their
        states are in the <code className="text-[var(--m-fg)]">Components</code>{" "}
        tab.
      </p>

      <div className="mt-10 flex flex-col gap-10">
        {/* 01 COLOR */}
        <Section
          index="01"
          title="COLOR SYSTEM"
          intro="Ten tokens per theme. In code — only var(--m-*); hard-coded hex is banned. The theme switches via a `.dark` class on an ancestor (the button in the header)."
        >
          <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
            <Palette title="// LIGHT" hex={LIGHT_HEX} pal={LIGHT} />
            <Palette title="// DARK" hex={DARK_HEX} pal={DARK} />
          </div>
        </Section>

        {/* 02 LOGO & MARK */}
        <Section
          index="02"
          title="LOGO & MARK"
          intro="The [ TEAM ] NOT LAZY lockup: a bracketed badge in the accent fill + the wordmark (NOT — fg, LAZY — accent, Space Grotesk 700). The sloth mark (LogoSloth) is mono ONLY: dark on light, light on dark. There is no green (accent) variant of the mark — the accent lives only in the lockup."
        >
          <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
            <LogoCard dark={false} />
            <LogoCard dark />
          </div>
        </Section>

        {/* 03 TYPOGRAPHY */}
        <Section
          index="03"
          title="TYPOGRAPHY"
          intro="The type scale. Space Grotesk = identity/titles/numbers. JetBrains Mono = data/code/body/labels. Don't invent intermediate sizes."
        >
          <div className="flex flex-col">
            {TYPE.map((t) => (
              <div
                key={t.spec}
                className="grid grid-cols-[200px_1fr] items-baseline gap-6 border-b-2 border-[var(--m-dim)] py-5"
              >
                <div className="text-[11px] tracking-[0.12em] text-[var(--m-muted2)]">
                  {t.spec}
                </div>
                <div
                  className={t.display ? "font-display" : ""}
                  style={t.style}
                >
                  {t.sample}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* 04 GEOMETRY & LAYOUT */}
        <Section
          index="04"
          title="GEOMETRY & LAYOUT"
          intro="The system foundations for shape and grid. Square corners (no rounding), 2px borders everywhere (primary --m-line, secondary --m-dim), accent edges are 2px too (never 3px). Containers and controls come from a fixed scale."
        >
          <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
            <Panel caption="// FORM & BORDERS" tone="muted">
              <div className="mb-7 flex flex-wrap items-end gap-7">
                <div className="flex flex-col gap-2.5">
                  <span className="size-16 border-2 border-[var(--m-line)]" />
                  <span className="text-[11px] tracking-[0.12em] text-[var(--m-muted2)]">
                    2px · --m-line
                  </span>
                </div>
                <div className="flex flex-col gap-2.5">
                  <span className="size-16 border-2 border-[var(--m-dim)]" />
                  <span className="text-[11px] tracking-[0.12em] text-[var(--m-muted2)]">
                    2px · --m-dim
                  </span>
                </div>
                <div className="flex flex-col gap-2.5">
                  <span className="size-16 border-2 border-t-2 border-[var(--m-dim)] border-t-[var(--m-accent)]" />
                  <span className="text-[11px] tracking-[0.12em] text-[var(--m-muted2)]">
                    accent stripe 2px
                  </span>
                </div>
              </div>
              <div className="flex flex-col">
                <Spec label="Corners" value="square · no radius" />
                <Spec label="Borders" value="2px everywhere" />
                <Spec label="Accent stripes / edges" value="2px · never 3px" />
              </div>
            </Panel>
            <Panel caption="// CONTAINERS & CONTROLS" tone="muted">
              <div className="flex flex-col">
                <Spec label="Page gutter (px-10)" value="40px" />
                <Spec label="Container max-w (home/profile)" value="1240" />
                <Spec label="Article column max-w · gutter" value="780 · 40" />
                <Spec label="Control height (h-9)" value="36px" />
                <Spec label="Header controls (size-9)" value="36px" />
                <Spec label="Avatar (byline · profile)" value="40 · 128" />
              </div>
            </Panel>
          </div>
        </Section>

        {/* 05 SPACING & RHYTHM */}
        <Section
          index="05"
          title="SPACING & RHYTHM"
          intro="A 4px grid. Keep section rhythm at 40px; 28px is ONLY for repeating item gaps (cards, feed, list, comments), NEVER for sections. Intermediate values (6/14/22) are off-limits."
        >
          <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
            <div className="flex flex-col">
              <Spec label="Page gutter (px-10)" value="40px" />
              <Spec label="Container max-w (home/profile)" value="1240" />
              <Spec label="Article column max-w · gutter" value="780 · 40" />
              <Spec label="Page top (home / inner)" value="80 / 40" />
              <Spec label="Page bottom (section rhythm)" value="40" />
              <Spec label="Full-bleed band padding (p-10)" value="40" />
            </div>
            <div className="flex flex-col">
              <Spec label="Feed card padding (p-5)" value="20" />
              <Spec label="List row padding (px-7 py-6)" value="28 / 24" />
              <Spec label="Hero card padding" value="34" />
              <Spec label="Section rhythm · label py-10" value="40" />
              <Spec label="Grid / feed / comment gap (gap-7)" value="28" />
              <Spec label="Stats grid gap (gap-10)" value="40" />
            </div>
          </div>
          <InfoBox className="mt-7">
            Text-block rhythm: category → title{" "}
            <strong className="text-[var(--m-accent)]">8</strong> (mb-2) · label
            → value / title → body{" "}
            <strong className="text-[var(--m-accent)]">16</strong> (mt-4) · body
            → meta <strong className="text-[var(--m-accent)]">24</strong>.
          </InfoBox>
        </Section>

        {/* 06 LETTER-SPACING & LINE-HEIGHT */}
        <Section
          index="06"
          title="LETTER-SPACING & LINE-HEIGHT"
          intro="All labels and categories — 0.12em letter-spacing at 11px (this is what gives the 'terminal' character; without it, it reads flat). Badges are tighter — 0.06em. Headings -0.02em."
        >
          <Panel caption="✕ 0 vs ✓ 0.12em" tone="muted" className="mb-7">
            <div className="grid grid-cols-1 gap-7 sm:grid-cols-2">
              <div>
                <div className="mb-2 text-[11px] tracking-[0.12em] text-[var(--m-muted2)]">
                  ✕ tracking 0 — flat
                </div>
                <div className="text-[11px] tracking-[0] text-[var(--m-muted)]">
                  {"// MOST ACTIVE USER"}
                </div>
              </div>
              <div>
                <div className="mb-2 text-[11px] tracking-[0.12em] text-[var(--m-muted2)]">
                  ✓ tracking 0.12em — standard
                </div>
                <div className="text-[11px] tracking-[0.12em] text-[var(--m-accent)]">
                  {"// MOST ACTIVE USER"}
                </div>
              </div>
            </div>
          </Panel>
          <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
            <div className="flex flex-col">
              <Spec label="Labels · categories" value="0.12em" />
              <Spec label="Status badge" value="0.06em · upper" />
              <Spec label="Headings (Display / H1)" value="-0.02em" />
              <Spec label="H3 · body" value="0" />
            </div>
            <div className="flex flex-col">
              <Spec label="Hero / H1 leading" value="1.04" />
              <Spec label="H3 leading" value="1.18" />
              <Spec label="Body / summary (14px)" value="1.6" />
              <Spec label="Prose (14px) · labels" value="1.85 · 1.2" />
            </div>
          </div>
        </Section>
      </div>
    </>
  );
}
