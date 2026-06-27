# UI Library — Wave 5 (prose sub-entrypoint) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Move the prose/markdown subsystem (the `react-markdown` + remark-directive read-view renderer and its in-post marks) out of the flat `shared/ui` into a dedicated `src/shared/ui/prose/` folder exposed as its OWN sub-entrypoint `@/shared/ui/prose`, and REMOVE it from the core `@/shared/ui` barrel so the heavy markdown dependency isn't pulled into every core import.

**Architecture:** Pure structural move + a barrel split. `post-body.tsx` is the hub; it imports `reveal-mark`, `prose-blocks`, `media-embed`, `remark-media-embeds` as siblings — they all move together so the relative imports survive. The core barrel drops the prose exports; the ~3 consumers switch to `@/shared/ui/prose`.

**Tech Stack:** Next.js 16 (webpack), React 19, TypeScript, react-markdown/remark.

## Global Constraints

- The prose subsystem becomes its own entrypoint `@/shared/ui/prose`; the core `@/shared/ui` barrel NO LONGER exports `PostBody`, `RevealMark`, `AsciiDivider`, `Callout` (they move to the prose entry). This is intentional — a clean barrel split, NOT a stable-barrel reorg.
- Pure `git mv` + import-path edits — no component logic changes.
- The `:::callout` / `::divider` / `:spoiler` / `:strike` read-view rendering and `post-body.test.tsx` must stay green and unchanged in behavior.
- Files that stay flat in `shared/ui` (NOT moved): `error-message`, `image-cropper(+dynamic)`, `index.ts` (the core barrel), plus the already-categorized folders.
- Gate on `npm run typecheck` (0), `npm run lint` (0), `npm run build` (succeeds), and `npx vitest run src/shared/ui/prose/post-body.test.tsx` (passes). Branch `feat/ui-library-prose` off main. Commit per task.

---

## Task 1: Move the prose subsystem into `shared/ui/prose/` + sub-entrypoint barrel

**Files to move (via `git mv`, component + test together):**
`post-body.tsx`, `post-body.test.tsx`, `prose-blocks.tsx`, `media-embed.tsx`, `remark-media-embeds.ts`, `reveal-mark.tsx` → `src/shared/ui/prose/`.

**Symbols & their consumers (for the repoint):**

- `PostBody` (post-body) — consumer: `src/features/post/ui/post-view.tsx` (barrel import).
- `RevealMark` (reveal-mark) — consumer: `src/app/brand/lab-tab.tsx` (barrel).
- `AsciiDivider` (prose-blocks) — consumer: `src/app/brand/lab-tab.tsx` (barrel).
- `Callout` (prose-blocks) — consumer: `src/app/brand/components-tab.tsx` (barrel).
- `MediaEmbed` (media-embed, the TYPE) — consumer: `src/features/post/ui/editor-embed-node.ts` (DEEP import `@/shared/ui/media-embed`).

- [ ] **Step 1: Move the 6 files** — `git mv` each into `src/shared/ui/prose/`. The intra-subsystem relative imports inside `post-body.tsx` (`./reveal-mark`, `./prose-blocks`, `./media-embed`, `./remark-media-embeds`) and `post-body.test.tsx` (`./post-body`) stay valid (all moved together).

- [ ] **Step 2: Fix any cross-folder relative imports** in the moved files — if a moved file imported a shared/ui sibling that did NOT move into prose/ (e.g. an effect, a `@/shared/ui/...` deep path), confirm it resolves; `@/`-alias and `react`/`react-markdown` imports need no change. (typecheck flags misses.)

- [ ] **Step 3: Create `src/shared/ui/prose/index.ts`** (the sub-entrypoint barrel):

```ts
export { PostBody } from "./post-body";
export { RevealMark } from "./reveal-mark";
export { AsciiDivider, Callout } from "./prose-blocks";
export { MediaEmbed } from "./media-embed";
export type { MediaEmbed as MediaEmbedDescriptor } from "@/shared/lib/media-embed";
```

> NOTE: confirm what `MediaEmbed` is — if `media-embed.tsx` exports a `MediaEmbed` COMPONENT and `@/shared/lib/media-embed` exports a `MediaEmbed` TYPE, export the component here and let `editor-embed-node.ts` import the TYPE from its real source. Adjust the barrel to match the actual exports (the implementer reads the files and exports exactly what exists — do not invent symbols).

- [ ] **Step 4: Remove the prose lines from the core barrel** `src/shared/ui/index.ts` — delete:
  - `export { PostBody } from "./post-body";`
  - `export { RevealMark } from "./reveal-mark";`
  - `export { AsciiDivider, Callout } from "./prose-blocks";`
    (Leave every other line untouched. `MediaEmbed`/`remarkMediaEmbeds` were never in the core barrel.)

- [ ] **Step 5: Repoint the consumers** to the new entry:
  - `src/features/post/ui/post-view.tsx`: import `PostBody` from `@/shared/ui/prose` (split it out of the `@/shared/ui` barrel import).
  - `src/app/brand/lab-tab.tsx`: import `RevealMark`, `AsciiDivider` from `@/shared/ui/prose`.
  - `src/app/brand/components-tab.tsx`: import `Callout` from `@/shared/ui/prose`.
  - `src/features/post/ui/editor-embed-node.ts`: repoint the `MediaEmbed` type import `@/shared/ui/media-embed` → `@/shared/ui/prose/media-embed` (or the type's real source if it lives in `@/shared/lib/media-embed`).
  - Sweep `grep -rnE 'from "@/shared/ui/(post-body|prose-blocks|media-embed|remark-media-embeds|reveal-mark)"' src` for any other deep importer and repoint to `@/shared/ui/prose/<file>`.

- [ ] **Step 6: Verify** — `npm run typecheck` (0), `npm run lint` (0), `npm run build` (succeeds), `npx vitest run src/shared/ui/prose/post-body.test.tsx` (passes). Also `grep -rn "PostBody\|RevealMark\|AsciiDivider\|Callout" src/shared/ui/index.ts` returns nothing (prose gone from core barrel).

- [ ] **Step 7: Commit** — `git add -A && git commit -m "refactor(ui): move the prose subsystem into shared/ui/prose as its own entrypoint"`.

## Task 2: Whole-branch verification

- [ ] **Step 1: Stray-import sweep** — `grep -rnE 'from "@/shared/ui/(post-body|prose-blocks|media-embed|remark-media-embeds|reveal-mark)"' src` returns only `…/prose/…` paths (no flat leftovers); the core barrel no longer references the prose files.
- [ ] **Step 2: shared/ui root** — only `index.ts`, `error-message.tsx`, `image-cropper.tsx`, `image-cropper-dynamic.tsx` remain flat (+ the `theme/ effects/ forms/ overlays/ feedback/ navigation/ data-display/ prose/` folders). Phase-1 root is clean.
- [ ] **Step 3: Full build + prose test** green.

## Self-Review (authoring)

- **Coverage:** the 6 prose files move; the core barrel drops the 3 prose exports; the 4 consumers (post-view, lab-tab, components-tab, editor-embed-node) repoint; the prose entrypoint barrel exports exactly what the moved files export.
- **No placeholders:** exact file list, exact barrel deletions, exact consumer list. Step 3 flags the one thing to confirm against the real source (the `MediaEmbed` component-vs-type ambiguity).
- **Type consistency:** `PostBody`/`RevealMark`/`AsciiDivider`/`Callout` names preserved; only the import path changes (`@/shared/ui` → `@/shared/ui/prose`).

## Done when

`src/shared/ui/prose/` holds the markdown read-view subsystem with its own barrel; `@/shared/ui` no longer exports prose; consumers import from `@/shared/ui/prose`; the flat `shared/ui` root is down to `index.ts` + `error-message` + `image-cropper*`; typecheck/lint/build/prose-test all green.
