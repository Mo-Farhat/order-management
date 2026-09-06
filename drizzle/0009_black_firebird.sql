ALTER TABLE "order_items" ADD COLUMN "note" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "storefront_hidden" boolean DEFAULT false NOT NULL;