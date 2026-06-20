"use client";

import type { CSSProperties, ReactNode } from "react";
import { Bars3Icon, LinkIcon } from "@heroicons/react/24/solid";
import { Header } from "@/widgets/header";
import { LogoSloth } from "@/shared/ui/logo-sloth";
import { Label, Category, StatusBadge, Metric, Dot, Field } from "@/shared/ui";

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

/* ----------------------------- helpers ----------------------------- */
function Section({
  index,
  title,
  intro,
  children,
}: {
  index: string;
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t-2 border-[var(--m-line)] pt-10">
      <div className="text-[11px] tracking-[0.12em] text-[var(--m-muted2)]">
        {index} — {title}
      </div>
      {intro ? (
        <p className="mt-7 max-w-[46em] text-[14px] leading-[1.7] text-[var(--m-muted)]">
          {intro}
        </p>
      ) : null}
      <div className="mt-7">{children}</div>
    </section>
  );
}

/** Demo card — the `--m-card` panel with a small muted2 caption. */
function Demo({
  caption,
  children,
  className = "",
}: {
  caption: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-[var(--m-card)] p-7 ${className}`}>
      <div className="mb-5 text-[11px] tracking-[0.12em] text-[var(--m-muted2)]">
        {caption}
      </div>
      {children}
    </div>
  );
}

/** Spec table row — label on the left, accent token value on the right. */
function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-baseline gap-6 border-b-2 border-[var(--m-dim)] py-3">
      <div className="text-[14px] text-[var(--m-fg)]">{label}</div>
      <div className="text-[12px] tracking-[0.06em] whitespace-nowrap text-[var(--m-accent)] tabular-nums">
        {value}
      </div>
    </div>
  );
}

/** 40px square avatar — outline accent letter (byline / comment scale). */
function Avatar({ letter, fill = false }: { letter: string; fill?: boolean }) {
  return (
    <span
      className={`font-display flex size-10 shrink-0 items-center justify-center text-[16px] font-bold text-[var(--m-accent)] ${
        fill ? "bg-[var(--m-panel)]" : "border-2 border-[var(--m-accent)]"
      }`}
    >
      {letter}
    </span>
  );
}

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

/* ----------------------------- button ----------------------------- */
const authSubmit =
  "flex h-9 w-full items-center justify-center bg-[var(--m-accent)] text-[var(--m-bg)] font-display font-bold text-[14px] leading-none";

export default function BrandPage() {
  return (
    <div
      className="mono-scope mx-[calc(50%-50vw)] min-h-screen w-screen bg-[var(--m-bg)] text-[var(--m-fg)]"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      <Header />

      <main className="mx-auto max-w-[1100px] px-10 pt-20 pb-10">
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
          скруглений. Это живой референс — все примеры собраны из реальных
          примитивов <code className="text-[var(--m-fg)]">src/shared/ui</code>.
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

          {/* 04 LABELS · CATEGORIES · STATUS */}
          <Section
            index="04"
            title="LABELS · CATEGORIES · STATUS"
            intro="«Терминальные» маркеры: // EYEBROW (Label), [ category ] (Category), статус-бейдж (StatusBadge). Лейблы/категории — 11px / 0.12em; бейдж — 0.06em uppercase."
          >
            <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
              <Demo caption="LABELS & EYEBROWS">
                <div className="flex flex-col gap-4">
                  <Label>PUBLICATIONS</Label>
                  <Label caret>MOST ACTIVE USER</Label>
                  <div>
                    <Category>ai</Category>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <StatusBadge status="LATEST DROP" />
                    <StatusBadge status="PINNED" />
                  </div>
                </div>
              </Demo>
              <Demo caption="SPEC">
                <div className="flex flex-col">
                  <Spec
                    label="// eyebrow · [ category ]"
                    value="11px · 0.12em"
                  />
                  <Spec label="Status badge" value="11px · 0.06em · upper" />
                  <Spec label="Field label" value="11px · 0.12em · upper" />
                  <Spec label="Status badge chip" value="px 10 · py 8" />
                  <Spec label="Badge icon" value="12px" />
                </div>
              </Demo>
            </div>
          </Section>

          {/* 05 BUTTONS */}
          <Section
            index="05"
            title="BUTTONS"
            intro="Контролы 36px (h-9): primary (mono-cta), outline (mono-btn-outline), icon (mono-icon-btn, size-9). Full-width submit в auth — тот же 36px (h-9), Space Grotesk 700 / 14px, flex-center + leading-none."
          >
            <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
              <Demo caption="36PX CONTROLS (h-9)">
                <div className="flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    className="mono-cta inline-flex h-9 items-center justify-center px-4 text-[14px] font-bold tracking-[0.06em]"
                  >
                    Primary CTA
                  </button>
                  <button
                    type="button"
                    className="mono-btn-outline inline-flex h-9 items-center justify-center px-4 text-[14px] font-semibold tracking-[0.06em]"
                  >
                    Outline
                  </button>
                  <button
                    type="button"
                    aria-label="Link"
                    className="mono-icon-btn size-9"
                  >
                    <LinkIcon className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Menu"
                    className="mono-icon-btn size-9"
                  >
                    <Bars3Icon className="size-4" />
                  </button>
                </div>
              </Demo>
              <Demo caption="FULL-WIDTH AUTH SUBMIT (36px)">
                <button type="button" className={authSubmit}>
                  Log in →
                </button>
                <div className="mt-4 flex flex-col">
                  <Spec label="Control height" value="36px · h-9" />
                  <Spec label="Padding · text" value="px-4 · 14/700/0.06em" />
                  <Spec label="Auth submit" value="h-9 · 14/700" />
                  <Spec label="Borders · corners" value="2px · square" />
                </div>
              </Demo>
            </div>
          </Section>

          {/* 06 FORM FIELD */}
          <Section
            index="06"
            title="FORM FIELD"
            intro="Underline-поле (Field): инпут 14px, лейбл всегда 11px/0.12em uppercase — анимируется только позиция (placeholder-спот → верх на фокусе/заполнении). Бордер 2px dim → accent на фокусе; ошибка (m-error, 11px) рендерится только при наличии. Пароль получает eye-toggle."
          >
            <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
              <Demo caption="UNDERLINE FIELD">
                <Field id="brand-email" label="Email" type="email" />
                <div className="mt-2">
                  <Field id="brand-pass" label="Password" type="password" />
                </div>
              </Demo>
              <Demo caption="SPEC">
                <div className="flex flex-col">
                  <Spec label="Input size" value="14px" />
                  <Spec label="Floating label" value="11px · 0.12em" />
                  <Spec label="Underline" value="2px · dim → accent" />
                  <Spec label="Error text" value="11px · m-error" />
                </div>
              </Demo>
            </div>
          </Section>

          {/* 07 META / INFO ROWS */}
          <Section
            index="07"
            title="META / INFO ROWS"
            intro="Строки автор · дата · метрики — ОДИН кегль Caption 12px, иконки 14px (Metric), разделитель · (Dot) цветом muted2, числа tabular-nums. In-group gap 10, между метриками 16."
          >
            <div className="flex flex-col gap-5">
              <Demo caption="POST BYLINE · avatar 40px">
                <div className="flex items-center gap-3">
                  <Avatar letter="Э" />
                  <div>
                    <div className="font-display text-[14px] font-semibold text-[var(--m-fg)]">
                      Эльвира Носова
                    </div>
                    <div className="flex items-center gap-2 text-[12px] text-[var(--m-muted)]">
                      <span>@lazy_ela</span>
                      <Dot />
                      <span>14 Jun 2025</span>
                      <Dot />
                      <span>6 min read</span>
                    </div>
                  </div>
                </div>
              </Demo>
              <Demo caption="FEED / LIST META · Caption 12px · icon 14px">
                <div className="flex flex-wrap items-center gap-4 text-[12px] text-[var(--m-muted2)]">
                  <span className="text-[var(--m-fg)]">@kostya</span>
                  <Dot />
                  <span>12 May 2025</span>
                  <span className="ml-auto flex items-center gap-4">
                    <Metric kind="likes" value={412} />
                    <Metric kind="views" value={18240} />
                    <Metric kind="comments" value={37} />
                  </span>
                </div>
              </Demo>
            </div>
          </Section>

          {/* 08 SPACING & RHYTHM */}
          <Section
            index="08"
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
              <strong className="text-[var(--m-accent)]">8</strong> (mb-2) ·
              label → value / title → body{" "}
              <strong className="text-[var(--m-accent)]">16</strong> (mt-4) ·
              body → meta <strong className="text-[var(--m-accent)]">24</strong>
              .
            </div>
          </Section>

          {/* 09 LETTER-SPACING & LINE-HEIGHT */}
          <Section
            index="09"
            title="LETTER-SPACING & LINE-HEIGHT"
            intro="Все лейблы и категории — трекинг 0.12em на 11px (это и даёт «терминальный» характер; без него — плоско). Бейджи плотнее — 0.06em. Заголовки -0.02em."
          >
            <Demo caption="✕ 0 vs ✓ 0.12em" className="mb-7">
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
            </Demo>
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
      </main>
    </div>
  );
}
