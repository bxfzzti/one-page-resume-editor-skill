import { expect, test } from "@playwright/test";

test("navigation remains available before a project is created", async ({ page }) => {
  await page.goto("/");
  const mode = await page.evaluate(async () => {
    const response = await fetch("/api/auth/me");
    return response.json();
  });
  if (mode.previewMode) {
    await expect(page.getByRole("link", { name: "我的简历" })).not.toBeVisible();
    await expect(page.getByRole("link", { name: "积分" })).not.toBeVisible();
    await expect(page.getByRole("link", { name: "账户" })).not.toBeVisible();
    await expect(page.getByText("公开验证版 · 每日 3 次免费测试")).toBeVisible();
    return;
  }
  await page.getByRole("link", { name: "我的简历" }).click();
  await expect(page.getByRole("heading", { name: "我的简历" })).toBeVisible();
  await page.getByRole("link", { name: "积分" }).click();
  await expect(page.getByRole("heading", { name: "积分余额" })).toBeVisible();
  await page.getByRole("link", { name: "账户" }).click();
  await expect(page.getByRole("heading", { name: "账户与隐私" })).toBeVisible();
});
