import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db/client";
import { and, eq } from "drizzle-orm";
import {
  paymentOrders,
  pointLedger,
  resumeProjects,
  serviceRuns,
  users,
} from "@/db/schema";
import { PointLedgerService } from "./point-ledger";

const ledger = new PointLedgerService(db);

async function createRunFixture() {
  const [user] = await db
    .insert(users)
    .values({ email: `${randomUUID()}@example.com` })
    .returning();
  const [project] = await db
    .insert(resumeProjects)
    .values({ userId: user.id, title: "测试简历" })
    .returning();
  const [run] = await db
    .insert(serviceRuns)
    .values({
      userId: user.id,
      resumeProjectId: project.id,
      serviceKind: "jd_tailoring",
      quotedPoints: 12,
      idempotencyKey: `run:${randomUUID()}`,
      inputSnapshot: {},
    })
    .returning();

  return { userId: user.id, serviceRunId: run.id };
}

describe("PointLedgerService", () => {
  beforeEach(async () => {
    await db.delete(pointLedger);
    await db.delete(serviceRuns);
    await db.delete(paymentOrders);
    await db.delete(resumeProjects);
    await db.delete(users);
  });

  it("grants welcome points once", async () => {
    const { userId } = await createRunFixture();

    await ledger.grantWelcome(userId);
    await ledger.grantWelcome(userId);

    expect(await ledger.getBalance(userId)).toEqual({
      available: 50,
      reserved: 0,
    });
  });

  it("does not double reserve the same run", async () => {
    const { userId, serviceRunId } = await createRunFixture();
    await ledger.grantWelcome(userId);

    await ledger.reserve({
      userId,
      serviceRunId,
      points: 12,
      idempotencyKey: `reserve:${serviceRunId}`,
    });
    await ledger.reserve({
      userId,
      serviceRunId,
      points: 12,
      idempotencyKey: `reserve:${serviceRunId}`,
    });

    expect(await ledger.getBalance(userId)).toEqual({
      available: 38,
      reserved: 12,
    });
  });

  it("settles reserved points without charging again", async () => {
    const { userId, serviceRunId } = await createRunFixture();
    await ledger.grantWelcome(userId);
    await ledger.reserve({
      userId,
      serviceRunId,
      points: 12,
      idempotencyKey: `reserve:${serviceRunId}`,
    });

    await ledger.settle({
      userId,
      serviceRunId,
      idempotencyKey: `settle:${serviceRunId}`,
    });
    await ledger.settle({
      userId,
      serviceRunId,
      idempotencyKey: `settle:${serviceRunId}`,
    });

    expect(await ledger.getBalance(userId)).toEqual({
      available: 38,
      reserved: 0,
    });
  });

  it("releases reserved points after failure", async () => {
    const { userId, serviceRunId } = await createRunFixture();
    await ledger.grantWelcome(userId);
    await ledger.reserve({
      userId,
      serviceRunId,
      points: 12,
      idempotencyKey: `reserve:${serviceRunId}`,
    });

    await ledger.release({
      userId,
      serviceRunId,
      idempotencyKey: `release:${serviceRunId}`,
    });
    await ledger.release({
      userId,
      serviceRunId,
      idempotencyKey: `release:${serviceRunId}`,
    });

    expect(await ledger.getBalance(userId)).toEqual({
      available: 50,
      reserved: 0,
    });
  });

  it("rejects a reservation larger than the available balance", async () => {
    const { userId, serviceRunId } = await createRunFixture();
    await ledger.grantWelcome(userId);

    await expect(
      ledger.reserve({
        userId,
        serviceRunId,
        points: 51,
        idempotencyKey: `reserve:${serviceRunId}`,
      }),
    ).rejects.toThrow("INSUFFICIENT_POINTS");
  });

  it("spends gift points before purchased points", async () => {
    const { userId, serviceRunId } = await createRunFixture();
    await ledger.grantWelcome(userId);
    const [order] = await db
      .insert(paymentOrders)
      .values({
        userId,
        provider: "mock",
        amountFen: 1_000,
        points: 100,
        state: "paid",
        idempotencyKey: `payment:${randomUUID()}`,
      })
      .returning();
    await ledger.grantPurchase({ userId, paymentOrderId: order.id, points: 100 });

    await ledger.reserve({
      userId,
      serviceRunId,
      points: 60,
      idempotencyKey: `reserve:${serviceRunId}`,
    });

    const reservations = await db
      .select({ bucket: pointLedger.bucket, amount: pointLedger.amount })
      .from(pointLedger)
      .where(
        and(
          eq(pointLedger.serviceRunId, serviceRunId),
          eq(pointLedger.entryType, "reserve"),
        ),
      );
    expect(reservations).toEqual(
      expect.arrayContaining([
        { bucket: "gift", amount: -50 },
        { bucket: "purchased", amount: -10 },
      ]),
    );
    expect(await ledger.getBalance(userId)).toEqual({
      available: 90,
      reserved: 60,
    });
  });
});
