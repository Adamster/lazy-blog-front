import { expect, test } from "@playwright/test";

// One lightweight, resilient smoke flow. The app proxies `/api/*` to a LIVE
// backend, so a feed failure isn't necessarily a frontend regression — where a
// test needs real post data it skips gracefully if none loaded, and the whole
// spec runs as a NON-BLOCKING CI job. Asserting the app shell + auth modal
// (which need no backend) still catches "the app is broken" hard.

test("home route renders the app shell without feed data", async ({ page }) => {
  await page.goto("/");
  // The header is independent of the live API; feed text is not.
  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("button", { name: "Menu" })).toBeVisible();
});

test("clicking a post navigates to /[user]/[post] and shows the article", async ({
  page,
}) => {
  await page.goto("/");

  // Wait briefly for feed links; if the live backend returned no posts, skip
  // rather than fail (this path needs real data).
  const postLink = page
    .locator("a[href]")
    .filter({ has: page.locator("h1, h3") })
    .first();

  const hasPost = await postLink
    .waitFor({ state: "visible", timeout: 8000 })
    .then(() => true)
    .catch(() => false);
  test.skip(!hasPost, "No posts returned by the live backend — skipping nav.");

  await postLink.click();
  await expect(page).toHaveURL(/\/[^/]+\/[^/]+/);
  await expect(page.locator("h1").first()).toBeVisible();
});

test('header "login" opens the auth dialog', async ({ page }) => {
  await page.goto("/");

  // Login lives behind the burger menu.
  await page.getByRole("button", { name: "Menu" }).click();
  await page.getByRole("button", { name: "login" }).click();

  await expect(page.getByRole("dialog")).toBeVisible();
  // Esc closes it (the modal's keyboard contract).
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
});
