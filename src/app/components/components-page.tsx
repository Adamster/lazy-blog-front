"use client";

import { useState, type ReactNode } from "react";
import { LinkIcon, TrashIcon, PencilIcon } from "@heroicons/react/24/solid";
import { Header } from "@/widgets/header";
import {
  Label,
  Category,
  StatusBadge,
  Metric,
  Dot,
  MatrixText,
  Menu,
  Field,
  Textarea,
  Select,
  Switch,
  Avatar,
  PostBody,
  Modal,
  ModalHeader,
  SubmitButton,
  useModalTitleId,
  type SelectOption,
} from "@/shared/ui";
import { Loading } from "@/shared/ui/loading";
import { Sparkline, buildMonthlySeries } from "@/shared/ui/sparkline";
import ConfirmDeleteModal from "@/shared/ui/confirmation-modal";
import { addToastSuccess, addToastError } from "@/shared/lib/toasts";

/* ----------------------------- layout helpers ----------------------------- */

/** Top-level section — `NN — TITLE` eyebrow + 40px section rhythm. */
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

/** One labelled state cell — small caption above the live primitive. */
function State({
  caption,
  children,
  className = "",
}: {
  caption: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="mb-4 text-[11px] tracking-[0.12em] text-[var(--m-muted2)] uppercase">
        {caption}
      </div>
      {children}
    </div>
  );
}

/** A `--m-card` panel grouping related state cells, with its own caption. */
function Panel({
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
      <div className="mb-5 text-[11px] tracking-[0.12em] text-[var(--m-accent)]">
        {caption}
      </div>
      {children}
    </div>
  );
}

/* --------------------------- shared button classes --------------------------- */
const ctaCls =
  "mono-cta inline-flex h-9 items-center justify-center px-4 text-[14px] font-bold tracking-[0.06em]";
const outlineCls =
  "mono-btn-outline inline-flex h-9 items-center justify-center px-4 text-[14px] font-semibold tracking-[0.06em]";
const dangerCls =
  "inline-flex h-9 items-center justify-center border-2 border-[var(--m-error)] bg-[var(--m-error)] px-4 text-[14px] font-bold tracking-[0.06em] text-[var(--m-bg)] uppercase transition-colors hover:bg-transparent hover:text-[var(--m-error)] disabled:opacity-60";

/* ------------------------------ static data ------------------------------ */
const CAT_OPTIONS: SelectOption[] = [
  { value: "ai", label: "AI" },
  { value: "design", label: "Design" },
  { value: "philosophy", label: "Philosophy" },
  { value: "code", label: "Code" },
];

const PROSE_SAMPLE = `### Self-debate as a method

A short sample of the **mono-prose** render — heading, list, blockquote,
inline \`code\`, a [link](https://example.com), and a fenced block.

- First point, stated plainly.
- Second point, with \`inline code\`.

> Confidence isn't knowledge; it's style.

\`\`\`ts
const decode = (glyphs: string[]) => glyphs.join("");
\`\`\``;

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

/* ------------------------------- the page ------------------------------- */
export default function ComponentsPage() {
  // Interactive demo state.
  const [demoOpen, setDemoOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [filledText, setFilledText] = useState("hello@notlazy.dev");
  const [filledArea, setFilledArea] = useState(
    "Уверенность — это не знание; это стиль."
  );
  const [singleSel, setSingleSel] = useState<string | undefined>("ai");
  const [multiSel, setMultiSel] = useState<string[]>(["design", "code"]);
  const [emptySel, setEmptySel] = useState<string | undefined>(undefined);
  const [switchOn, setSwitchOn] = useState(true);

  const demoTitleId = useModalTitleId();

  return (
    <div
      className="mono-scope mx-[calc(50%-50vw)] min-h-screen w-screen bg-[var(--m-bg)] text-[var(--m-fg)]"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      <Header />

      <main className="mx-auto max-w-[1240px] px-10 pt-20 pb-10">
        {/* Masthead */}
        <div className="text-[11px] tracking-[0.12em] text-[var(--m-accent)]">
          {"// NOT LAZY — COMPONENTS · KITCHEN SINK"}
        </div>
        <h1 className="font-display mt-7 text-[40px] leading-none font-bold tracking-[-0.02em]">
          Components
        </h1>
        <p className="mt-5 max-w-[46em] text-[14px] leading-[1.7] text-[var(--m-muted)]">
          Every Brutalist-Mono primitive from{" "}
          <code className="text-[var(--m-fg)]">src/shared/ui</code> and every
          state, side by side. A living reference — these are the real
          components, so the page stays truthful as the design system evolves.
          Hover and focus states are CSS-only and noted, not staged. Theme
          follows the header toggle.
        </p>

        <div className="mt-10 flex flex-col gap-10">
          {/* 01 — BUTTONS */}
          <Section
            index="01"
            title="BUTTONS"
            intro="36px controls (h-9). Primary (.mono-cta), outline (.mono-btn-outline), icon (.mono-icon-btn), destructive (--m-error), and the full-width auth SubmitButton. Hover is CSS; disabled + pending are shown."
          >
            <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
              <Panel caption="// PRIMARY · OUTLINE · ICON · DESTRUCTIVE">
                <div className="grid grid-cols-2 gap-x-7 gap-y-7">
                  <State caption="default">
                    <div className="flex flex-wrap items-center gap-4">
                      <button type="button" className={ctaCls}>
                        Primary
                      </button>
                      <button type="button" className={outlineCls}>
                        Outline
                      </button>
                      <button
                        type="button"
                        aria-label="Copy link"
                        className="mono-icon-btn size-9"
                      >
                        <LinkIcon className="size-4" />
                      </button>
                      <button type="button" className={dangerCls}>
                        Delete
                      </button>
                    </div>
                  </State>
                  <State caption="disabled">
                    <div className="flex flex-wrap items-center gap-4">
                      <button type="button" disabled className={ctaCls}>
                        Primary
                      </button>
                      <button
                        type="button"
                        disabled
                        className={`${outlineCls} disabled:opacity-60`}
                      >
                        Outline
                      </button>
                      <button
                        type="button"
                        disabled
                        aria-label="Copy link"
                        className="mono-icon-btn size-9 disabled:opacity-60"
                      >
                        <LinkIcon className="size-4" />
                      </button>
                      <button type="button" disabled className={dangerCls}>
                        Delete
                      </button>
                    </div>
                  </State>
                </div>
                <p className="mt-7 text-[12px] leading-[1.6] text-[var(--m-muted2)]">
                  Hover (CSS): primary inverts to hollow accent; outline/icon
                  borders go accent.
                </p>
              </Panel>

              <Panel caption="// FULL-WIDTH SUBMIT (SubmitButton)">
                <div className="flex flex-col gap-7">
                  <State caption="default">
                    <form onSubmit={(e) => e.preventDefault()}>
                      <SubmitButton>Log in →</SubmitButton>
                    </form>
                  </State>
                  <State caption="pending / loading">
                    <form onSubmit={(e) => e.preventDefault()}>
                      <SubmitButton pending pendingLabel="Signing in…">
                        Log in →
                      </SubmitButton>
                    </form>
                  </State>
                </div>
              </Panel>
            </div>
          </Section>

          {/* 02 — LABELS · CATEGORIES · BADGES */}
          <Section
            index="02"
            title="LABELS · CATEGORIES · BADGES"
            intro="Terminal markers — Label (// X, optional blinking caret), Category ([ x ]), StatusBadge (LATEST DROP / PINNED), and the inline [ Draft ] badge. Labels/categories 11px / 0.12em; badges 0.06em uppercase."
          >
            <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
              <Panel caption="// LABELS & CATEGORY">
                <div className="grid grid-cols-2 gap-x-7 gap-y-7">
                  <State caption="label">
                    <Label>PUBLICATIONS</Label>
                  </State>
                  <State caption="label · caret (blinking)">
                    <Label caret>MOST ACTIVE USER</Label>
                  </State>
                  <State caption="label · muted override">
                    <Label className="text-[11px] font-medium tracking-[0.12em] text-[var(--m-muted2)]">
                      VOTE
                    </Label>
                  </State>
                  <State caption="category">
                    <Category>ai</Category>
                  </State>
                </div>
              </Panel>

              <Panel caption="// STATUS & INLINE BADGES">
                <div className="grid grid-cols-2 gap-x-7 gap-y-7">
                  <State caption="status · latest drop">
                    <StatusBadge status="LATEST DROP" />
                  </State>
                  <State caption="status · pinned">
                    <StatusBadge status="PINNED" />
                  </State>
                  <State caption="inline [ Draft ] badge">
                    <span className="border-2 border-[var(--m-accent)] px-2.5 py-1 text-[11px] font-semibold tracking-[0.06em] text-[var(--m-accent)] uppercase">
                      [ Draft ]
                    </span>
                  </State>
                  <State caption="dot separator">
                    <span className="flex items-center gap-2 text-[12px] text-[var(--m-muted)]">
                      <span>@lazy</span>
                      <Dot />
                      <span>14 Jun</span>
                    </span>
                  </State>
                </div>
              </Panel>
            </div>
          </Section>

          {/* 03 — AVATAR */}
          <Section
            index="03"
            title="AVATAR"
            intro="Square 2px-border tile. sm (40px / 16px letter) for bylines & comments, lg (128px / 44px letter) for the profile header. Image when set, first-initial fallback on the panel surface otherwise."
          >
            <Panel caption="// SIZE × FALLBACK">
              <div className="flex flex-wrap items-end gap-10">
                <State caption="sm · image">
                  <Avatar
                    size="sm"
                    name="Elvira Nosova"
                    src="https://i.pravatar.cc/128?img=47"
                  />
                </State>
                <State caption="sm · initial fallback">
                  <Avatar size="sm" name="Konstantin" />
                </State>
                <State caption="lg · image">
                  <Avatar
                    size="lg"
                    name="Elvira Nosova"
                    src="https://i.pravatar.cc/256?img=12"
                  />
                </State>
                <State caption="lg · initial fallback">
                  <Avatar size="lg" name="Anna" />
                </State>
              </div>
            </Panel>
          </Section>

          {/* 04 — INPUTS */}
          <Section
            index="04"
            title="INPUTS"
            intro="The headline coverage. Underline Field (text / email / password), Textarea, custom Select (single + multiple) and Switch — each shown empty, filled, errored, disabled, side by side. Error text (! …, 11px / --m-error) renders only when present; the floating label always reads uppercase."
          >
            {/* Field */}
            <Panel
              caption="// FIELD — text · email · password"
              className="mb-7"
            >
              <div className="grid grid-cols-1 gap-x-7 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
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
                <State caption="password · eye toggle">
                  <Field
                    id="cs-f-pass"
                    label="Password"
                    type="password"
                    defaultValue="hunter2hunter2"
                  />
                </State>
                <State caption="password · error">
                  <Field
                    id="cs-f-pass-err"
                    label="Password"
                    type="password"
                    defaultValue="123"
                    error="Too short — min 8 characters"
                  />
                </State>
                <State caption="text · empty">
                  <Field id="cs-f-text" label="Display name" type="text" />
                </State>
                <State caption="text · disabled filled">
                  <Field
                    id="cs-f-text-dis"
                    label="Username"
                    type="text"
                    defaultValue="lazy_ela"
                    disabled
                  />
                </State>
              </div>
            </Panel>

            {/* Textarea */}
            <Panel caption="// TEXTAREA" className="mb-7">
              <div className="grid grid-cols-1 gap-x-7 gap-y-9 lg:grid-cols-3">
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
              </div>
            </Panel>

            {/* Select */}
            <Panel caption="// SELECT — single · multiple" className="mb-7">
              <div className="grid grid-cols-1 gap-x-7 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
                <State caption="single · selected value">
                  <Select
                    id="cs-sel-single"
                    label="Category"
                    options={CAT_OPTIONS}
                    value={singleSel}
                    onChange={setSingleSel}
                  />
                </State>
                <State caption="single · empty (placeholder)">
                  <Select
                    id="cs-sel-empty"
                    label="Category"
                    placeholder="Pick one…"
                    options={CAT_OPTIONS}
                    value={emptySel}
                    onChange={setEmptySel}
                  />
                </State>
                <State caption="multiple · selected">
                  <Select
                    id="cs-sel-multi"
                    label="Categories"
                    multiple
                    options={CAT_OPTIONS}
                    value={multiSel}
                    onChange={setMultiSel}
                  />
                </State>
                <State caption="error">
                  <Select
                    id="cs-sel-error"
                    label="Category"
                    required
                    options={CAT_OPTIONS}
                    value={undefined}
                    onChange={() => {}}
                    error="Choose a category"
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
              <p className="mt-7 text-[12px] leading-[1.6] text-[var(--m-muted2)]">
                Click a Select to open its listbox — ↑/↓ to move, Enter/Space to
                toggle, Esc to close, type-ahead supported.
              </p>
            </Panel>

            {/* Switch */}
            <Panel caption="// SWITCH">
              <div className="flex flex-col gap-7 sm:flex-row sm:gap-10">
                <State caption="on" className="sm:w-56">
                  <Switch
                    id="cs-sw-on"
                    label="Published"
                    checked={switchOn}
                    onChange={setSwitchOn}
                  />
                </State>
                <State caption="off" className="sm:w-56">
                  <Switch
                    id="cs-sw-off"
                    label="Published"
                    checked={false}
                    onChange={() => {}}
                  />
                </State>
                <State caption="disabled (on)" className="sm:w-56">
                  <Switch
                    id="cs-sw-dis"
                    label="Published"
                    checked
                    disabled
                    onChange={() => {}}
                  />
                </State>
              </div>
            </Panel>
          </Section>

          {/* 05 — MENU & OVERLAYS */}
          <Section
            index="05"
            title="MENU · MODALS"
            intro="The kebab Menu (opens an inline icon-row to the left, including a destructive item) and the real Modal shell — a demo confirm via Modal/ModalHeader/SubmitButton plus the actual ConfirmDeleteModal. Buttons below open them for real."
          >
            <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
              <Panel caption="// KEBAB MENU">
                <State caption="click the dots — opens edit + destructive delete">
                  <div className="flex justify-end border-2 border-[var(--m-dim)] p-5">
                    <Menu
                      triggerLabel="Post options"
                      items={[
                        {
                          id: "edit",
                          label: "Edit",
                          icon: <PencilIcon />,
                          onSelect: () => addToastSuccess("Edit clicked"),
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

              <Panel caption="// MODALS">
                <div className="flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    className={outlineCls}
                    onClick={() => setDemoOpen(true)}
                  >
                    Open demo modal
                  </button>
                  <button
                    type="button"
                    className={dangerCls}
                    onClick={() => setConfirmOpen(true)}
                  >
                    Confirm delete
                  </button>
                </div>
                <p className="mt-7 text-[12px] leading-[1.6] text-[var(--m-muted2)]">
                  Real Modal shell: focus-trapped, Esc + backdrop close, scroll
                  locked. Both portal into a themed .mono-portal node.
                </p>
              </Panel>
            </div>
          </Section>

          {/* 06 — FEEDBACK / TOASTS */}
          <Section
            index="06"
            title="FEEDBACK · TOASTS"
            intro="Notifications go through the module-level toast store; the app-level <Toaster/> renders them. These call the real addToastSuccess / addToastError so the live toast appears bottom-corner."
          >
            <Panel caption="// TOASTS">
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  className={ctaCls}
                  onClick={() => addToastSuccess("Post published successfully")}
                >
                  Show success
                </button>
                <button
                  type="button"
                  className={outlineCls}
                  onClick={() => addToastError("Something went wrong")}
                >
                  Show error
                </button>
              </div>
            </Panel>
          </Section>

          {/* 07 — META & DATA */}
          <Section
            index="07"
            title="META · DATA"
            intro="Metric (icon + tabular number, each kind), the MatrixText decode animation, and the Sparkline (monthly series). One caption size — 12px; icons 14px."
          >
            <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
              <Panel caption="// METRIC — every kind">
                <div className="flex flex-col gap-7">
                  <State caption="default (muted)">
                    <div className="flex flex-wrap items-center gap-4 text-[12px] text-[var(--m-muted2)]">
                      <Metric kind="likes" value={412} />
                      <Metric kind="views" value={18240} />
                      <Metric kind="posts" value={37} />
                      <Metric kind="comments" value={88} />
                    </div>
                  </State>
                  <State caption="accent (e.g. up-voted)">
                    <div className="flex flex-wrap items-center gap-4 text-[12px] text-[var(--m-muted2)]">
                      <Metric kind="likes" value={413} accent />
                      <Metric kind="views" value={18241} />
                    </div>
                  </State>
                </div>
              </Panel>

              <Panel caption="// MATRIXTEXT (animated decode)">
                <State caption="cycles forever · respects reduced-motion">
                  <MatrixText
                    text="// SIGNAL SENT ... NO REPLY YET"
                    className="mono-label"
                  />
                </State>
              </Panel>
            </div>

            <Panel caption="// SPARKLINE — monthly series" className="mt-7">
              <State caption="6-month rolling counts · accent curve + dots">
                <div className="max-w-[420px]">
                  <Sparkline
                    series={buildMonthlySeries(SPARK_DATES, 6)}
                    gradientId="cs-spark"
                    ariaLabel="Posts per month over the last six months"
                  />
                </div>
              </State>
            </Panel>
          </Section>

          {/* 08 — LOADING */}
          <Section
            index="08"
            title="LOADING"
            intro="The mono spinner — a 2px square ring with an accent top edge. inline centers it in flow; the block form fills the viewport (shown boxed here so it doesn't take over the page)."
          >
            <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
              <Panel caption="// INLINE">
                <State caption="inline (20px, in-flow)">
                  <Loading inline />
                </State>
              </Panel>
              <Panel caption="// BLOCK">
                <State caption="block (28px, fills its container)">
                  <div className="relative h-40 overflow-hidden border-2 border-[var(--m-dim)]">
                    {/* Block Loading fills min-h-screen; clip it to a demo box. */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span
                        role="status"
                        aria-label="Loading"
                        className="block animate-spin border-2 border-[var(--m-dim)] border-t-[var(--m-accent)]"
                        style={{ width: 28, height: 28 }}
                      />
                    </div>
                  </div>
                </State>
              </Panel>
            </div>
            <p className="mt-7 text-[12px] leading-[1.6] text-[var(--m-muted2)]">
              Note: the real block Loading uses min-h-screen + header
              compensation, so it can&apos;t render &quot;boxed&quot; without
              taking over the viewport — the demo box mirrors its exact spinner
              markup. The inline variant above is the real component.
            </p>
          </Section>

          {/* 09 — PROSE */}
          <Section
            index="09"
            title="PROSE (PostBody)"
            intro="The shared markdown renderer (.mono-prose). Same component for the server-rendered read view and the editor preview — heading, list, blockquote, inline + fenced code, and a safe external link. Raw HTML is intentionally not rendered."
          >
            <Panel caption="// MARKDOWN → MONO-PROSE">
              <div className="max-w-[780px]">
                <PostBody markdown={PROSE_SAMPLE} />
              </div>
            </Panel>
          </Section>
        </div>
      </main>

      {/* ----------------------------- live overlays ----------------------------- */}
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
              <SubmitButton>Save →</SubmitButton>
            </form>
          </>
        )}
      </Modal>

      <ConfirmDeleteModal
        isOpen={confirmOpen}
        onOpenChange={() => setConfirmOpen(false)}
        message="Delete this post?"
        onConfirm={() => addToastSuccess("Deleted (demo)")}
      />
    </div>
  );
}
