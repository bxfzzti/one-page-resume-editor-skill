import { describe, expect, it } from "vitest";
import { SkillLoader } from "./skill-loader";

const loader = new SkillLoader();

describe("SkillLoader", () => {
  it("loads only diagnosis references", async () => {
    const bundle = await loader.load("diagnosis");
    expect(bundle.references.map((item) => item.path)).toEqual([
      "references/fact-ledger.md",
      "references/diagnosis.md",
    ]);
    expect(bundle.skillRevision).toMatch(/^[a-f0-9]{64}$/);
  });

  it("loads growth role rules for JD tailoring", async () => {
    const bundle = await loader.load("jd_tailoring", {
      roleGroup: "product_operations_growth",
    });
    expect(bundle.references.map((item) => item.path)).toEqual([
      "references/fact-ledger.md",
      "references/jd-tailoring.md",
      "references/roles/product-operations-growth.md",
    ]);
  });
});
