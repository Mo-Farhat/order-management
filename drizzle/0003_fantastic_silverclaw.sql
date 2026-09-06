CREATE TABLE "share_carts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"code" text NOT NULL,
	"items" jsonb NOT NULL,
	"note" text,
	"customer_name" text,
	"customer_phone" text,
	"subtotal" numeric(12, 2) DEFAULT '0' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"imported_order_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "accent_color" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "logo_key" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "share_policy_text" text;--> statement-breakpoint
ALTER TABLE "share_carts" ADD CONSTRAINT "share_carts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "share_carts_tenant_code_uq" ON "share_carts" USING btree ("tenant_id","code");--> statement-breakpoint
CREATE INDEX "share_carts_tenant_idx" ON "share_carts" USING btree ("tenant_id","created_at");