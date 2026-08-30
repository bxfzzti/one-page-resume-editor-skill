import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { resumeProjects, resumeVersions } from "@/db/schema";
import { getCurrentUser } from "@/server/auth/session";
import { generateDocx } from "@/server/export/resume-document";
import { generatePdf } from "@/server/export/render-pdf";
import { verifyExport } from "@/server/export/verify-export";

export async function GET(
  request: Request,
  context: { params: Promise<{ versionId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  const { versionId } = await context.params;
  const [row] = await db
    .select({ version: resumeVersions })
    .from(resumeVersions)
    .innerJoin(resumeProjects, eq(resumeVersions.resumeProjectId, resumeProjects.id))
    .where(and(eq(resumeVersions.id, versionId), eq(resumeProjects.userId, user.id)))
    .limit(1);
  if (!row) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

  const version = { title: row.version.title, contentJson: row.version.contentJson };
  const format = new URL(request.url).searchParams.get("format") ?? "docx";
  if (format === "docx") {
    return new Response(new Uint8Array(await generateDocx(version)), {
      headers: {
        "content-type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "content-disposition": `attachment; filename="resume-${versionId}.docx"`,
      },
    });
  }
  if (format !== "pdf") return NextResponse.json({ ok: false, error: "UNSUPPORTED_FORMAT" }, { status: 400 });
  const pdf = await generatePdf(version);
  const verification = await verifyExport({ pdf, expected: [version.title], version });
  if (!verification.ok) return NextResponse.json({ ok: false, error: "EXPORT_VERIFY_FAILED", missing: verification.missing }, { status: 500 });
  return new Response(new Uint8Array(pdf), {
    headers: { "content-type": "application/pdf", "content-disposition": `attachment; filename="resume-${versionId}.pdf"` },
  });
}
