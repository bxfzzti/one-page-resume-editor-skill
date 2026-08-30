import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";

export type ExportVersion = {
  title: string;
  contentJson: unknown;
};

function contentText(content: unknown): string {
  if (typeof content === "string") return content;
  return JSON.stringify(content, null, 2);
}

export function renderResumeHtml(version: ExportVersion): string {
  const text = contentText(version.contentJson)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><style>body{font-family:Arial,"PingFang SC",sans-serif;margin:32px;color:#171717}h1{font-size:24px;border-bottom:2px solid #171717;padding-bottom:10px}pre{font:14px/1.7 Arial,"PingFang SC",sans-serif;white-space:pre-wrap}</style></head><body><h1>${version.title}</h1><pre>${text}</pre></body></html>`;
}

export async function generateDocx(version: ExportVersion): Promise<Buffer> {
  const paragraphs = contentText(version.contentJson)
    .split("\n")
    .map((line) => new Paragraph({ children: [new TextRun(line)] }));
  const document = new Document({
    sections: [{
      properties: { page: { margin: { top: 720, right: 900, bottom: 720, left: 900 } } },
      children: [new Paragraph({ text: version.title, heading: HeadingLevel.HEADING_1 }), ...paragraphs],
    }],
  });
  return Packer.toBuffer(document);
}
