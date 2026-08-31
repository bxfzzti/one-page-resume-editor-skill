import {
  boolean,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const feedbackSubmissions = pgTable(
  "feedback_submissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    serviceRunId: uuid("service_run_id").notNull(),
    serviceKind: text("service_kind").notNull(),
    runState: text("run_state").notNull(),
    errorCode: text("error_code"),
    category: text("category").notNull(),
    helpful: boolean("helpful").notNull(),
    description: text("description").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("feedback_submissions_run_unique").on(table.serviceRunId),
  ],
);
