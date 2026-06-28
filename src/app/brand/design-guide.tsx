"use client";

import { useState, type CSSProperties } from "react";
import {
  AdjustmentsHorizontalIcon,
  LinkIcon,
  PencilIcon,
  UserIcon,
  LockClosedIcon,
  CheckIcon,
} from "@heroicons/react/24/solid";
import {
  EyeSlashIcon,
  XMarkIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import {
  Label,
  Category,
  StatusBadge,
  Metric,
  Dot,
  Menu,
  Field,
  FieldError,
  Textarea,
  Select,
  Switch,
  Avatar,
  Modal,
  ModalHeader,
  SubmitButton,
  IconSubmitButton,
  Button,
  useModalTitleId,
  Loading,
  Spinner,
  ProgressBar,
  StatBar,
  Stepper,
  TabNav,
  UnderlineTabs,
  Console,
  Checkbox,
  RadioGroup,
  Sparkline,
  buildMonthlySeries,
  ConfirmModal,
  InfoBox,
  ErrorMessage,
  type SelectOption,
} from "@/shared/ui";
import { GlitchText, MatrixText } from "@/shared/ui/effects";
import { addToastSuccess, addToastError } from "@/shared/lib/toasts";
import { DraftOverlay } from "@/features/post/ui/draft-overlay";
import { CrepeEditor } from "@/features/post/ui/crepe-wrapper";
import { Section, Panel, State, Spec, GroupBand } from "./_helpers";

const navLinkCls =
  "inline-flex items-center gap-2 text-[11px] leading-none tracking-[0.12em] text-[var(--m-muted2)] uppercase transition-colors hover:text-[var(--m-muted)]";

// ───────────────────────── FOUNDATIONS data ─────────────────────────
// Explicit hex (not tokens) so the light/dark swatch rows render both themes
// regardless of the ambient page theme. Mirrors the tokens in tailwind.css.
type Pal = {
  bg: string;
  fg: string;
  accent: string;
  muted2: string;
  border: string;
};
const LIGHT_PAL: Pal = {
  bg: "#f4f4f4",
  fg: "#161616",
  accent: "#4d7c0f",
  muted2: "#8c8c8c",
  border: "#161616",
};
const DARK_PAL: Pal = {
  bg: "#181818",
  fg: "#dcdcdc",
  accent: "#cdff48",
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

// Compact swatch row — each token is a 36px (size-9) square + name/hex beside
// it, wrapping so the whole palette sits in a line or two per theme.
function CompactPalette({
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
        className="mb-4 text-[11px] leading-none tracking-[0.12em]"
        style={{ color: pal.accent }}
      >
        {title}
      </div>
      <div className="flex flex-wrap gap-x-7 gap-y-5">
        {SWATCHES.map((name) => (
          <div key={name} className="flex items-center gap-2.5">
            <span
              className="size-9 shrink-0 border-2"
              style={{ background: hex[name], borderColor: pal.border }}
            />
            <div>
              <div
                className="text-[12px] leading-none font-semibold"
                style={{ color: pal.fg }}
              >
                {name}
              </div>
              <div
                className="mt-1 text-[11px] leading-none tabular-nums"
                style={{ color: pal.muted2 }}
              >
                {hex[name]}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

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

const CAT_OPTIONS: SelectOption[] = [
  { value: "ai", label: "AI" },
  { value: "design", label: "Design" },
  { value: "philosophy", label: "Philosophy" },
  { value: "code", label: "Code" },
];

const SPARK_DATES = [
  "2025-01-04",
  "2025-01-22",
  "2025-02-09",
  "2025-04-15",
  "2025-05-02",
  "2025-05-19",
  "2025-05-28",
  "2025-06-10",
];

// Seed for the live Crepe editor in the Prose layer — exercises a heading, a
// bold mark, a list and a blockquote so the authoring surface reads real.
const PROSE_SEED = `# Live editor

This is the **real** Crepe authoring surface — the same WYSIWYG you write posts in. It renders 1-to-1 with the read view through \`.mono-prose\`.

- Format with the toolbar above
- The editable column is centred at the 700px measure
- Effects ▾ wraps the in-post marks

> Confidence isn't knowledge; it's style.`;

// Single source for the table of contents + the layer band headings. The page
// body interleaves the bands (looked up by id) with the sections that follow.
// FOUNDATIONS opens the foundation sections; the rest open the component
// storybook, one section per PRIMITIVE with its variants/states folded inside.
const GROUPS = [
  {
    id: "foundations",
    layer: "FOUNDATIONS",
    title: "Foundations",
    intro:
      "The non-negotiable tokens — colour, type, geometry, spacing and letter-spacing. Every primitive further down is assembled from exactly these; nothing is invented per-screen. In code it's only var(--m-*) and the documented scale.",
  },
  {
    id: "forms",
    layer: "FORMS",
    title: "Forms",
    intro:
      "Inputs, buttons and selection controls. Every control draws the accent focus-visible ring, renders the required asterisk from one rule, and surfaces errors through the FieldError treatment.",
  },
  {
    id: "data-display",
    layer: "DATA-DISPLAY",
    title: "Data-display",
    intro:
      "The read-only primitives that thread through bylines, meta rows, cards and stat blocks — one 12px caption size, one muted colour, tabular numerals everywhere. The bars (StatBar determinate · ProgressBar indeterminate) share one section.",
  },
  {
    id: "navigation",
    layer: "NAVIGATION",
    title: "Navigation",
    intro:
      "Step boxes and tablists. Stepper (progress) and TabNav (tabs) share the square box language and sit together; UnderlineTabs is the lighter accent-baseline variant driving this page's own top bar.",
  },
  {
    id: "overlays",
    layer: "OVERLAYS",
    title: "Overlays",
    intro:
      "Things that portal above the page — the Modal shell and its ConfirmModal, the kebab Menu, the terminal Console, and the toast surface. Triggers below open the real components.",
  },
  {
    id: "feedback",
    layer: "FEEDBACK",
    title: "Feedback",
    intro:
      "State communicated to the user — the loading spinner, the inline InfoBox note (also the carrier for the help notes across this page), and the full-screen error page.",
  },
  {
    id: "effects",
    layer: "EFFECTS",
    title: "Effects",
    intro:
      "The base text-effect primitives. Both are theme-aware and hold a single static frame under prefers-reduced-motion.",
  },
  {
    id: "prose",
    layer: "PROSE",
    title: "Prose",
    intro:
      "The article authoring surface. This layer embeds the real Crepe (Milkdown) WYSIWYG editor — the exact one behind the post composer — so the showcase dog-foods the writing experience itself.",
  },
] as const;

function bandProps(id: (typeof GROUPS)[number]["id"]) {
  const g = GROUPS.find((x) => x.id === id);
  if (!g) throw new Error(`Unknown brand group: ${id}`);
  return { id: g.id, layer: g.layer, title: g.title, intro: g.intro };
}

export function DesignGuide() {
  const [demoOpen, setDemoOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmDefaultOpen, setConfirmDefaultOpen] = useState(false);
  const [filledText, setFilledText] = useState("hello@notlazy.dev");
  const [filledArea, setFilledArea] = useState(
    "Confidence isn't knowledge; it's style."
  );
  const [singleSel, setSingleSel] = useState<string | undefined>("ai");
  const [multiSel, setMultiSel] = useState<string[]>(["design", "code"]);
  const [emptySel, setEmptySel] = useState<string | undefined>(undefined);
  const [switchOn, setSwitchOn] = useState(true);
  const [stepDemo, setStepDemo] = useState(1);
  const [tabDemo, setTabDemo] = useState("overview");
  const [tabNavSel, setTabNavSel] = useState("profile");
  const [checks, setChecks] = useState({ replies: true, drafts: false });
  const [feedSort, setFeedSort] = useState("standard");

  const demoTitleId = useModalTitleId();

  return (
    <>
      {/* ───────────────────────── Masthead ───────────────────────── */}
      <div className="text-[11px] leading-none tracking-[0.12em] text-[var(--m-accent)]">
        {"// NOT LAZY — DESIGN GUIDE · BRUTALIST MONO"}
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-5">
        <span className="bg-[var(--m-accent)] px-4 py-2 text-[14px] tracking-[0.2em] text-[var(--m-bg)]">
          [ TEAM ]
        </span>
        <div className="font-display text-[40px] leading-none font-bold tracking-[-0.02em] whitespace-nowrap text-[var(--m-fg)]">
          NOT <span className="text-[var(--m-accent)]">LAZY</span>
        </div>
      </div>
      <h1 className="font-display mt-6 text-[40px] leading-none font-bold tracking-[-0.02em]">
        Design Guide
      </h1>
      <p className="mt-4 text-[14px] leading-[1.6] text-[var(--m-muted)]">
        The living design system behind NOT LAZY team products — the foundations
        (colour, type, geometry, spacing, letter-spacing) plus every shipped
        primitive from <code className="text-[var(--m-fg)]">src/shared/ui</code>
        , grouped by layer and rendered 1:1 with the code. These are the real
        components, so the guide stays in sync as the system evolves. Hover and
        focus states are CSS-only, surfaced through the real{" "}
        <code className="text-[var(--m-fg)]">InfoBox</code>. Theme follows the
        header toggle.
      </p>

      {/* ───────────────────────── Table of contents ───────────────────────── */}
      <Panel caption="// JUMP TO" className="mt-10">
        <nav
          aria-label="Layer index"
          className="flex flex-wrap gap-x-7 gap-y-3"
        >
          {GROUPS.map((g) => (
            <a
              key={g.id}
              href={`#${g.id}`}
              className="text-[11px] leading-none tracking-[0.12em] text-[var(--m-muted2)] uppercase transition-colors hover:text-[var(--m-accent)]"
            >
              {g.layer}
            </a>
          ))}
        </nav>
      </Panel>

      <div className="mt-10 flex flex-col gap-10">
        {/* ─────────────────────── FOUNDATIONS ─────────────────────── */}
        <GroupBand {...bandProps("foundations")} />

        <Section
          index="01"
          title="COLOR SYSTEM"
          intro="Ten tokens per theme. In code — only var(--m-*); hard-coded hex is banned. The theme switches via a `.dark` class on an ancestor (the button in the header)."
        >
          <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
            <CompactPalette title="// LIGHT" hex={LIGHT_HEX} pal={LIGHT_PAL} />
            <CompactPalette title="// DARK" hex={DARK_HEX} pal={DARK_PAL} />
          </div>
        </Section>

        <Section
          index="02"
          title="TYPOGRAPHY"
          intro="The type scale. Space Grotesk = identity/titles/numbers. JetBrains Mono = data/code/body/labels. Don't invent intermediate sizes."
        >
          <div className="flex flex-col">
            {TYPE.map((t) => (
              <div
                key={t.spec}
                className="grid grid-cols-[200px_1fr] items-baseline gap-6 border-b-2 border-[var(--m-dim)] py-5"
              >
                <div className="text-[11px] leading-none tracking-[0.12em] text-[var(--m-muted2)]">
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

        <Section
          index="03"
          title="GEOMETRY & LAYOUT"
          intro="The system foundations for shape and grid. Square corners (no rounding), 2px borders everywhere (primary --m-line, secondary --m-dim), accent edges are 2px too (never 3px). Containers and controls come from a fixed scale."
        >
          <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
            <Panel caption="// FORM & BORDERS" tone="muted">
              <div className="mb-7 flex flex-wrap items-end gap-7">
                <div className="flex flex-col gap-2.5">
                  <span className="size-16 border-2 border-[var(--m-line)]" />
                  <span className="text-[11px] leading-none tracking-[0.12em] text-[var(--m-muted2)]">
                    2px · --m-line
                  </span>
                </div>
                <div className="flex flex-col gap-2.5">
                  <span className="size-16 border-2 border-[var(--m-dim)]" />
                  <span className="text-[11px] leading-none tracking-[0.12em] text-[var(--m-muted2)]">
                    2px · --m-dim
                  </span>
                </div>
                <div className="flex flex-col gap-2.5">
                  <span className="size-16 border-2 border-t-2 border-[var(--m-dim)] border-t-[var(--m-accent)]" />
                  <span className="text-[11px] leading-none tracking-[0.12em] text-[var(--m-muted2)]">
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

        <Section
          index="04"
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

        <Section
          index="05"
          title="LETTER-SPACING & LINE-HEIGHT"
          intro="All labels and categories — 0.12em letter-spacing at 11px (this is what gives the 'terminal' character; without it, it reads flat). Badges are tighter — 0.06em. Headings -0.02em."
        >
          <Panel caption="✕ 0 vs ✓ 0.12em" tone="muted" className="mb-7">
            <div className="grid grid-cols-1 gap-7 sm:grid-cols-2">
              <div>
                <div className="mb-2 text-[11px] leading-none tracking-[0.12em] text-[var(--m-muted2)]">
                  ✕ tracking 0 — flat
                </div>
                <div className="text-[11px] tracking-[0] text-[var(--m-muted)]">
                  {"// MOST ACTIVE USER"}
                </div>
              </div>
              <div>
                <div className="mb-2 text-[11px] leading-none tracking-[0.12em] text-[var(--m-muted2)]">
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

        {/* ───────────────────────── FORMS ───────────────────────── */}
        <GroupBand {...bandProps("forms")} />

        <Section
          id="button"
          index="06"
          title="BUTTON"
          intro="The one action button — 36px (h-9), Space Grotesk, where .mono-cta / .mono-btn-outline / the danger fill live. Everything here is a FORM of it: primary / outline / danger × default → disabled, the href link form, the icon control, the full-width SubmitButton (with its pending spinner), and the icon-only IconSubmitButton. Arrows are direction-only and stay LINK-style, never on an action button."
        >
          <Panel caption="// PRIMARY · OUTLINE · DANGER · ICON · SUBMIT">
            <div className="grid grid-cols-1 gap-x-7 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
              <State caption="default — primary / outline / danger">
                <div className="flex flex-wrap items-center gap-4">
                  <Button>Primary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="danger">Delete</Button>
                </div>
              </State>
              <State caption="disabled">
                <div className="flex flex-wrap items-center gap-4">
                  <Button disabled>Primary</Button>
                  <Button variant="outline" disabled>
                    Outline
                  </Button>
                  <Button variant="danger" disabled>
                    Delete
                  </Button>
                </div>
              </State>
              <State caption="href → <a> (link form)">
                <Button href="#button">Anchor button</Button>
              </State>
              <State caption="SubmitButton — default / pending (spinner)">
                <div className="flex flex-col gap-3">
                  <form onSubmit={(e) => e.preventDefault()}>
                    <SubmitButton>Log in</SubmitButton>
                  </form>
                  <form onSubmit={(e) => e.preventDefault()}>
                    <SubmitButton pending pendingLabel="Signing in…">
                      Log in
                    </SubmitButton>
                  </form>
                </div>
              </State>
              <State caption="icon buttons — mono-icon-btn · IconSubmitButton (rocket / check / pending)">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    aria-label="Copy link"
                    className="mono-icon-btn size-9"
                  >
                    <LinkIcon className="size-4" />
                  </button>
                  <form onSubmit={(e) => e.preventDefault()}>
                    <IconSubmitButton label="Publish post" />
                  </form>
                  <form onSubmit={(e) => e.preventDefault()}>
                    <IconSubmitButton label="Save draft" icon={CheckIcon} />
                  </form>
                  <form onSubmit={(e) => e.preventDefault()}>
                    <IconSubmitButton label="Publishing…" pending />
                  </form>
                </div>
              </State>
            </div>
            <InfoBox className="mt-6">
              Hover (CSS): primary inverts to hollow accent; outline / icon
              borders go accent; danger hollows out. Passing{" "}
              <code className="text-[var(--m-fg)]">href</code> renders an{" "}
              <code className="text-[var(--m-fg)]">&lt;a&gt;</code> with the
              identical chrome.{" "}
              <code className="text-[var(--m-fg)]">SubmitButton</code>{" "}
              (full-width, pending) and{" "}
              <code className="text-[var(--m-fg)]">IconSubmitButton</code> (icon
              submit) are the form-action forms of the same button.
            </InfoBox>
          </Panel>

          <Panel
            caption="// ARROWS — direction only, never on action buttons"
            className="mt-7"
          >
            <div className="flex flex-wrap items-center gap-6">
              <button type="button" className={navLinkCls}>
                <span aria-hidden="true">←</span>
                Back
              </button>
              <button type="button" className={navLinkCls}>
                Next
                <span aria-hidden="true">→</span>
              </button>
              <button type="button" className={navLinkCls}>
                <XMarkIcon className="size-3.5" />
                Cancel
              </button>
            </div>
            <InfoBox className="mt-7">
              Arrows mark DIRECTION / navigation only — Next (→), Back (←),
              go-home — and they are LINK-style (11px label, muted2 → muted, NO
              border / box / fill). An abort (Cancel) is a close ✕ link, not a
              back arrow. Action buttons (login / submit / send / save) are the
              filled buttons and never carry an arrow.
            </InfoBox>
          </Panel>
        </Section>

        <Section
          id="field"
          index="07"
          title="FIELD"
          intro="The underline Field (text / email / password), shown empty (required *) → filled → error → disabled → password (built-in eye toggle). The floating label always reads 11px / 0.12em uppercase and only animates POSITION; the error (! …, 11px / --m-error) renders only when present."
        >
          <Panel caption="// FIELD — text · email · password">
            <div className="grid grid-cols-1 gap-x-7 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
              <State caption="empty (required *)">
                <Field id="cs-f-empty" label="Email" type="email" required />
              </State>
              <State caption="filled">
                <Field
                  id="cs-f-filled"
                  label="Email"
                  type="email"
                  value={filledText}
                  onChange={(e) => setFilledText(e.target.value)}
                />
              </State>
              <State caption="error">
                <Field
                  id="cs-f-error"
                  label="Email"
                  type="email"
                  defaultValue="not-an-email"
                  error="Enter a valid email address"
                />
              </State>
              <State caption="disabled">
                <Field
                  id="cs-f-disabled"
                  label="Email"
                  type="email"
                  defaultValue="locked@notlazy.dev"
                  disabled
                />
              </State>
              <State caption="password (eye toggle)">
                <Field
                  id="cs-f-pw"
                  label="Password"
                  type="password"
                  defaultValue="hunter2"
                  required
                />
              </State>
            </div>
          </Panel>
        </Section>

        <Section
          id="textarea"
          index="08"
          title="TEXTAREA"
          intro="The multi-line Field sibling — same underline + floating label, auto-growing with content. Shown empty → filled → error → disabled."
        >
          <Panel caption="// TEXTAREA (auto-grow)">
            <div className="grid grid-cols-1 gap-x-7 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
              <State caption="empty">
                <Textarea id="cs-ta-empty" label="Biography" />
              </State>
              <State caption="filled">
                <Textarea
                  id="cs-ta-filled"
                  label="Biography"
                  value={filledArea}
                  onChange={(e) => setFilledArea(e.target.value)}
                />
              </State>
              <State caption="error">
                <Textarea
                  id="cs-ta-error"
                  label="Biography"
                  defaultValue="x"
                  error="Bio must be at least 20 characters"
                />
              </State>
              <State caption="disabled">
                <Textarea
                  id="cs-ta-disabled"
                  label="Biography"
                  defaultValue="Read-only bio."
                  disabled
                />
              </State>
            </div>
          </Panel>
        </Section>

        <Section
          id="select"
          index="09"
          title="SELECT"
          intro="The custom Select (single + multiple), shown empty (placeholder) → filled single → error (a required multiple) → disabled. Click to open the listbox — ↑/↓ to move, Enter/Space to toggle, Esc to close, type-ahead supported."
        >
          <Panel caption="// SELECT — single · multiple">
            <div className="grid grid-cols-1 gap-x-7 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
              <State caption="empty (placeholder)">
                <Select
                  id="cs-sel-empty"
                  label="Category"
                  placeholder="Pick one…"
                  options={CAT_OPTIONS}
                  value={emptySel}
                  onChange={setEmptySel}
                />
              </State>
              <State caption="filled · single">
                <Select
                  id="cs-sel-single"
                  label="Category"
                  options={CAT_OPTIONS}
                  value={singleSel}
                  onChange={setSingleSel}
                />
              </State>
              <State caption="error · multiple (required)">
                <Select
                  id="cs-sel-multi"
                  label="Categories"
                  multiple
                  required
                  options={CAT_OPTIONS}
                  value={multiSel}
                  onChange={setMultiSel}
                  error="Pick at least one category"
                />
              </State>
              <State caption="disabled">
                <Select
                  id="cs-sel-disabled"
                  label="Category"
                  disabled
                  options={CAT_OPTIONS}
                  value="ai"
                  onChange={() => {}}
                />
              </State>
            </div>
          </Panel>
        </Section>

        <Section
          id="selection"
          index="10"
          title="SWITCH · CHECKBOX · RADIO"
          intro="Square selection controls — no circles in this system. Switch (on → off → disabled), Checkbox (fills accent with a ✓) and RadioGroup (inner filled square). All wrap native inputs for a11y, draw the accent focus ring, and render the required asterisk from the same rule as the fields. Error reddens the box + an 11px / 0.12em message."
        >
          <Panel caption="// SWITCH" className="mb-7">
            <div className="flex flex-col gap-7 sm:flex-row sm:gap-10">
              <State caption="on" className="sm:w-56">
                <Switch
                  id="cs-sw-on"
                  label="Notifications"
                  checked={switchOn}
                  onChange={setSwitchOn}
                />
              </State>
              <State caption="off" className="sm:w-56">
                <Switch
                  id="cs-sw-off"
                  label="Notifications"
                  checked={false}
                  onChange={() => {}}
                />
              </State>
              <State caption="disabled (on)" className="sm:w-56">
                <Switch
                  id="cs-sw-dis"
                  label="Notifications"
                  checked
                  disabled
                  onChange={() => {}}
                />
              </State>
            </div>
          </Panel>

          <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
            <Panel caption="// CHECKBOX">
              <div className="flex flex-col gap-4">
                <Checkbox
                  id="cs-chk-replies"
                  label="Email me on replies"
                  checked={checks.replies}
                  onChange={(v) => setChecks((c) => ({ ...c, replies: v }))}
                />
                <Checkbox
                  id="cs-chk-drafts"
                  label="Show my drafts publicly"
                  checked={checks.drafts}
                  onChange={(v) => setChecks((c) => ({ ...c, drafts: v }))}
                />
                <Checkbox
                  id="cs-chk-terms"
                  label="Accept the house rules"
                  checked={false}
                  onChange={() => {}}
                  required
                  error="You must accept to continue"
                />
                <Checkbox
                  id="cs-chk-dis"
                  label="Beta features (locked)"
                  checked
                  disabled
                  onChange={() => {}}
                />
              </div>
            </Panel>

            <Panel caption="// RADIO (RadioGroup)">
              <RadioGroup
                name="cs-feed-sort"
                label="Feed sort"
                required
                value={feedSort}
                onChange={setFeedSort}
                options={[
                  { value: "standard", label: "Standard feed" },
                  { value: "chrono", label: "Chronological" },
                  { value: "top", label: "Top this week" },
                ]}
              />
            </Panel>
          </div>
        </Section>

        <Section
          id="label"
          index="11"
          title="LABEL · FIELDERROR"
          intro="The terminal Label (// X eyebrow, optional blinking caret, muted override) and the one error treatment — FieldError (! …, 11px / 0.12em / --m-error, role=alert) that hugs every control and stands alone here."
        >
          <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
            <Panel caption="// LABEL">
              <div className="grid grid-cols-2 gap-x-7 gap-y-7">
                <State caption="default">
                  <Label>PUBLICATIONS</Label>
                </State>
                <State caption="caret (blinking)">
                  <Label caret>MOST ACTIVE USER</Label>
                </State>
                <State caption="muted override">
                  <Label className="text-[11px] font-medium tracking-[0.12em] text-[var(--m-muted2)]">
                    VOTE
                  </Label>
                </State>
              </div>
            </Panel>

            <Panel caption="// FIELDERROR — standalone">
              <State caption="role=alert · ! prefix · the one error treatment">
                <FieldError error="Enter a valid email address" />
              </State>
            </Panel>
          </div>
        </Section>

        {/* ─────────────────────── DATA-DISPLAY ─────────────────────── */}
        <GroupBand {...bandProps("data-display")} />

        <Section
          id="avatar"
          index="12"
          title="AVATAR"
          intro="Square 2px-border tile. sm (40px / 16px letter) for bylines & comments, lg (128px / 44px letter) for the profile header. Image when set, first-initial fallback on the panel surface otherwise."
        >
          <Panel caption="// SIZE × FALLBACK">
            <div className="flex flex-wrap items-end gap-10">
              <State caption="sm · img">
                <Avatar
                  size="sm"
                  name="Elvira Nosova"
                  src="https://i.pravatar.cc/128?img=47"
                />
              </State>
              <State caption="sm · letter">
                <Avatar size="sm" name="Konstantin" />
              </State>
              <State caption="lg · img">
                <Avatar
                  size="lg"
                  name="Elvira Nosova"
                  src="https://i.pravatar.cc/256?img=12"
                />
              </State>
              <State caption="lg · letter">
                <Avatar size="lg" name="Anna" />
              </State>
            </div>
          </Panel>
        </Section>

        <Section
          id="metric"
          index="13"
          title="METRIC · DOT"
          intro="Metric (icon + tabular number, each kind) and the Dot separator that threads through every meta row. One caption size — 12px; icons 14px; one colour — muted. The rating kind is a neutral STAR + the net value — the star never changes with sign, the number carries the +/-. The accent flag lifts a just-changed value (e.g. a fresh up-vote)."
        >
          <Panel caption="// METRIC — every kind + the meta row">
            <div className="flex flex-col gap-7">
              <State caption="default (muted)">
                <div className="flex flex-wrap items-center gap-4 text-[12px] text-[var(--m-muted)]">
                  <Metric kind="likes" value={412} />
                  <Metric kind="views" value={18240} />
                  <Metric kind="posts" value={37} />
                  <Metric kind="comments" value={88} />
                </div>
              </State>
              <State caption="accent (e.g. up-voted)">
                <div className="flex flex-wrap items-center gap-4 text-[12px] text-[var(--m-muted)]">
                  <Metric kind="likes" value={413} accent />
                  <Metric kind="views" value={18241} />
                </div>
              </State>
              <State caption="rating — neutral star, number carries the sign">
                <div className="flex flex-wrap items-center gap-4 text-[12px] text-[var(--m-muted)]">
                  <Metric kind="rating" value={42} />
                  <Metric kind="rating" value={-7} />
                  <Metric kind="rating" value={0} />
                </div>
              </State>
              <State caption="meta row — @handle · date · metrics, Dot separators">
                <div className="flex flex-wrap items-center gap-2.5 text-[12px] text-[var(--m-muted)]">
                  <span className="transition-colors hover:text-[var(--m-accent)]">
                    @lazy
                  </span>
                  <Dot />
                  <span>14 Jun</span>
                  <Dot />
                  <Metric kind="comments" value={12} />
                  <Dot />
                  <Metric kind="views" value={840} />
                </div>
              </State>
            </div>
          </Panel>
        </Section>

        <Section
          id="markers"
          index="14"
          title="CATEGORY · STATUSBADGE · DRAFT"
          intro="The terminal markers. Category ([ x ], 11px / 0.12em) tags a post's topic; StatusBadge flags LATEST DROP / PINNED; the draft/unpublished cover overlay (dim + crossed-eye + UNPUBLISHED) renders on the author's own feed cards & their post page — the ONE draft treatment."
        >
          <Panel caption="// CATEGORY · STATUS · DRAFT OVERLAY">
            <div className="grid grid-cols-2 gap-x-7 gap-y-7 sm:grid-cols-4">
              <State caption="category">
                <Category>ai</Category>
              </State>
              <State caption="status · latest drop">
                <StatusBadge status="LATEST DROP" />
              </State>
              <State caption="status · pinned">
                <StatusBadge status="PINNED" />
              </State>
              <State caption="unpublished cover overlay">
                <div className="relative aspect-[16/9] w-full overflow-hidden border-2 border-[var(--m-dim)] bg-[var(--m-panel)]">
                  <DraftOverlay size="card" />
                </div>
              </State>
            </div>
          </Panel>
        </Section>

        <Section
          id="bars"
          index="15"
          title="STATBAR · PROGRESSBAR"
          intro="The two ████░░░░ block bars, close in meaning. StatBar is determinate — a labelled stat with a dotted-fill remainder and a right-aligned %, low values flipping to --m-error. ProgressBar is its indeterminate sibling — the same cells with an unknown-duration sweep."
        >
          <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
            <Panel caption="// STATBAR — determinate">
              <State caption="labelled stat · dotted remainder · low values go --m-error">
                <div className="flex flex-col gap-2.5">
                  <StatBar label="CPU" value={38} cells={48} />
                  <StatBar label="RAM" value={52} cells={48} />
                  <StatBar label="Motivation" value={4} cells={48} />
                  <StatBar label="Caffeine" value={98} cells={48} />
                </div>
              </State>
            </Panel>
            <Panel caption="// PROGRESSBAR — indeterminate">
              <State caption="processing · unknown-duration sweep">
                <ProgressBar label="Processing" cells={48} />
              </State>
            </Panel>
          </div>
        </Section>

        <Section
          id="sparkline"
          index="16"
          title="SPARKLINE"
          intro="A monthly-series micro-chart — accent curve + dots over a gradient fill. Shown with a rolling 6-month series and with an all-zero (no-activity) series."
        >
          <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
            <Panel caption="// SPARKLINE — with data">
              <State caption="6-month rolling counts · accent curve + dots">
                <Sparkline
                  series={buildMonthlySeries(SPARK_DATES, 6)}
                  gradientId="cs-spark"
                  ariaLabel="Posts per month over the last six months"
                />
              </State>
            </Panel>
            <Panel caption="// SPARKLINE — empty series">
              <State caption="all-zero · flat baseline (no activity)">
                <Sparkline
                  series={buildMonthlySeries([], 6)}
                  gradientId="cs-spark-empty"
                  ariaLabel="No posts in the last six months"
                />
              </State>
            </Panel>
          </div>
        </Section>

        {/* ───────────────────────── NAVIGATION ───────────────────────── */}
        <GroupBand {...bandProps("navigation")} />

        <Section
          id="stepper"
          index="17"
          title="STEPPER · TABNAV"
          intro="One square box-language, two roles. Stepper is the composer's PROGRESS — box precedence error (red) > active (filled accent) > complete (accent OUTLINE) > dim, the connector filling on the PRECEDING step's completion. TabNav is the TABS cousin (edit-profile): only the active box highlights, the connector is a STATIC --m-dim rule, no completion layer."
        >
          <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
            <Panel caption="// STEPPER — interactive (active + complete)">
              <State caption="click to jump · a COMPLETE-but-inactive step gets the accent OUTLINE">
                <Stepper
                  steps={["Setup", "Write"]}
                  icons={[AdjustmentsHorizontalIcon, PencilIcon]}
                  current={stepDemo}
                  completeSteps={[1]}
                  onSelect={setStepDemo}
                  className="justify-center"
                />
              </State>
            </Panel>
            <Panel caption="// STEPPER — error state">
              <State caption="step 1 errors (red box + red connector out)">
                <Stepper
                  steps={["Setup", "Write"]}
                  icons={[AdjustmentsHorizontalIcon, PencilIcon]}
                  current={2}
                  errorSteps={[1]}
                  onSelect={() => {}}
                  className="justify-center"
                />
              </State>
            </Panel>
          </div>

          <Panel
            caption="// TABNAV — tabs variant (active box only, static connector)"
            className="mt-7"
          >
            <State caption="click to switch · box names are aria-label-only">
              <TabNav
                tabs={[
                  { id: "profile", label: "Profile", icon: UserIcon },
                  { id: "security", label: "Security", icon: LockClosedIcon },
                ]}
                current={tabNavSel}
                onSelect={setTabNavSel}
                className="justify-center"
              />
            </State>
            <InfoBox className="mt-7">
              TabNav reuses the Stepper box language but is TABS, not progress —
              only the active box highlights, the connector stays a static{" "}
              <code className="text-[var(--m-fg)]">--m-dim</code> rule (never
              accent), and there is no completion layer.
            </InfoBox>
          </Panel>
        </Section>

        <Section
          id="underlinetabs"
          index="18"
          title="UNDERLINETABS"
          intro="The lighter accent-baseline tablist driving this /brand page's own top bar — a 2px --m-dim baseline with an accent underline on the active tab. baseline={false} drops its own rule when it sits under a header that already has one."
        >
          <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
            <Panel caption="// UNDERLINETABS — default (baseline)">
              <State caption="live · click or arrow-key the tablist">
                <UnderlineTabs
                  ariaLabel="Demo tabs"
                  current={tabDemo}
                  onSelect={setTabDemo}
                  tabs={[
                    { id: "overview", label: "Overview" },
                    { id: "activity", label: "Activity" },
                    { id: "settings", label: "Settings" },
                  ]}
                />
                <InfoBox className="mt-7">
                  Active panel:{" "}
                  <span className="text-[var(--m-accent)] uppercase">
                    {tabDemo}
                  </span>{" "}
                  — click a tab or roam the tablist with the arrow keys.
                </InfoBox>
              </State>
            </Panel>
            <Panel caption="// UNDERLINETABS — baseline={false}">
              <State caption="no own rule — for use under an existing divider">
                <UnderlineTabs
                  ariaLabel="Demo tabs (no baseline)"
                  baseline={false}
                  current={tabDemo}
                  onSelect={setTabDemo}
                  tabs={[
                    { id: "overview", label: "Overview" },
                    { id: "activity", label: "Activity" },
                    { id: "settings", label: "Settings" },
                  ]}
                />
              </State>
            </Panel>
          </div>
        </Section>

        {/* ───────────────────────── OVERLAYS ───────────────────────── */}
        <GroupBand {...bandProps("overlays")} />

        <Section
          id="modal"
          index="19"
          title="MODAL · CONFIRMMODAL"
          intro="The real Modal shell (Modal / ModalHeader / SubmitButton) — focus-trapped, Esc + backdrop close, body scroll locked, portalled into a themed .mono-portal node — and the ConfirmModal built on it (danger + default tones). The buttons open them for real."
        >
          <Panel caption="// TRIGGERS — open the real overlays">
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" onClick={() => setDemoOpen(true)}>
                Open demo modal
              </Button>
              <Button variant="danger" onClick={() => setConfirmOpen(true)}>
                Confirm (danger)
              </Button>
              <Button onClick={() => setConfirmDefaultOpen(true)}>
                Confirm (default)
              </Button>
            </div>
            <InfoBox className="mt-7">
              ConfirmModal:{" "}
              <code className="text-[var(--m-fg)]">
                tone=&quot;danger&quot;
              </code>{" "}
              reddens the eyebrow + the confirm fill;{" "}
              <code className="text-[var(--m-fg)]">
                tone=&quot;default&quot;
              </code>{" "}
              keeps the accent. Cancel left, primary right (modal button order).
            </InfoBox>
          </Panel>
        </Section>

        <Section
          id="menu"
          index="20"
          title="MENU"
          intro="The kebab Menu — the circled-ellipsis trigger opens an inline icon-row to the left (edit / hide / a destructive delete). The danger item routes to the ConfirmModal."
        >
          <Panel caption="// KEBAB MENU">
            <State caption="click the dots — opens edit + destructive delete">
              <div className="flex justify-end border-2 border-[var(--m-dim)] p-5">
                <Menu
                  triggerLabel="Post options"
                  items={[
                    {
                      id: "edit",
                      label: "Edit",
                      icon: <PencilSquareIcon />,
                      onSelect: () => addToastSuccess("Edit clicked"),
                    },
                    {
                      id: "hide",
                      label: "Hide",
                      icon: <EyeSlashIcon />,
                      onSelect: () => addToastSuccess("Hidden"),
                    },
                    {
                      id: "delete",
                      label: "Delete",
                      icon: <TrashIcon />,
                      danger: true,
                      onSelect: () => setConfirmOpen(true),
                    },
                  ]}
                />
              </div>
            </State>
          </Panel>
        </Section>

        <Section
          id="console"
          index="21"
          title="CONSOLE"
          intro="The terminal panel reused by the error page — a ConsoleTitleBar (traffic-light squares + a filename) over a monospace body."
        >
          <Panel caption="// CONSOLE — title bar + body">
            <State caption="reused verbatim by the error page">
              <Console title="stacktrace.log">
                <span className="text-[var(--m-error)]">Error</span>
                {": "}
                <span className="text-[var(--m-fg)]">
                  Cannot read &apos;energy&apos; of undefined
                </span>
              </Console>
            </State>
          </Panel>
        </Section>

        <Section
          id="toaster"
          index="22"
          title="TOASTER"
          intro="Notifications go through the module-level toast store; the app-level <Toaster/> renders them bottom-right — a single card surface with a 2px type stripe (accent / error) and a status icon. The whole toast dismisses on click and auto-dismisses. These call the real addToastSuccess / addToastError."
        >
          <Panel caption="// TOASTS — fires the real store">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() => addToastSuccess("Post published successfully")}
              >
                Show success
              </Button>
              <Button
                variant="danger"
                onClick={() => addToastError("Something went wrong")}
              >
                Show error
              </Button>
            </div>
          </Panel>
        </Section>

        {/* ───────────────────────── FEEDBACK ───────────────────────── */}
        <GroupBand {...bandProps("feedback")} />

        <Section
          id="loading"
          index="23"
          title="LOADING · SPINNER"
          intro="The terminal ASCII spinner (│ / ─ \\ cycling at 100ms, accent). Spinner is the bare glyph; Loading wraps it — inline centers it in flow, the block form (default) centers spinner + LOADING label in the viewport. (The spinner-in-button lives in the Button section as the pending state.)"
        >
          <Panel caption="// SPINNER · LOADING">
            <div className="grid grid-cols-1 gap-x-7 gap-y-7 sm:grid-cols-3">
              <State caption="Spinner — bare glyph">
                <Spinner className="text-[14px] font-bold text-[var(--m-accent)]" />
              </State>
              <State caption="Loading inline — in-flow, centered">
                <Loading inline />
              </State>
              <State caption="Loading block — route fallback">
                <div className="flex items-center gap-3">
                  <Spinner className="text-[14px] font-bold text-[var(--m-accent)]" />
                  <span className="text-[11px] leading-none tracking-[0.12em] text-[var(--m-muted2)] uppercase">
                    Loading
                  </span>
                </div>
              </State>
            </div>
          </Panel>
        </Section>

        <Section
          id="infobox"
          index="24"
          title="INFOBOX"
          intro="The chrome-surface note — a 2px accent left edge over a faint accent wash, 12px muted body. It is its own primitive AND the carrier for every help / behaviour note across this page (the hover, arrow and tabs explanations above all render through it)."
        >
          <Panel caption="// INFOBOX">
            <State caption="2px accent left edge · 12px muted body">
              <InfoBox>
                Drafts never reach the home feed — the unpublished overlay only
                ever shows to you.
              </InfoBox>
            </State>
          </Panel>
        </Section>

        <Section
          id="errormessage"
          index="25"
          title="ERRORMESSAGE"
          intro="The full-screen error / 404 page — the GlitchText headline, the status eyebrow, the stacktrace Console and a go-home button. It is normally full-page (min-h-app); here it's the real component, contained in a height-capped, overflow-hidden box for the showcase."
        >
          <Panel caption="// ERRORMESSAGE — contained preview (normally full-page)">
            <State caption="the real component, min-height overridden to fit the box">
              <div className="relative h-[460px] overflow-hidden border-2 border-[var(--m-dim)] [&>.mono-scope]:min-h-full">
                <ErrorMessage
                  error={new Error("Cannot read 'energy' of undefined")}
                  status={500}
                />
              </div>
            </State>
          </Panel>
        </Section>

        {/* ───────────────────────── EFFECTS ───────────────────────── */}
        <GroupBand {...bandProps("effects")} />

        <Section
          id="glitchtext"
          index="26"
          title="GLITCHTEXT"
          intro="Jitter + accent/error chromatic ghosts — the error-page headline. Auto-beats on its own; caret adds a blinking terminal cursor. Holds a single static frame under reduced-motion."
        >
          <Panel caption="// GLITCHTEXT — auto beat">
            <State caption="jitter + accent/error ghosts (error pages)">
              <span className="font-display text-[32px] leading-none font-bold tracking-[-0.02em] text-[var(--m-fg)]">
                <GlitchText caret>Glitch</GlitchText>
              </span>
            </State>
          </Panel>
        </Section>

        <Section
          id="matrixtext"
          index="27"
          title="MATRIXTEXT"
          intro="Decodes a string from scrambled glyphs and loops. Theme-aware; resolves to the legible static string under reduced-motion."
        >
          <Panel caption="// MATRIXTEXT — decode loop">
            <State caption="scrambled → resolved · respects reduced-motion">
              <MatrixText
                text="// SIGNAL SENT ... NO REPLY YET"
                className="mono-label"
              />
            </State>
          </Panel>
        </Section>

        {/* ───────────────────────── PROSE ───────────────────────── */}
        <GroupBand {...bandProps("prose")} />

        <Section
          id="prose"
          index="28"
          title="CREPE EDITOR"
          intro="The article authoring surface, live. This embeds the real Crepe (Milkdown) WYSIWYG — the exact editor behind the post composer (dynamic, client-only) — seeded with markdown. Type into it: the toolbar formats, the editable column sits at the 700px measure, and it renders 1:1 with the read view through .mono-prose."
        >
          <Panel caption="// CREPE — live WYSIWYG (the real composer editor)">
            <div className="border-2 border-[var(--m-dim)] bg-[var(--m-card)]">
              <CrepeEditor
                markdown={PROSE_SEED}
                placeholder="Start writing … use the toolbar to format"
                onChange={() => {}}
              />
            </div>
            <InfoBox className="mt-7">
              This is the same component the composer mounts at Step 2 — image
              upload, the Effects ▾ marks and the slash menu all work. Edits
              here are local to the showcase (the onChange is a no-op).
            </InfoBox>
          </Panel>
        </Section>
      </div>

      <Modal
        isOpen={demoOpen}
        onOpenChange={() => setDemoOpen(false)}
        labelledBy={demoTitleId}
      >
        {(close) => (
          <>
            <ModalHeader
              eyebrow="// DEMO"
              title="Save changes?"
              titleId={demoTitleId}
              subtitle="The real Modal shell — focus-trapped, Esc + backdrop close, body scroll locked."
              onClose={close}
            />
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addToastSuccess("Saved from the demo modal");
                close();
              }}
            >
              <SubmitButton>Save</SubmitButton>
            </form>
          </>
        )}
      </Modal>

      <ConfirmModal
        isOpen={confirmOpen}
        onOpenChange={() => setConfirmOpen(false)}
        title="Delete this post?"
        description="This post and all its comments will be permanently removed. This can't be undone."
        confirmLabel="Delete post"
        onConfirm={() => addToastSuccess("Deleted (demo)")}
      />

      <ConfirmModal
        isOpen={confirmDefaultOpen}
        onOpenChange={() => setConfirmDefaultOpen(false)}
        tone="default"
        title="Publish this post?"
        description="It'll appear on the home feed and your profile right away."
        confirmLabel="Publish"
        onConfirm={() => addToastSuccess("Published (demo)")}
      />
    </>
  );
}
