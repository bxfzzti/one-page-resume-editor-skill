export const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
export const PDF_MIME = "application/pdf";
export const TEXT_MIME = "text/plain";
export const MAX_RESUME_FILE_BYTES = 10 * 1024 * 1024;

export type ParsedResumeFile = {
  mimeType: string;
  originalName: string;
  text: string;
  warnings: string[];
};

async function readFileBuffer(file: File): Promise<ArrayBuffer> {
  if (typeof file.arrayBuffer === "function") return file.arrayBuffer();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("FILE_READ_FAILED"));
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) resolve(reader.result);
      else reject(new Error("FILE_READ_FAILED"));
    };
    reader.readAsArrayBuffer(file);
  });
}

function normalizeMimeType(file: File): string {
  if (file.type) return file.type;
  const extension = file.name.toLowerCase().split(".").pop();
  if (extension === "pdf") return PDF_MIME;
  if (extension === "docx") return DOCX_MIME;
  if (extension === "txt") return TEXT_MIME;
  return "application/octet-stream";
}

async function parseDocx(file: File): Promise<string> {
  const mammoth = await import("mammoth/mammoth.browser.js");
  const result = await mammoth.extractRawText({
    arrayBuffer: await readFileBuffer(file),
  });
  return result.value.trim();
}

async function parsePdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const document = await pdfjs.getDocument({
    data: new Uint8Array(await readFileBuffer(file)),
    isEvalSupported: false,
    useSystemFonts: true,
  }).promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(
      content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")
        .trim(),
    );
  }

  return pages.filter(Boolean).join("\n\n");
}

export async function parseResumeFile(file: File): Promise<ParsedResumeFile> {
  if (file.size > MAX_RESUME_FILE_BYTES) throw new Error("FILE_TOO_LARGE");
  const mimeType = normalizeMimeType(file);
  if (![DOCX_MIME, PDF_MIME, TEXT_MIME].includes(mimeType)) {
    throw new Error("UNSUPPORTED_FILE_TYPE");
  }

  let text = "";
  if (mimeType === TEXT_MIME) {
    text = new TextDecoder().decode(await readFileBuffer(file)).trim();
  }
  if (mimeType === DOCX_MIME) text = await parseDocx(file);
  if (mimeType === PDF_MIME) text = await parsePdf(file);

  return {
    mimeType,
    originalName: file.name,
    text,
    warnings: text ? [] : ["没有提取到可读文本，请粘贴简历内容。"],
  };
}
