CREATE TABLE "feedback_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_run_id" uuid NOT NULL,
	"service_kind" text NOT NULL,
	"run_state" text NOT NULL,
	"error_code" text,
	"category" text NOT NULL,
	"helpful" boolean NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "feedback_submissions_run_unique" ON "feedback_submissions" USING btree ("service_run_id");