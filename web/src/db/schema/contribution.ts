import {
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { serviceRuns } from "./billing";

export const consentStateEnum = pgEnum("consent_state", [
  "consented",
  "withdrawn",
]);
export const reviewStateEnum = pgEnum("training_review_state", [
  "pending",
  "approved",
  "rejected",
  "excluded_from_future_use",
]);

export const contributionConsents = pgTable(
  "contribution_consents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    serviceRunId: uuid("service_run_id")
      .notNull()
      .references(() => serviceRuns.id, { onDelete: "cascade" }),
    consentVersion: text("consent_version").notNull(),
    state: consentStateEnum("state").default("consented").notNull(),
    consentedAt: timestamp("consented_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    withdrawnAt: timestamp("withdrawn_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("contribution_consents_run_unique").on(table.serviceRunId),
  ],
);

export const trainingSamples = pgTable("training_samples", {
  id: uuid("id").defaultRandom().primaryKey(),
  consentId: uuid("consent_id")
    .notNull()
    .references(() => contributionConsents.id, { onDelete: "cascade" }),
  serviceRunId: uuid("service_run_id")
    .notNull()
    .references(() => serviceRuns.id, { onDelete: "cascade" }),
  sampleJson: jsonb("sample_json").notNull(),
  deidentificationVersion: text("deidentification_version").notNull(),
  reviewState: reviewStateEnum("review_state").default("pending").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
});

export const auditEvents = pgTable("audit_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: uuid("target_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
