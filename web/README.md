# 简历网站 Web MVP

## 本地运行

```bash
cp .env.example .env
docker-compose up -d postgres
npm run db:migrate
npm run check:env
npm run dev
```

打开 `http://127.0.0.1:3000`。当前主入口使用手机号验证码登录：开发环境验证码会在终端输出，也会通过接口返回 `devCode`；测试支付不会真实扣款。

## 验证

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm run e2e
```

网站默认不把用户简历用于模型训练。只有用户逐任务主动同意、样本完成脱敏后，才会创建训练样本并奖励 10 积分。

真实模型、短信、对象存储和支付配置只写入本机 `web/.env` 或部署平台的 Secret，不要提交 Git，也不要发到对话中。手机号登录的真实短信供应商尚未接入；生产环境配置短信供应商前，验证码发送会主动失败，不会假装发送成功。邮箱验证码接口暂保留为后备能力，当前界面不展示。
