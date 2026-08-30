import {
  boolean,
  date,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email"),
    phone: text("phone"),
    isAnonymous: boolean("is_anonymous").default(false).notNull(),
    anonymousExpiresAt: timestamp("anonymous_expires_at", { withTimezone: true }),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    phoneVerifiedAt: timestamp("phone_verified_at", { withTimezone: true }),
    welcomePointsGrantedAt: timestamp("welcome_points_granted_at", {
      withTimezone: true,
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("users_email_unique").on(table.email),
    uniqueIndex("users_phone_unique").on(table.phone),
  ],
);

export const emailOtps = pgTable("email_otps", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull(),
  codeHash: text("code_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const phoneOtps = pgTable("phone_otps", {
  id: uuid("id").defaultRandom().primaryKey(),
  phone: text("phone").notNull(),
  codeHash: text("code_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const guestUsage = pgTable(
  "guest_usage",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    scopeKey: text("scope_key").notNull(),
    usageDay: date("usage_day").notNull(),
    runCount: integer("run_count").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("guest_usage_scope_day_unique").on(
      table.scopeKey,
      table.usageDay,
    ),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("sessions_token_hash_unique").on(table.tokenHash)],
);
