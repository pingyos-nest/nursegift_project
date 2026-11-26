import { expect, type Page } from "@playwright/test";

/** Relative paths: resolved against baseURL (which includes the /dev/nursegift basePath). */
export const url = (path: string) => path.replace(/^\//, "");

export async function loginAsAdmin(page: Page, role: "Admin" | "User" = "Admin") {
  await page.goto(url("/admin/login"));
  await page.getByRole("button", { name: role, exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

export async function expectToast(page: Page, text: string | RegExp) {
  await expect(page.locator("[role=status]").filter({ hasText: text }).last()).toBeVisible({ timeout: 10_000 });
}

export async function waitToastsGone(page: Page) {
  await expect(page.locator("[role=status]")).toHaveCount(0, { timeout: 10_000 });
}

export const unique = (prefix: string) => `${prefix}-${Date.now().toString(36)}`;
