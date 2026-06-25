"use client";

import { useState } from "react";
import {
  AdjustmentsHorizontalIcon,
  LinkIcon,
  PencilIcon,
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
  Textarea,
  Select,
  Switch,
  Avatar,
  DraftOverlay,
  Modal,
  ModalHeader,
  SubmitButton,
  useModalTitleId,
  Loading,
  ProgressBar,
  StatBar,
  Stepper,
  UnderlineTabs,
  Console,
  Checkbox,
  RadioGroup,
  type SelectOption,
} from "@/shared/ui";
import { Sparkline, buildMonthlySeries } from "@/shared/ui/sparkline";
import ConfirmDeleteModal from "@/shared/ui/confirmation-modal";
import { addToastSuccess, addToastError } from "@/shared/lib/toasts";
import { Section, Panel, State } from "./_helpers";

/* --------------------------- shared button classes --------------------------- */
const ctaCls =
  "mono-cta inline-flex h-9 items-center justify-center px-4 text-[14px] font-bold tracking-[0.06em]";
const outlineCls =
  "mono-btn-outline inline-flex h-9 items-center justify-center px-4 text-[14px] font-semibold tracking-[0.06em]";
const dangerCls =
  "inline-flex h-9 items-center justify-center border-2 border-[var(--m-error)] bg-[var(--m-error)] px-4 text-[14px] font-bold tracking-[0.06em] text-[var(--m-bg)] uppercase transition-colors hover:bg-transparent hover:text-[var(--m-error)] disabled:opacity-60";
// Directional / abort nav (Back · Next · Cancel) — LINK treatment, never a boxed
// button: 11px label, muted2 → muted, no border / fill.
const navLinkCls =
  "inline-flex items-center gap-2 text-[11px] leading-none tracking-[0.12em] text-[var(--m-muted2)] uppercase transition-colors hover:text-[var(--m-muted)]";

/* ------------------------------ static data ------------------------------ */
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

/* ------------------------------- the tab ------------------------------- */
export function ComponentsTab() {
  // Interactive demo state.
  const [demoOpen, setDemoOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
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
  const [checks, setChecks] = useState({ replies: true, drafts: false });
  const [feedSort, setFeedSort] = useState("standard");

  const demoTitleId = useModalTitleId();

  return (
    <>
      {/* Masthead */}
      <div className="text-[11px] tracking-[0.12em] text-[var(--m-accent)]">
        {"// NOT LAZY — COMPONENTS · KITCHEN SINK"}
      </div>
      <h1 className="font-display mt-7 text-[40px] leading-none font-bold tracking-[-0.02em]">
        Components
      </h1>
      <p className="mt-5 text-[14px] leading-[1.7] text-[var(--m-muted)]">
        Every Brutalist-Mono primitive from{" "}
        <code className="text-[var(--m-fg)]">src/shared/ui</code> and every
        state, side by side. A living reference — these are the real components,
        so the page stays truthful as the design system evolves. Hover and focus
        states are CSS-only and noted, not staged. Theme follows the header
        toggle.
      </p>

      <div className="mt-10 flex flex-col gap-10">
        {/* 01 — BUTTONS */}
        <Section
          index="01"
          title="BUTTONS"
          intro="36px controls (h-9). Primary (.mono-cta), outline (.mono-btn-outline), destructive (--m-error) and icon (.mono-icon-btn) — shown default, then a single disabled example, then the loading/pending submit (spinner + label, action disabled). Hover is CSS. Arrows are direction-only and live below as LINK-style nav, never on action buttons."
        >
          <Panel caption="// PRIMARY · OUTLINE · DESTRUCTIVE · ICON">
            <div className="grid grid-cols-1 gap-x-7 gap-y-9 sm:grid-cols-3">
              <State caption="default">
                <div className="flex flex-wrap items-center gap-4">
                  <button type="button" className={ctaCls}>
                    Primary
                  </button>
                  <button type="button" className={outlineCls}>
                    Outline
                  </button>
                  <button type="button" className={dangerCls}>
                    Delete
                  </button>
                  <button
                    type="button"
                    aria-label="Copy link"
                    className="mono-icon-btn size-9"
                  >
                    <LinkIcon className="size-4" />
                  </button>
                </div>
              </State>
              <State caption="disabled">
                <button type="button" disabled className={ctaCls}>
                  Primary
                </button>
              </State>
              <State caption="pending — spinner + label, action disabled">
                <form onSubmit={(e) => e.preventDefault()}>
                  <SubmitButton
                    fullWidth={false}
                    pending
                    pendingLabel="Signing in…"
                  >
                    Log in
                  </SubmitButton>
                </form>
              </State>
            </div>
            <p className="mt-7 text-[12px] leading-[1.6] text-[var(--m-muted2)]">
              Hover (CSS): primary inverts to hollow accent; outline/icon
              borders go accent. Pending disables the action and swaps the label
              for the spinner + pending text.
            </p>
          </Panel>

          {/* The arrow rule — directional vs action. */}
          <Panel
            caption="// ARROWS — direction only, never on action buttons"
            className="mt-7"
          >
            <State caption="directional / navigation — arrows belong here">
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
            </State>
            <p className="mt-7 text-[12px] leading-[1.6] text-[var(--m-muted2)]">
              Arrows are for DIRECTION / navigation only — Next (→), Back (←),
              go-home — and they are LINK-style (11px label, muted2 → muted, NO
              border / box / fill), never boxed buttons. An abort (Cancel) is a
              close ✕ link, not a back arrow. Action buttons (login / submit /
              send / save) are the filled buttons and never carry an arrow.
            </p>
          </Panel>
        </Section>

        {/* 02 — LABELS · CATEGORY · EYEBROWS */}
        <Section
          index="02"
          title="LABELS · CATEGORY · EYEBROWS"
          intro="Terminal markers — Label (// X, optional blinking caret), Category ([ x ]), and the status line + dot separator that thread through every meta row. Labels/categories 11px / 0.12em; the draft/unpublished cover overlay (dim + crossed-eye + UNPUBLISHED) renders on the author's own feed cards & their post page."
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

            <Panel caption="// TERMINAL MARKERS — status · separator · draft">
              <div className="grid grid-cols-2 gap-x-7 gap-y-7">
                <State caption="status · latest drop">
                  <StatusBadge status="LATEST DROP" />
                </State>
                <State caption="status · pinned">
                  <StatusBadge status="PINNED" />
                </State>
                <State caption="dot separator">
                  <span className="flex items-center gap-2 text-[12px] text-[var(--m-muted)]">
                    <span>@lazy</span>
                    <Dot />
                    <span>14 Jun</span>
                  </span>
                </State>
                <State caption="unpublished cover overlay">
                  <div className="relative aspect-[16/9] w-full overflow-hidden border-2 border-[var(--m-dim)] bg-[var(--m-panel)]">
                    <DraftOverlay size="card" />
                  </div>
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

        {/* 04 — INPUTS: FIELD */}
        <Section
          index="04"
          title="INPUTS — FIELD"
          intro="Underline Field (text / email), shown empty (required *) → filled → error → disabled, side by side. Error text (! …, 11px / --m-error) renders only when present; the floating label always reads uppercase and only animates POSITION."
        >
          <Panel caption="// FIELD — text · email">
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
            </div>
          </Panel>
        </Section>

        {/* 05 — TEXTAREA */}
        <Section
          index="05"
          title="TEXTAREA"
          intro="The multi-line Field sibling — same underline + floating label, shown empty → filled → error → disabled."
        >
          <Panel caption="// TEXTAREA">
            <div className="grid grid-cols-1 gap-x-7 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
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

        {/* 06 — SELECT */}
        <Section
          index="06"
          title="SELECT"
          intro="The custom Select (single + multiple), shown empty (placeholder) → filled → error (a multiple-select, required) → disabled. Click to open the listbox — ↑/↓ to move, Enter/Space to toggle, Esc to close, type-ahead supported."
        >
          <Panel caption="// SELECT — single · multiple">
            <div className="grid grid-cols-1 gap-x-7 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
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

        {/* 07 — FORM CONTROLS: SWITCH · CHECKBOX · RADIO */}
        <Section
          index="07"
          title="FORM CONTROLS — SWITCH · CHECKBOX · RADIO"
          intro="Square selection controls — no circles in this system. Switch (on → off → disabled), Checkbox (fills accent with a ✓) and RadioGroup (inner filled square). All wrap native inputs (sr-only peer) for a11y, draw the accent focus-visible ring, and render the required asterisk from the same rule as the form fields. Error reddens the box + an 11px / 0.12em message."
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

        {/* 08 — MENU · MODALS */}
        <Section
          index="08"
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

            <Panel caption="// MODALS">
              <div className="flex flex-wrap items-center gap-3">
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

        {/* 09 — FEEDBACK · TOASTS */}
        <Section
          index="09"
          title="FEEDBACK · TOASTS"
          intro="Notifications go through the module-level toast store; the app-level <Toaster/> renders them. These call the real addToastSuccess / addToastError so the live toast appears bottom-right — a single card surface with a 2px type stripe (accent/error) and the status icon between the text and the right edge. The whole toast dismisses on click; it also auto-dismisses."
        >
          <Panel caption="// TOASTS">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className={ctaCls}
                onClick={() => addToastSuccess("Post published successfully")}
              >
                Show success
              </button>
              <button
                type="button"
                className={dangerCls}
                onClick={() => addToastError("Something went wrong")}
              >
                Show error
              </button>
            </div>
          </Panel>
        </Section>

        {/* 10 — STATUSES · METADATA */}
        <Section
          index="10"
          title="STATUSES · METADATA"
          intro="Metric (icon + tabular number, each kind) and the Sparkline (monthly series). One caption size — 12px; icons 14px; one colour — muted (except the rating kind, which is sign-coloured: ↑ accent / ↓ error / muted at 0). Byline rule: the @handle is the profile link (+ the avatar), the name is plain text; handle is muted everywhere with a muted→accent hover (never underline). Only the profile-page header @handle is accent."
        >
          <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
            <Panel caption="// METRIC — every kind">
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
                <State caption="rating — sign-coloured (↑ accent / ↓ error / 0 muted)">
                  <div className="flex flex-wrap items-center gap-4 text-[12px] text-[var(--m-muted)]">
                    <Metric kind="rating" value={42} />
                    <Metric kind="rating" value={-7} />
                    <Metric kind="rating" value={0} />
                  </div>
                </State>
              </div>
            </Panel>

            <Panel caption="// SPARKLINE — monthly series">
              <State caption="6-month rolling counts · accent curve + dots">
                <Sparkline
                  series={buildMonthlySeries(SPARK_DATES, 6)}
                  gradientId="cs-spark"
                  ariaLabel="Posts per month over the last six months"
                />
              </State>
            </Panel>
          </div>
        </Section>

        {/* 11 — LOADERS · PROGRESS */}
        <Section
          index="11"
          title="LOADERS · PROGRESS"
          intro="Terminal ASCII spinner (│ / ─ \ cycling at 100ms, accent) — inline centers it in flow; the block form pairs it with a LOADING label. ProgressBar is the ████░░░░ block bar (indeterminate sweep); StatBar is its determinate sibling — a labelled stat with a dotted-fill remainder + a right-aligned %, low values flipping to --m-error. Stepper = the composer's numbered step boxes (free-jump, forward gated by the parent). Every bar reads as one 12px data row."
        >
          <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
            <Panel caption="// SPINNER (Loading)">
              <div className="grid grid-cols-2 gap-x-7">
                <State caption="inline (14px, in-flow)">
                  <Loading inline />
                </State>
                <State caption="block — spinner + LOADING label">
                  <div className="flex items-center gap-3">
                    <Loading inline />
                    <span className="text-[11px] tracking-[0.12em] text-[var(--m-muted2)] uppercase">
                      Loading
                    </span>
                  </div>
                </State>
              </div>
            </Panel>

            <Panel caption="// STEPPER (composer)">
              <State caption="icon boxes · click to jump (forward gated by the parent) · a COMPLETE-but-inactive step gets the accent OUTLINE">
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
          </div>

          <Panel caption="// PROGRESSBAR — indeterminate" className="mt-7">
            <State caption="processing · unknown-duration sweep">
              <ProgressBar label="Processing" cells={48} />
            </State>
          </Panel>

          <Panel
            caption="// STATBAR — statistics (determinate)"
            className="mt-7"
          >
            <State caption="labelled stat · dotted remainder · low values go --m-error">
              <div className="flex flex-col gap-2.5">
                <StatBar label="CPU" value={38} cells={48} />
                <StatBar label="RAM" value={52} cells={48} />
                <StatBar label="Motivation" value={4} cells={48} />
                <StatBar label="Caffeine" value={98} cells={48} />
              </div>
            </State>
          </Panel>

          <Panel caption="// CONSOLE (terminal panel)" className="mt-7">
            <State caption="title bar + monospace body — reused from the error page">
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

        {/* 12 — TABS */}
        <Section
          index="12"
          title="TABS (UnderlineTabs)"
          intro="The shared UnderlineTabs — a 2px --m-dim baseline with an accent underline on the active tab (no marker boxes; the lighter chrome of a reference index). This is the variant driving this /brand page's own top bar. Full tab a11y (role=tablist / tab / aria-selected) + roving-tabindex arrow nav. (The letter-box TabNav variant — the composer step-box language re-dressed as tabs — drives edit-profile; it's a real component, just not shown here.)"
        >
          <Panel caption="// UNDERLINETABS — accent baseline, no marker boxes">
            <State caption="click to switch · arrow keys roam the tablist">
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
              <p className="mt-5 text-[12px] text-[var(--m-muted2)]">
                Panel:{" "}
                <span className="text-[var(--m-accent)] uppercase">
                  {tabDemo}
                </span>
              </p>
            </State>
          </Panel>
        </Section>
      </div>

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
              <SubmitButton>Save</SubmitButton>
            </form>
          </>
        )}
      </Modal>

      <ConfirmDeleteModal
        isOpen={confirmOpen}
        onOpenChange={() => setConfirmOpen(false)}
        title="Delete this post?"
        description="This post and all its comments will be permanently removed. This can't be undone."
        confirmLabel="Delete post"
        onConfirm={() => addToastSuccess("Deleted (demo)")}
      />
    </>
  );
}
