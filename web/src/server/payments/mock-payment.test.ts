import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db/client";
import { paymentOrders, pointLedger, users } from "@/db/schema";
import { PointLedgerService } from "@/server/points/point-ledger";
import { MockPaymentService } from "./mock-payment";

const ledger = new PointLedgerService(db);
const payments = new MockPaymentService(db, ledger);

describe("MockPaymentService", () => {
  beforeEach(async () => {
    await db.delete(pointLedger);
    await db.delete(paymentOrders);
    await db.delete(users);
  });

  it("creates a custom 1:10 test order and credits once", async () => {
    const [user] = await db
      .insert(users)
      .values({ email: `${randomUUID()}@example.com` })
      .returning();
    const order = await payments.createOrder({
      userId: user.id,
      amountYuan: 1,
      idempotencyKey: `payment:${randomUUID()}`,
    });

    await payments.completeOrder(order.id);
    await payments.completeOrder(order.id);

    expect(await ledger.getBalance(user.id)).toEqual({
      available: 10,
      reserved: 0,
    });
  });

  it("applies the published pack amounts", async () => {
    const [user] = await db
      .insert(users)
      .values({ email: `${randomUUID()}@example.com` })
      .returning();
    const order = await payments.createOrder({
      userId: user.id,
      amountYuan: 20,
      idempotencyKey: `payment:${randomUUID()}`,
      pack: "sprint",
    });

    expect(order.points).toBe(240);
    expect(order.amountFen).toBe(2_000);
  });
});
