import { expect, test } from "@playwright/test";
import { expectToast, loginAsAdmin, unique, url, waitToastsGone } from "./helpers";

// Needs DEV_LOGIN=true (dev server only). Each test cleans up the data it creates.
test.describe.configure({ mode: "serial" });

const SET = 9001; // dedicated test set number

test("admin can create a set + prizes, record winners in both tabs, then clean up", async ({ page, request }) => {
  await loginAsAdmin(page);
  const mainPrize = unique("E2E main");
  const subPrize = unique("E2E sub");
  const winner = unique("E2E-W");

  // Create the set and one prize of each kind
  await page.goto(url("/admin/gifts"));
  const mainSection = page.locator("section").filter({ hasText: "ของรางวัล(ใหญ่)" }).first();
  await mainSection.getByRole("button", { name: "เพิ่มชุดรางวัล" }).click();
  await page.getByRole("dialog").locator("input[name=datagroup]").fill(String(SET));
  await page.getByRole("dialog").getByRole("button", { name: "เพิ่มชุดใหม่" }).click();
  await expectToast(page, "เพิ่มชุดข้อมูลสำเร็จ");
  await waitToastsGone(page);

  for (const [section, name] of [[mainSection, mainPrize], [page.locator("section").filter({ hasText: "ของรางวัล(ย่อย)" }).last(), subPrize]] as const) {
    await page.reload();
    await section.getByRole("button", { name: "เพิ่มรางวัล" }).click();
    await page.getByRole("dialog").locator("input[name=giftname]").fill(name);
    await page.getByRole("dialog").locator("select[name=datagroup]").selectOption(String(SET));
    await page.getByRole("dialog").getByRole("button", { name: "บันทึก" }).click();
    await expectToast(page, "เพิ่มข้อมูลสำเร็จ");
    await waitToastsGone(page);
  }

  // Record the same person on main + sub (max 2), third is blocked
  await page.goto(url(`/admin/sets/${SET}`));
  await page.getByRole("button", { name: new RegExp(mainPrize) }).click();
  await page.getByPlaceholder("เช่น 1001").fill(winner);
  await page.getByRole("button", { name: "บันทึก" }).click();
  await expectToast(page, "บันทึกสำเร็จ");
  await waitToastsGone(page);

  await page.goto(url(`/admin/sets/${SET}?type=sub`));
  await page.getByRole("button", { name: new RegExp(subPrize) }).click();
  await page.getByPlaceholder("เช่น 1001").fill(winner);
  await page.getByRole("button", { name: "บันทึก" }).click();
  await expectToast(page, "บันทึกสำเร็จ");
  await waitToastsGone(page);

  await page.getByRole("button", { name: new RegExp(subPrize) }).click();
  await page.getByPlaceholder("เช่น 1001").fill(winner);
  await page.getByRole("button", { name: "บันทึก" }).click();
  await expectToast(page, /ครบ 2 ชิ้น/);
  await page.keyboard.press("Escape");
  await waitToastsGone(page);

  // Public live feed shows both (cache is ~1.5s)
  await expect.poll(async () => (await (await request.get(url("/api/live"))).json()).gifts.filter((g: { name: string }) => g.name === winner).length, { timeout: 10_000 }).toBe(2);

  // Cleanup: winners, prizes, set
  for (const [tab, prize] of [["", mainPrize], ["?type=sub", subPrize]] as const) {
    await page.goto(url(`/admin/sets/${SET}${tab}`));
    await page.getByRole("button", { name: new RegExp(prize) }).click();
    await page.getByRole("button", { name: `ลบ ${winner}` }).click();
    await page.getByRole("dialog").last().getByRole("button", { name: "ลบ" }).click();
    await expectToast(page, "ลบสำเร็จ");
    await waitToastsGone(page);
  }
  await page.goto(url("/admin/gifts"));
  for (const prize of [mainPrize, subPrize]) {
    await page.getByRole("row", { name: new RegExp(prize) }).getByRole("button", { name: /^ลบ/ }).click();
    await page.getByRole("dialog").getByRole("button", { name: "ลบ" }).click();
    await expectToast(page, "ลบสำเร็จ");
    await waitToastsGone(page);
  }
  await page.goto(url("/admin/sets"));
  await page.getByRole("button", { name: `ลบชุดที่ ${SET}` }).click();
  await page.getByRole("dialog").getByRole("button", { name: "ลบ" }).click();
  await expectToast(page, "ลบสำเร็จ");
});

test("user role cannot open admin-only pages", async ({ page, request }) => {
  await loginAsAdmin(page, "User");
  await page.goto(url("/admin/users"));
  await expect(page).toHaveURL(/\/admin$/);
  const res = await page.request.get(url("/admin/backup/download"));
  expect(res.status()).toBe(403);
  void request;
});
