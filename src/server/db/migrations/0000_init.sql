CREATE TYPE "public"."cheque_status" AS ENUM('pending', 'deposited', 'cleared', 'bounced', 'replaced', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."commission_deal_type" AS ENUM('rent', 'sale');--> statement-breakpoint
CREATE TYPE "public"."commission_status" AS ENUM('pending', 'approved', 'paid');--> statement-breakpoint
CREATE TYPE "public"."contract_status" AS ENUM('active', 'expired', 'terminated', 'pending_renewal');--> statement-breakpoint
CREATE TYPE "public"."contract_type" AS ENUM('new', 'renewal');--> statement-breakpoint
CREATE TYPE "public"."doc_type" AS ENUM('trade_license', 'rera_card', 'ejari', 'tawtheeq', 'title_deed', 'passport', 'emirates_id', 'contract', 'noc', 'oqood', 'invoice', 'other');--> statement-breakpoint
CREATE TYPE "public"."document_entity_type" AS ENUM('property', 'contract', 'owner', 'tenant', 'broker', 'company', 'maintenance');--> statement-breakpoint
CREATE TYPE "public"."emirate" AS ENUM('abu_dhabi', 'dubai', 'sharjah', 'ajman', 'umm_al_quwain', 'ras_al_khaimah', 'fujairah');--> statement-breakpoint
CREATE TYPE "public"."lead_activity_type" AS ENUM('call', 'whatsapp', 'email', 'viewing', 'meeting', 'note');--> statement-breakpoint
CREATE TYPE "public"."lead_source" AS ENUM('website', 'whatsapp', 'phone', 'walk_in', 'referral', 'portal', 'social');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('new', 'contacted', 'qualified', 'viewing', 'negotiation', 'won', 'lost');--> statement-breakpoint
CREATE TYPE "public"."listing_status" AS ENUM('draft', 'active', 'paused', 'expired', 'sold', 'rented');--> statement-breakpoint
CREATE TYPE "public"."listing_type" AS ENUM('rent', 'sale');--> statement-breakpoint
CREATE TYPE "public"."maintenance_category" AS ENUM('plumbing', 'electrical', 'ac', 'painting', 'carpentry', 'cleaning', 'pest_control', 'other');--> statement-breakpoint
CREATE TYPE "public"."maintenance_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."maintenance_status" AS ENUM('reported', 'approved', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payment_mode" AS ENUM('cheques', 'bank_transfer', 'cash', 'mixed');--> statement-breakpoint
CREATE TYPE "public"."price_frequency" AS ENUM('yearly', 'monthly', 'weekly', 'daily', 'total');--> statement-breakpoint
CREATE TYPE "public"."property_purpose" AS ENUM('rent', 'sale', 'both');--> statement-breakpoint
CREATE TYPE "public"."property_status" AS ENUM('available', 'rented', 'sold', 'under_maintenance', 'off_market');--> statement-breakpoint
CREATE TYPE "public"."property_type" AS ENUM('apartment', 'villa', 'townhouse', 'office', 'warehouse', 'land', 'building', 'penthouse', 'studio');--> statement-breakpoint
CREATE TYPE "public"."subscription_tier" AS ENUM('free', 'basic', 'pro', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."tenant_type" AS ENUM('agency', 'landlord', 'independent');--> statement-breakpoint
CREATE TYPE "public"."transaction_payment_method" AS ENUM('cheque', 'bank_transfer', 'cash', 'card', 'online');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('pending', 'completed', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('rent_income', 'commission', 'maintenance_cost', 'refund', 'deposit', 'other');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('super_admin', 'admin', 'manager', 'broker', 'accountant', 'viewer');--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"type" "tenant_type" DEFAULT 'agency' NOT NULL,
	"trade_license" varchar(100),
	"rera_orn" varchar(100),
	"phone" varchar(30),
	"email" varchar(255),
	"address" text,
	"emirate" "emirate",
	"logo_url" text,
	"subscription" "subscription_tier" DEFAULT 'free' NOT NULL,
	"subscription_expires_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(30),
	"name" varchar(255) NOT NULL,
	"password_hash" text,
	"role" "user_role" DEFAULT 'broker' NOT NULL,
	"rera_brn" varchar(100),
	"avatar_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"reference_no" varchar(50),
	"title" varchar(255) NOT NULL,
	"type" "property_type" NOT NULL,
	"purpose" "property_purpose" DEFAULT 'rent' NOT NULL,
	"status" "property_status" DEFAULT 'available' NOT NULL,
	"bedrooms" integer,
	"bathrooms" integer,
	"area_sqft" numeric(10, 2),
	"price" numeric(12, 2),
	"price_frequency" "price_frequency" DEFAULT 'yearly',
	"currency" varchar(3) DEFAULT 'AED' NOT NULL,
	"address" text,
	"building_name" varchar(255),
	"community" varchar(255),
	"emirate" "emirate",
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"amenities" jsonb DEFAULT '[]'::jsonb,
	"owner_id" uuid,
	"assigned_broker" uuid,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"url" text NOT NULL,
	"caption" varchar(255),
	"is_primary" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "owners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(30),
	"email" varchar(255),
	"emirates_id" text,
	"passport_no" text,
	"nationality" varchar(100),
	"address" text,
	"bank_name" varchar(255),
	"bank_iban" varchar(40),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(30),
	"email" varchar(255),
	"emirates_id" text,
	"passport_no" text,
	"nationality" varchar(100),
	"company_name" varchar(255),
	"emergency_contact" varchar(255),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"property_tenant_id" uuid NOT NULL,
	"owner_id" uuid,
	"contract_type" "contract_type" DEFAULT 'new' NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"rent_amount" numeric(12, 2) NOT NULL,
	"security_deposit" numeric(12, 2),
	"commission_pct" numeric(5, 2),
	"payment_mode" "payment_mode" DEFAULT 'cheques' NOT NULL,
	"num_cheques" integer DEFAULT 1 NOT NULL,
	"ejari_number" varchar(100),
	"tawtheeq_number" varchar(100),
	"contract_doc_url" text,
	"status" "contract_status" DEFAULT 'active' NOT NULL,
	"renewal_reminder_sent" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cheques" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"contract_id" uuid,
	"property_id" uuid,
	"property_tenant_id" uuid,
	"owner_id" uuid,
	"cheque_number" varchar(50),
	"bank_name" varchar(255),
	"amount" numeric(12, 2) NOT NULL,
	"due_date" timestamp NOT NULL,
	"status" "cheque_status" DEFAULT 'pending' NOT NULL,
	"deposited_date" timestamp,
	"cleared_date" timestamp,
	"bounce_reason" text,
	"replacement_cheque_id" uuid,
	"cheque_image_url" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"broker_id" uuid,
	"title" varchar(255) NOT NULL,
	"description" text,
	"listing_type" "listing_type" DEFAULT 'rent' NOT NULL,
	"price" numeric(12, 2),
	"is_featured" boolean DEFAULT false NOT NULL,
	"featured_until" timestamp,
	"trakheesi_permit" varchar(100),
	"permit_expiry" timestamp,
	"status" "listing_status" DEFAULT 'draft' NOT NULL,
	"views_count" integer DEFAULT 0 NOT NULL,
	"enquiries_count" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"user_id" uuid,
	"type" "lead_activity_type" NOT NULL,
	"content" text,
	"scheduled_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"listing_id" uuid,
	"assigned_to" uuid,
	"name" varchar(255) NOT NULL,
	"phone" varchar(30),
	"email" varchar(255),
	"source" "lead_source" DEFAULT 'website' NOT NULL,
	"status" "lead_status" DEFAULT 'new' NOT NULL,
	"budget_min" numeric(12, 2),
	"budget_max" numeric(12, 2),
	"requirements" jsonb,
	"next_follow_up" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maintenance_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"property_tenant_id" uuid,
	"reported_by" uuid,
	"assigned_to" varchar(255),
	"category" "maintenance_category" DEFAULT 'other' NOT NULL,
	"priority" "maintenance_priority" DEFAULT 'medium' NOT NULL,
	"status" "maintenance_status" DEFAULT 'reported' NOT NULL,
	"description" text NOT NULL,
	"cost_estimate" numeric(12, 2),
	"cost_actual" numeric(12, 2),
	"cost_approved" boolean DEFAULT false NOT NULL,
	"cost_approved_by" uuid,
	"before_photos" jsonb DEFAULT '[]'::jsonb,
	"after_photos" jsonb DEFAULT '[]'::jsonb,
	"invoice_url" text,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"contract_id" uuid,
	"broker_id" uuid,
	"listing_id" uuid,
	"deal_type" "commission_deal_type" NOT NULL,
	"deal_value" numeric(12, 2),
	"commission_pct" numeric(5, 2),
	"commission_amount" numeric(12, 2),
	"company_share" numeric(12, 2),
	"broker_share" numeric(12, 2),
	"status" "commission_status" DEFAULT 'pending' NOT NULL,
	"paid_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"type" "transaction_type" NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"vat_amount" numeric(12, 2),
	"currency" varchar(3) DEFAULT 'AED' NOT NULL,
	"reference_type" varchar(50),
	"reference_id" uuid,
	"from_entity" varchar(255),
	"to_entity" varchar(255),
	"payment_method" "transaction_payment_method",
	"status" "transaction_status" DEFAULT 'pending' NOT NULL,
	"receipt_url" text,
	"notes" text,
	"transaction_date" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid,
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(50),
	"entity_id" uuid,
	"old_values" jsonb,
	"new_values" jsonb,
	"ip_address" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"entity_type" "document_entity_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"doc_type" "doc_type" NOT NULL,
	"name" varchar(255) NOT NULL,
	"file_url" text NOT NULL,
	"file_size" integer,
	"mime_type" varchar(100),
	"expiry_date" timestamp,
	"is_verified" boolean DEFAULT false NOT NULL,
	"uploaded_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "idx_tenants_slug" ON "tenants" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_properties_tenant_id" ON "properties" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_properties_status" ON "properties" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_cheques_due_date" ON "cheques" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "idx_cheques_tenant_status" ON "cheques" USING btree ("tenant_id","status");