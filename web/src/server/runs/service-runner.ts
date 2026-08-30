import { and, eq } from "drizzle-orm";
import type { ResumeDb } from "@/db/client";
import { resumeProjects, serviceRuns } from "@/db/schema";
import type { ServiceKind } from "@/lib/service-catalog";
import { PointLedgerService } from "@/server/points/point-ledger";
import { quoteService } from "@/server/points/service-pricing";

export type CreateServiceRunInput = {
  userId: string;
  resumeProjectId: string;
  serviceKind: ServiceKind;
  inputSnapshot: Record<string, unknown>;
  idempotencyKey: string;
};

export class ServiceRunner {
  constructor(
    private readonly database: ResumeDb,
    private readonly ledger: PointLedgerService,
  ) {}

  async create(input: CreateServiceRunInput) {
    const [existing] = await this.database
      .select()
      .from(serviceRuns)
      .where(eq(serviceRuns.idempotencyKey, input.idempotencyKey))
      .limit(1);
    if (existing) return existing;

    const [project] = await this.database
      .select({ id: resumeProjects.id })
      .from(resumeProjects)
      .where(
        and(
          eq(resumeProjects.id, input.resumeProjectId),
          eq(resumeProjects.userId, input.userId),
        ),
      )
      .limit(1);
    if (!project) throw new Error("RESUME_PROJECT_NOT_FOUND");

    const quotedPoints = quoteService(input.serviceKind);
    const [run] = await this.database
      .insert(serviceRuns)
      .values({
        userId: input.userId,
        resumeProjectId: input.resumeProjectId,
        serviceKind: input.serviceKind,
        state: "quoted",
        quotedPoints,
        idempotencyKey: input.idempotencyKey,
        inputSnapshot: input.inputSnapshot,
      })
      .returning();

    try {
      await this.ledger.reserve({
        userId: input.userId,
        serviceRunId: run.id,
        points: quotedPoints,
        idempotencyKey: `reserve:${run.id}`,
      });
      const [reserved] = await this.database
        .update(serviceRuns)
        .set({ state: "reserved", updatedAt: new Date() })
        .where(eq(serviceRuns.id, run.id))
        .returning();
      return reserved;
    } catch (error) {
      await this.database
        .update(serviceRuns)
        .set({
          state: "failed",
          errorCode: error instanceof Error ? error.message : "RESERVE_FAILED",
          updatedAt: new Date(),
        })
        .where(eq(serviceRuns.id, run.id));
      throw error;
    }
  }

  async get(runId: string, userId: string) {
    const [run] = await this.database
      .select()
      .from(serviceRuns)
      .where(and(eq(serviceRuns.id, runId), eq(serviceRuns.userId, userId)))
      .limit(1);
    return run ?? null;
  }
}
