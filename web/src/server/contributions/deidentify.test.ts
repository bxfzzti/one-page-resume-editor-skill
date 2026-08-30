import { describe, expect, it } from "vitest";
import { deidentifyTrainingSample } from "./deidentify";

describe("deidentifyTrainingSample", () => {
  it("removes direct identifiers and raw file references", () => {
    const sample = deidentifyTrainingSample({
      task: "诊断",
      facts: [{ text: "联系 user@example.com 或 13800138000，详见 https://internal.example/a" }],
      sentences: [],
    });
    const text = JSON.stringify(sample);
    expect(text).not.toContain("user@example.com");
    expect(text).not.toContain("13800138000");
    expect(text).not.toContain("https://internal.example/a");
    expect(text).not.toContain("storageKey");
  });
});
