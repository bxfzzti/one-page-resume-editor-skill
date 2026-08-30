import { Document, Packer, Paragraph } from "docx";
import { describe, expect, it } from "vitest";
import {
  DOCX_MIME,
  MAX_RESUME_FILE_BYTES,
  parseResumeFile,
} from "./parse-resume";

describe("parseResumeFile", () => {
  it("reads plain text files", async () => {
    const file = new File(["张某｜用户增长"], "resume.txt", {
      type: "text/plain",
    });
    await expect(parseResumeFile(file)).resolves.toMatchObject({
      mimeType: "text/plain",
      originalName: "resume.txt",
      text: "张某｜用户增长",
    });
  });

  it("extracts text from docx files", async () => {
    const document = new Document({
      sections: [{ children: [new Paragraph("星河电商平台 高级用户运营")] }],
    });
    const buffer = await Packer.toBuffer(document);
    const bytes = new Uint8Array(buffer);
    const file = new File([bytes], "resume.docx", { type: DOCX_MIME });

    const result = await parseResumeFile(file);
    expect(result.text).toContain("星河电商平台");
    expect(result.mimeType).toBe(DOCX_MIME);
  });

  it("rejects executable files", async () => {
    const file = new File([new Uint8Array([77, 90])], "resume.exe", {
      type: "application/x-msdownload",
    });
    await expect(parseResumeFile(file)).rejects.toThrow(
      "UNSUPPORTED_FILE_TYPE",
    );
  });

  it("rejects files larger than 10 MiB", async () => {
    const file = new File(
      [new Uint8Array(MAX_RESUME_FILE_BYTES + 1)],
      "resume.txt",
      { type: "text/plain" },
    );
    await expect(parseResumeFile(file)).rejects.toThrow("FILE_TOO_LARGE");
  });
});
