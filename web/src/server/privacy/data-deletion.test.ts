import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db/client";
import { auditEvents, contributionConsents, paymentOrders, pointLedger, resumeProjects, serviceRuns, trainingSamples, users } from "@/db/schema";
import { DataDeletionService } from "./data-deletion";

const deletion = new DataDeletionService(db);

describe("DataDeletionService", () => {
  beforeEach(async () => {
    await db.delete(trainingSamples); await db.delete(contributionConsents); await db.delete(pointLedger); await db.delete(paymentOrders); await db.delete(serviceRuns); await db.delete(resumeProjects); await db.delete(auditEvents); await db.delete(users);
  });

  it("deletes a resume project and writes an audit event", async () => {
    const [user] = await db.insert(users).values({ email: `${randomUUID()}@example.com` }).returning();
    const [project] = await db.insert(resumeProjects).values({ userId: user.id, title: "测试" }).returning();
    await deletion.deleteResume(user.id, project.id);
    expect(await db.select().from(resumeProjects)).toHaveLength(0);
    expect(await db.select().from(auditEvents)).toHaveLength(1);
  });
});
