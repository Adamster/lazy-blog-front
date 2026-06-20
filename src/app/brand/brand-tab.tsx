import type { CSSProperties } from "react";
import { LogoSloth } from "@/shared/ui/logo-sloth";
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
  bg: "#1a1a1a",
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
  bg: "#1a1a1a",
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
          {dark ? "светлый вариант" : "тёмный вариант"} — морда только моно, без
          зелёного
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
    sample: "Новый режим self-debate",
    display: true,
    style: { fontSize: 18, fontWeight: 600, lineHeight: 1.18 },
  },
  {
    spec: "Prose · 14 / 400 · lh 1.85",
    sample: "Уверенность — это не знание; это стиль.",
    style: { fontSize: 14, fontWeight: 400, lineHeight: 1.85 },
  },
  {
    spec: "UI body · 14 / 400 · lh 1.6",
    sample: "Саммари, био, кнопки, инпуты, комментарии — всё на 14.",
    style: { fontSize: 14, fontWeight: 400, lineHeight: 1.6 },
  },
  {
    spec: "Caption · 12 / 400",
    sample: "15 июня · 4 мин чтения · @lazy_ela",
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
      <div className="mt-7 flex items-center gap-5">
        <LogoSloth className="h-12 w-12 text-[var(--m-fg)]" />
        <div className="font-display text-[40px] leading-none font-bold tracking-[-0.02em] whitespace-nowrap">
          NOT <span className="text-[var(--m-accent)]">LAZY</span>
        </div>
      </div>
      <p className="mt-5 max-w-[46em] text-[14px] leading-[1.7] text-[var(--m-muted)]">
        Space Grotesk — для идентичности, заголовков и чисел; JetBrains Mono —
        для данных, кода, body и лейблов. Тёмно-серая база, никогда чистый
        чёрный. Акцент проекта —{" "}
        <strong className="text-[var(--m-accent)]">лайм</strong> (оливковый в
        свете, кислотный в тёмной). Геометрия: квадратные углы, рамки 2px, без
        скруглений. Foundations здесь; готовые примитивы и их состояния — во
        вкладке <code className="text-[var(--m-fg)]">Components</code>.
      </p>

      <div className="mt-10 flex flex-col gap-10">
        {/* 01 COLOR */}
        <Section
          index="01"
          title="COLOR SYSTEM"
          intro="Десять токенов на тему. В коде — только var(--m-*); хардкод хексов запрещён. Тема переключается классом .dark на предке (кнопка в хедере)."
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
          intro="Лок-ап [ TEAM ] NOT LAZY: бракетный бейдж в заливке акцента + словесный знак (NOT — fg, LAZY — accent, Space Grotesk 700). Морда ленивца (LogoSloth) — ТОЛЬКО моно: тёмная на светлом, светлая на тёмном. Зелёного (accent) варианта морды нет — акцент живёт только в лок-апе."
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
          intro="Шкала кеглей. Space Grotesk = идентичность/тайтлы/числа. JetBrains Mono = data/code/body/labels. Не выдумывай промежуточных размеров."
        >
          <div className="flex flex-col">
            {TYPE.map((t) => (
              <div
                key={t.spec}
                className="grid grid-cols-[200px_1fr] items-baseline gap-6 border-b-2 border-[var(--m-dim)] py-5"
              >
                <div className="text-[11px] tracking-[0.06em] text-[var(--m-muted2)]">
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
          intro="Системные foundations формы и сетки. Квадратные углы (без скруглений), рамки 2px везде (primary --m-line, secondary --m-dim), акцентные кромки тоже 2px (никогда 3px). Контейнеры и контролы — из фиксированной шкалы."
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
          intro="Сетка 4px. Секционность держим на 40px; 28px — ТОЛЬКО для повторяющихся item-гэпов (карточки, лента, список, комменты), НИКОГДА для секций. Промежуточные значения (6/14/22) — мимо."
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
          <div className="mt-7 border-l-2 border-l-[var(--m-accent)] bg-[var(--m-accent)]/[0.06] px-4 py-3 text-[14px] leading-[1.6] text-[var(--m-muted)]">
            Text-block rhythm: category → title{" "}
            <strong className="text-[var(--m-accent)]">8</strong> (mb-2) · label
            → value / title → body{" "}
            <strong className="text-[var(--m-accent)]">16</strong> (mt-4) · body
            → meta <strong className="text-[var(--m-accent)]">24</strong>.
          </div>
        </Section>

        {/* 06 LETTER-SPACING & LINE-HEIGHT */}
        <Section
          index="06"
          title="LETTER-SPACING & LINE-HEIGHT"
          intro="Все лейблы и категории — трекинг 0.12em на 11px (это и даёт «терминальный» характер; без него — плоско). Бейджи плотнее — 0.06em. Заголовки -0.02em."
        >
          <Panel caption="✕ 0 vs ✓ 0.12em" tone="muted" className="mb-7">
            <div className="grid grid-cols-1 gap-7 sm:grid-cols-2">
              <div>
                <div className="mb-2 text-[11px] tracking-[0.1em] text-[var(--m-muted2)]">
                  ✕ tracking 0 — плоско
                </div>
                <div className="text-[11px] tracking-[0] text-[var(--m-muted)]">
                  {"// MOST ACTIVE USER"}
                </div>
              </div>
              <div>
                <div className="mb-2 text-[11px] tracking-[0.1em] text-[var(--m-muted2)]">
                  ✓ tracking 0.12em — стандарт
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
