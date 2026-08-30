import { describe, expect, it } from "vitest";
import { generateDocx, renderResumeHtml } from "./resume-document";

const version = {
  title: "张某｜用户运营",
  contentJson: "星河电商平台\n复购率提升 18%",
};

describe("resume export", () => {
  it("renders the same text source for HTML and editable docx", async () => {
    expect(renderResumeHtml(version)).toContain("复购率提升 18%");
    const docx = await generateDocx(version);
    expect(docx.subarray(0, 2).toString()).toBe("PK");
  });
});
