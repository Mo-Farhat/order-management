CREATE TYPE "public"."payment_method" AS ENUM('cash_on_delivery', 'bank_transfer');--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_method" "payment_method";