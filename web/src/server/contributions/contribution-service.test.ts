import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db/client";
import { auditEvents, contributionConsents, paymentOrders, pointLedger, resumeProjects, serviceRuns, trainingSamples, users } from "@/db/schema";
import { PointLedgerService } from "@/server/points/point-ledger";
import { ContributionService } from "./contribution-service";

const ledger = new PointLedgerService(db);
const service = new ContributionService(db, ledger);

describe("ContributionService", () => {
  beforeEach(async () => {
    await db.delete(trainingSamples); await db.delete(contributionConsents); await db.delete(pointLedger); await db.delete(paymentOrders); await db.delete(serviceRuns); await db.delete(resumeProjects); await db.delete(auditEvents); await db.delete(users);
  });

  it("rewards an approved contribution only once", async () => {
    const [user] = await db.insert(users).values({ email: `${randomUUID()}@example.com` }).returning();
    const [project] = await db.insert(resumeProjects).values({ userId: user.id, title: "测试" }).returning();
    const [run] = await db.insert(serviceRuns).values({ userId: user.id, resumeProjectId: project.id, serviceKind: "diagnosis", state: "succeeded", quotedPoints: 5, idempotencyKey: `run:${randomUUID()}`, inputSnapshot: {}, outputSnapshot: { task: "诊断", facts: [], sentences: [] } }).returning();
    const consent = await service.consent({ userId: user.id, serviceRunId: run.id, version: "v1" });
    await service.approve(consent!.id, user.id); await service.approve(consent!.id, user.id);
    expect(await ledger.getBalance(user.id)).toEqual({ available: 10, reserved: 0 });
  });
});
