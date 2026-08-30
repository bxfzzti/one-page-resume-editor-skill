import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db/client";
import {
  paymentOrders,
  pointLedger,
  resumeProjects,
  serviceRuns,
  users,
} from "@/db/schema";
import { PointLedgerService } from "@/server/points/point-ledger";
import { MockModelGateway } from "@/server/model/mock-model";
import { SkillLoader } from "@/server/skill/skill-loader";
import { ServiceRunner } from "./service-runner";
import { processServiceRun } from "@/worker/process-service-run";

const ledger = new PointLedgerService(db);
const model = new MockModelGateway();
const runner = new ServiceRunner(db, ledger);

async function createProject() {
  const [user] = await db
    .insert(users)
    .values({ email: `${randomUUID()}@example.com` })
    .returning();
  const [project] = await db
    .insert(resumeProjects)
    .values({ userId: user.id, title: "测试简历" })
    .returning();
  await ledger.grantWelcome(user.id);
  return { userId: user.id, resumeProjectId: project.id };
}

describe("ServiceRunner", () => {
  beforeEach(async () => {
    await db.delete(pointLedger);
    await db.delete(paymentOrders);
    await db.delete(serviceRuns);
    await db.delete(resumeProjects);
    await db.delete(users);
    model.nextResult = {
      task: "通用诊断",
      completeness: "完整",
      summary: "测试结果",
      facts: [
        {
          id: "F1",
          text: "负责用户运营",
          status: "confirmed",
          boundary: "负责",
          bodyEligible: true,
        },
      ],
      risks: [],
      questions: [],
      sentences: [{ text: "负责用户运营", factIds: ["F1"] }],
    };
  });

  it("reserves points before running a service", async () => {
    const { userId, resumeProjectId } = await createProject();
    const run = await runner.create({
      userId,
      resumeProjectId,
      serviceKind: "diagnosis",
      inputSnapshot: {
        facts: [
          {
            id: "F1",
            text: "负责用户运营",
            status: "confirmed",
            boundary: "负责",
            bodyEligible: true,
          },
        ],
      },
      idempotencyKey: `run:${randomUUID()}`,
    });

    expect(run.state).toBe("reserved");
    expect(await ledger.getBalance(userId)).toEqual({
      available: 45,
      reserved: 5,
    });
  });

  it("settles only after valid audited output", async () => {
    const { userId, resumeProjectId } = await createProject();
    const run = await runner.create({
      userId,
      resumeProjectId,
      serviceKind: "diagnosis",
      inputSnapshot: { facts: [] },
      idempotencyKey: `run:${randomUUID()}`,
    });

    const result = await processServiceRun(run.id, {
      database: db,
      ledger,
      model,
      loader: new SkillLoader(),
    });

    expect(result.state).toBe("succeeded");
    expect(await ledger.getBalance(userId)).toEqual({
      available: 45,
      reserved: 0,
    });
  });

  it("releases points after audit failure", async () => {
    const { userId, resumeProjectId } = await createProject();
    model.nextResult = {
      task: "通用诊断",
      completeness: "完整",
      summary: "测试结果",
      facts: [
        {
          id: "F1",
          text: "协同产品团队上线权益页",
          status: "confirmed",
          boundary: "协同",
          bodyEligible: true,
        },
      ],
      risks: [],
      questions: [],
      sentences: [{ text: "主导会员体系建设", factIds: ["F1"] }],
    };
    const run = await runner.create({
      userId,
      resumeProjectId,
      serviceKind: "diagnosis",
      inputSnapshot: { facts: [] },
      idempotencyKey: `run:${randomUUID()}`,
    });

    const result = await processServiceRun(run.id, {
      database: db,
      ledger,
      model,
      loader: new SkillLoader(),
    });

    expect(result.state).toBe("failed");
    expect(result.errorCode).toBe("SOURCE_AUDIT_FAILED");
    expect(await ledger.getBalance(userId)).toEqual({
      available: 50,
      reserved: 0,
    });
  });
});
