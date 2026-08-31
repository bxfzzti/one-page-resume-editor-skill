# Test Database Isolation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 确保 Vitest 和 Playwright 永远只操作 `resume_skill_test`，不触碰公开验证版 `resume_skill`。

**Architecture:** 使用共享 PostgreSQL 实例中的独立测试数据库。统一准备脚本负责后缀保护、创建、迁移和清空；Vitest 在模块加载前覆盖连接，Playwright 使用独立端口和强制测试环境。

**Tech Stack:** TypeScript、PostgreSQL 16、Drizzle ORM migrator、Vitest、Playwright、Next.js。

## Global Constraints

- 测试数据库名必须以 `_test` 结尾。
- 测试不得监听或复用端口 `3000`。
- E2E 必须使用 Mock 模型和 `.data/test-storage`。
- 子线程不得提交、推送或修改分派范围之外的文件。

---

### Task 1: 测试数据库准备与 Vitest 隔离

**Files:**
- Create: `web/src/test/database-config.ts`
- Create: `web/scripts/prepare-test-db.ts`
- Modify: `web/vitest.config.mts`
- Modify: `web/package.json`

**Interfaces:**
- Produces: `getTestDatabaseUrl()`、`assertTestDatabaseUrl(url)`、`npm run test:prepare`。
- Consumes: `web/drizzle/` 迁移目录和当前 PostgreSQL 容器。

- [x] **Step 1: 实现无副作用 URL 保护函数**

`assertTestDatabaseUrl(url)` 使用 `new URL(url)` 读取数据库名；数据库名不匹配 `/^[A-Za-z0-9_]+_test$/` 时抛出 `UNSAFE_TEST_DATABASE_URL`。

- [x] **Step 2: 实现准备脚本**

脚本先连接管理数据库并按经过正则校验的名称创建测试库，再使用 `drizzle-orm/postgres-js/migrator` 应用 `drizzle/`，最后查询 `pg_tables` 并对测试库业务表执行 `TRUNCATE ... RESTART IDENTITY CASCADE`。

- [x] **Step 3: 接入 Vitest 与 npm scripts**

`vitest.config.mts` 在 `defineConfig` 前设置 `process.env.DATABASE_URL = getTestDatabaseUrl()`，保留 `fileParallelism: false`。新增：

```json
"test:prepare": "tsx scripts/prepare-test-db.ts",
"test": "npm run test:prepare && vitest run",
"test:watch": "npm run test:prepare && vitest"
```

- [x] **Step 4: 验证**

Run: `cd web && npm run test:prepare && npm test`

Expected: 测试库自动创建，全部单测通过。

### Task 2: Playwright 环境隔离

**Files:**
- Modify: `web/playwright.config.ts`

**Interfaces:**
- Consumes: `getTestDatabaseUrl()` 和 `npm run test:prepare`。
- Produces: 固定 `3010` 端口、测试库和 Mock 模型的 E2E 服务。

- [x] **Step 1: 修改基础地址和 Web Server**

将 `baseURL` 与 `webServer.url` 改为 `http://127.0.0.1:3010`，命令改为 `npm run dev -- --port 3010`，并设置 `reuseExistingServer: false`。

- [x] **Step 2: 注入测试环境**

`webServer.env` 必须包含测试数据库 URL、`MODEL_PROVIDER=mock`、`AUTH_MODE=anonymous_preview`、`STORAGE_DRIVER=local` 和 `LOCAL_STORAGE_PATH=.data/test-storage`。

- [x] **Step 3: 验证**

Run: `cd web && npm run e2e`

Expected: 8 个 E2E 通过，端口 `3000` 的公开服务不中断。

### Task 3: 主线程集成与数据不变性验证

**Files:**
- Modify: `web/README.md`
- Modify: `docs/superpowers/plans/2026-08-31-test-database-isolation-plan.md`

- [x] **Step 1: 记录公开库基线**

记录 `resume_skill` 的 `users`、`resume_projects`、`service_runs`、`feedback_submissions` 数量。

- [x] **Step 2: 运行完整验证**

Run: `cd web && npm run lint && npm run typecheck && npm test && npm run e2e && npm run build`

Expected: 全部退出码为 0。

- [x] **Step 3: 回读公开库**

公开库四张表计数必须与基线完全一致；测试库存在全部迁移表。

- [x] **Step 4: 提交推送**

```bash
git add docs web
git commit -m "Isolate automated test database"
git push origin main
```
