import { describe, expect, it } from "vitest";
import { pointLedger, serviceRuns, trainingSamples } from "./index";

describe("database schema", () => {
  it("keeps billing and training data in separate tables", () => {
    expect(pointLedger).toBeDefined();
    expect(serviceRuns).toBeDefined();
    expect(trainingSamples).toBeDefined();
    expect(pointLedger).not.toBe(trainingSamples);
  });
});
