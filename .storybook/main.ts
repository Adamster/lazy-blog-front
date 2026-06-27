import type { StorybookConfig } from "@storybook/react-vite";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

/**
 * Storybook runs on @storybook/react-vite — a plain React + Vite build, NO Next
 * adapter (CLAUDE.md: Next is the SEO head only; shared/ui is framework-agnostic).
 * Tailwind v4 is processed by the @tailwindcss/vite plugin (the project's
 * `postcss.config` / @tailwindcss/postcss is for the Next webpack build and does
 * NOT generate utilities here — so it's disabled for SB to avoid double-running).
 * The `@/` alias is resolved from tsconfig via vite-tsconfig-paths.
 */
const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx|mdx)"],
  addons: [],
  framework: { name: "@storybook/react-vite", options: {} },
  async viteFinal(cfg) {
    cfg.plugins = [...(cfg.plugins ?? []), tailwindcss(), tsconfigPaths()];
    cfg.css = { ...(cfg.css ?? {}), postcss: { plugins: [] } };
    return cfg;
  },
};

export default config;
