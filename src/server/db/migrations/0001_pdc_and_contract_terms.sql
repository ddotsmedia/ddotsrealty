CREATE TYPE "public"."cheque_direction" AS ENUM('receivable', 'payable');--> statement-breakpoint
CREATE TYPE "public"."security_deposit_status" AS ENUM('held', 'partially_refunded', 'fully_refunded', 'forfeited');--> statement-breakpoint
ALTER TYPE "public"."cheque_status" ADD VALUE 'collected';--> statement-breakpoint
ALTER TYPE "public"."cheque_status" ADD VALUE 'in_custody';--> statement-breakpoint
ALTER TYPE "public"."cheque_status" ADD VALUE 'with_owner';--> statement-breakpoint
ALTER TYPE "public"."cheque_status" ADD VALUE 'pending_deposit';--> statement-breakpoint
ALTER TYPE "public"."cheque_status" ADD VALUE 'postponed';--> statement-breakpoint
ALTER TYPE "public"."cheque_status" ADD VALUE 'returned';--> statement-breakpoint
ALTER TYPE "public"."cheque_status" ADD VALUE 'stale';--> statement-breakpoint
CREATE TABLE "bank_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"bank_name" varchar(255) NOT NULL,
	"account_number" varchar(50),
	"iban" varchar(50),
	"swift_code" varchar(20),
	"branch" varchar(255),
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "rent_free_months" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "grace_period_days" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "security_deposit_status" "security_deposit_status" DEFAULT 'held' NOT NULL;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "deposit_deductions" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "deposit_refund_date" timestamp;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "escalation_pct" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "termination_notice_days" integer DEFAULT 90 NOT NULL;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "early_termination_penalty" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "dewa_premise_no" varchar(50);--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "auto_renew" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "cheques" ADD COLUMN "direction" "cheque_direction" DEFAULT 'receivable' NOT NULL;--> statement-breakpoint
ALTER TABLE "cheques" ADD COLUMN "bank_account_id" uuid;--> statement-breakpoint
ALTER TABLE "cheques" ADD COLUMN "custody_holder" varchar(255);--> statement-breakpoint
ALTER TABLE "cheques" ADD COLUMN "custody_date" timestamp;--> statement-breakpoint
ALTER TABLE "cheques" ADD COLUMN "original_due_date" timestamp;--> statement-breakpoint
ALTER TABLE "cheques" ADD COLUMN "postponed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "cheques" ADD COLUMN "penalty_amount" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "cheques" ADD COLUMN "receipt_number" varchar(50);--> statement-breakpoint
ALTER TABLE "cheques" ADD COLUMN "stale_date" timestamp;