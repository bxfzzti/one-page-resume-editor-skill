import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db/client";
import {
  feedbackSubmissions,
  paymentOrders,
  pointLedger,
  resumeProjects,
  serviceRuns,
  users,
} from "@/db/schema";
import { FeedbackService } from "./feedback-service";

const service = new FeedbackService(db);

async function createRun() {
  const [user] = await db
    .insert(users)
    .values({ isAnonymous: true, anonymousExpiresAt: new Date(Date.now() + 86_400_000) })
    .returning();
  const [project] = await db
    .insert(resumeProjects)
    .values({ userId: user.id, title: "反馈测试" })
    .returning();
  const [run] = await db
    .insert(serviceRuns)
    .values({
      userId: user.id,
      resumeProjectId: project.id,
      serviceKind: "diagnosis",
      state: "succeeded",
      quotedPoints: 5,
      idempotencyKey: `feedback:${randomUUID()}`,
      inputSnapshot: {},
      outputSnapshot: {},
    })
    .returning();
  return { user, run };
}

describe("FeedbackService", () => {
  beforeEach(async () => {
    await db.delete(feedbackSubmissions);
    await db.delete(pointLedger);
    await db.delete(paymentOrders);
    await db.delete(serviceRuns);
    await db.delete(resumeProjects);
    await db.delete(users);
  });

  it("stores only task metadata and anonymous feedback", async () => {
    const { user, run } = await createRun();
    const feedback = await service.submit({
      userId: user.id,
      serviceRunId: run.id,
      category: "result_quality",
      helpful: false,
      description: "建议把风险项解释得更具体。",
    });

    expect(feedback.serviceRunId).toBe(run.id);
    expect(feedback.serviceKind).toBe("diagnosis");
    expect(feedback.description).toBe("建议把风险项解释得更具体。");
    expect("userId" in feedback).toBe(false);
  });

  it("rejects feedback for another user's task", async () => {
    const { run } = await createRun();
    const [other] = await db
      .insert(users)
      .values({ isAnonymous: true, anonymousExpiresAt: new Date(Date.now() + 86_400_000) })
      .returning();

    await expect(
      service.submit({
        userId: other.id,
        serviceRunId: run.id,
        category: "other",
        helpful: false,
        description: "这个任务不是我的。",
      }),
    ).rejects.toThrow("SERVICE_RUN_NOT_FOUND");
  });

  it.each(["请联系 13800138000", "请发邮件到 test@example.com"])(
    "rejects contact information: %s",
    async (description) => {
      const { user, run } = await createRun();
      await expect(
        service.submit({
          userId: user.id,
          serviceRunId: run.id,
          category: "other",
          helpful: false,
          description,
        }),
      ).rejects.toThrow("CONTACT_INFORMATION_NOT_ALLOWED");
    },
  );

  it("updates the existing row when the same task is submitted again", async () => {
    const { user, run } = await createRun();
    const base = {
      userId: user.id,
      serviceRunId: run.id,
      category: "usability" as const,
      helpful: false,
    };
    await service.submit({ ...base, description: "第一次反馈。" });
    await service.submit({ ...base, description: "更新后的反馈。" });

    const rows = await db.select().from(feedbackSubmissions);
    expect(rows).toHaveLength(1);
    expect(rows[0].description).toBe("更新后的反馈。");
  });
});
