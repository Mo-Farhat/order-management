import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { requireCapability } from "@/lib/session";
import { listProducts } from "@/lib/catalog";
import { getShareCartByCode } from "@/lib/share";
import { NewOrderFlow } from "@/components/orders/new-order-flow";
import { ImportCodeBox } from "@/components/orders/import-code-box";
import type { ComposerInitial } from "@/components/orders/order-composer";

export default async function NewOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const ctx = await requireCapability("order:create");
  const { code } = await searchParams;

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

  let initial: ComposerInitial | undefined;
  let importNote: string | null = null;
  if (code) {
    const cart = await getShareCartByCode(ctx, code);
    if (!cart) {
      importNote = `No handoff found for code “${code.toUpperCase()}”.`;
    } else if (cart.status === "imported") {
      importNote = `Code ${cart.code} was already turned into an order.`;
    } else {
      const known = new Set(products.map((p) => p.id));
      const items = cart.items.filter((i) => known.has(i.productId));
      initial = {
        customer: { id: null, name: cart.customerName, phone: cart.customerPhone },
        items,
        deliveryFee: "",
        discountType: "none",
        discountValue: "",
        note: cart.note,
        shareCode: cart.code,
      };
      importNote =
        items.length < cart.items.length
          ? `Loaded ${items.length} of ${cart.items.length} items — the rest are no longer in your catalog.`
          : `Loaded ${items.length} item${items.length === 1 ? "" : "s"} from code ${cart.code}.`;
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/desk/orders"
        className="font-mono text-[11px] font-semibold uppercase tracking-widest text-muted"
      >
        ← Orders
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">New order</h1>
        <ImportCodeBox defaultCode={code ?? ""} />
      </div>
      {importNote && (
        <p className="rounded-lg border border-accent/30 bg-accent-weak px-3 py-2 text-sm">
          {importNote}
        </p>
      )}
      <NewOrderFlow
        key={code ?? "blank"}
        products={products}
        currency={tenant?.currency ?? ""}
        deliveryFeeDefault={tenant?.deliveryFeeDefault ?? null}
        initial={initial}
      />
    </div>
  );
}
