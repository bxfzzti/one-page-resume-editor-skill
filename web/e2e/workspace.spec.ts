import { expect, test } from "@playwright/test";

test("navigation remains available before a project is created", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "我的简历" }).click();
  await expect(page.getByRole("heading", { name: "我的简历" })).toBeVisible();
  await page.getByRole("link", { name: "积分" }).click();
  await expect(page.getByRole("heading", { name: "积分余额" })).toBeVisible();
  await page.getByRole("link", { name: "账户" }).click();
  await expect(page.getByRole("heading", { name: "账户与隐私" })).toBeVisible();
});
