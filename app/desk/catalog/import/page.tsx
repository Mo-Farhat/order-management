import Link from "next/link";
import { requireCapability } from "@/lib/session";
import { ImportForm } from "@/components/catalog/import-form";

export default async function ImportPage() {
  await requireCapability("catalog:edit");

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/desk/catalog"
        className="font-mono text-[11px] font-semibold uppercase tracking-widest text-muted"
      >
        ← Catalog
      </Link>
      <h2 className="text-base font-medium">Import products from CSV</h2>
      <p className="text-sm text-muted">
        We show you a preview first. Nothing is saved until you confirm, and if any
        row has an error the whole import is held back.
      </p>
      <ImportForm />
    </div>
  );
}
