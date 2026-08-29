CREATE TYPE "public"."ledger_entry_type" AS ENUM('welcome_grant', 'purchase_grant', 'contribution_grant', 'reserve', 'settle', 'release', 'refund');--> statement-breakpoint
CREATE TYPE "public"."payment_state" AS ENUM('pending', 'paid', 'failed', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."point_bucket" AS ENUM('gift', 'purchased');--> statement-breakpoint
CREATE TYPE "public"."service_run_state" AS ENUM('quoted', 'reserved', 'running', 'succeeded', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."consent_state" AS ENUM('consented', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."training_review_state" AS ENUM('pending', 'approved', 'rejected', 'excluded_from_future_use');--> statement-breakpoint
CREATE TYPE "public"."fact_status" AS ENUM('confirmed', 'pending_confirmation', 'missing_from_source', 'not_recommended');--> statement-breakpoint
CREATE TYPE "public"."parse_status" AS ENUM('pending', 'parsed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."version_type" AS ENUM('base', 'one_page', 'jd_tailored', 'user_saved');--> statement-breakpoint
CREATE TABLE "email_otps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"code_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"email_verified_at" timestamp with time zone,
	"welcome_points_granted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "payment_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"amount_fen" integer NOT NULL,
	"points" integer NOT NULL,
	"state" "payment_state" DEFAULT 'pending' NOT NULL,
	"provider_order_id" text,
	"idempotency_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"paid_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "point_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"service_run_id" uuid,
	"payment_order_id" uuid,
	"entry_type" "ledger_entry_type" NOT NULL,
	"bucket" "point_bucket" NOT NULL,
	"amount" integer NOT NULL,
	"idempotency_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"resume_project_id" uuid NOT NULL,
	"service_kind" text NOT NULL,
	"state" "service_run_state" DEFAULT 'quoted' NOT NULL,
	"quoted_points" integer NOT NULL,
	"idempotency_key" text NOT NULL,
	"input_snapshot" jsonb NOT NULL,
	"output_snapshot" jsonb,
	"error_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contribution_consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"service_run_id" uuid NOT NULL,
	"consent_version" text NOT NULL,
	"state" "consent_state" DEFAULT 'consented' NOT NULL,
	"consented_at" timestamp with time zone DEFAULT now() NOT NULL,
	"withdrawn_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "training_samples" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"consent_id" uuid NOT NULL,
	"service_run_id" uuid NOT NULL,
	"sample_json" jsonb NOT NULL,
	"deidentification_version" text NOT NULL,
	"review_state" "training_review_state" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"approved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "fact_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resume_project_id" uuid NOT NULL,
	"source_file_id" uuid,
	"source_excerpt" text NOT NULL,
	"source_location" text NOT NULL,
	"fact_type" text NOT NULL,
	"status" "fact_status" NOT NULL,
	"contribution_boundary" text,
	"data_scope" jsonb,
	"handling" text NOT NULL,
	"body_eligible" boolean DEFAULT false NOT NULL,
	"risk_text" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_descriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resume_project_id" uuid NOT NULL,
	"label" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resume_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "resume_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resume_project_id" uuid NOT NULL,
	"service_run_id" uuid,
	"job_description_id" uuid,
	"base_version_id" uuid,
	"version_type" "version_type" NOT NULL,
	"title" text NOT NULL,
	"content_json" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resume_project_id" uuid NOT NULL,
	"storage_key" text NOT NULL,
	"mime_type" text NOT NULL,
	"original_name" text NOT NULL,
	"parse_status" "parse_status" DEFAULT 'pending' NOT NULL,
	"parsed_text" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "point_ledger" ADD CONSTRAINT "point_ledger_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "point_ledger" ADD CONSTRAINT "point_ledger_service_run_id_service_runs_id_fk" FOREIGN KEY ("service_run_id") REFERENCES "public"."service_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "point_ledger" ADD CONSTRAINT "point_ledger_payment_order_id_payment_orders_id_fk" FOREIGN KEY ("payment_order_id") REFERENCES "public"."payment_orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_runs" ADD CONSTRAINT "service_runs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_runs" ADD CONSTRAINT "service_runs_resume_project_id_resume_projects_id_fk" FOREIGN KEY ("resume_project_id") REFERENCES "public"."resume_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contribution_consents" ADD CONSTRAINT "contribution_consents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contribution_consents" ADD CONSTRAINT "contribution_consents_service_run_id_service_runs_id_fk" FOREIGN KEY ("service_run_id") REFERENCES "public"."service_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_samples" ADD CONSTRAINT "training_samples_consent_id_contribution_consents_id_fk" FOREIGN KEY ("consent_id") REFERENCES "public"."contribution_consents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_samples" ADD CONSTRAINT "training_samples_service_run_id_service_runs_id_fk" FOREIGN KEY ("service_run_id") REFERENCES "public"."service_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fact_items" ADD CONSTRAINT "fact_items_resume_project_id_resume_projects_id_fk" FOREIGN KEY ("resume_project_id") REFERENCES "public"."resume_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fact_items" ADD CONSTRAINT "fact_items_source_file_id_source_files_id_fk" FOREIGN KEY ("source_file_id") REFERENCES "public"."source_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_descriptions" ADD CONSTRAINT "job_descriptions_resume_project_id_resume_projects_id_fk" FOREIGN KEY ("resume_project_id") REFERENCES "public"."resume_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resume_projects" ADD CONSTRAINT "resume_projects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resume_versions" ADD CONSTRAINT "resume_versions_resume_project_id_resume_projects_id_fk" FOREIGN KEY ("resume_project_id") REFERENCES "public"."resume_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resume_versions" ADD CONSTRAINT "resume_versions_job_description_id_job_descriptions_id_fk" FOREIGN KEY ("job_description_id") REFERENCES "public"."job_descriptions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_files" ADD CONSTRAINT "source_files_resume_project_id_resume_projects_id_fk" FOREIGN KEY ("resume_project_id") REFERENCES "public"."resume_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_hash_unique" ON "sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_orders_idempotency_key_unique" ON "payment_orders" USING btree ("idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "point_ledger_idempotency_key_unique" ON "point_ledger" USING btree ("idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "service_runs_idempotency_key_unique" ON "service_runs" USING btree ("idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "contribution_consents_run_unique" ON "contribution_consents" USING btree ("service_run_id");