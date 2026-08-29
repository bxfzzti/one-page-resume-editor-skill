import { and, eq, inArray, sql as drizzleSql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { db } from "@/db/client";
import * as schema from "@/db/schema";
import { pointLedger, users } from "@/db/schema";

type ResumeDb = PostgresJsDatabase<typeof schema>;
type LedgerRow = typeof pointLedger.$inferSelect;
type PointBucket = LedgerRow["bucket"];

export type PointBalance = {
  available: number;
  reserved: number;
};

export type ReserveInput = {
  userId: string;
  serviceRunId: string;
  points: number;
  idempotencyKey: string;
};

export type LedgerMutationInput = {
  userId: string;
  serviceRunId: string;
  idempotencyKey: string;
};

type BucketBalance = Record<PointBucket, PointBalance>;

function emptyBucketBalance(): BucketBalance {
  return {
    gift: { available: 0, reserved: 0 },
    purchased: { available: 0, reserved: 0 },
  };
}

function aggregateRows(rows: LedgerRow[]): BucketBalance {
  const balance = emptyBucketBalance();

  for (const row of rows) {
    const bucket = balance[row.bucket];
    switch (row.entryType) {
      case "welcome_grant":
      case "purchase_grant":
      case "contribution_grant":
      case "refund":
        bucket.available += row.amount;
        break;
      case "reserve":
        bucket.available += row.amount;
        bucket.reserved -= row.amount;
        break;
      case "settle":
        bucket.reserved -= row.amount;
        break;
      case "release":
        bucket.available += row.amount;
        bucket.reserved -= row.amount;
        break;
    }
  }

  return balance;
}

function totalBalance(bucketBalance: BucketBalance): PointBalance {
  return {
    available:
      bucketBalance.gift.available + bucketBalance.purchased.available,
    reserved: bucketBalance.gift.reserved + bucketBalance.purchased.reserved,
  };
}

export class PointLedgerService {
  constructor(private readonly database: ResumeDb = db) {}

  async getBalance(userId: string): Promise<PointBalance> {
    const rows = await this.database
      .select()
      .from(pointLedger)
      .where(eq(pointLedger.userId, userId));
    return totalBalance(aggregateRows(rows));
  }

  async grantWelcome(userId: string): Promise<void> {
    await this.database.transaction(async (tx) => {
      await tx.execute(
        drizzleSql`select pg_advisory_xact_lock(hashtext(${userId}))`,
      );
      const inserted = await tx
        .insert(pointLedger)
        .values({
          userId,
          entryType: "welcome_grant",
          bucket: "gift",
          amount: 50,
          idempotencyKey: `welcome:${userId}`,
        })
        .onConflictDoNothing({ target: pointLedger.idempotencyKey })
        .returning({ id: pointLedger.id });

      if (inserted.length > 0) {
        await tx
          .update(users)
          .set({ welcomePointsGrantedAt: new Date() })
          .where(eq(users.id, userId));
      }
    });
  }

  async grantContributionReward(input: {
    userId: string;
    consentId: string;
    points?: number;
  }): Promise<void> {
    const points = input.points ?? 10;
    if (!Number.isInteger(points) || points <= 0) {
      throw new Error("INVALID_POINT_AMOUNT");
    }

    await this.database.transaction(async (tx) => {
      await tx.execute(
        drizzleSql`select pg_advisory_xact_lock(hashtext(${input.userId}))`,
      );
      await tx
        .insert(pointLedger)
        .values({
          userId: input.userId,
          entryType: "contribution_grant",
          bucket: "gift",
          amount: points,
          idempotencyKey: `contribution:${input.consentId}`,
        })
        .onConflictDoNothing({ target: pointLedger.idempotencyKey });
    });
  }

  async grantPurchase(input: {
    userId: string;
    paymentOrderId: string;
    points: number;
  }): Promise<void> {
    if (!Number.isInteger(input.points) || input.points <= 0) {
      throw new Error("INVALID_POINT_AMOUNT");
    }

    await this.database.transaction(async (tx) => {
      await tx.execute(
        drizzleSql`select pg_advisory_xact_lock(hashtext(${input.userId}))`,
      );
      await tx
        .insert(pointLedger)
        .values({
          userId: input.userId,
          paymentOrderId: input.paymentOrderId,
          entryType: "purchase_grant",
          bucket: "purchased",
          amount: input.points,
          idempotencyKey: `purchase:${input.paymentOrderId}`,
        })
        .onConflictDoNothing({ target: pointLedger.idempotencyKey });
    });
  }

  async reserve(input: ReserveInput): Promise<void> {
    if (!Number.isInteger(input.points) || input.points <= 0) {
      throw new Error("INVALID_POINT_AMOUNT");
    }

    await this.database.transaction(async (tx) => {
      await tx.execute(
        drizzleSql`select pg_advisory_xact_lock(hashtext(${input.userId}))`,
      );

      const existing = await tx
        .select({ id: pointLedger.id })
        .from(pointLedger)
        .where(
          and(
            eq(pointLedger.userId, input.userId),
            eq(pointLedger.serviceRunId, input.serviceRunId),
            eq(pointLedger.entryType, "reserve"),
          ),
        );
      if (existing.length > 0) return;

      const rows = await tx
        .select()
        .from(pointLedger)
        .where(eq(pointLedger.userId, input.userId));
      const balance = aggregateRows(rows);
      const available = totalBalance(balance).available;
      if (available < input.points) {
        throw new Error("INSUFFICIENT_POINTS");
      }

      const giftPoints = Math.min(input.points, balance.gift.available);
      const purchasedPoints = input.points - giftPoints;
      const entries: Array<typeof pointLedger.$inferInsert> = [];

      if (giftPoints > 0) {
        entries.push({
          userId: input.userId,
          serviceRunId: input.serviceRunId,
          entryType: "reserve",
          bucket: "gift",
          amount: -giftPoints,
          idempotencyKey: `${input.idempotencyKey}:gift`,
        });
      }
      if (purchasedPoints > 0) {
        entries.push({
          userId: input.userId,
          serviceRunId: input.serviceRunId,
          entryType: "reserve",
          bucket: "purchased",
          amount: -purchasedPoints,
          idempotencyKey: `${input.idempotencyKey}:purchased`,
        });
      }

      await tx.insert(pointLedger).values(entries);
    });
  }

  async settle(input: LedgerMutationInput): Promise<void> {
    await this.finalizeReservation("settle", input);
  }

  async release(input: LedgerMutationInput): Promise<void> {
    await this.finalizeReservation("release", input);
  }

  private async finalizeReservation(
    action: "settle" | "release",
    input: LedgerMutationInput,
  ): Promise<void> {
    await this.database.transaction(async (tx) => {
      await tx.execute(
        drizzleSql`select pg_advisory_xact_lock(hashtext(${input.userId}))`,
      );

      const terminal = await tx
        .select({ entryType: pointLedger.entryType })
        .from(pointLedger)
        .where(
          and(
            eq(pointLedger.userId, input.userId),
            eq(pointLedger.serviceRunId, input.serviceRunId),
            inArray(pointLedger.entryType, ["settle", "release"]),
          ),
        );
      if (terminal.length > 0) {
        if (terminal.every((row) => row.entryType === action)) return;
        throw new Error("RESERVATION_ALREADY_FINALIZED");
      }

      const reservations = await tx
        .select()
        .from(pointLedger)
        .where(
          and(
            eq(pointLedger.userId, input.userId),
            eq(pointLedger.serviceRunId, input.serviceRunId),
            eq(pointLedger.entryType, "reserve"),
          ),
        );
      if (reservations.length === 0) {
        throw new Error("RESERVATION_NOT_FOUND");
      }

      await tx.insert(pointLedger).values(
        reservations.map((reservation) => ({
          userId: input.userId,
          serviceRunId: input.serviceRunId,
          entryType: action,
          bucket: reservation.bucket,
          amount: -reservation.amount,
          idempotencyKey: `${input.idempotencyKey}:${reservation.bucket}`,
        })),
      );
    });
  }
}
