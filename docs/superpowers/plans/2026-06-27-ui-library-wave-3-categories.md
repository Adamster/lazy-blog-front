# UI Library — Wave 3 (category folders) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the CORE `shared/ui` primitives out of the flat folder into five category subfolders (`forms/overlays/feedback/navigation/data-display`) with per-category barrels, while the public `@/shared/ui` surface stays byte-identical for consumers.

**Architecture:** Pure structural move. Each category is one task: `git mv` its files together (intra-category relative imports survive), fix any cross-folder relative imports to the `@/shared/ui/...` alias, add a category `index.ts`, repoint the top `src/shared/ui/index.ts` re-exports for those files, and update any DEEP importers (files that import `@/shared/ui/<file>` directly, bypassing the barrel). The tree stays green at every commit.

**Tech Stack:** Next.js 16 (webpack), React 19, TypeScript, Tailwind v4.

## Global Constraints

- **`@/shared/ui` exports stay identical** — every symbol currently exported from the barrel keeps exporting (same name) after the move. Verify by diffing the set of exported names.
- **Deep imports must keep resolving** — some core files are imported via `@/shared/ui/<file>` directly (NOT through the barrel): `confirmation-modal`, `toaster`, `sparkline`, `step-box` (and possibly others — grep per task). When such a file moves, repoint its deep importers to the new path.
- **Scope = CORE primitives only.** Do NOT move the deferred files (they stay flat for later waves / the deferred lab cleanup): all effect/LAB toys (`ansi-block`, `ascii-*`, `boot-*`, `channel-surf`, `cite-tooltip`, `count-up`, `datamosh-headline`, `diff-block`, `dither-cam`, `fold-block`, `glyph-cursor-trail`, `gravity-well`, `kbd`, `marquee`, `margin-ref`, `poll-block`, `reveal-mark`, `scan-link`, `scan-text`, `spotlight-decode`, `transcript`, `wave-highlight`, `weight-wave`, `compare-slider`), prose (`post-body`, `prose-blocks`, `media-embed`, `remark-media-embeds`), app-specific (`draft-overlay`, `heart-icons`, `logo-sloth`, `image-cropper*`, `error-message`), `theme/`, `effects/`. Their barrel lines stay UNCHANGED (still point at the flat files).
- **No component logic changes** — only file location + import paths.
- Tests move with their component (intra-folder `./x` imports survive); only cross-folder relatives change.
- Gate EVERY task on `npm run typecheck` (0 errors) + `npm run lint` (0 errors). Commit per task. Branch `feat/ui-library-categories` (already off fresh main).

---

## Per-category procedure (applies to Tasks 1–5)

For category folder `C` with file list `F`:

1. `mkdir -p src/shared/ui/C` implicitly via `git mv`.
2. `git mv src/shared/ui/<file> src/shared/ui/C/<file>` for each file in `F` (component + its `*.test.*` together).
3. In each MOVED file, fix imports that pointed at a shared/ui sibling NOW in a different folder (or still flat): change relative `./x` / `../x` to `@/shared/ui/x` (or `@/shared/ui/<otherCat>/x`). Imports of `@/...` aliases, `react`, and SAME-folder siblings (`./y` where y also moved to `C`) need NO change. (typecheck will flag any miss.)
4. Create `src/shared/ui/C/index.ts` re-exporting the category's public symbols (copy the exact `export {…} from "./<file>"` lines from the top barrel, with paths now relative to `C`).
5. In `src/shared/ui/index.ts`, replace each moved file's `export … from "./<file>"` line with `export … from "./C/<file>"` (or re-export the category barrel: `export * from "./C"`). Keep every other line unchanged.
6. `grep -rn 'from "@/shared/ui/<file>"' src` for each moved file — repoint any DEEP importer to `@/shared/ui/C/<file>`.
7. `npm run typecheck && npm run lint` → 0/0. Commit.

---

## Task 1: forms/

**Files (move into `src/shared/ui/forms/`):** `field.tsx`, `field.test.tsx`, `field-error.tsx`, `textarea.tsx`, `select.tsx`, `select.test.tsx`, `checkbox.tsx`, `radio.tsx`, `switch.tsx`, `switch.test.tsx`, `icon-submit-button.tsx`, `label.tsx`.

**Barrel symbols (top `index.ts` lines to repoint → `./forms/...`):** `Label`(label), `Field`(field), `FieldError`(field-error), `Textarea`(textarea), `Select`+`SelectOption`(select), `Switch`(switch), `IconSubmitButton`(icon-submit-button), `Checkbox`(checkbox), `RadioGroup`+`RadioOption`(radio).

- [ ] **Step 1: Move the files** — `git mv` each file above into `src/shared/ui/forms/`.
- [ ] **Step 2: Fix cross-folder relative imports** in the moved files (per the procedure step 3). E.g. if `select.tsx` imports `./menu` (menu is NOT in forms), change to `@/shared/ui/menu`. Same-folder imports (`field-error` from `field`) stay `./field-error`.
- [ ] **Step 3: Create `src/shared/ui/forms/index.ts`** with the forms symbols:

```ts
export { Label } from "./label";
export { Field } from "./field";
export { FieldError } from "./field-error";
export { Textarea } from "./textarea";
export { Select } from "./select";
export type { SelectOption } from "./select";
export { Switch } from "./switch";
export { IconSubmitButton } from "./icon-submit-button";
export { Checkbox } from "./checkbox";
export { RadioGroup } from "./radio";
export type { RadioOption } from "./radio";
```

- [ ] **Step 4: Repoint the top barrel** — in `src/shared/ui/index.ts` replace the 9 forms lines' `"./<file>"` with `"./forms/<file>"` (or replace them all with a single `export * from "./forms";`). Leave every non-forms line untouched.
- [ ] **Step 5: Deep importers** — `grep -rn 'from "@/shared/ui/\(field\|field-error\|textarea\|select\|checkbox\|radio\|switch\|icon-submit-button\|label\)"' src` and repoint each to `@/shared/ui/forms/<file>`.
- [ ] **Step 6: Verify** — `npm run typecheck && npm run lint` → 0/0.
- [ ] **Step 7: Commit** — `git add -A && git commit -m "refactor(ui): move form primitives into shared/ui/forms"`.

## Task 2: overlays/

**Files (into `src/shared/ui/overlays/`):** `modal.tsx`, `modal.test.tsx`, `submit-button.test.tsx` (tests `SubmitButton` from `./modal`), `confirmation-modal.tsx`, `menu.tsx`, `toaster.tsx`, `console.tsx`.

**Barrel symbols → `./overlays/...`:** `Menu`+`MenuItem`(menu), `Modal`+`ModalHeader`+`SubmitButton`+`useModalTitleId`(modal), `Console`+`ConsoleTitleBar`(console). (`confirmation-modal` and `toaster` are NOT in the barrel — deep-imported only.)

- [ ] **Step 1: Move the files** into `src/shared/ui/overlays/`.
- [ ] **Step 2: Fix cross-folder relative imports** in moved files (e.g. `confirmation-modal` importing `./modal` stays `./modal` since both move; anything pointing at a still-flat or other-category file → `@/shared/ui/...`).
- [ ] **Step 3: Create `src/shared/ui/overlays/index.ts`:**

```ts
export { Menu } from "./menu";
export type { MenuItem } from "./menu";
export { Modal, ModalHeader, SubmitButton, useModalTitleId } from "./modal";
export { Console, ConsoleTitleBar } from "./console";
```

- [ ] **Step 4: Repoint the top barrel** — replace the `menu`, `modal`, `console` lines with `"./overlays/<file>"` paths. Leave the rest.
- [ ] **Step 5: Deep importers** — `grep -rn 'from "@/shared/ui/\(modal\|confirmation-modal\|menu\|toaster\|console\)"' src` and repoint to `@/shared/ui/overlays/<file>` (this is where `confirmation-modal`'s and `toaster`'s direct importers get fixed).
- [ ] **Step 6: Verify** — `npm run typecheck && npm run lint` → 0/0.
- [ ] **Step 7: Commit** — `git add -A && git commit -m "refactor(ui): move overlay primitives into shared/ui/overlays"`.

## Task 3: feedback/

**Files (into `src/shared/ui/feedback/`):** `status-badge.tsx`, `status-badge.test.tsx`, `info-box.tsx`, `loading.tsx`, `progress-bar.tsx`.

**Barrel symbols → `./feedback/...`:** `StatusBadge`+`Status`(status-badge), `InfoBox`(info-box), `Loading`+`Spinner`(loading), `ProgressBar`(progress-bar).

- [ ] **Step 1: Move the files** into `src/shared/ui/feedback/`.
- [ ] **Step 2: Fix cross-folder relative imports** in moved files.
- [ ] **Step 3: Create `src/shared/ui/feedback/index.ts`:**

```ts
export { StatusBadge } from "./status-badge";
export type { Status } from "./status-badge";
export { InfoBox } from "./info-box";
export { Loading, Spinner } from "./loading";
export { ProgressBar } from "./progress-bar";
```

- [ ] **Step 4: Repoint the top barrel** — `status-badge`, `info-box`, `loading`, `progress-bar` lines → `"./feedback/<file>"`.
- [ ] **Step 5: Deep importers** — `grep -rn 'from "@/shared/ui/\(status-badge\|info-box\|loading\|progress-bar\)"' src` → `@/shared/ui/feedback/<file>`.
- [ ] **Step 6: Verify** — `npm run typecheck && npm run lint` → 0/0.
- [ ] **Step 7: Commit** — `git add -A && git commit -m "refactor(ui): move feedback primitives into shared/ui/feedback"`.

## Task 4: navigation/

**Files (into `src/shared/ui/navigation/`):** `tab-nav.tsx`, `underline-tabs.tsx`, `stepper.tsx`, `step-box.ts`.

**Barrel symbols → `./navigation/...`:** `Stepper`(stepper), `TabNav`+`TabItem`(tab-nav), `UnderlineTabs`+`UnderlineTabItem`(underline-tabs). (`step-box` is a helper, not in the barrel — deep-imported by `stepper` and possibly others.)

- [ ] **Step 1: Move the files** into `src/shared/ui/navigation/`.
- [ ] **Step 2: Fix cross-folder relative imports** — `stepper.tsx` importing `./step-box` stays `./step-box` (both move). Anything else → alias.
- [ ] **Step 3: Create `src/shared/ui/navigation/index.ts`:**

```ts
export { Stepper } from "./stepper";
export { TabNav } from "./tab-nav";
export type { TabItem } from "./tab-nav";
export { UnderlineTabs } from "./underline-tabs";
export type { UnderlineTabItem } from "./underline-tabs";
```

- [ ] **Step 4: Repoint the top barrel** — `stepper`, `tab-nav`, `underline-tabs` lines → `"./navigation/<file>"`.
- [ ] **Step 5: Deep importers** — `grep -rn 'from "@/shared/ui/\(tab-nav\|underline-tabs\|stepper\|step-box\)"' src` → `@/shared/ui/navigation/<file>`.
- [ ] **Step 6: Verify** — `npm run typecheck && npm run lint` → 0/0.
- [ ] **Step 7: Commit** — `git add -A && git commit -m "refactor(ui): move navigation primitives into shared/ui/navigation"`.

## Task 5: data-display/

**Files (into `src/shared/ui/data-display/`):** `avatar.tsx`, `metric.tsx`, `category.tsx`, `dot.tsx`, `sparkline.tsx`, `sparkline.test.ts`, `stat-bar.tsx`.

**Barrel symbols → `./data-display/...`:** `Avatar`(avatar), `Metric`+`fmt`(metric), `Category`(category), `Dot`(dot), `StatBar`(stat-bar). (`sparkline` is NOT in the barrel — deep-imported.)

- [ ] **Step 1: Move the files** into `src/shared/ui/data-display/`.
- [ ] **Step 2: Fix cross-folder relative imports** in moved files (e.g. `stat-bar` importing `./sparkline` stays `./sparkline` since both move).
- [ ] **Step 3: Create `src/shared/ui/data-display/index.ts`:**

```ts
export { Avatar } from "./avatar";
export { Metric, fmt } from "./metric";
export { Category } from "./category";
export { Dot } from "./dot";
export { StatBar } from "./stat-bar";
```

- [ ] **Step 4: Repoint the top barrel** — `avatar`, `metric`, `category`, `dot`, `stat-bar` lines → `"./data-display/<file>"`.
- [ ] **Step 5: Deep importers** — `grep -rn 'from "@/shared/ui/\(avatar\|metric\|category\|dot\|sparkline\|stat-bar\)"' src` → `@/shared/ui/data-display/<file>`.
- [ ] **Step 6: Verify** — `npm run typecheck && npm run lint` → 0/0.
- [ ] **Step 7: Commit** — `git add -A && git commit -m "refactor(ui): move data-display primitives into shared/ui/data-display"`.

## Task 6: Whole-branch verification

- [ ] **Step 1: Exported-surface diff** — confirm `src/shared/ui/index.ts` still exports the exact same set of names as before (none dropped, none added). The only changes are the `from "./..."` paths.
- [ ] **Step 2: Full build** — `npm run build` succeeds (all routes compile, CSS pipeline OK).
- [ ] **Step 3: Stray-import sweep** — `grep -rn 'from "@/shared/ui/\(field\|modal\|menu\|avatar\|…each moved file…\)"' src` returns only the new `…/<category>/<file>` paths (no flat-path leftovers).

## Self-Review (done at authoring)

- **Coverage:** the 5 category folders from the spec's wave 3 = Tasks 1–5; stable barrel preserved (only paths change); deferred files (prose/effects/app-specific/lab) explicitly NOT moved.
- **No placeholders:** each task has the exact file list, the exact barrel content, and the exact grep for deep importers.
- **Type consistency:** category barrel exports mirror the top-barrel symbol names verbatim (Field/Select/Switch/Modal/SubmitButton/Avatar/Metric/StatBar/etc.).

## Done when

`src/shared/ui` holds `forms/ overlays/ feedback/ navigation/ data-display/` (+ existing `theme/ effects/`) each with a barrel; the flat folder retains only the deferred files; `@/shared/ui` exports an identical name set; `typecheck` + `lint` = 0; `build` succeeds.
