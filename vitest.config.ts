import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Unit + component test runner. jsdom for DOM-bearing primitives, the `@/` alias
// mirrors tsconfig so test imports match app imports, and the setup file wires
// jest-dom matchers. Playwright specs (e2e/**) are excluded — they run via the
// Playwright runner, not Vitest.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["node_modules", ".next", "e2e"],
    css: false,
  },
});
