# UI Library — Waves 1–2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the extraction-ready `theme/` module (tokens + `.mono-*` core layer + provider) and a 3-effect `effects/` entrypoint inside `src/shared/ui`, with zero visual change and a stable `@/shared/ui` core barrel.

**Architecture:** Pure structural refactor. Move design-system CSS out of the monolithic `tailwind.css`/`global.scss` into `src/shared/ui/theme/*.css`, move the theme provider into `theme/`, and move the three product-used effects into `src/shared/ui/effects/`. The app keeps importing `@/shared/ui` (unchanged) and the old provider path (via shim); effect importers repoint to `@/shared/ui/effects`. No component logic, no token values, and no Tailwind/Vercel config change.

**Tech Stack:** Next.js 16 (webpack), React 19, Tailwind CSS v4 (CSS-first `@import "tailwindcss"` + `@theme`/`@utility`/`@layer`), TypeScript.

## Global Constraints

- Phase 1 = in-repo, extraction-ready. **No** separate package, npm publish, or workspace conversion.
- **Tailwind stays a peer** — do NOT rewrite components to drop Tailwind classes; extract the design-system CSS verbatim, never re-author values.
- The **`@/shared/ui` core barrel stays stable** — existing `import { X } from "@/shared/ui"` must keep resolving for every CORE primitive.
- Effects scope = exactly `matrix-rain` (incl. `MatrixRainOverlay`), `matrix-text`, `glitch-text`. All other LAB effects stay in place (deferred).
- **No token-value changes.** Dark bg stays `#141414`; `--m-card`/`--m-panel` stay translucent; light/dark/neo render byte-identical.
- **No Next.js / Vercel / Tailwind config change.** `npm run build` path is untouched.
- Gate EVERY task on: `npm run typecheck` (0 errors) + `npm run lint` (0 errors) + a manual visual check of `/` and `/brand` in **light, dark, and neo** themes.
- Work on branch `feat/ui-library` (already created off `main`). Commit per task.

---

## File Structure

**Created:**

- `src/shared/ui/theme/tokens.css` — all `--m-*` token blocks + theme-class scopes (light/`.dark`/`.neo`), moved verbatim from `tailwind.css`.
- `src/shared/ui/theme/mono-layer.css` — the core `.mono-*` utility classes, moved verbatim from `tailwind.css`.
- `src/shared/ui/theme/theme-provider.tsx` — the theme provider/hooks, moved from `src/shared/providers/theme-providers.tsx`.
- `src/shared/ui/theme/index.ts` — entrypoint re-exporting the provider/hooks.
- `src/shared/ui/effects/index.ts` — entrypoint re-exporting the 3 effects.
- `src/shared/ui/effects/matrix-rain.tsx`, `matrix-text.tsx`, `glitch-text.tsx` — moved from `src/shared/ui/`.

**Modified:**

- `src/assets/styles/tailwind.css` — token blocks + core `.mono-*` removed (now `@import`ed from `theme/`).
- `src/assets/styles/global.scss` — unchanged in content; the `html.dark` anti-flash stays (it is app-global, not part of the lib theme module — see Task 1 note).
- `src/shared/providers/theme-providers.tsx` — becomes a one-line shim re-export of `@/shared/ui/theme`.
- `src/app/layout.tsx` — CSS import order (ensure `theme/*.css` load before app styles).
- `src/shared/ui/index.ts` — drop the 3 effect re-exports from the CORE barrel (they move to the effects entrypoint).
- Effect importers (Task 8 enumerates them) — repoint to `@/shared/ui/effects`.

---

## WAVE 1 — Theme module

### Task 1: Extract `--m-*` tokens into `theme/tokens.css`

**Files:**

- Create: `src/shared/ui/theme/tokens.css`
- Modify: `src/assets/styles/tailwind.css` (remove the moved blocks; add an `@import`)

**Interfaces:**

- Produces: a CSS file holding `@theme inline {…}`, `:root {…}`, the light `.mono-scope, .mono-portal {…}` token block, `.dark .mono-scope, .dark .mono-portal {…}`, the `html.dark [role="menu"], …` solid-overlay override, and `html.neo .mono-scope {…}`. No JS interface.

- [ ] **Step 1: Create `theme/tokens.css` with the token blocks moved verbatim**

Move these blocks **exactly as written** from `src/assets/styles/tailwind.css` (do not retype values) into a new `src/shared/ui/theme/tokens.css`, preserving order and comments:

- `@theme inline { … }` (currently ~lines 5–11)
- `:root { … }` (currently ~lines 12–39)
- `.mono-scope, .mono-portal { …light --m-* tokens… }` (currently ~lines 48–76)
- `.dark .mono-scope, .dark .mono-portal { … }` (currently ~lines 77–109)
- the `html.dark [role="menu"], html.dark [role="listbox"], html.dark .milkdown { … }` solid-surface override
- `html.neo .mono-scope { background-color: transparent; }`

Leave `@import "tailwindcss";` (line 2) and `@utility min-h-app { … }` in `tailwind.css` (min-h-app is a layout utility, not a token).

- [ ] **Step 2: Wire the import at the top of `tailwind.css`**

In `src/assets/styles/tailwind.css`, immediately AFTER `@import "tailwindcss";`, add:

```css
@import "../../shared/ui/theme/tokens.css";
```

(Tailwind v4 resolves `@import` at build; tokens must load before the utilities/components that reference `var(--m-*)`.)

- [ ] **Step 3: Verify build + tokens resolve**

Run: `npm run typecheck && npm run lint`
Expected: 0 errors, 0 errors.

- [ ] **Step 4: Visual gate**

Run `npm run dev`, open `/` and `/brand`, toggle **light → dark → neo** (header theme button). Confirm: page bg `#141414` in dark, cards/panels translucent, lime accent, no FOUC. Identical to before.

- [ ] **Step 5: Commit**

```bash
git add src/shared/ui/theme/tokens.css src/assets/styles/tailwind.css
git commit -m "refactor(ui-theme): extract --m-* tokens into shared/ui/theme/tokens.css"
```

> **Note on `global.scss`:** the `html.dark { background-color: #141414 }` anti-flash rule STAYS in `global.scss` for now — it is an app-document concern (pre-paint background on `<html>`, which the lib doesn't own). It will be reconciled when the package is actually extracted (Phase 2). Do not move it in this wave.

---

### Task 2: Extract the core `.mono-*` utilities into `theme/mono-layer.css`

**Files:**

- Create: `src/shared/ui/theme/mono-layer.css`
- Modify: `src/assets/styles/tailwind.css`

**Interfaces:**

- Produces: a CSS file holding ONLY the core utility classes: `.mono-label`, `.mono-cat`, `.mono-title`, `.mono-field-label`, `.mono-input`, `.mono-cta`, `.mono-btn-outline`, `.mono-focus`, `.mono-error`, `.mono-icon-btn`, `.mono-scrollbar` (+ its `::-webkit-scrollbar*` rules). No JS interface.

- [ ] **Step 1: Move the core utility block verbatim**

Cut the core `.mono-*` utility definitions (currently ~lines 1082–1165 — the `.mono-label` … `.mono-scrollbar*` run, INCLUDING the enclosing `@layer`/`@utility` wrapper they live in if present) from `tailwind.css` into a new `src/shared/ui/theme/mono-layer.css`. **Do NOT move** the effect/prose classes (`.mono-glitch*`, `.mono-redact`, `.mono-spoiler`, `.mono-scan*`, `.mono-kbd`, `.mono-cite*`, `.mono-ref`, `.mono-strike*`, `.mono-jiggle*`, `.mono-trail-glyph`, `.mono-transcript-line`, keyframes, `.mono-modal-enter`/`.mono-toast-enter` animations, or the `advanced-cropper` overrides) — those stay in `tailwind.css` (deferred effects/prose + app chrome).

- [ ] **Step 2: Wire the import**

In `tailwind.css`, directly after the `tokens.css` import from Task 1, add:

```css
@import "../../shared/ui/theme/mono-layer.css";
```

- [ ] **Step 3: Verify build**

Run: `npm run typecheck && npm run lint`
Expected: 0 errors, 0 errors.

- [ ] **Step 4: Verify the utilities still apply (visual gate)**

Run `npm run dev`. On `/brand`, confirm buttons (`.mono-cta`/`.mono-btn-outline`), field labels (`.mono-field-label`), the focus ring (`.mono-focus`), errors (`.mono-error`), and any `.mono-scrollbar` list render identically in all three themes. Spot-check a form (register modal) for `.mono-input`.

- [ ] **Step 5: Commit**

```bash
git add src/shared/ui/theme/mono-layer.css src/assets/styles/tailwind.css
git commit -m "refactor(ui-theme): extract core .mono-* utilities into theme/mono-layer.css"
```

---

### Task 3: Move the theme provider into `theme/` with a shim

**Files:**

- Create: `src/shared/ui/theme/theme-provider.tsx` (moved content)
- Modify: `src/shared/providers/theme-providers.tsx` (becomes a shim)

**Interfaces:**

- Consumes: nothing new.
- Produces: `ThemeProvider`, `useTheme`, `useThemeSafe`, `type Theme` exported from `@/shared/ui/theme/theme-provider`. The old path `@/shared/providers/theme-providers` re-exports them unchanged.

- [ ] **Step 1: Move the file content**

Copy the FULL current contents of `src/shared/providers/theme-providers.tsx` into a new `src/shared/ui/theme/theme-provider.tsx` verbatim (it already exports `ThemeProvider`, `useTheme`, `useThemeSafe`, `Theme`).

- [ ] **Step 2: Replace the old file with a shim re-export**

Overwrite `src/shared/providers/theme-providers.tsx` with exactly:

```tsx
// Moved to the UI library theme module. This shim keeps existing
// `@/shared/providers/theme-providers` imports working.
export * from "@/shared/ui/theme/theme-provider";
```

- [ ] **Step 3: Verify build**

Run: `npm run typecheck && npm run lint`
Expected: 0 errors (every existing `useTheme`/`ThemeProvider`/`useThemeSafe` import still resolves through the shim).

- [ ] **Step 4: Verify theme switching works**

Run `npm run dev`; click the header theme toggle through light → dark → neo. Confirm it cycles and persists (the provider state still drives the classes).

- [ ] **Step 5: Commit**

```bash
git add src/shared/ui/theme/theme-provider.tsx src/shared/providers/theme-providers.tsx
git commit -m "refactor(ui-theme): move ThemeProvider into theme module, shim old path"
```

---

### Task 4: Add the `theme/` entrypoint barrel

**Files:**

- Create: `src/shared/ui/theme/index.ts`

**Interfaces:**

- Produces: `@/shared/ui/theme` exporting `ThemeProvider`, `useTheme`, `useThemeSafe`, `Theme`.

- [ ] **Step 1: Create the barrel**

Create `src/shared/ui/theme/index.ts` with exactly:

```ts
export * from "./theme-provider";
```

(The CSS — `tokens.css`, `mono-layer.css` — is imported via `tailwind.css`, not via this barrel; this barrel is the JS surface only. Documented in the spec.)

- [ ] **Step 2: Verify build**

Run: `npm run typecheck && npm run lint`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/shared/ui/theme/index.ts
git commit -m "refactor(ui-theme): add @/shared/ui/theme entrypoint barrel"
```

---

## WAVE 2 — The three approved effects

### Task 5: Move `matrix-rain` into `effects/`

**Files:**

- Create: `src/shared/ui/effects/matrix-rain.tsx` (moved)
- Delete: `src/shared/ui/matrix-rain.tsx`

**Interfaces:**

- Produces: `MatrixRain`, `MatrixRainOverlay` from `@/shared/ui/effects/matrix-rain`.

- [ ] **Step 1: Move the file**

Run:

```bash
git mv src/shared/ui/matrix-rain.tsx src/shared/ui/effects/matrix-rain.tsx
```

- [ ] **Step 2: Fix any now-relative imports inside the moved file**

Open `src/shared/ui/effects/matrix-rain.tsx`. If it imports siblings via relative paths (`./something`), repoint them up one level (`../something`) or to the `@/`-alias. (If it only uses `@/`-alias imports and `react`, no change.) Verify with the next step.

- [ ] **Step 3: Verify build (expected to FAIL on the barrel)**

Run: `npm run typecheck`
Expected: FAIL — `src/shared/ui/index.ts:33` can no longer resolve `./matrix-rain`. This is expected; fixed in Task 8.

- [ ] **Step 4: Commit the move**

```bash
git add -A
git commit -m "refactor(ui-effects): move matrix-rain into effects/"
```

---

### Task 6: Move `matrix-text` into `effects/`

**Files:**

- Create: `src/shared/ui/effects/matrix-text.tsx` (moved)
- Delete: `src/shared/ui/matrix-text.tsx`

**Interfaces:**

- Produces: `MatrixText` from `@/shared/ui/effects/matrix-text`.

- [ ] **Step 1: Move the file**

```bash
git mv src/shared/ui/matrix-text.tsx src/shared/ui/effects/matrix-text.tsx
```

- [ ] **Step 2: Fix relative imports inside the moved file** (same rule as Task 5 Step 2).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "refactor(ui-effects): move matrix-text into effects/"
```

---

### Task 7: Move `glitch-text` into `effects/`

**Files:**

- Create: `src/shared/ui/effects/glitch-text.tsx` (moved)
- Delete: `src/shared/ui/glitch-text.tsx`

**Interfaces:**

- Produces: `GlitchText` from `@/shared/ui/effects/glitch-text`.

- [ ] **Step 1: Move the file**

```bash
git mv src/shared/ui/glitch-text.tsx src/shared/ui/effects/glitch-text.tsx
```

- [ ] **Step 2: Fix relative imports inside the moved file** (same rule as Task 5 Step 2).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "refactor(ui-effects): move glitch-text into effects/"
```

---

### Task 8: Add the `effects/` entrypoint and repoint all importers

**Files:**

- Create: `src/shared/ui/effects/index.ts`
- Modify: `src/shared/ui/index.ts` (drop the 3 effect re-exports)
- Modify: every effect importer (enumerate via grep in Step 2)

**Interfaces:**

- Produces: `@/shared/ui/effects` exporting `MatrixRain`, `MatrixRainOverlay`, `MatrixText`, `GlitchText`.

- [ ] **Step 1: Create the effects barrel**

Create `src/shared/ui/effects/index.ts` with exactly:

```ts
export { MatrixRain, MatrixRainOverlay } from "./matrix-rain";
export { MatrixText } from "./matrix-text";
export { GlitchText } from "./glitch-text";
```

- [ ] **Step 2: Remove the 3 effect re-exports from the CORE barrel**

In `src/shared/ui/index.ts`, delete these three lines:

```ts
export { MatrixText } from "./matrix-text";
export { GlitchText } from "./glitch-text";
export { MatrixRain, MatrixRainOverlay } from "./matrix-rain";
```

- [ ] **Step 3: Find every importer**

Run:

```bash
grep -rln "MatrixRain\|MatrixRainOverlay\|MatrixText\|GlitchText" src --include=*.tsx --include=*.ts | grep -v "shared/ui/effects"
```

This lists files importing the 3 effects from `@/shared/ui` (e.g. `src/app/app-providers.tsx`, `/brand` tabs, `post-body.tsx`, etc.).

- [ ] **Step 4: Repoint each importer**

In each file from Step 3, change the import source for these symbols from `"@/shared/ui"` to `"@/shared/ui/effects"`. If a file imports a mix (e.g. `import { MatrixRain, Modal } from "@/shared/ui"`), split it:

```ts
import { Modal } from "@/shared/ui";
import { MatrixRain } from "@/shared/ui/effects";
```

- [ ] **Step 5: Verify build is green again**

Run: `npm run typecheck && npm run lint`
Expected: 0 errors, 0 errors (the Task 5 barrel break is now resolved).

- [ ] **Step 6: Visual gate**

Run `npm run dev`. Confirm: neo-theme Matrix rain still drapes the page (switch to neo); the glitch error headline still glitches (visit a 404 / error state); `MatrixText` scrambles where used (empty profile/empty comments eyebrow); the post-page `:matrix`/`:glitch` directives still render (any post using them). All three effects intact.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor(ui-effects): add @/shared/ui/effects entrypoint, repoint importers"
```

---

## Self-Review (done at authoring)

- **Spec coverage:** theme module (tokens/mono-layer/provider/index) = Tasks 1–4; effects entrypoint (3 effects) = Tasks 5–8; stable core barrel = preserved (only effects dropped) ; Tailwind-as-peer = honored (verbatim CSS moves, no rewrite); deploy-safe = no config touched. Waves 3–6 (category folders, app-specific eviction, prose, Storybook) are intentionally OUT of this plan (separate later plans) per "start with waves 1–2".
- **No placeholders:** every step has the exact path/command/code; CSS is a verbatim move (blocks identified by selector + line range) rather than re-pasted, to avoid drift.
- **Type consistency:** `ThemeProvider`/`useTheme`/`useThemeSafe`/`Theme` names match across Tasks 3–4 and the shim; effect symbols `MatrixRain`/`MatrixRainOverlay`/`MatrixText`/`GlitchText` match across Tasks 5–8.

## Done when

`src/shared/ui/theme/` holds `tokens.css` + `mono-layer.css` + `theme-provider.tsx` + `index.ts`; `src/shared/ui/effects/` holds the 3 effects + `index.ts`; `tailwind.css` `@import`s the two theme CSS files; the old provider path is a shim; `@/shared/ui` core barrel no longer exports the 3 effects and all other imports are unchanged; `typecheck` + `lint` = 0; light/dark/neo render identically.
