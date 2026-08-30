# Anonymous Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为匿名公开验证版增加不采集联系方式和简历内容的任务反馈入口。

**Architecture:** 新建独立 `feedback_submissions` 表保存任务元数据快照和用户描述。`FeedbackService` 负责归属校验、敏感联系方式拒绝和幂等更新；API 只接受结构化输入，客户端表单只在任务终态显示。

**Tech Stack:** Next.js App Router、TypeScript、React、PostgreSQL、Drizzle ORM、Zod、Vitest、Playwright。

## Global Constraints

- 不保存用户 ID、IP、访客指纹、简历原文、事实底稿或模型输出。
- 描述为 2 至 500 字，检测到手机号或邮箱必须拒绝。
- 每个任务只保留一条最新反馈。
- 所有用户可见内容使用中文。

---

### Task 1: 反馈数据与服务边界

**Files:**
- Create: `web/src/db/schema/feedback.ts`
- Modify: `web/src/db/schema/index.ts`
- Create: `web/src/server/feedback/feedback-service.ts`
- Test: `web/src/server/feedback/feedback-service.test.ts`
- Create: `web/drizzle/0005_*.sql`

**Interfaces:**
- Consumes: `ResumeDb`、`serviceRuns`。
- Produces: `FeedbackService.submit({ userId, serviceRunId, category, helpful, description })`。

- [ ] **Step 1: 写归属、敏感信息和幂等测试**

测试自己的任务可提交；其他用户返回 `SERVICE_RUN_NOT_FOUND`；手机号或邮箱返回 `CONTACT_INFORMATION_NOT_ALLOWED`；同一任务二次提交后表中仍只有一条记录。

- [ ] **Step 2: 运行测试并确认失败**

Run: `cd web && npm test -- src/server/feedback/feedback-service.test.ts`

Expected: FAIL，反馈模块尚不存在。

- [ ] **Step 3: 实现表和服务**

表字段固定为：`id`、`serviceRunId`、`serviceKind`、`runState`、`errorCode`、`category`、`helpful`、`description`、`createdAt`、`updatedAt`。`serviceRunId` 使用唯一索引但不设置外键，匿名任务清理后反馈仍保留随机任务号。

联系方式检测：

```ts
const PHONE = /(?<!\d)1[3-9]\d{9}(?!\d)/;
const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
```

- [ ] **Step 4: 生成迁移并运行测试**

Run: `cd web && npm run db:generate && npm run db:migrate && npm test -- src/server/feedback/feedback-service.test.ts`

Expected: PASS，重复提交更新原记录。

### Task 2: 反馈 API

**Files:**
- Create: `web/src/app/api/feedback/route.ts`

**Interfaces:**
- Consumes: `FeedbackService.submit()`、`getCurrentUser()`。
- Produces: `POST /api/feedback`。

- [ ] **Step 1: 定义 Zod 输入**

```ts
z.object({
  serviceRunId: z.string().uuid(),
  category: z.enum(["result_quality", "fact_error", "usability", "technical_error", "other"]),
  helpful: z.boolean(),
  description: z.string().trim().min(2).max(500),
})
```

- [ ] **Step 2: 实现会话和错误映射**

无会话返回 401；任务不属于当前会话返回 404；联系方式返回 400；成功返回 `{ ok: true }`。

- [ ] **Step 3: 运行类型检查**

Run: `cd web && npm run typecheck`

Expected: PASS。

### Task 3: 反馈表单

**Files:**
- Create: `web/src/components/workspace/feedback-form.tsx`
- Modify: `web/src/components/workspace/task-launcher.tsx`
- Modify: `web/e2e/first-run.spec.ts`

**Interfaces:**
- Consumes: `serviceRunId`、`runState`、`errorCode`。
- Produces: 成功和失败状态下的匿名反馈表单。

- [ ] **Step 1: 实现折叠表单**

表单使用分类下拉框、是/否分段按钮、描述文本框和提交按钮。界面提示“请勿填写姓名、联系方式或简历原文”。

- [ ] **Step 2: 接入任务终态**

成功结果和失败错误下方均渲染 `<FeedbackForm serviceRunId={run.id} />`。

- [ ] **Step 3: 扩展 E2E**

任务模拟成功后打开反馈，选择分类、填写描述，拦截 `/api/feedback` 返回成功，并断言“感谢反馈”可见。

- [ ] **Step 4: 运行完整验证**

Run: `cd web && npm run lint && npm run typecheck && npm test && npm run e2e && npm run build`

Expected: 所有命令退出码为 0。

### Task 4: 公网回测与交付

**Files:**
- Modify: `docs/superpowers/plans/2026-08-31-anonymous-feedback-plan.md`

- [ ] **Step 1: 用公网地址完成一次反馈提交**

Expected: HTTPS 页面提交成功，数据库只出现允许字段。

- [ ] **Step 2: 扫描敏感信息和暂存差异**

Run: `git diff --check && git diff --cached --check`

Expected: 无空白错误、无密钥和 `.env`。

- [ ] **Step 3: 提交并推送**

```bash
git add docs web
git commit -m "Add anonymous task feedback"
git push origin main
```
