import { defineConfig, devices } from "@playwright/test";
import {
  getTestDatabaseUrl,
  loadTestEnvironment,
} from "./src/test/database-config";

loadTestEnvironment();
const e2eBaseURL = "http://127.0.0.1:3010";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  timeout: 30_000,
  use: { baseURL: e2eBaseURL, trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 }, isMobile: true } },
  ],
  webServer: {
    command: "npm run dev -- --port 3010",
    url: e2eBaseURL,
    reuseExistingServer: false,
    timeout: 30_000,
    env: {
      DATABASE_URL: getTestDatabaseUrl(),
      MODEL_PROVIDER: "mock",
      SMTP_URL: "",
      SMS_PROVIDER: "console",
      PAYMENT_PROVIDER: "mock",
      AUTH_MODE: "anonymous_preview",
      STORAGE_DRIVER: "local",
      LOCAL_STORAGE_PATH: ".data/test-storage",
      NEXT_DIST_DIR: ".next-e2e",
    },
  },
});
