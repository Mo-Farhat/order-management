import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { requireCapability } from "@/lib/session";
import { listProducts } from "@/lib/catalog";
import { NewOrderFlow } from "@/components/orders/new-order-flow";

export default async function NewOrderPage() {
  const ctx = await requireCapability("order:create");
  const [productItems, tenant] = await Promise.all([
    listProducts(ctx, {}),
    db.query.tenants.findFirst({ where: eq(tenants.id, ctx.tenantId) }),
  ]);

  const products = productItems.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    stockQty: p.stockQty,
    photoUrl: p.photoUrl,
  }));

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/desk"
        className="font-mono text-[11px] font-semibold uppercase tracking-widest text-muted"
      >
        ← Orders
      </Link>
      <NewOrderFlow
        products={products}
        currency={tenant?.currency ?? ""}
        deliveryFeeDefault={tenant?.deliveryFeeDefault ?? null}
      />
    </div>
  );
}
