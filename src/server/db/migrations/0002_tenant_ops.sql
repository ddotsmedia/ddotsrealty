CREATE TYPE "public"."announcement_target" AS ENUM('all', 'building', 'community', 'specific_tenants');--> statement-breakpoint
CREATE TYPE "public"."clearance_status" AS ENUM('in_progress', 'pending_payment', 'pending_inspection', 'pending_dewa', 'pending_ejari', 'completed');--> statement-breakpoint
CREATE TYPE "public"."communication_channel" AS ENUM('whatsapp', 'email', 'phone', 'sms', 'portal', 'in_person');--> statement-breakpoint
CREATE TYPE "public"."communication_direction" AS ENUM('inbound', 'outbound');--> statement-breakpoint
CREATE TYPE "public"."communication_entity_type" AS ENUM('property_tenant', 'owner', 'lead', 'staff');--> statement-breakpoint
CREATE TYPE "public"."communication_status" AS ENUM('sent', 'delivered', 'read', 'failed');--> statement-breakpoint
CREATE TYPE "public"."deposit_refund_method" AS ENUM('cheque', 'bank_transfer', 'cash');--> statement-breakpoint
CREATE TYPE "public"."inspection_condition" AS ENUM('excellent', 'good', 'fair', 'poor');--> statement-breakpoint
CREATE TYPE "public"."inspection_item_condition" AS ENUM('new', 'good', 'fair', 'damaged', 'missing');--> statement-breakpoint
CREATE TYPE "public"."inspection_room" AS ENUM('living_room', 'bedroom_master', 'bedroom_2', 'bedroom_3', 'kitchen', 'bathroom_master', 'bathroom_2', 'bathroom_3', 'balcony', 'entrance', 'store', 'laundry', 'garage', 'garden', 'common_area', 'other');--> statement-breakpoint
CREATE TYPE "public"."inspection_type" AS ENUM('move_in', 'move_out', 'periodic', 'complaint');--> statement-breakpoint
CREATE TYPE "public"."key_handover_type" AS ENUM('handover', 'return');--> statement-breakpoint
CREATE TYPE "public"."noc_status" AS ENUM('requested', 'under_review', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."noc_type" AS ENUM('subletting', 'renovation', 'pet', 'satellite_dish', 'business_activity', 'visa_sponsorship', 'parking', 'move_in', 'move_out', 'other');--> statement-breakpoint
CREATE TYPE "public"."occupant_relationship" AS ENUM('spouse', 'child', 'parent', 'sibling', 'domestic_help', 'other');--> statement-breakpoint
CREATE TYPE "public"."parking_type" AS ENUM('covered', 'uncovered', 'basement', 'valet');--> statement-breakpoint
CREATE TYPE "public"."salary_range" AS ENUM('below_5k', '5k_10k', '10k_20k', '20k_50k', 'above_50k');--> statement-breakpoint
CREATE TYPE "public"."screening_status" AS ENUM('pending', 'approved', 'rejected', 'waived');--> statement-breakpoint
CREATE TYPE "public"."settlement_status" AS ENUM('pending', 'partial', 'settled');--> statement-breakpoint
CREATE TYPE "public"."utility_status" AS ENUM('pending_activation', 'active', 'pending_deactivation', 'deactivated', 'clearance_pending', 'cleared');--> statement-breakpoint
CREATE TYPE "public"."utility_type" AS ENUM('dewa', 'aadc', 'sewa', 'fewa', 'internet', 'gas', 'chiller');--> statement-breakpoint
CREATE TYPE "public"."visa_status" AS ENUM('valid', 'expired', 'in_process', 'cancelled');--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text,
	"target_type" "announcement_target" DEFAULT 'all' NOT NULL,
	"target_ids" jsonb DEFAULT '[]'::jsonb,
	"sent_via" jsonb DEFAULT '[]'::jsonb,
	"published_at" timestamp,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "communications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"entity_type" "communication_entity_type" DEFAULT 'property_tenant' NOT NULL,
	"entity_id" uuid,
	"channel" "communication_channel" DEFAULT 'whatsapp' NOT NULL,
	"direction" "communication_direction" DEFAULT 'outbound' NOT NULL,
	"subject" varchar(255),
	"content" text,
	"sent_by" uuid,
	"status" "communication_status" DEFAULT 'sent' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contract_occupants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"contract_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"emirates_id" text,
	"relationship" "occupant_relationship" DEFAULT 'other' NOT NULL,
	"nationality" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inspection_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"inspection_id" uuid NOT NULL,
	"room" "inspection_room" DEFAULT 'other' NOT NULL,
	"item" varchar(255) NOT NULL,
	"condition" "inspection_item_condition" DEFAULT 'good' NOT NULL,
	"notes" text,
	"photos" jsonb DEFAULT '[]'::jsonb,
	"deduction_amount" numeric(10, 2),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inspections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"contract_id" uuid,
	"property_id" uuid NOT NULL,
	"property_tenant_id" uuid,
	"type" "inspection_type" DEFAULT 'move_in' NOT NULL,
	"inspection_date" timestamp,
	"inspector_name" varchar(255),
	"inspector_role" varchar(100),
	"overall_condition" "inspection_condition",
	"notes" text,
	"tenant_signed" boolean DEFAULT false NOT NULL,
	"tenant_signed_at" timestamp,
	"report_pdf_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "key_handovers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"contract_id" uuid,
	"property_id" uuid NOT NULL,
	"property_tenant_id" uuid,
	"type" "key_handover_type" DEFAULT 'handover' NOT NULL,
	"handover_date" timestamp,
	"keys" jsonb DEFAULT '[]'::jsonb,
	"received_by" varchar(255),
	"handed_by" varchar(255),
	"receipt_signed" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "noc_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"property_tenant_id" uuid,
	"contract_id" uuid,
	"noc_type" "noc_type" DEFAULT 'other' NOT NULL,
	"description" text,
	"status" "noc_status" DEFAULT 'requested' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp,
	"rejection_reason" text,
	"noc_document_url" text,
	"valid_until" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parking_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"slot_number" varchar(50),
	"floor_level" varchar(50),
	"type" "parking_type" DEFAULT 'covered' NOT NULL,
	"assigned_to" uuid,
	"contract_id" uuid,
	"vehicle_plate" varchar(50),
	"vehicle_make" varchar(100),
	"is_available" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_clearances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"contract_id" uuid,
	"property_id" uuid,
	"property_tenant_id" uuid,
	"notice_date" timestamp,
	"notice_period_days" integer,
	"planned_move_out" timestamp,
	"actual_move_out" timestamp,
	"move_out_inspection_id" uuid,
	"damage_deductions" numeric(10, 2),
	"outstanding_rent" numeric(10, 2) DEFAULT '0' NOT NULL,
	"outstanding_utility" numeric(10, 2) DEFAULT '0' NOT NULL,
	"outstanding_maintenance" numeric(10, 2) DEFAULT '0' NOT NULL,
	"penalty_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_outstanding" numeric(12, 2) DEFAULT '0' NOT NULL,
	"settlement_status" "settlement_status" DEFAULT 'pending' NOT NULL,
	"deposit_amount" numeric(12, 2),
	"deposit_deductions" numeric(10, 2) DEFAULT '0' NOT NULL,
	"deposit_refund_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"deposit_refund_method" "deposit_refund_method",
	"deposit_refund_date" timestamp,
	"deposit_refund_ref" varchar(100),
	"cheques_returned" boolean DEFAULT false NOT NULL,
	"cheques_returned_date" timestamp,
	"cheques_return_receipt_url" text,
	"dewa_cleared" boolean DEFAULT false NOT NULL,
	"dewa_clearance_date" timestamp,
	"dewa_clearance_cert_url" text,
	"ejari_cancelled" boolean DEFAULT false NOT NULL,
	"ejari_cancel_date" timestamp,
	"keys_returned" boolean DEFAULT false NOT NULL,
	"keys_returned_date" timestamp,
	"clearance_status" "clearance_status" DEFAULT 'in_progress' NOT NULL,
	"clearance_cert_url" text,
	"cleared_by" uuid,
	"cleared_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "utility_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"contract_id" uuid,
	"property_id" uuid NOT NULL,
	"property_tenant_id" uuid,
	"utility_type" "utility_type" DEFAULT 'dewa' NOT NULL,
	"account_number" varchar(100),
	"premise_number" varchar(100),
	"status" "utility_status" DEFAULT 'pending_activation' NOT NULL,
	"activation_date" timestamp,
	"deactivation_date" timestamp,
	"security_deposit" numeric(10, 2),
	"deposit_refunded" boolean DEFAULT false NOT NULL,
	"clearance_cert_url" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "property_tenants" ADD COLUMN "photo_url" text;--> statement-breakpoint
ALTER TABLE "property_tenants" ADD COLUMN "visa_status" "visa_status";--> statement-breakpoint
ALTER TABLE "property_tenants" ADD COLUMN "visa_expiry" timestamp;--> statement-breakpoint
ALTER TABLE "property_tenants" ADD COLUMN "visa_uid" varchar(50);--> statement-breakpoint
ALTER TABLE "property_tenants" ADD COLUMN "salary_range" "salary_range";--> statement-breakpoint
ALTER TABLE "property_tenants" ADD COLUMN "employer_name" varchar(255);--> statement-breakpoint
ALTER TABLE "property_tenants" ADD COLUMN "employer_phone" varchar(30);--> statement-breakpoint
ALTER TABLE "property_tenants" ADD COLUMN "previous_address" text;--> statement-breakpoint
ALTER TABLE "property_tenants" ADD COLUMN "previous_landlord" varchar(255);--> statement-breakpoint
ALTER TABLE "property_tenants" ADD COLUMN "previous_landlord_phone" varchar(30);--> statement-breakpoint
ALTER TABLE "property_tenants" ADD COLUMN "blacklisted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "property_tenants" ADD COLUMN "blacklist_reason" text;--> statement-breakpoint
ALTER TABLE "property_tenants" ADD COLUMN "screening_status" "screening_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "property_tenants" ADD COLUMN "screening_date" timestamp;--> statement-breakpoint
ALTER TABLE "property_tenants" ADD COLUMN "screening_notes" text;--> statement-breakpoint
ALTER TABLE "property_tenants" ADD COLUMN "portal_login_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "property_tenants" ADD COLUMN "portal_password_hash" text;--> statement-breakpoint
ALTER TABLE "property_tenants" ADD COLUMN "portal_last_login" timestamp;