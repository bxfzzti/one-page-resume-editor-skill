import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import {
  getTestDatabaseUrl,
  loadTestEnvironment,
} from "./src/test/database-config";

loadTestEnvironment();
process.env.DATABASE_URL = getTestDatabaseUrl();
process.env.MODEL_PROVIDER = "mock";
process.env.SMTP_URL = "";
process.env.SMS_PROVIDER = "console";
process.env.PAYMENT_PROVIDER = "mock";
process.env.STORAGE_DRIVER = "local";
process.env.LOCAL_STORAGE_PATH = ".data/test-storage";
process.env.AUTH_MODE = "anonymous_preview";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    exclude: ["e2e/**", "node_modules/**"],
    fileParallelism: false,
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
});
