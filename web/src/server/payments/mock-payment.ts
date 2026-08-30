import { and, eq } from "drizzle-orm";
import type { ResumeDb } from "@/db/client";
import { paymentOrders } from "@/db/schema";
import { PointLedgerService } from "@/server/points/point-ledger";

const PACKS = {
  light: { amountYuan: 5, points: 50 },
  job: { amountYuan: 10, points: 110 },
  sprint: { amountYuan: 20, points: 240 },
  long: { amountYuan: 50, points: 650 },
} as const;

export type PointPack = keyof typeof PACKS;

export class MockPaymentService {
  constructor(
    private readonly database: ResumeDb,
    private readonly ledger: PointLedgerService,
  ) {}

  async createOrder(input: {
    userId: string;
    amountYuan: number;
    idempotencyKey: string;
    pack?: PointPack;
  }) {
    const [existing] = await this.database
      .select()
      .from(paymentOrders)
      .where(eq(paymentOrders.idempotencyKey, input.idempotencyKey))
      .limit(1);
    if (existing) return existing;
    if (!Number.isInteger(input.amountYuan) || input.amountYuan < 1 || input.amountYuan > 99) {
      throw new Error("INVALID_PAYMENT_AMOUNT");
    }

    const pack = input.pack ? PACKS[input.pack] : undefined;
    if (pack && pack.amountYuan !== input.amountYuan) {
      throw new Error("PACK_AMOUNT_MISMATCH");
    }
    const points = pack?.points ?? input.amountYuan * 10;
    const [order] = await this.database
      .insert(paymentOrders)
      .values({
        userId: input.userId,
        provider: "mock",
        amountFen: input.amountYuan * 100,
        points,
        state: "pending",
        idempotencyKey: input.idempotencyKey,
      })
      .returning();
    return order;
  }

  async completeOrder(orderId: string) {
    const [paid] = await this.database
      .update(paymentOrders)
      .set({ state: "paid", paidAt: new Date() })
      .where(
        and(eq(paymentOrders.id, orderId), eq(paymentOrders.state, "pending")),
      )
      .returning();
    if (!paid) {
      const [existing] = await this.database
        .select()
        .from(paymentOrders)
        .where(eq(paymentOrders.id, orderId))
        .limit(1);
      if (!existing) throw new Error("PAYMENT_ORDER_NOT_FOUND");
      return existing;
    }
    await this.ledger.grantPurchase({
      userId: paid.userId,
      paymentOrderId: paid.id,
      points: paid.points,
    });
    return paid;
  }
}
