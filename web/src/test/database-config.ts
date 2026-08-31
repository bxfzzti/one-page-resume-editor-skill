const DEFAULT_TEST_DATABASE_URL =
  "postgres://resume:resume@127.0.0.1:54329/resume_skill_test";

const TEST_DATABASE_NAME_PATTERN = /^[A-Za-z0-9_]+_test$/;

export function loadTestEnvironment(): void {
  try {
    process.loadEnvFile();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

export function assertTestDatabaseUrl(url: string): void {
  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    throw new Error("UNSAFE_TEST_DATABASE_URL");
  }

  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\//, ""));

  if (!TEST_DATABASE_NAME_PATTERN.test(databaseName)) {
    throw new Error("UNSAFE_TEST_DATABASE_URL");
  }
}

export function getTestDatabaseUrl(): string {
  const url = process.env.TEST_DATABASE_URL ?? DEFAULT_TEST_DATABASE_URL;
  assertTestDatabaseUrl(url);
  return url;
}
