import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { resumeProjects } from "./resume";

export const serviceRunStateEnum = pgEnum("service_run_state", [
  "quoted",
  "reserved",
  "running",
  "succeeded",
  "failed",
  "cancelled",
]);
export const ledgerEntryTypeEnum = pgEnum("ledger_entry_type", [
  "welcome_grant",
  "purchase_grant",
  "contribution_grant",
  "reserve",
  "settle",
  "release",
  "refund",
]);
export const pointBucketEnum = pgEnum("point_bucket", ["gift", "purchased"]);
export const paymentStateEnum = pgEnum("payment_state", [
  "pending",
  "paid",
  "failed",
  "cancelled",
  "refunded",
]);

export const serviceRuns = pgTable(
  "service_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    resumeProjectId: uuid("resume_project_id")
      .notNull()
      .references(() => resumeProjects.id, { onDelete: "cascade" }),
    serviceKind: text("service_kind").notNull(),
    state: serviceRunStateEnum("state").default("quoted").notNull(),
    quotedPoints: integer("quoted_points").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    inputSnapshot: jsonb("input_snapshot").notNull(),
    outputSnapshot: jsonb("output_snapshot"),
    errorCode: text("error_code"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("service_runs_idempotency_key_unique").on(
      table.idempotencyKey,
    ),
  ],
);

export const paymentOrders = pgTable(
  "payment_orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    provider: text("provider").notNull(),
    amountFen: integer("amount_fen").notNull(),
    points: integer("points").notNull(),
    state: paymentStateEnum("state").default("pending").notNull(),
    providerOrderId: text("provider_order_id"),
    idempotencyKey: text("idempotency_key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("payment_orders_idempotency_key_unique").on(
      table.idempotencyKey,
    ),
  ],
);

export const pointLedger = pgTable(
  "point_ledger",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    serviceRunId: uuid("service_run_id").references(() => serviceRuns.id, {
      onDelete: "set null",
    }),
    paymentOrderId: uuid("payment_order_id").references(
      () => paymentOrders.id,
      { onDelete: "set null" },
    ),
    entryType: ledgerEntryTypeEnum("entry_type").notNull(),
    bucket: pointBucketEnum("bucket").notNull(),
    amount: integer("amount").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("point_ledger_idempotency_key_unique").on(
      table.idempotencyKey,
    ),
  ],
);
