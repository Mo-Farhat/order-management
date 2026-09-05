import Link from "next/link";
import { requireActive } from "@/lib/session";
import { isStorageConfigured } from "@/lib/storage";
import { createProductAction } from "@/app/actions/catalog";
import { ProductForm } from "@/components/catalog/product-form";

export default async function NewProductPage() {
  await requireActive();

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/desk/catalog"
        className="font-mono text-[11px] font-semibold uppercase tracking-widest text-muted"
      >
        ← Catalog
      </Link>
      <h2 className="text-base font-medium">Add product</h2>
      <ProductForm
        action={createProductAction}
        submitLabel="Save product"
        storageEnabled={isStorageConfigured()}
      />
    </div>
  );
}
