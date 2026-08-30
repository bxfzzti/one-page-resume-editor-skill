import { expect, test } from "@playwright/test";

test("shows four service entrances and opens the upload flow", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "你今天想完成什么？" })).toBeVisible();
  await expect(page.getByRole("link", { name: /看看简历问题/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /整理成一页纸/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /按 JD 定制/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /检查简历和准备面试/ })).toBeVisible();
  await page.getByRole("link", { name: /看看简历问题/ }).click();
  await expect(page.getByRole("heading", { name: "看看简历问题" })).toBeVisible();
  await expect(page.getByText("文件先在浏览器中解析")).toBeVisible();
});

test("mobile upload page keeps the paste path usable", async ({ page }) => {
  await page.goto("/start?service=diagnosis");
  await page.getByRole("textbox", { name: "粘贴完整简历内容" }).fill("测试简历内容");
  await expect(page.getByRole("button", { name: "检查粘贴内容" })).toBeEnabled();
  await page.getByRole("button", { name: "检查粘贴内容" }).click();
  await expect(page.getByRole("textbox", { name: "简历原文" })).toHaveValue("测试简历内容");
});
