CREATE TABLE "job_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"job_type" varchar(50) NOT NULL,
	"entity_type" varchar(50),
	"entity_id" uuid,
	"channel" varchar(30) DEFAULT 'whatsapp' NOT NULL,
	"recipient" varchar(100),
	"status" varchar(20) DEFAULT 'sent' NOT NULL,
	"message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "reminders_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "cheque_reminder_days" jsonb DEFAULT '[3,7]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "contract_reminder_days" jsonb DEFAULT '[7,15,30,60,90]'::jsonb NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_job_logs_tenant_created" ON "job_logs" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_job_logs_type" ON "job_logs" USING btree ("job_type");