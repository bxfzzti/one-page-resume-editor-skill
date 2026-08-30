# 简历网站 Web MVP

## 本地运行

```bash
cp .env.example .env
docker-compose up -d postgres
npm run db:migrate
npm run dev
```

打开 `http://127.0.0.1:3000`。开发环境验证码会在终端输出，也会通过接口返回 `devCode`；测试支付不会真实扣款。

## 验证

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm run e2e
```

网站默认不把用户简历用于模型训练。只有用户逐任务主动同意、样本完成脱敏后，才会创建训练样本并奖励 10 积分。
