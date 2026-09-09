CREATE TYPE "public"."plan_tier" AS ENUM('basic', 'studio', 'pro');--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "plan_tier" "plan_tier" DEFAULT 'basic' NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "pro_website_discount" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "banner_key" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "storefront_config" jsonb;