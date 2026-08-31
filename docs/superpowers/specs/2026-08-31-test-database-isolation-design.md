# 测试数据库隔离设计

## 目标

将公开验证版数据库与 Vitest、Playwright 自动测试完全隔离，确保运行任何测试命令都不会删除、修改或污染真实访客的简历、任务和反馈。

## 方案

沿用当前 PostgreSQL 容器，在同一实例中使用两个独立数据库：

- `resume_skill`：公开验证版数据库，只由本地生产服务使用。
- `resume_skill_test`：自动测试数据库，只由 Vitest 和 Playwright 使用。

测试准备脚本从 `TEST_DATABASE_URL` 读取测试库地址；未配置时默认使用 `postgres://resume:resume@127.0.0.1:54329/resume_skill_test`。数据库名必须以 `_test` 结尾，否则脚本立即退出，不能执行迁移或清理。

## 测试库生命周期

`npm test` 和 `npm run e2e` 在执行测试前统一调用 `test:prepare`：

1. 连接同一 PostgreSQL 实例的 `postgres` 管理数据库。
2. 若 `resume_skill_test` 不存在则创建。
3. 将仓库 `web/drizzle/` 中的全部迁移应用到测试库。
4. `TRUNCATE` 测试库 `public` schema 内的业务表，保留迁移历史。

所有清理 SQL 只能对通过 `_test` 后缀校验的数据库执行。

## Vitest

Vitest 配置在加载任何测试模块前，将 `DATABASE_URL` 强制设置为测试库 URL。数据库型测试文件保持串行，避免多个测试文件同时清表导致相互干扰。测试结束后允许测试数据留在测试库，下一次 `test:prepare` 会统一清空。

## Playwright

Playwright 固定使用 `http://127.0.0.1:3010`，不再复用端口 `3000` 的公开服务。测试 Web 进程强制使用：

- `DATABASE_URL=resume_skill_test`
- `MODEL_PROVIDER=mock`
- `AUTH_MODE=anonymous_preview`
- `STORAGE_DRIVER=local`
- `LOCAL_STORAGE_PATH=.data/test-storage`

`reuseExistingServer` 必须为 `false`，避免测试误连公开服务。

## 验收标准

- 测试准备脚本拒绝数据库名不是 `_test` 后缀的 URL。
- 运行完整单测和 E2E 前后，`resume_skill` 的用户、项目、任务和反馈数量保持不变。
- `resume_skill_test` 自动创建并具备全部迁移表。
- E2E 监听 `3010`，公开服务继续监听 `3000`。
- E2E 不调用真实 DeepSeek，不写入公开存储目录。
- 原有全部单测、E2E、类型检查和生产构建通过。
