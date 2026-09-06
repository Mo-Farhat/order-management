-- Split the old pipeline into order status + delivery status.
-- Runs in its own migration so the new 'completed' enum value (added in 0007)
-- is safe to reference here.

UPDATE "orders" SET "delivery_status" = CASE
  WHEN "status" = 'delivered' THEN 'delivered'::"delivery_status"
  WHEN "status" = 'shipped'   THEN 'dispatched'::"delivery_status"
  ELSE 'pending'::"delivery_status"
END;
--> statement-breakpoint
UPDATE "orders" SET "dispatched_at" = "updated_at" WHERE "status" IN ('shipped', 'delivered');
--> statement-breakpoint
UPDATE "orders" SET "delivered_at" = "updated_at" WHERE "status" = 'delivered';
--> statement-breakpoint
UPDATE "orders" SET "status" = CASE
  WHEN "status" = 'delivered' THEN 'completed'::"order_status"
  WHEN "status" IN ('draft', 'packed', 'shipped') THEN 'confirmed'::"order_status"
  ELSE "status"
END;
