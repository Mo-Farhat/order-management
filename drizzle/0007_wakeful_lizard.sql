CREATE TYPE "public"."delivery_status" AS ENUM('pending', 'dispatched', 'delivered');--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'completed' BEFORE 'cancelled';--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'confirmed';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_status" "delivery_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "courier" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "dispatched_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivered_at" timestamp with time zone;