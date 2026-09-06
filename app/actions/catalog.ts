"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireCapability } from "@/lib/session";
import { ForbiddenError } from "@/lib/rbac";
import {
  DeleteBlockedError,
  addProductPhotoKey,
  createProduct,
  deleteProduct,
  removeProductPhoto,
  setArchived,
  setStock,
  updateProduct,
} from "@/lib/catalog";
import { buildPreview, commitImport, type ImportPreview } from "@/lib/csv-import";
import {
  deleteObject,
  isStorageConfigured,
  uploadProductPhoto,
} from "@/lib/storage";
import { productSchema, stockAdjustSchema } from "@/lib/validation";
import type { ZodError } from "zod";

export type CatalogState =
  | { error?: string; fieldErrors?: Record<string, string[]>; ok?: string }
  | undefined;

function fieldErrors(err: ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? "form");
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

function toInput(formData: FormData) {
  return {
    name: formData.get("name"),
    price: formData.get("price"),
    stockQty: formData.get("stockQty"),
    description: formData.get("description") ?? "",
    category: formData.get("category") ?? "",
    lowStockThreshold: formData.get("lowStockThreshold") ?? "",
    sku: formData.get("sku") ?? "",
    storefrontHidden: formData.get("storefrontHidden") === "on",
  };
}

async function handlePhotoUploads(
  tenantId: string,
  productId: string,
  formData: FormData,
  ctx: Awaited<ReturnType<typeof requireCapability>>,
) {
  if (!isStorageConfigured()) return;
  const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  for (const file of files) {
    const { key } = await uploadProductPhoto(tenantId, file);
    await addProductPhotoKey(ctx, productId, key);
  }
}

export async function createProductAction(
  _prev: CatalogState,
  formData: FormData,
): Promise<CatalogState> {
  const ctx = await requireCapability("catalog:edit");
  const parsed = productSchema.safeParse(toInput(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  let id: string;
  try {
    id = await createProduct(ctx, parsed.data);
    await handlePhotoUploads(ctx.tenantId, id, formData, ctx);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Couldn't save the product." };
  }

  revalidatePath("/desk/catalog");
  redirect("/desk/catalog");
}

export async function updateProductAction(
  productId: string,
  _prev: CatalogState,
  formData: FormData,
): Promise<CatalogState> {
  const ctx = await requireCapability("catalog:edit");
  const parsed = productSchema.safeParse(toInput(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  try {
    await updateProduct(ctx, productId, parsed.data);
    await handlePhotoUploads(ctx.tenantId, productId, formData, ctx);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Couldn't save changes." };
  }

  revalidatePath("/desk/catalog");
  revalidatePath(`/desk/catalog/${productId}`);
  return { ok: "Saved." };
}

export async function adjustStockAction(
  productId: string,
  _prev: CatalogState,
  formData: FormData,
): Promise<CatalogState> {
  const ctx = await requireCapability("catalog:edit");
  const parsed = stockAdjustSchema.safeParse({
    stockQty: formData.get("stockQty"),
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  try {
    await setStock(ctx, productId, parsed.data.stockQty, parsed.data.note || undefined);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Couldn't update stock." };
  }

  revalidatePath("/desk/catalog");
  revalidatePath(`/desk/catalog/${productId}`);
  return { ok: "Stock updated." };
}

/** Quick inline stock editor on the product list (catalog S4). */
export async function quickSetStockAction(
  productId: string,
  stockQty: number,
): Promise<{ ok: true; stockQty: number } | { ok: false; error: string }> {
  const ctx = await requireCapability("catalog:edit");
  if (!Number.isInteger(stockQty) || stockQty < 0 || stockQty > 1_000_000) {
    return { ok: false, error: "Enter a whole number." };
  }
  try {
    const next = await setStock(ctx, productId, stockQty);
    revalidatePath("/desk/catalog");
    return { ok: true, stockQty: next };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Couldn't update stock." };
  }
}

export async function archiveProductAction(productId: string, archived: boolean) {
  const ctx = await requireCapability("catalog:edit");
  await setArchived(ctx, productId, archived);
  revalidatePath("/desk/catalog");
  revalidatePath(`/desk/catalog/${productId}`);
}

export async function deleteProductAction(productId: string): Promise<CatalogState> {
  const ctx = await requireCapability("catalog:delete_product");
  try {
    const keys = await deleteProduct(ctx, productId);
    await Promise.all(keys.map((k) => deleteObject(k)));
  } catch (err) {
    if (err instanceof DeleteBlockedError || err instanceof ForbiddenError) {
      return { error: err.message };
    }
    throw err;
  }
  revalidatePath("/desk/catalog");
  redirect("/desk/catalog");
}

export async function removePhotoAction(photoId: string) {
  const ctx = await requireCapability("catalog:edit");
  const key = await removeProductPhoto(ctx, photoId);
  if (key) await deleteObject(key);
  revalidatePath("/desk/catalog");
}

export async function previewImportAction(
  csv: string,
): Promise<{ ok: true; preview: ImportPreview } | { ok: false; error: string }> {
  await requireCapability("catalog:edit");
  if (!csv.trim()) return { ok: false, error: "Paste or choose a CSV file first." };
  try {
    return { ok: true, preview: buildPreview(csv) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Couldn't read that file." };
  }
}

export async function commitImportAction(
  _prev: CatalogState,
  formData: FormData,
): Promise<CatalogState> {
  const ctx = await requireCapability("catalog:edit");
  const csv = String(formData.get("csv") ?? "");
  if (!csv.trim()) return { error: "Paste or upload a CSV first." };

  let imported: number;
  try {
    ({ imported } = await commitImport(ctx, csv));
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Import failed." };
  }

  revalidatePath("/desk/catalog");
  redirect(`/desk/catalog?imported=${imported}`);
}
