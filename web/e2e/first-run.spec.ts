import { expect, test } from "@playwright/test";

test("shows preview service entrances and opens the upload flow", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "你今天想完成什么？" })).toBeVisible();
  await expect(page.getByRole("link", { name: /看看简历问题/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /整理成一页纸/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /按 JD 定制/ })).not.toBeVisible();
  await expect(page.getByRole("link", { name: /检查简历和准备面试/ })).not.toBeVisible();
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

test("anonymous preview saves the confirmed resume", async ({ page }) => {
  await page.goto("/start?service=diagnosis");
  await page.getByRole("textbox", { name: "粘贴完整简历内容" }).fill("候选人\n产品经理\n负责增长项目");
  await page.getByRole("button", { name: "检查粘贴内容" }).click();
  await page.getByRole("button", { name: "确认材料并继续" }).click();

  await expect(page.getByText("公开验证版 · 免费测试")).toBeVisible();
  await expect(page.getByRole("dialog", { name: "登录后开始生成" })).not.toBeVisible();
  await expect(page.getByRole("heading", { name: "材料已保存" })).toBeVisible();

  await page.getByRole("link", { name: "进入任务" }).click();
  await expect(page.getByRole("heading", { name: "继续当前任务" })).toBeVisible();

  await page.route("**/api/service-runs", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        run: { id: "00000000-0000-4000-8000-000000000001", state: "reserved", serviceKind: "diagnosis" },
      }),
    });
  });
  await page.route("**/api/service-runs/00000000-0000-4000-8000-000000000001", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        run: {
          id: "00000000-0000-4000-8000-000000000001",
          state: "succeeded",
          serviceKind: "diagnosis",
          outputSnapshot: { summary: "测试结果" },
        },
      }),
    });
  });
  await page.getByRole("button", { name: /看看简历问题/ }).click();
  await expect(page.getByText("任务已完成")).toBeVisible();
});
