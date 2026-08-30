import { and, eq, isNull } from "drizzle-orm";
import type { ResumeDb } from "@/db/client";
import { db } from "@/db/client";
import { auditEvents, resumeProjects, sourceFiles, users } from "@/db/schema";
import { getStorageAdapter } from "@/server/storage/storage";

export class DataDeletionService {
  constructor(private readonly database: ResumeDb = db) {}

  async deleteResume(userId: string, resumeId: string) {
    const project = await this.findProject(userId, resumeId);
    if (!project) throw new Error("RESUME_PROJECT_NOT_FOUND");
    const files = await this.database.select().from(sourceFiles).where(eq(sourceFiles.resumeProjectId, resumeId));
    const storage = getStorageAdapter();
    for (const file of files) await storage.delete(file.storageKey);
    await this.database.delete(resumeProjects).where(eq(resumeProjects.id, resumeId));
    await this.audit(userId, "delete_resume", "resume_project", resumeId);
  }

  async deleteAccount(userId: string) {
    const projects = await this.database.select({ id: resumeProjects.id }).from(resumeProjects).where(eq(resumeProjects.userId, userId));
    for (const project of projects) await this.deleteResume(userId, project.id);
    await this.database.update(users).set({ deletedAt: new Date() }).where(and(eq(users.id, userId), isNull(users.deletedAt)));
    await this.audit(userId, "delete_account", "user", userId);
  }

  private async findProject(userId: string, resumeId: string) {
    const [project] = await this.database.select().from(resumeProjects).where(and(eq(resumeProjects.id, resumeId), eq(resumeProjects.userId, userId))).limit(1);
    return project;
  }

  private async audit(userId: string, action: string, targetType: string, targetId: string) {
    await this.database.insert(auditEvents).values({ userId, action, targetType, targetId });
  }
}
