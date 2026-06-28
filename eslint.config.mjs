import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";
import boundaries from "eslint-plugin-boundaries";

/**
 * Feature-Sliced Design layer order (high → low): app > widgets > features >
 * entities > shared. The boundaries plugin maps each `src/<layer>` directory to
 * an element type and enforces that a layer may import only ITSELF and LOWER
 * layers — no upward imports and no sibling-slice imports across `features/*`
 * or `entities/*`. Intra-slice imports (same `features/<slice>` / `entities/<slice>`)
 * stay allowed.
 */
const fsdBoundaries = {
  files: ["src/**/*.{ts,tsx}"],
  plugins: { boundaries },
  settings: {
    // Resolve the `@/` alias (→ `src/*`) so cross-layer imports are classified
    // against the right element instead of failing to resolve.
    "import/resolver": {
      typescript: { project: "./tsconfig.json" },
    },
    "boundaries/include": ["src/**/*"],
    "boundaries/elements": [
      { type: "app", pattern: "src/app", mode: "folder" },
      { type: "widgets", pattern: "src/widgets", mode: "folder" },
      // Slices: capture the slice name so siblings are distinguishable.
      {
        type: "features",
        pattern: "src/features/*",
        mode: "folder",
        capture: ["slice"],
      },
      {
        type: "entities",
        pattern: "src/entities/*",
        mode: "folder",
        capture: ["slice"],
      },
      { type: "shared", pattern: "src/shared", mode: "folder" },
    ],
  },
  rules: {
    // v6 dependency rule (object selectors + `{{from.slice}}` template syntax).
    "boundaries/dependencies": [
      "error",
      {
        default: "disallow",
        rules: [
          {
            from: { type: "app" },
            allow: {
              to: {
                type: ["app", "widgets", "features", "entities", "shared"],
              },
            },
          },
          {
            from: { type: "widgets" },
            allow: {
              to: { type: ["widgets", "features", "entities", "shared"] },
            },
          },
          {
            // A feature may import its OWN slice + any entity/shared — never a
            // sibling feature.
            from: { type: "features" },
            allow: {
              to: [
                {
                  type: "features",
                  captured: { slice: "{{from.slice}}" },
                },
                { type: ["entities", "shared"] },
              ],
            },
          },
          {
            // An entity may import its OWN slice + shared — never a sibling
            // entity, and never up into features/widgets/app.
            from: { type: "entities" },
            allow: {
              to: [
                {
                  type: "entities",
                  captured: { slice: "{{from.slice}}" },
                },
                { type: "shared" },
              ],
            },
          },
          {
            from: { type: "shared" },
            allow: { to: { type: "shared" } },
          },
        ],
      },
    ],
  },
};

/**
 * `src/shared/ui` is a framework-agnostic component library (Storybook-able,
 * reusable) — it must NOT bind to Next.js (CLAUDE.md: "Next.js is the SEO head
 * only; everything else is full client"). Ban every `next/*` import here, and
 * turn off the Next lint rule that pushes `<Link>` onto a plain `<a>` (the lib
 * uses plain `<a>` / `<img>` / `React.lazy` instead of next/link/image/dynamic).
 */
const sharedUiNextFree = {
  files: ["src/shared/ui/**/*.{ts,tsx}"],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["next/*"],
            message:
              "shared/ui must stay framework-agnostic — no next/* imports. Use <img>/<a>/React.lazy/CSS instead (CLAUDE.md: Next.js is the SEO head only).",
          },
        ],
      },
    ],
    "@next/next/no-html-link-for-pages": "off",
  },
};

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "storybook-static/**",
      ".claude/**",
      "next-env.d.ts",
    ],
  },
  ...coreWebVitals,
  ...typescript,
  fsdBoundaries,
  sharedUiNextFree,
];

export default eslintConfig;
