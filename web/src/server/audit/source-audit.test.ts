import { describe, expect, it } from "vitest";
import { auditGeneratedSentences } from "./source-audit";

describe("auditGeneratedSentences", () => {
  it("rejects contribution upgrades", () => {
    const result = auditGeneratedSentences({
      facts: [
        {
          id: "F1",
          text: "协同产品团队上线权益页",
          status: "confirmed",
          boundary: "协同",
          bodyEligible: true,
        },
      ],
      sentences: [{ text: "主导会员体系建设", factIds: ["F1"] }],
    });

    expect(result.ok).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain(
      "CONTRIBUTION_UPGRADE",
    );
  });

  it("rejects pending facts and unsupported result wrappers", () => {
    const result = auditGeneratedSentences({
      facts: [
        {
          id: "F1",
          text: "活动 SOP 支持 12 个城市复用",
          status: "pending_confirmation",
          boundary: "支持",
          bodyEligible: false,
        },
      ],
      sentences: [
        {
          text: "具备跨城市运营经验，提升执行效率",
          factIds: ["F1"],
        },
      ],
    });

    expect(result.ok).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["PENDING_FACT_IN_BODY", "UNSUPPORTED_INFERENCE"]),
    );
  });
});
