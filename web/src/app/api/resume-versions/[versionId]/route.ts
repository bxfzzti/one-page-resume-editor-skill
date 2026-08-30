import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { resumeProjects, resumeVersions } from "@/db/schema";
import { getCurrentUser } from "@/server/auth/session";

const inputSchema = z.object({
  title: z.string().trim().min(1).max(120),
  contentJson: z.unknown(),
  baseVersionId: z.string().uuid(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ versionId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  const { versionId } = await context.params;
  const input = inputSchema.parse(await request.json());
  const [base] = await db
    .select({ version: resumeVersions, project: resumeProjects })
    .from(resumeVersions)
    .innerJoin(resumeProjects, eq(resumeVersions.resumeProjectId, resumeProjects.id))
    .where(and(eq(resumeVersions.id, versionId), eq(resumeProjects.userId, user.id)))
    .limit(1);
  if (!base) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

  const [saved] = await db
    .insert(resumeVersions)
    .values({
      resumeProjectId: base.version.resumeProjectId,
      serviceRunId: base.version.serviceRunId,
      jobDescriptionId: base.version.jobDescriptionId,
      baseVersionId: input.baseVersionId,
      versionType: "user_saved",
      title: input.title,
      contentJson: input.contentJson,
    })
    .returning();
  return NextResponse.json({ ok: true, version: saved });
}
