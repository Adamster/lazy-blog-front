import { defineConfig, devices } from "@playwright/test";

// Lightweight smoke layer. Depends on a LIVE backend (the app proxies `/api/*`
// to the prod blog API), so it is deliberately resilient: a single Chromium
// project, and a `webServer` that builds + starts the app. In CI this runs as a
// separate, NON-BLOCKING job (see .github/workflows/ci.yml) so a flaky/unreachable
// backend can't gate merges. To promote it to a required check, remove that
// job's `continue-on-error` once the API is reliably reachable from CI.
const PORT = Number(process.env.PORT ?? "3000");
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Build + start the real app. Reuse an already-running dev server locally.
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run build && npm run start",
        url: BASE_URL,
        timeout: 180_000,
        reuseExistingServer: !process.env.CI,
      },
});
