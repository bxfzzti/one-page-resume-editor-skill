import type { ExportVersion } from "./resume-document";
import { renderResumeHtml } from "./resume-document";

export async function generatePdf(version: ExportVersion): Promise<Buffer> {
  const { chromium } = await import("@playwright/test");
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(renderResumeHtml(version), { waitUntil: "load" });
    return Buffer.from(await page.pdf({ format: "A4", printBackground: true, margin: { top: "16mm", right: "16mm", bottom: "16mm", left: "16mm" } }));
  } finally {
    await browser.close();
  }
}
