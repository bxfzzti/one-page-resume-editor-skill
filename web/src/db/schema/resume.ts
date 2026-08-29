import {
  boolean,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth";

export const parseStatusEnum = pgEnum("parse_status", [
  "pending",
  "parsed",
  "failed",
]);
export const factStatusEnum = pgEnum("fact_status", [
  "confirmed",
  "pending_confirmation",
  "missing_from_source",
  "not_recommended",
]);
export const versionTypeEnum = pgEnum("version_type", [
  "base",
  "one_page",
  "jd_tailored",
  "user_saved",
]);

export const resumeProjects = pgTable("resume_projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const sourceFiles = pgTable("source_files", {
  id: uuid("id").defaultRandom().primaryKey(),
  resumeProjectId: uuid("resume_project_id")
    .notNull()
    .references(() => resumeProjects.id, { onDelete: "cascade" }),
  storageKey: text("storage_key").notNull(),
  mimeType: text("mime_type").notNull(),
  originalName: text("original_name").notNull(),
  parseStatus: parseStatusEnum("parse_status").default("pending").notNull(),
  parsedText: text("parsed_text"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const factItems = pgTable("fact_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  resumeProjectId: uuid("resume_project_id")
    .notNull()
    .references(() => resumeProjects.id, { onDelete: "cascade" }),
  sourceFileId: uuid("source_file_id").references(() => sourceFiles.id, {
    onDelete: "set null",
  }),
  sourceExcerpt: text("source_excerpt").notNull(),
  sourceLocation: text("source_location").notNull(),
  factType: text("fact_type").notNull(),
  status: factStatusEnum("status").notNull(),
  contributionBoundary: text("contribution_boundary"),
  dataScope: jsonb("data_scope"),
  handling: text("handling").notNull(),
  bodyEligible: boolean("body_eligible").default(false).notNull(),
  riskText: text("risk_text"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const jobDescriptions = pgTable("job_descriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  resumeProjectId: uuid("resume_project_id")
    .notNull()
    .references(() => resumeProjects.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const resumeVersions = pgTable("resume_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  resumeProjectId: uuid("resume_project_id")
    .notNull()
    .references(() => resumeProjects.id, { onDelete: "cascade" }),
  serviceRunId: uuid("service_run_id"),
  jobDescriptionId: uuid("job_description_id").references(
    () => jobDescriptions.id,
    { onDelete: "set null" },
  ),
  baseVersionId: uuid("base_version_id"),
  versionType: versionTypeEnum("version_type").notNull(),
  title: text("title").notNull(),
  contentJson: jsonb("content_json").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
