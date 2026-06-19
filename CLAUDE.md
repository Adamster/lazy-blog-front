# Project rules

## Brutalist-Mono design system — ALWAYS follow

The frontend (home / profile / post / auth) uses the "Brutalist Mono" design system. **Apply this on every UI edit and every new feature. Do NOT invent new spacing / size / letter-spacing values — pick from the scale below. If you notice a mismatch while working, flag it and propose the guide-correct value.**

- **Source of truth = the project-defined design system, in this precedence order:** (1) the scale documented in THIS file (spacing / rhythm / type size / letter-spacing / line-height), (2) the established primitives in `src/shared/ui` + the `.mono-*` classes in `src/assets/styles/tailwind.css` (the CSS layer keeps the `mono`/`--m-*` names; only component/file names dropped the prefix). The Claude Design file `notlazy/Design System.dc.html` (project `8fe2783d-192c-4b5b-b9d5-d39639af59eb`, re-fetch via DesignSync) is a **reference, not gospel — it may be imperfect or stale**. When the design file conflicts with the documented scale here or with how the primitives already render, **follow the project system, not the raw design file**, and flag the design-file discrepancy so we can reconcile it. Stay on the spacing scale: use whole steps (4px grid → `p-1`/`p-2`/`p-2.5`/`p-5`/`p-7`/`p-10` etc. as listed below); do not reach for half-steps like `1.5`/`6px` to "nudge" a size unless that exact value is already documented here. The `reference/NOT LAZY Brand Identity.html` file in the same Design project is a **brand / colour / tone-of-voice reference only — NOT a source of spacing / type / letter-spacing tokens** (it's a loose marketing showcase with off-grid paddings, `.1em` labels and a teal accent; the project holds lime + `.12em` + the 4px grid). Pull identity cues from it (the sloth mark, the `[ TEAM ] NOT LAZY` lockup), never sizes.
- **When you fix or touch a UI file, audit the whole file in passing:** scan every spacing / size / letter-spacing / line-height / font value in it against this system, and flag (or fix, if in scope) anything that deviates — not just the one thing reported. Recurring offender: compact elements (labels, badges, chips, buttons) missing `leading-none`/a pinned line-height inherit the body 1.5 line-height and render taller than the scale intends — pin the line box so height = the documented value.
- **Reuse the primitives** from `src/shared/ui` (barrel `@/shared/ui`): `Field`, `Modal`/`ModalHeader`/`SubmitButton`, `Label`, `Category`, `Metric`, `StatusBadge`, `Dot`, `Menu`, `MatrixText`. Files not yet architect-rewritten carry a `rewrite-` filename prefix (e.g. `rewrite-label.tsx` still exports `Label`); untouched legacy files carry `legacy-`. The `.mono-*` CSS classes in `src/assets/styles/tailwind.css` (`.mono-label`, `.mono-cat`, `.mono-title`, `.mono-cta`, `.mono-btn-outline`, `.mono-icon-btn`, `.mono-field-label`, `.mono-input`) and the `--m-*` tokens keep their names. Don't copy-paste long class strings.

### Type scale — CLOSED SET (size / weight / letter-spacing)

**Font sizes are a closed set of 8. NEVER invent an intermediate — no 13 / 14.5 / 13.5 / 12.5 / 11.5 / 17 / 30. Snap to the nearest listed value.**

- **46**/700/-0.02em — big stat NUMBERS (profile counts, vote score; tabular-nums). Deliberately larger than H1; don't fold into 40/32. — **Space Grotesk**.
- Display **40**/700/-0.02em · H1 **32**/700/-0.02em (also the modal title) · H3 **18**/600/0 — **Space Grotesk** (`font-display`).
- **Prose 16**/400/lh 1.85 = article reading ONLY (`.mono-prose`, post body); don't unify down to 14, 16 is deliberate for long-form.
- **UI body 14**/400/lh 1.6 = the default for EVERYTHING else: card summaries, bios, descriptions, comment text, **buttons** (700/0.06em), **inputs**, helper links, info boxes, menu rows, dropdown/toast titles, modal subtitle's sibling text.
- **Caption 12**/400 = meta/info rows, captions · **Label 11**/500/**0.12em** = labels, eyebrows `// X`, categories `[ x ]`, field labels, errors — **JetBrains Mono**.
- Not part of the scale (don't "fix" them onto it): the `✕` close glyph (sized to its 36px control), SVG/logo internal text. Article prose has its OWN sub-scale in `crepe-overrides.scss` (16 body · 24 h2 · 18 h3 · 14 code/small) — keep it separate from chrome.
- Line-heights: stat/H1/hero 1.04 · H3 1.18 · UI body 1.6 · prose(16px) 1.85 · labels 1.2.
- Space Grotesk = identity/titles/numbers; JetBrains Mono = data/code/body/labels.

### Letter-spacing

- Labels & categories (`// X`, `[ x ]`, field labels) = **0.12em @ 11px** (the "terminal" character — never drop it). Status badges 0.06em uppercase. Headings -0.02em; H3/body 0.

### Spacing (never invent values)

- Page gutter 40px (`px-10`). Container max-w **1240** (home/profile); article column max-w **780**, gutter 40.
- Page **bottom = section rhythm 40px** (`pb-10`) — we orient on sectionality, the last section just ends with the 40px rhythm (no separate big page-bottom). Page **top**: home `pt-20` (80, clears the fixed header), inner pages `pt-10` (40).
- Full-bleed bands: 100vw, content in max-w column with 40px inset; band internal padding **40px** (`p-10`, byline/stat/like bands).
- Feed card padding **20px** (`p-5` — correct). List row **28/24** (`px-7 py-6`). Hero card **34px** (`p-[34px]`).
- **Section spacing = 40px (the dedicated section rhythm).** Section labels (`// PUBLICATIONS`, `// COMMENTS`, etc.) use `py-10` (40 above AND below). Every block in/around a section sits 40px apart (band→section, compose→label, label→content) — use `py-10`/`pt-10`, NOT 28. **28 (`gap-7`) is ONLY for repeating item gaps** (grid cards, feed, list rows, comment list) — never for section-level spacing.
- Grid/feed/comment-list gap **28** (`gap-7`); stats grid gap **40** (`gap-10`).
- Text-block rhythm: category→title **8** (`mb-2`); label→value / title→body **16** (`mt-4`); body→meta 24.

### Meta / info rows (author · date · icon+number)

- ONE size: **Caption 12px** (`text-[12px]`) — NEVER 11/11.5/12.5. Icons **14px** (`size-3.5`). In-group gap 10 (`gap-2.5`), between-metrics gap 16 (`gap-4`), separator middle-dot `·` muted2, tabular-nums.

### Components (fixed sizes)

- Underline field **14px**, padding 8px 0. Label uses the Material floating pattern but is **always 11px/0.12em uppercase** (the field-label size) — only its POSITION animates (rests in the placeholder spot → floats to top on focus/fill); the label never changes size. Full-width submit (auth) = the **36px** control height (`flex h-9 w-full items-center justify-center`), Space Grotesk 700/14px/`leading-none`. No separate 44px/`py-[15px]` exception — auth submit matches the universal 36px button.
- **Buttons = 36px** (`h-9` / `size-9` — 32 content + 2px borders, matching the burger/header control), `px-4`, **14px**/700/0.06em uppercase; outline btn same @600. Use everywhere (send/cancel/emoji/icon). (Supersedes the design file's older 44px.)
- Avatar **40px** (byline/comment, letter 16px) & **128px** (profile header). Header controls 36px (`size-9`).
- Geometry: square corners (no radius), **2px borders everywhere** (primary `--m-line`, secondary `--m-dim`). Accent stripes/edges too (modal top stripe, info-box left edge, toast left edge) = **2px, never 3px**.
- Modals (auth / confirm / etc.): portal into a `.mono-portal` node; chrome = `border-2 border-[var(--m-dim)]` + 2px accent top stripe (`border-t-2 border-t-[var(--m-accent)]`), `bg-[var(--m-bg)]`, square; inner padding `px-9 pt-[34px] pb-9`; header = `// EYEBROW` (mono-label, `mb-2`) + **32px** `font-display` title (`tracking-[-0.02em] leading-none`) + optional **14px** subtitle (`mt-4`, UI-body muted; the auth + recovery views both use this — no separate bordered info-box for the lead line).
- **Logo / sloth mark** (`LogoSloth`): mark = **mono only** — dark on light, light on dark (two variants); **never the accent/lime tint**. The accent appears only in the `[ TEAM ] NOT LAZY` lockup wordmark (filled `[ TEAM ]` badge + accent "LAZY"), not the sloth itself. Living reference of the whole system lives at `/brand` (`src/app/brand`).
- Tokens: `var(--m-bg/fg/accent/line/panel/card/muted/muted2/dim/error)`; light + `.dark`. Accent stays lime (not teal).

## Workflow

- Run `npm run typecheck` and `npm run lint` after changes; keep both at 0 errors.
- Don't commit unless asked; no co-authorship trailer.
