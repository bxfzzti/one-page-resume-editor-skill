import { and, desc, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { db } from "@/db/client";
import {
  factItems,
  resumeProjects,
  resumeVersions,
  serviceRuns,
  sourceFiles,
} from "@/db/schema";
import { getCurrentUser } from "@/server/auth/session";

export default async function ResumeWorkspacePage({
  params,
}: {
  params: Promise<{ resumeId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/start");
  const { resumeId } = await params;
  const [project] = await db
    .select()
    .from(resumeProjects)
    .where(
      and(eq(resumeProjects.id, resumeId), eq(resumeProjects.userId, user.id)),
    )
    .limit(1);
  if (!project) notFound();

  const [versions, facts, runs, sourceFile] = await Promise.all([
    db
      .select()
      .from(resumeVersions)
      .where(eq(resumeVersions.resumeProjectId, project.id))
      .orderBy(desc(resumeVersions.createdAt)),
    db.select().from(factItems).where(eq(factItems.resumeProjectId, project.id)),
    db
      .select()
      .from(serviceRuns)
      .where(eq(serviceRuns.resumeProjectId, project.id))
      .orderBy(desc(serviceRuns.createdAt)),
    db
      .select({ parsedText: sourceFiles.parsedText })
      .from(sourceFiles)
      .where(eq(sourceFiles.resumeProjectId, project.id))
      .limit(1),
  ]);

  return (
    <WorkspaceShell
      project={{
        id: project.id,
        title: project.title,
        versions,
        facts,
        runs,
        resumeText: sourceFile[0]?.parsedText ?? "",
      }}
    />
  );
}
