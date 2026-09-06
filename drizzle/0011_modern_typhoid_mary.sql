CREATE TYPE "public"."order_source" AS ENUM('desk', 'storefront');--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'pending';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "source" "order_source" DEFAULT 'desk' NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "instagram_handle" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "onboarding_dismissed_at" timestamp with time zone;