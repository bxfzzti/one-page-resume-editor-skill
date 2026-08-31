import { describe, expect, it } from "vitest";
import { assertTestDatabaseUrl } from "./database-config";

describe("test database URL guard", () => {
  it("accepts a database with the _test suffix", () => {
    expect(() =>
      assertTestDatabaseUrl(
        "postgres://resume:resume@127.0.0.1:54329/resume_skill_test",
      ),
    ).not.toThrow();
  });

  it.each([
    "postgres://resume:resume@127.0.0.1:54329/resume_skill",
    "postgres://resume:resume@127.0.0.1:54329/postgres",
    "not-a-database-url",
  ])("rejects an unsafe database URL: %s", (url) => {
    expect(() => assertTestDatabaseUrl(url)).toThrow(
      "UNSAFE_TEST_DATABASE_URL",
    );
  });
});
