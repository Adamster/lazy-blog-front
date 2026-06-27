# UI Library — Design Spec

**Date:** 2026-06-26
**Status:** Approved design → ready for implementation plan
**Repo:** `lazy-blog-front`

## Goal

Turn the flat `src/shared/ui` (~76 files in one folder) into a **package-shaped, extraction-ready component library** that carries the Brutalist-Mono design system (tokens, `.mono-*` layer, rules) and a Storybook showcase. It stays in this repo for now (no separate package/publish), but is structured so a later lift into a real package is mechanical.

**Non-goal (Phase 2, deferred):** a separate repo, an npm/registry publish, or a workspace/monorepo conversion. That happens only when a second consumer exists (YAGNI). Nothing in this phase changes the Next.js / Vercel build.

## Scope decisions (locked)

- **Delivery:** Phase 1, in-repo, extraction-ready.
- **Library contents:** core primitives + theme + a **minimal effects set** (`matrix-rain`, `matrix-text`, `glitch-text` — the three actually used in the product) + generic data-viz + markdown/prose render. The rest of the LAB effects are **deferred** (not yet approved for the lib).
- **Stays in the app (app-specific):** `draft-overlay`, `heart-icons`, `image-cropper*`, `logo-sloth`, `margin-ref`.
- **Showcase:** **Storybook is the component showcase** — including a one-page kitchen-sink "overview" story rebuilt in Storybook (the same all-on-one-page survey `/brand` gives today). The existing `/brand` page stays purely as the **brand / identity** page, no longer the source of component documentation.
- **Tailwind is a hard dependency** of the library (components are built from Tailwind utility classes + the `.mono-*` layer). We do NOT rewrite them to drop Tailwind — instead Tailwind + the design-system preset travel with the lib (see Tailwind dependency).
- **Structure:** package-shaped (category subfolders + a `theme/` module + multiple entrypoints + colocated stories + a package boundary).

## Directory layout

All under `src/shared/ui/` (the FSD slot stays; it becomes the package root on extraction):

```
src/shared/ui/
  index.ts                 # public entrypoint — CORE primitives (stays stable)
  theme/                   # the design system, self-contained (see Theme module)
    tokens.css
    mono-layer.css
    theme-provider.tsx
    index.ts
  forms/                   field, field-error, textarea, select, checkbox, radio,
                           switch, submit-button, icon-submit-button, label
  overlays/                modal, confirmation-modal, menu, toaster, console
  feedback/                status-badge, info-box, loading, progress-bar
  navigation/              tab-nav, underline-tabs, stepper, step-box
  data-display/            avatar, metric, category, dot, sparkline, stat-bar,
                           count-up, compare-slider
  effects/                 matrix-rain, matrix-text, glitch-text   # ONLY these 3
    index.ts               (approved). Every other LAB effect (channel-surf,
                           boot-*, datamosh, gravity-well, weight-wave,
                           spotlight-decode, marquee, scan-text, wave-highlight,
                           reveal-mark, glyph-cursor-trail, ascii-*, ansi-block,
                           kbd, cite-tooltip) stays where it is for now — deferred,
                           revisit per-effect later.
  prose/                   post-body, prose-blocks, diff-block, poll-block,
    index.ts               fold-block, media-embed, remark-media-embeds,
    prose.css              transcript, scan-link
  <component>.stories.tsx  # stories colocated with each component
```

- Each category folder gets a local barrel; the top `index.ts` re-exports the **core** categories (forms/overlays/feedback/navigation/data-display) so existing `@/shared/ui` imports keep resolving unchanged.
- `effects/` and `prose/` are **separate entrypoints**, NOT re-exported from the core barrel, so their heavier deps (effect runtimes, remark/react-markdown) tree-shake out of the core surface.
- Tests (`*.test.tsx`) move with their components into the category folders.

## Theme module (`src/shared/ui/theme/`)

The design system is currently spread across `tailwind.css` (tokens + `.mono-*`), `global.scss` (anti-flash bg), and `shared/providers` (the provider). Consolidate so the theme is "in a box":

- `tokens.css` — all `--m-*` tokens for `light` / `.dark` / `.neo`, including the recent changes (`#141414` dark bg, translucent `--m-card`/`--m-panel`). Sourced from the current `tailwind.css` theme block.
- `mono-layer.css` — the `.mono-*` utility classes (`.mono-label/cat/title/cta/btn-outline/icon-btn/field-label/input/focus/error/scrollbar`).
- `theme-provider.tsx` — `ThemeProvider`, `useTheme`, `useThemeSafe` (moved from `shared/providers`). A **shim re-export** at the old `shared/providers/theme-providers` path keeps app imports working during/after the move.
- `index.ts` — re-exports the provider/hooks; the app's global stylesheet imports `theme/tokens.css` + `theme/mono-layer.css`.

A consumer of the library gets the provider + tokens + utility layer together — the extraction-critical piece.

## Tailwind dependency

The library is **Tailwind-dependent by design**: components are authored with Tailwind utility classes plus the `.mono-*` layer, and that is intentional — we do NOT rewrite components into bespoke CSS to "decouple" them. Tailwind travels with the lib instead:

- The theme module ships a **Tailwind preset** (the design-system tokens + the `.mono-*` `@layer`/`@utility` definitions) that a consumer pulls into its own Tailwind config. The lib's classes only resolve when the consumer runs Tailwind over the lib's source.
- This makes **Tailwind v4 a required peer / co-requisite** of the package — documented explicitly in the (future) package README and assumed by this repo today. A consumer must (a) have Tailwind v4 configured and (b) include the lib's content paths in its Tailwind scan so the utilities are generated.
- **Storybook** must run Tailwind over the lib too (same preset + content globs) so stories render with real styles — this is part of the Storybook wave's setup.
- Phase-1 reality: in THIS repo Tailwind is already global, so nothing breaks; the work is to factor the design-system tokens/`.mono-*` into a preset-shaped module so extraction later is a copy, not a rewrite.

## Public API / entrypoints

- `@/shared/ui` — **core** primitives. Stays stable; the bulk of app imports do not change (lowest-risk lever).
- `@/shared/ui/effects` — the three approved effects (`matrix-rain`, `matrix-text`, `glitch-text`), opt-in, tree-shaken from core. (Deferred effects are NOT exported here yet.)
- `@/shared/ui/prose` — markdown render system (opt-in, pulls remark/react-markdown).
- `@/shared/ui/theme` — tokens/provider/hooks.

## App-specific eviction

These are not generic library primitives; move them out of the `ui` tree to their domain home:

- `draft-overlay` → post feature.
- `heart-icons` → voting feature.
- `image-cropper` / `image-cropper-dynamic` → profile feature (or `shared/app-ui`).
- `logo-sloth` → brand (app).
- `margin-ref` → dev utility (app).

Update their importers accordingly.

## Storybook

Storybook is the **component showcase and documentation** — it replaces `/brand` as the place to browse/learn the primitives. `/brand` stays as the brand / identity page only.

- Builder: `@storybook/nextjs`. **Fallback:** `@storybook/react-vite` if Next 16 (`--webpack`) + React 19 + Tailwind v4 integration proves troublesome — Storybook renders components standalone and does not need the Next runtime.
- **Tailwind in Storybook:** run Tailwind v4 over the lib (the design-system preset + the lib's content globs) so stories render with real styles — see Tailwind dependency.
- Load `theme/tokens.css` + `theme/mono-layer.css` in `.storybook/preview`; add a toolbar theme switcher (`light` / `dark` / `neo`) that toggles the `.dark`/`.neo` classes on the preview root.
- One story per primitive; the three approved effects + `prose/` get their own story sections.
- A **one-page "Overview" story** that rebuilds the `/brand` kitchen-sink survey (all primitives on a single page) inside Storybook, so the at-a-glance catalog `/brand` gives today lives in the showcase too.
- A new `storybook` dev script. No change to the app's `build`/`dev`/Vercel config.

**Risk:** Storybook ↔ Next 16 (`--webpack`) ↔ React 19 ↔ Tailwind v4 compatibility. Validate at the start of the Storybook wave; if it fights, switch to the vite builder before writing stories.

## Migration plan (waves, deploy-safe)

Each wave ends green (`typecheck` + `lint` = 0 errors) and is independently reviewable. The top barrel `@/shared/ui` stays stable throughout so app imports don't churn. **Start with waves 1–2** (theme + the three approved effects) — the owner's chosen starting point; the later waves can be re-scoped as we go.

1. **Theme module** — extract tokens/`.mono-*`/provider into `theme/` (preset-shaped), add shim re-exports, point the global stylesheet at the new CSS. Verify BOTH light and dark (and neo) render unchanged — the highest-risk wave.
2. **The three approved effects** — establish the `effects/` entrypoint with ONLY `matrix-rain`, `matrix-text`, `glitch-text`; repoint their importers to `@/shared/ui/effects`. Low coupling, concrete early deliverable. (The other LAB effects are left untouched in place — deferred.)
3. **Category folders** — move core primitives into `forms/overlays/feedback/navigation/data-display`, add category barrels, keep `@/shared/ui` re-exporting them. Verify after each group.
4. **App-specific eviction** — move the five app-specific files out, update importers.
5. **Prose sub-entrypoint** — establish `prose/` + barrel; move the prose/markdown components. **Coupling to resolve here:** some in-post directive renderers reference effect components — `:glitch`→`GlitchText` and `:matrix`→`MatrixText` are now in the lib (fine), but others (`:redact`/`:scan`/`:wave`/`:spoiler`, etc.) reference _deferred_ effects. Options at this wave: keep those specific effect deps in `app`/`shared` and have prose import them locally, or defer those directives' migration. Decide when we reach it.
6. **Storybook** — add the tooling (validate builder first), Tailwind over the lib, colocate stories per primitive + the one-page Overview.

## Risks

- **Theme extraction regression** (wave 1) — moving `--m-*` + `.mono-*` could shift styles. Mitigation: extract verbatim, diff both themes visually, no value changes in this wave.
- **Storybook toolchain** (wave 5) — see Storybook risk above; vite-builder fallback.
- **Import churn** — mitigated by the stable `@/shared/ui` core barrel; only `effects`/`prose` importers repoint.

## Testing

- Existing component tests move with their components and stay green.
- Storybook stories act as visual/interaction documentation; no new unit-test mandate in this phase.
- Gate each wave on `npm run typecheck` + `npm run lint` (0 errors) and a visual check of the two themes for the touched surfaces.

## Out of scope (YAGNI / Phase 2)

- Separate repo, npm/registry publish, semantic versioning.
- Workspace/monorepo conversion.
- Replacing Tailwind with bespoke CSS (Tailwind stays a required peer).
- Keeping `/brand` as a component-doc surface — the component showcase consolidates into Storybook (incl. the one-page Overview); `/brand` is brand/identity only. No two parallel component catalogs.

These come only when a real second consumer appears; the package-shaped layout makes that lift a `git mv` + a `package.json`.

## Success criteria

- `src/shared/ui` is organized by category with a `theme/` module and `effects`/`prose` entrypoints; no flat dump.
- `@/shared/ui` core imports across the app are unchanged (or trivially so).
- The theme is self-contained in `theme/` (tokens + layer + provider), importable as one unit.
- Storybook runs with a light/dark/neo switcher and a story per primitive.
- `typecheck` + `lint` = 0 errors; both themes render unchanged; Vercel build untouched.
