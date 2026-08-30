# 一页纸简历 Web MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在当前仓库新增一个可本地真实运行的中文简历 Web MVP，支持四类服务、注册赠送积分、测试支付、真实模型调用、版本管理、Word/PDF 导出和逐任务数据贡献授权。

**Architecture:** 在仓库 `web/` 下创建 Next.js 全栈应用，使用 PostgreSQL 与不可变积分账本保存状态。Web 通过版本化 Skill 加载器读取仓库根目录的 `SKILL.md` 和 `references/`，AI 任务由数据库队列与独立 worker 执行；真实支付和自动模型训练不进入本计划。

**Tech Stack:** Next.js App Router、TypeScript、React、Tailwind CSS、Lucide、PostgreSQL 16、Drizzle ORM、Zod、Vitest、Playwright、Mammoth、PDF.js、docx、无头 Chromium。

## Global Constraints

- 所有用户可见内容使用中文。
- 网站代码放在 `web/`；根目录 Skill 继续作为唯一业务规则来源。
- 首页直接提供四类任务，不制作营销落地页。
- 首次流程采用单栏向导；结果生成后才展开渐进式工作台。
- 电脑端优先，手机端必须完整可用。
- 人民币 1 元等于 10 积分；首次注册赠送 50 积分。
- 没有会员、订阅、等级、自动续费或积分有效期。
- 事实底稿包含在服务内，不单独收费；基础 Word/PDF 导出免费。
- 第一版支付必须是测试支付，不发生真实扣款。
- 用户工作数据默认不用于训练；只有逐任务主动授权并完成脱敏的样本才能进入训练样本表。
- 未授权训练、编造事实、修改数字、升级贡献、多 JD 混版和重复扣积分均为 P0。
- 不提交模型、邮件、对象存储或支付密钥。

---

### Task 1: Web 工程骨架与运行环境

**Files:**
- Create: `web/package.json`
- Create: `web/package-lock.json`
- Create: `web/next.config.ts`
- Create: `web/tsconfig.json`
- Create: `web/eslint.config.mjs`
- Create: `web/postcss.config.mjs`
- Create: `web/src/app/layout.tsx`
- Create: `web/src/app/page.tsx`
- Create: `web/src/app/globals.css`
- Create: `web/src/components/app-header.tsx`
- Create: `web/src/lib/service-catalog.ts`
- Create: `web/.env.example`
- Create: `web/docker-compose.yml`
- Create: `web/vitest.config.mts`
- Create: `web/src/test/setup.ts`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `SERVICE_CATALOG`、`ServiceKind`、Next.js 应用骨架、本地 PostgreSQL。
- Consumes: `docs/superpowers/specs/2026-08-30-resume-skill-web-product-design.md`。

- [x] **Step 1: 初始化 Next.js 工程**

Run:

```bash
npx create-next-app@latest web --ts --tailwind --eslint --app --src-dir --import-alias '@/*' --use-npm
cd web
npm install drizzle-orm postgres zod lucide-react jose nodemailer mammoth pdfjs-dist docx
npm install -D drizzle-kit vitest @testing-library/react @testing-library/jest-dom jsdom @playwright/test tsx @types/nodemailer
```

Expected: `web/package.json` 和 `web/package-lock.json` 存在，安装退出码为 0。

- [x] **Step 2: 添加开发脚本和本地数据库**

`web/docker-compose.yml`：

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: resume
      POSTGRES_PASSWORD: resume
      POSTGRES_DB: resume_skill
    ports:
      - "54329:5432"
    volumes:
      - resume_skill_pg:/var/lib/postgresql/data

volumes:
  resume_skill_pg:
```

在 `web/package.json` 增加：

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "worker": "tsx src/worker/index.ts",
    "e2e": "playwright test"
  }
}
```

- [x] **Step 3: 定义环境变量样例**

`web/.env.example`：

```dotenv
DATABASE_URL=postgres://resume:resume@127.0.0.1:54329/resume_skill
SESSION_SECRET=replace-with-at-least-32-random-bytes
EMAIL_FROM=resume@example.com
SMTP_URL=
MODEL_PROVIDER=mock
MODEL_API_KEY=
MODEL_BASE_URL=
MODEL_NAME=
STORAGE_DRIVER=local
LOCAL_STORAGE_PATH=.data/storage
APP_URL=http://127.0.0.1:3000
```

- [x] **Step 4: 定义服务目录**

`web/src/lib/service-catalog.ts`：

```ts
export const SERVICE_CATALOG = {
  diagnosis: { label: "看看简历问题", points: 5 },
  one_page: { label: "整理成一页纸", points: 15 },
  jd_tailoring: { label: "按 JD 定制", points: 12 },
  multi_jd: { label: "多个 JD 分版本定制", points: 20 },
  interview_review: { label: "检查简历和准备面试", points: 8 },
  deep_follow_up: { label: "基于当前结果继续追问", points: 3 },
} as const;

export type ServiceKind = keyof typeof SERVICE_CATALOG;

export const PRIMARY_SERVICE_KINDS = [
  "diagnosis",
  "one_page",
  "jd_tailoring",
  "interview_review",
] as const satisfies readonly ServiceKind[];
```

- [x] **Step 5: 建立真实第一屏**

`web/src/app/page.tsx` 必须直接渲染四类任务按钮、注册赠送 50 积分说明和“上传简历”主操作；不得出现营销 hero、用户评价或虚构招聘结果。

核心渲染：

```tsx
import { PRIMARY_SERVICE_KINDS, SERVICE_CATALOG } from "@/lib/service-catalog";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-semibold">你今天想完成什么？</h1>
      <p className="mt-2 text-sm text-neutral-600">首次注册赠送 50 积分，生成前会明确显示消耗。</p>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {PRIMARY_SERVICE_KINDS.map((kind) => {
          const item = SERVICE_CATALOG[kind];
          return (
          <a key={kind} href={`/start?service=${kind}`} className="border p-4">
            <strong>{item.label}</strong>
            <span className="mt-2 block text-sm text-blue-700">{item.points} 积分</span>
          </a>
          );
        })}
      </div>
    </main>
  );
}
```

- [x] **Step 6: 配置忽略规则**

在根 `.gitignore` 增加：

```gitignore
web/.env
web/.next/
web/node_modules/
web/.data/
web/playwright-report/
web/test-results/
.superpowers/
```

- [x] **Step 7: 运行骨架验证**

Run:

```bash
cd web
npm run lint
npm run typecheck
npm run build
```

Expected: 三个命令退出码均为 0。

- [x] **Step 8: 提交**

```bash
git add .gitignore web
git commit -m "Scaffold resume web app"
```

### Task 2: PostgreSQL Schema 与迁移

**Files:**
- Create: `web/drizzle.config.ts`
- Create: `web/src/db/client.ts`
- Create: `web/src/db/schema/auth.ts`
- Create: `web/src/db/schema/resume.ts`
- Create: `web/src/db/schema/billing.ts`
- Create: `web/src/db/schema/contribution.ts`
- Create: `web/src/db/schema/index.ts`
- Create: `web/src/db/schema/schema.test.ts`
- Create: `web/drizzle/0000_rich_quasimodo.sql`
- Create: `web/drizzle/meta/0000_snapshot.json`
- Create: `web/drizzle/meta/_journal.json`

**Interfaces:**
- Produces: 数据表和 Drizzle 类型；`db` 客户端。
- Consumes: `ServiceKind`。

- [x] **Step 1: 写 schema 约束测试**

`web/src/db/schema/schema.test.ts`：

```ts
import { describe, expect, it } from "vitest";
import { pointLedger, serviceRuns, trainingSamples } from "./index";

describe("database schema", () => {
  it("keeps billing and training data in separate tables", () => {
    expect(pointLedger).toBeDefined();
    expect(serviceRuns).toBeDefined();
    expect(trainingSamples).toBeDefined();
    expect(pointLedger).not.toBe(trainingSamples);
  });
});
```

- [x] **Step 2: 运行测试并确认失败**

Run: `cd web && npm test -- src/db/schema/schema.test.ts`

Expected: FAIL，提示 `./index` 不存在。

- [x] **Step 3: 实现 schema**

表必须包含以下关键字段：

```ts
// auth.ts
users: id, email, emailVerifiedAt, welcomePointsGrantedAt, createdAt, deletedAt
emailOtps: id, email, codeHash, expiresAt, consumedAt, createdAt
sessions: id, userId, tokenHash, expiresAt, createdAt

// resume.ts
resumeProjects: id, userId, title, createdAt, updatedAt, deletedAt
sourceFiles: id, resumeProjectId, storageKey, mimeType, originalName, parseStatus, parsedText, createdAt
factItems: id, resumeProjectId, sourceFileId, sourceExcerpt, sourceLocation, factType, status, contributionBoundary, dataScope, handling, bodyEligible, riskText, createdAt, updatedAt
jobDescriptions: id, resumeProjectId, label, content, createdAt
resumeVersions: id, resumeProjectId, serviceRunId, jobDescriptionId, versionType, title, contentJson, createdAt

// billing.ts
serviceRuns: id, userId, resumeProjectId, serviceKind, state, quotedPoints, idempotencyKey, inputSnapshot, outputSnapshot, errorCode, createdAt, updatedAt
pointLedger: id, userId, serviceRunId, paymentOrderId, entryType, bucket, amount, idempotencyKey, createdAt
paymentOrders: id, userId, provider, amountFen, points, state, providerOrderId, idempotencyKey, createdAt, paidAt

// contribution.ts
contributionConsents: id, userId, serviceRunId, consentVersion, state, consentedAt, withdrawnAt
trainingSamples: id, consentId, serviceRunId, sampleJson, deidentificationVersion, reviewState, createdAt, approvedAt
auditEvents: id, userId, action, targetType, targetId, metadata, createdAt
```

所有用户资源表使用 UUID 主键；`pointLedger.idempotencyKey`、`serviceRuns.idempotencyKey` 和 `paymentOrders.idempotencyKey` 必须唯一。删除账户使用 `deletedAt` 软删除用户并清理工作数据。

- [x] **Step 4: 生成迁移并执行**

Run:

```bash
cd web
docker compose up -d postgres
npm run db:generate
npm run db:migrate
```

Expected: 迁移成功，生成 `web/drizzle/0000_rich_quasimodo.sql` 和 Drizzle metadata。

- [x] **Step 5: 运行测试**

Run: `cd web && npm test -- src/db/schema/schema.test.ts`

Expected: PASS。

- [x] **Step 6: 提交**

```bash
git add web/drizzle.config.ts web/src/db web/drizzle
git commit -m "Add resume web database schema"
```

### Task 3: 不可变积分账本

**Files:**
- Create: `web/src/server/points/point-ledger.ts`
- Create: `web/src/server/points/point-ledger.test.ts`
- Create: `web/src/server/points/service-pricing.ts`

**Interfaces:**
- Produces: `PointLedgerService.getBalance()`、`grantWelcome()`、`grantPurchase()`、`reserve()`、`settle()`、`release()`、`grantContributionReward()`。
- Consumes: `SERVICE_CATALOG`、`pointLedger`、`serviceRuns`。

- [x] **Step 1: 写失败测试**

测试必须覆盖：

```ts
it("grants welcome points once", async () => {
  await ledger.grantWelcome(userId);
  await ledger.grantWelcome(userId);
  expect(await ledger.getBalance(userId)).toEqual({ available: 50, reserved: 0 });
});

it("does not double reserve the same run", async () => {
  await ledger.grantWelcome(userId);
  await ledger.reserve({ userId, serviceRunId, points: 12, idempotencyKey: "reserve:run-1" });
  await ledger.reserve({ userId, serviceRunId, points: 12, idempotencyKey: "reserve:run-1" });
  expect(await ledger.getBalance(userId)).toEqual({ available: 38, reserved: 12 });
});

it("releases reserved points after failure", async () => {
  await ledger.release({ userId, serviceRunId, idempotencyKey: "release:run-1" });
  expect(await ledger.getBalance(userId)).toEqual({ available: 50, reserved: 0 });
});
```

- [x] **Step 2: 运行测试并确认失败**

Run: `cd web && npm test -- src/server/points/point-ledger.test.ts`

Expected: FAIL，提示 `PointLedgerService` 不存在。

- [x] **Step 3: 实现事务账本**

`PointLedgerService` 规则：

```ts
export type PointBalance = { available: number; reserved: number };

export interface ReserveInput {
  userId: string;
  serviceRunId: string;
  points: number;
  idempotencyKey: string;
}

export interface LedgerMutationInput {
  userId: string;
  serviceRunId: string;
  idempotencyKey: string;
}
```

- `grantWelcome` 写入 `welcome_grant +50`，唯一幂等键为 `welcome:<userId>`。
- `reserve` 在同一数据库事务中锁定用户流水、计算余额、写入 `reserve -points` 与 `reserved +points`；余额不足抛出 `INSUFFICIENT_POINTS`。
- `settle` 写入正数 `settle points` 以减少冻结额，不再次减少可用余额。
- `release` 写入 `release +points` 并清空该任务冻结额。
- `getBalance` 通过流水聚合计算，不读取可变余额字段。
- 赠送积分与购买积分分别记录 `bucket`，消耗时先赠送后购买。

- [x] **Step 4: 运行测试**

Run: `cd web && npm test -- src/server/points/point-ledger.test.ts`

Expected: PASS，重复调用不产生重复流水。

- [x] **Step 5: 提交**

```bash
git add web/src/server/points
git commit -m "Implement immutable point ledger"
```

### Task 4: 邮箱验证码登录与注册赠送

**Files:**
- Create: `web/src/server/auth/otp.ts`
- Create: `web/src/server/auth/email-sender.ts`
- Create: `web/src/server/auth/session.ts`
- Create: `web/src/server/auth/auth.test.ts`
- Create: `web/src/app/api/auth/request-code/route.ts`
- Create: `web/src/app/api/auth/verify-code/route.ts`
- Create: `web/src/app/api/auth/logout/route.ts`
- Create: `web/src/app/api/auth/me/route.ts`
- Create: `web/src/components/auth-dialog.tsx`

**Interfaces:**
- Produces: `requestEmailCode(email)`、`verifyEmailCode(email, code)`、`getCurrentUser()`。
- Consumes: `PointLedgerService.grantWelcome()`。

- [x] **Step 1: 写登录失败测试**

```ts
it("creates a user and grants 50 points after first verification", async () => {
  const code = await auth.requestEmailCode("user@example.com");
  const user = await auth.verifyEmailCode("user@example.com", code);
  expect(user.email).toBe("user@example.com");
  expect(await ledger.getBalance(user.id)).toEqual({ available: 50, reserved: 0 });
});

it("does not grant another welcome reward on later logins", async () => {
  const first = await auth.verifyEmailCode(
    "user@example.com",
    await auth.requestEmailCode("user@example.com"),
  );
  await auth.verifyEmailCode(
    "user@example.com",
    await auth.requestEmailCode("user@example.com"),
  );
  expect(await ledger.getBalance(first.id)).toEqual({ available: 50, reserved: 0 });
});
```

- [x] **Step 2: 运行测试并确认失败**

Run: `cd web && npm test -- src/server/auth/auth.test.ts`

Expected: FAIL，提示 auth 模块不存在。

- [x] **Step 3: 实现 OTP 与会话**

- OTP 为 6 位数字，数据库只保存 SHA-256 hash，有效期 10 分钟，成功后立即消费。
- 同一邮箱 60 秒内不可重复发送；15 分钟最多请求 5 次。
- `SMTP_URL` 为空时只允许 `NODE_ENV !== "production"`，并在服务器日志输出验证码。
- 会话使用 32 字节随机 token，数据库保存 token hash，浏览器保存 `httpOnly`、`sameSite=lax`、生产环境 `secure` cookie。
- 首次验证邮箱时创建用户并在同一事务中调用 `grantWelcome`。

- [x] **Step 4: 实现登录弹窗**

弹窗只包含邮箱、验证码、发送按钮和登录按钮。用户首次点击收费服务时打开；不得在上传前阻止游客解析文件。

- [x] **Step 5: 运行测试**

Run:

```bash
cd web
npm test -- src/server/auth/auth.test.ts
npm run typecheck
```

Expected: PASS，类型检查无错误。

- [x] **Step 6: 提交**

```bash
git add web/src/server/auth web/src/app/api/auth web/src/components/auth-dialog.tsx
git commit -m "Add email login and welcome points"
```

### Task 5: 游客文件解析与登录后存储

**Files:**
- Create: `web/src/lib/files/parse-resume.ts`
- Create: `web/src/lib/files/parse-resume.test.ts`
- Create: `web/src/server/storage/storage.ts`
- Create: `web/src/server/storage/local-storage.ts`
- Create: `web/src/server/storage/local-storage.test.ts`
- Create: `web/src/app/api/resumes/route.ts`
- Create: `web/src/app/start/page.tsx`
- Create: `web/src/components/resume-upload.tsx`
- Create: `web/src/components/material-confirmation.tsx`
- Create: `web/src/types/mammoth-browser.d.ts`

**Interfaces:**
- Produces: `parseResumeFile(file)`、`StorageAdapter.put/get/delete()`、`POST /api/resumes`。
- Consumes: 当前用户、`resumeProjects`、`sourceFiles`。

- [x] **Step 1: 写解析测试**

```ts
it("accepts docx and pdf but rejects executable files", async () => {
  expect(await parseResumeFile(docxFixture)).toMatchObject({ mimeType: DOCX_MIME });
  expect(await parseResumeFile(pdfFixture)).toMatchObject({ mimeType: "application/pdf" });
  await expect(parseResumeFile(exeFixture)).rejects.toThrow("UNSUPPORTED_FILE_TYPE");
});
```

- [x] **Step 2: 运行测试并确认失败**

Run: `cd web && npm test -- src/lib/files/parse-resume.test.ts`

Expected: FAIL，提示 `parseResumeFile` 不存在。

- [x] **Step 3: 实现浏览器解析**

- DOCX 使用 Mammoth 提取文本。
- PDF 使用 PDF.js 提取每页文本。
- 纯文本直接读取。
- 单文件最大 10 MiB。
- 支持 MIME：PDF、DOCX、TXT。
- 返回 `{ mimeType, originalName, text, warnings }`。
- 不把游客文件发送到服务器。

- [x] **Step 4: 实现本地存储适配器**

```ts
export interface StorageAdapter {
  put(key: string, bytes: Uint8Array, contentType: string): Promise<void>;
  get(key: string): Promise<Uint8Array>;
  delete(key: string): Promise<void>;
}
```

`LocalStorageAdapter` 只能写入 `LOCAL_STORAGE_PATH/<userId>/<resumeProjectId>/`，拒绝 `..` 和绝对路径。

- [x] **Step 5: 实现 `/start` 向导**

页面步骤固定为：选择服务 → 上传或粘贴 → 材料确认 → 登录 → 价格确认。上传和材料确认不要求登录。

- [x] **Step 6: 登录后创建项目**

`POST /api/resumes` 验证资源所有权，保存项目、原始文件和解析文本。响应：

```ts
type CreateResumeResponse = {
  resumeProjectId: string;
  sourceFileId: string;
};
```

- [x] **Step 7: 运行测试并提交**

```bash
cd web
npm test -- src/lib/files/parse-resume.test.ts
npm run typecheck
git add src/lib/files src/server/storage src/app/api/resumes src/app/start src/components/resume-upload.tsx src/components/material-confirmation.tsx
git commit -m "Add resume parsing and storage"
```

### Task 6: Skill 加载器、结构化输出与模型适配层

**Files:**
- Create: `web/src/server/skill/skill-loader.ts`
- Create: `web/src/server/skill/skill-loader.test.ts`
- Create: `web/src/server/model/model-gateway.ts`
- Create: `web/src/server/model/mock-model.ts`
- Create: `web/src/server/model/http-model.ts`
- Create: `web/src/server/model/schemas.ts`
- Create: `web/src/server/audit/source-audit.ts`
- Create: `web/src/server/audit/source-audit.test.ts`

**Interfaces:**
- Produces: `SkillLoader.load(serviceKind)`、`ModelGateway.generate()`、`auditGeneratedSentences()`。
- Consumes: 根目录 Skill 与 references、`ServiceKind`。

- [x] **Step 1: 写 Skill 路由测试**

```ts
it("loads only required references for diagnosis", async () => {
  const bundle = await loader.load("diagnosis");
  expect(bundle.references.map((item) => item.path)).toEqual([
    "references/fact-ledger.md",
    "references/diagnosis.md",
  ]);
});

it("loads JD and role rules for growth tailoring", async () => {
  const bundle = await loader.load("jd_tailoring", { roleGroup: "product_operations_growth" });
  expect(bundle.references.map((item) => item.path)).toContain("references/jd-tailoring.md");
  expect(bundle.references.map((item) => item.path)).toContain("references/roles/product-operations-growth.md");
});
```

- [x] **Step 2: 写来源审计失败测试**

```ts
it("rejects contribution upgrades", () => {
  const result = auditGeneratedSentences({
    facts: [{ id: "F1", text: "协同产品团队上线权益页", boundary: "协同" }],
    sentences: [{ text: "主导会员体系建设", factIds: ["F1"] }],
  });
  expect(result.ok).toBe(false);
  expect(result.issues[0]?.code).toBe("CONTRIBUTION_UPGRADE");
});
```

- [x] **Step 3: 实现 Skill 加载器**

- 通过 `process.cwd()` 向上定位仓库根目录。
- 每次加载 `SKILL.md` 和当前任务需要的 references。
- 计算文件 SHA-256，返回 `skillRevision`。
- 不复制 Skill 内容到 `web/`。

```ts
export type SkillBundle = {
  entrypoint: string;
  references: Array<{ path: string; content: string }>;
  skillRevision: string;
};
```

- [x] **Step 4: 定义模型接口与 schema**

```ts
export interface ModelGateway {
  generate<T>(input: {
    system: string;
    user: string;
    schema: z.ZodType<T>;
    requestId: string;
  }): Promise<T>;
}
```

所有服务输出共享：任务识别、事实条目、风险、追问和 `sentences[{ text, factIds }]`。JD 定制额外包含 JD 要求、证据等级、版本修改记录和独立版本。

- [x] **Step 5: 实现模型适配器**

- `MockModelGateway` 返回测试 fixture。
- `HttpModelGateway` 使用 `MODEL_BASE_URL`、`MODEL_NAME` 和服务端 `MODEL_API_KEY`。
- `HttpModelGateway` 调用 OpenAI-compatible `POST <MODEL_BASE_URL>/chat/completions`，使用 Bearer token、`MODEL_NAME` 和 JSON schema response format；非兼容模型必须新增独立适配器，不能在此实现中加入供应商条件分支。
- 请求超时 60 秒，最多重试一次。
- 只接受 JSON 结构化输出；解析或 Zod 校验失败抛出 `MODEL_OUTPUT_INVALID`。

- [x] **Step 6: 实现来源审计**

检查：事实编号存在；数字、公司、岗位、项目和专有名词一致；贡献动词不升级；待确认项不进入正文；多个 JD 不交叉带入无证据关键词。

- [x] **Step 7: 运行测试并提交**

```bash
cd web
npm test -- src/server/skill src/server/audit
npm run typecheck
git add src/server/skill src/server/model src/server/audit
git commit -m "Add Skill model and source audit layer"
```

### Task 7: 服务运行状态机、worker 与测试支付

**Files:**
- Create: `web/src/server/runs/service-runner.ts`
- Create: `web/src/server/runs/service-runner.test.ts`
- Create: `web/src/worker/index.ts`
- Create: `web/src/worker/process-service-run.ts`
- Create: `web/src/app/api/service-runs/route.ts`
- Create: `web/src/app/api/service-runs/[runId]/route.ts`
- Create: `web/src/server/payments/mock-payment.ts`
- Create: `web/src/server/payments/mock-payment.test.ts`
- Create: `web/src/app/api/payments/mock/route.ts`

**Interfaces:**
- Produces: `ServiceRunner.create()`、`ServiceRunner.get()`、worker、测试支付订单。
- Consumes: 积分账本、Skill 加载器、模型网关、来源审计。

- [x] **Step 1: 写状态机测试**

```ts
it("settles only after valid audited output", async () => {
  const run = await runner.create(input);
  await worker.process(run.id);
  expect((await runner.get(run.id)).state).toBe("succeeded");
  expect(await ledger.getBalance(userId)).toEqual({ available: 38, reserved: 0 });
});

it("releases points after audit failure", async () => {
  model.nextResult = contributionUpgradeFixture;
  const run = await runner.create(input);
  await worker.process(run.id);
  expect((await runner.get(run.id)).state).toBe("failed");
  expect(await ledger.getBalance(userId)).toEqual({ available: 50, reserved: 0 });
});
```

- [x] **Step 2: 实现服务创建**

`POST /api/service-runs` 接收：

```ts
type CreateServiceRunInput = {
  resumeProjectId: string;
  serviceKind: ServiceKind;
  jobDescriptionIds: string[];
  idempotencyKey: string;
};
```

服务端重新计算价格；前端价格不能作为结算依据。创建任务与冻结积分在同一事务内完成。

- [x] **Step 3: 实现 worker**

worker 轮询 `reserved` 任务，原子更新为 `running`，加载输入快照和 Skill，调用模型，执行 schema 和来源审计，成功后保存事实与版本并结算积分；任一步失败均记录错误码并释放积分。`npm run worker -- --once` 只处理当前最早的一条可运行任务并退出，供测试和验收使用；不带 `--once` 时持续轮询。

- [x] **Step 4: 实现测试支付**

- 支持自定义 1 至 99 元整数金额，按 1:10 到账。
- 支持 5/50、10/110、20/240、50/650 积分包。
- 模拟回调必须使用订单幂等键，重复回调只到账一次。
- 页面和订单明确显示“测试支付，不会真实扣款”。

- [x] **Step 5: 运行测试并提交**

```bash
cd web
npm test -- src/server/runs src/server/payments
npm run typecheck
git add src/server/runs src/worker src/app/api/service-runs src/server/payments src/app/api/payments
git commit -m "Add service runner and mock payments"
```

### Task 8: 渐进式工作台与版本管理

**Files:**
- Create: `web/src/app/resumes/page.tsx`
- Create: `web/src/app/resumes/[resumeId]/page.tsx`
- Create: `web/src/components/workspace/workspace-shell.tsx`
- Create: `web/src/components/workspace/version-sidebar.tsx`
- Create: `web/src/components/workspace/result-panel.tsx`
- Create: `web/src/components/workspace/fact-drawer.tsx`
- Create: `web/src/components/workspace/mobile-tabs.tsx`
- Create: `web/src/components/workspace/run-progress.tsx`
- Create: `web/src/components/workspace/version-editor.tsx`
- Create: `web/src/components/workspace/workspace.test.tsx`
- Create: `web/src/app/api/resume-versions/[versionId]/route.ts`
- Create: `web/src/app/points/page.tsx`
- Create: `web/src/app/account/page.tsx`

**Interfaces:**
- Produces: 首次单栏向导、结果后工作台、版本和事实风险 UI。
- Consumes: 服务运行 API、版本、事实条目和积分流水。

- [x] **Step 1: 写渐进展示测试**

```tsx
it("hides the full workspace before the first successful run", () => {
  render(<WorkspaceShell project={projectWithoutResults} />);
  expect(screen.getByText("继续当前任务")).toBeInTheDocument();
  expect(screen.queryByText("历史版本")).not.toBeInTheDocument();
});

it("shows versions and fact drawer after a result exists", () => {
  render(<WorkspaceShell project={projectWithResults} />);
  expect(screen.getByText("历史版本")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "事实与风险" })).toBeInTheDocument();
});
```

- [x] **Step 2: 实现桌面工作台**

- 结果前：单栏显示材料、追问和运行进度。
- 结果后：左侧版本、中间结果、右侧可收起事实抽屉。
- 用户点击风险句子时打开抽屉并定位来源事实。
- 不在默认正文显示内部事实编号。
- 用户手动编辑后必须“另存为新版本”，不得静默覆盖 AI 结果。`PATCH /api/resume-versions/:versionId` 接收 `{ title, contentJson, baseVersionId }`，创建 `versionType=user_saved` 的新记录并返回新版本 ID。

- [x] **Step 3: 实现手机布局**

宽度小于 768px 时使用“流程、当前结果、事实与风险”标签。按钮、文本和积分不得重叠；底部操作栏显示当前服务和积分。

- [x] **Step 4: 实现积分和账户页**

- 积分页显示可用、冻结和流水；充值前明确测试支付。
- 账户页显示删除简历、注销账户、贡献记录和撤回未来使用入口。

- [x] **Step 5: 运行测试并提交**

```bash
cd web
npm test -- src/components/workspace
npm run lint
npm run typecheck
git add src/app/resumes src/app/points src/app/account src/components/workspace
git commit -m "Build progressive resume workspace"
```

### Task 9: Word/PDF 导出与真实回读

**Files:**
- Create: `web/src/server/export/resume-document.ts`
- Create: `web/src/server/export/resume-document.test.ts`
- Create: `web/src/server/export/render-pdf.ts`
- Create: `web/src/server/export/verify-export.ts`
- Create: `web/src/app/api/resume-versions/[versionId]/export/route.ts`
- Create: `web/src/components/workspace/export-menu.tsx`

**Interfaces:**
- Produces: `generateDocx()`、`generatePdf()`、`verifyExport()`。
- Consumes: 已确认 `resumeVersions`。

- [ ] **Step 1: 写导出测试**

```ts
it("creates editable docx and text-readable pdf from the same content", async () => {
  const docx = await generateDocx(versionFixture);
  const pdf = await generatePdf(versionFixture);
  expect(await verifyExport({ docx, pdf, expected: ["张某", "星河电商平台", "18%"] })).toEqual({
    ok: true,
    pageCount: 1,
  });
});
```

- [ ] **Step 2: 实现 DOCX**

使用 `docx` 创建真实段落、标题和列表；姓名、联系方式、公司、岗位、时间和项目必须可复制。不得把整页导出为图片。

- [ ] **Step 3: 实现 PDF**

从与 DOCX 相同的内容模型生成打印 HTML，使用 Playwright Chromium 输出 PDF。若一页会损失已确认事实，返回 `TWO_PAGES_RECOMMENDED`，不强制压缩。

- [ ] **Step 4: 实现回读验证**

验证页数、关键字段文本、数字和项目名；生成页面 PNG 供视觉检查。验证失败不返回下载链接。

- [ ] **Step 5: 运行测试并提交**

```bash
cd web
npm test -- src/server/export
npm run typecheck
git add src/server/export src/app/api/resume-versions src/components/workspace/export-menu.tsx
git commit -m "Add verified Word and PDF export"
```

### Task 10: 数据贡献授权、脱敏、奖励与数据删除

**Files:**
- Create: `web/src/server/contributions/deidentify.ts`
- Create: `web/src/server/contributions/deidentify.test.ts`
- Create: `web/src/server/contributions/contribution-service.ts`
- Create: `web/src/server/contributions/contribution-service.test.ts`
- Create: `web/src/app/api/contributions/route.ts`
- Create: `web/src/app/api/contributions/[consentId]/withdraw/route.ts`
- Create: `web/src/components/contribution-prompt.tsx`
- Create: `web/src/server/privacy/data-deletion.ts`
- Create: `web/src/server/privacy/data-deletion.test.ts`
- Create: `web/src/app/api/account/delete/route.ts`
- Create: `web/src/app/api/resumes/[resumeId]/route.ts`

**Interfaces:**
- Produces: `deidentifyTrainingSample()`、`ContributionService.consent()`、`withdraw()`、`DataDeletionService.deleteResume()`、`deleteAccount()`。
- Consumes: 成功服务结果、事实条目、积分账本。

- [ ] **Step 1: 写隐私失败测试**

```ts
it("removes direct identifiers and raw file references", () => {
  const sample = deidentifyTrainingSample(rawContributionFixture);
  expect(JSON.stringify(sample)).not.toContain("13800138000");
  expect(JSON.stringify(sample)).not.toContain("user@example.com");
  expect(JSON.stringify(sample)).not.toContain("sourceFiles");
});

it("rewards an approved contribution once", async () => {
  await service.approve(consentId);
  await service.approve(consentId);
  expect(await ledger.getBalance(userId)).toEqual({ available: 60, reserved: 0 });
});

it("deletes work data but preserves required billing ledger", async () => {
  await deletion.deleteAccount(userId);
  expect(await db.query.resumeProjects.findMany({ where: byUser(userId) })).toHaveLength(0);
  expect(await db.query.sourceFiles.findMany({ where: byUser(userId) })).toHaveLength(0);
  expect(await db.query.pointLedger.findMany({ where: byUser(userId) })).not.toHaveLength(0);
});
```

- [ ] **Step 2: 实现脱敏**

删除电话、邮箱、微信、住址、身份证、内部链接、客户名、敏感项目名和原始文件引用；公司、项目和日期组合替换为稳定代号。检测到金融、医疗、未成年人或无法可靠脱敏内容时拒绝入库。

- [ ] **Step 3: 实现授权和撤回**

- 提示在结果完成后出现，默认不勾选。
- 同意记录 `consentVersion` 和任务 ID。
- 通过脱敏审核后发放 10 积分；每月最多 30 积分。
- 撤回后停止未来使用，并删除尚未进入训练批次的样本。
- 拒绝或撤回不影响工作数据和服务。

- [ ] **Step 4: 实现简历和账户删除**

- 删除单份简历时删除原始文件、解析文本、事实、JD 和版本；保留已结算服务运行和积分流水中的必要金额与状态，去除正文快照。
- 删除账户时撤销会话、删除所有工作数据、删除未进入训练批次的贡献样本，并把用户记录软删除。
- 已进入训练批次的样本记录停止未来使用标记，不承诺从既有模型参数中单独移除。
- 每个删除操作写入不包含简历正文的 `auditEvents`。
- API 必须再次验证邮箱验证码，防止仅凭现有会话误删。

- [ ] **Step 5: 运行测试并提交**

```bash
cd web
npm test -- src/server/contributions src/server/privacy
npm run typecheck
git add src/server/contributions src/server/privacy src/app/api/contributions src/app/api/account src/app/api/resumes src/components/contribution-prompt.tsx
git commit -m "Add consent and privacy controls"
```

### Task 11: Web 回归、真实浏览器验收与运行交付

**Files:**
- Create: `web/playwright.config.ts`
- Create: `web/e2e/first-run.spec.ts`
- Create: `web/e2e/points-idempotency.spec.ts`
- Create: `web/e2e/multi-jd.spec.ts`
- Create: `web/e2e/mobile-workspace.spec.ts`
- Create: `web/e2e/privacy.spec.ts`
- Create: `web/scripts/run-skill-regressions.ts`
- Create: `web/README.md`
- Modify: `README.md`

**Interfaces:**
- Produces: 可重复的浏览器、Skill 和文件验收；本地可访问 URL。
- Consumes: Tasks 1-10 的完整 Web MVP。

- [ ] **Step 1: 建立 Playwright 配置**

配置桌面 `1440x900`、手机 `390x844` 两个项目，使用真实开发服务器和独立测试数据库。测试完成后保留失败截图和 trace。

- [ ] **Step 2: 实现首次流程 E2E**

测试：游客选择通用诊断 → 上传虚拟简历 → 确认材料 → 邮箱登录 → 获得 50 积分 → 明确看到消耗 5 积分 → 成功生成 → 余额 45 → 导出 Word/PDF。

- [ ] **Step 3: 实现幂等与失败退款 E2E**

测试双击生成只创建一个任务；模型超时和来源审计失败均恢复原余额；测试支付重复回调只到账一次。

- [ ] **Step 4: 实现多 JD E2E**

使用 `tests/regression/cases/03-multi-jd-tailoring.md`，验证两个版本共享事实编号、数字一致、贡献边界一致且无混版。

- [ ] **Step 5: 实现手机与隐私 E2E**

验证手机三个标签、无重叠、按钮可点击；拒绝贡献不影响使用；未授权任务不产生 `trainingSamples`；授权样本不含直接身份信息。

- [ ] **Step 6: 接入现有 Skill 回归**

`run-skill-regressions.ts` 读取 `tests/regression/cases/*.md` 和 expected，通过 Web 服务运行诊断、单 JD 和多 JD，并输出通过、部分通过或失败。P0 时退出码为 1。

- [ ] **Step 7: 运行全量验证**

Run:

```bash
python3 /Users/xxqq/.codex/skills/.system/skill-creator/scripts/quick_validate.py .
git diff --check
cd web
npm test
npm run lint
npm run typecheck
npm run build
npm run e2e
npm run worker -- --once
```

Expected: Skill 输出 `Skill is valid!`；其余命令退出码为 0；P0 回归数为 0。

- [ ] **Step 8: 启动真实开发服务**

Run:

```bash
cd web
docker compose up -d postgres
npm run db:migrate
npm run dev
```

Expected: 开发服务器输出本地 URL，浏览器可完成首次流程。若默认端口被占用，使用 Next.js 提供的下一个可用端口。

- [ ] **Step 9: 更新文档**

`web/README.md` 写明本地启动、环境变量、测试支付、模型适配器、测试命令和隐私边界。根 `README.md` 增加 Web MVP 入口，但不把未上线功能写成已发布。

- [ ] **Step 10: 提交**

```bash
git add web/playwright.config.ts web/e2e web/scripts web/README.md README.md
git commit -m "Verify resume web MVP end to end"
```

### Task 12: 主线程总复核、安装副本与远端发布

**Files:**
- Modify: `docs/superpowers/plans/2026-08-30-resume-skill-web-mvp-plan.md`

**Interfaces:**
- Produces: 主线程最终判断、安装副本同步、GitHub `main` 更新。
- Consumes: 所有子线程提交。

- [ ] **Step 1: 主线程检查提交和工作区**

Run:

```bash
git status --short --branch
git log --oneline --decorate -15
git diff origin/main...HEAD --stat
```

Expected: 无意外文件、无私有简历、无密钥。

- [ ] **Step 2: 检查敏感内容**

Run:

```bash
if git diff origin/main...HEAD -- . ':!package-lock.json' | rg -n "MODEL_API_KEY=.+|SMTP_URL=.+@|BEGIN PRIVATE KEY"; then
  exit 1
else
  echo "no committed secrets"
fi
```

Expected: 输出 `no committed secrets`。测试 fixture 可以使用 `13800138000` 和 `user@example.com`，但隐私测试必须证明它们不进入训练样本。

- [ ] **Step 3: 同步 Skill 安装副本**

仅同步根目录 Skill、references、examples 和 tests 到 `/Users/xxqq/.agents/skills/one-page-resume-editor`；不要把 `web/`、`docs/`、`.git/` 或开发依赖复制到安装副本。

- [ ] **Step 4: 最终验证**

重复 Task 11 Step 7，并使用 Playwright 截取首页、首次向导、结果工作台、积分页和手机布局。检查文本不重叠、画面非空、积分数字与服务目录一致。

- [ ] **Step 5: 推送并确认远端**

Run:

```bash
git push origin main
git status --short --branch
git ls-remote origin refs/heads/main
```

Expected: 状态为 `## main...origin/main`，远端 `main` 指向最新提交。
