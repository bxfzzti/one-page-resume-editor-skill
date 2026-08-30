import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const required = ["DATABASE_URL", "SESSION_SECRET", "MODEL_PROVIDER"] as const;
const missing = required.filter((name) => !process.env[name]);
const errors: string[] = missing.map((name) => `${name} 未配置`);

if ((process.env.SESSION_SECRET?.length ?? 0) < 32) {
  errors.push("SESSION_SECRET 至少需要 32 个字符");
}

if (process.env.MODEL_PROVIDER !== "mock") {
  for (const name of ["MODEL_API_KEY", "MODEL_BASE_URL", "MODEL_NAME"]) {
    if (!process.env[name]) errors.push(`${name} 未配置`);
  }
}

if (process.env.STORAGE_DRIVER === "s3") {
  for (const name of ["S3_ENDPOINT", "S3_REGION", "S3_BUCKET", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY"]) {
    if (!process.env[name]) errors.push(`${name} 未配置`);
  }
}

if (errors.length > 0) {
  console.error("环境配置未通过：");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`环境配置通过：模型=${process.env.MODEL_PROVIDER}，存储=${process.env.STORAGE_DRIVER ?? "local"}，支付=${process.env.PAYMENT_PROVIDER ?? "mock"}`);
