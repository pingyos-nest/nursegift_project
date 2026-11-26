import { expect, test } from "@playwright/test";
import { url } from "./helpers";

test("root redirects to a locale", async ({ page }) => {
  await page.goto(url("/"));
  await expect(page).toHaveURL(/\/(th|en)$/);
});

test("live page loads winners from the API", async ({ page, request }) => {
  const api = await (await request.get(url("/api/live"))).json();
  expect(api.ok).toBe(true);
  await page.goto(url("/th/live"));
  await expect(page.getByText("LIVE")).toBeVisible();
  if (api.gifts.length) await expect(page.locator("article")).toHaveCount(api.gifts.length);
});

test("search requires 4 characters", async ({ request }) => {
  expect((await request.get(url("/api/search?keyword=ab"))).status()).toBe(400);
  expect((await (await request.get(url("/api/search?keyword=zzzz-none"))).json()).ok).toBe(true);
});

test("legacy PHP URLs redirect", async ({ request }) => {
  const r = await request.get(url("/livedata/live"), { maxRedirects: 0 });
  expect(r.headers()["location"]).toMatch(/\/th\/live$/);
});

test("admin requires login", async ({ page }) => {
  await page.goto(url("/admin"));
  await expect(page).toHaveURL(/\/admin\/login$/);
});
