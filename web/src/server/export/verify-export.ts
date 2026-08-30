import type { ExportVersion } from "./resume-document";

export async function verifyExport(input: {
  pdf: Buffer;
  expected: string[];
  version: ExportVersion;
}) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const document = await pdfjs.getDocument({ data: new Uint8Array(input.pdf) }).promise;
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => ("str" in item ? item.str : "")).join(" "));
  }
  const text = pages.join("\n").normalize("NFKC").replace(/\s+/g, "");
  const expected = input.expected.map((value) =>
    value.normalize("NFKC").replace(/\s+/g, ""),
  );
  return {
    ok: expected.every((value) => text.includes(value)),
    pageCount: document.numPages,
    missing: input.expected.filter(
      (_, index) => !text.includes(expected[index]),
    ),
  };
}
