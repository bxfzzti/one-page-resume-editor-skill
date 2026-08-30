import { and, eq } from "drizzle-orm";
import type { ResumeDb } from "@/db/client";
import {
  contributionConsents,
  resumeProjects,
  serviceRuns,
  trainingSamples,
} from "@/db/schema";
import { PointLedgerService } from "@/server/points/point-ledger";
import { deidentifyTrainingSample, DEIDENTIFICATION_VERSION } from "./deidentify";

export class ContributionService {
  constructor(
    private readonly database: ResumeDb,
    private readonly ledger: PointLedgerService,
  ) {}

  async consent(input: { userId: string; serviceRunId: string; version: string }) {
    const [run] = await this.database
      .select({ run: serviceRuns, project: resumeProjects })
      .from(serviceRuns)
      .innerJoin(resumeProjects, eq(serviceRuns.resumeProjectId, resumeProjects.id))
      .where(and(eq(serviceRuns.id, input.serviceRunId), eq(serviceRuns.userId, input.userId)))
      .limit(1);
    if (!run || run.run.state !== "succeeded" || !run.run.outputSnapshot) {
      throw new Error("SERVICE_RESULT_NOT_READY");
    }
    const [consent] = await this.database
      .insert(contributionConsents)
      .values({ userId: input.userId, serviceRunId: input.serviceRunId, consentVersion: input.version })
      .onConflictDoNothing({ target: contributionConsents.serviceRunId })
      .returning();
    return consent ?? null;
  }

  async approve(consentId: string, userId: string) {
    const [consent] = await this.database
      .select()
      .from(contributionConsents)
      .where(and(eq(contributionConsents.id, consentId), eq(contributionConsents.userId, userId)))
      .limit(1);
    if (!consent) throw new Error("CONSENT_NOT_FOUND");
    const [run] = await this.database.select().from(serviceRuns).where(eq(serviceRuns.id, consent.serviceRunId)).limit(1);
    if (!run?.outputSnapshot) throw new Error("SERVICE_RESULT_NOT_READY");
    const [sample] = await this.database
      .insert(trainingSamples)
      .values({
        consentId,
        serviceRunId: run.id,
        sampleJson: deidentifyTrainingSample(run.outputSnapshot as never),
        deidentificationVersion: DEIDENTIFICATION_VERSION,
        reviewState: "approved",
        approvedAt: new Date(),
      })
      .returning();
    await this.ledger.grantContributionReward({ userId, consentId });
    return sample;
  }

  async withdraw(consentId: string, userId: string) {
    const [updated] = await this.database
      .update(contributionConsents)
      .set({ state: "withdrawn", withdrawnAt: new Date() })
      .where(and(eq(contributionConsents.id, consentId), eq(contributionConsents.userId, userId)))
      .returning();
    if (!updated) throw new Error("CONSENT_NOT_FOUND");
    await this.database
      .update(trainingSamples)
      .set({ reviewState: "excluded_from_future_use" })
      .where(eq(trainingSamples.consentId, consentId));
    return updated;
  }
}
