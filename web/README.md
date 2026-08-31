# 简历网站 Web MVP

## 本地运行

```bash
cp .env.example .env
docker-compose up -d postgres
npm run db:migrate
npm run check:env
npm run dev
```

打开 `http://127.0.0.1:3000`。默认 `AUTH_MODE=anonymous_preview`，用户无需注册即可体验诊断和一页纸整理，每日最多启动 3 次任务。匿名简历和任务数据保留 24 小时，后续访问会触发过期清理；测试支付不会真实扣款。

需要恢复手机号登录时，将 `web/.env` 中的 `AUTH_MODE` 改为 `phone`。开发环境验证码会在终端输出，也会通过接口返回 `devCode`。

## 验证

自动测试使用独立的 `resume_skill_test` 数据库。`npm test` 和 `npm run e2e` 会自动创建、迁移并清空测试库；测试库名称不是 `_test` 后缀时会拒绝执行。Playwright 固定使用端口 `3010` 和 Mock 模型，不会复用端口 `3000` 的公开服务。

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm run e2e
```

网站默认不把用户简历用于模型训练。只有用户逐任务主动同意、样本完成脱敏后，才会创建训练样本并奖励 10 积分。

公开验证版的成功和失败任务都可以提交完全匿名的反馈。反馈只保存随机任务号、任务状态、问题分类、帮助度和最多 500 字描述，不保存用户、IP、简历原文或模型输出。

真实模型、短信、对象存储和支付配置只写入本机 `web/.env` 或部署平台的 Secret，不要提交 Git，也不要发到对话中。匿名验证版不依赖短信；手机号模式的真实短信供应商尚未接入，生产环境配置短信供应商前，验证码发送会主动失败。邮箱验证码接口暂保留为后备能力，当前界面不展示。
