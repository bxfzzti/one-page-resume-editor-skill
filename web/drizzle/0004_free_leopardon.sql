CREATE TABLE "guest_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scope_key" text NOT NULL,
	"usage_day" date NOT NULL,
	"run_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_anonymous" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "anonymous_expires_at" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "guest_usage_scope_day_unique" ON "guest_usage" USING btree ("scope_key","usage_day");