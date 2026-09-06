"use client";

import { useActionState, useState } from "react";
import type { CatalogState } from "@/app/actions/catalog";
import { removePhotoAction } from "@/app/actions/catalog";
import { Field, FormError, SubmitButton } from "@/components/form";

type Photo = { id: string; url: string };

export function ProductForm({
  action,
  submitLabel,
  storageEnabled,
  photos = [],
  defaults,
}: {
  action: (prev: CatalogState, formData: FormData) => Promise<CatalogState>;
  submitLabel: string;
  storageEnabled: boolean;
  photos?: Photo[];
  defaults?: {
    name?: string;
    price?: string;
    stockQty?: string | number;
    description?: string | null;
    category?: string | null;
    lowStockThreshold?: string | number | null;
    sku?: string | null;
    storefrontHidden?: boolean;
  };
}) {
  const [state, formAction] = useActionState<CatalogState, FormData>(action, undefined);
  const [showMore, setShowMore] = useState(
    Boolean(defaults?.description || defaults?.category || defaults?.lowStockThreshold || defaults?.sku),
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormError message={state?.error} />
      {state?.ok && (
        <p className="rounded-lg border border-line bg-surface px-3 py-2 text-sm">{state.ok}</p>
      )}

      {storageEnabled && (
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-muted">
            Photos
          </span>
          {photos.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {photos.map((ph) => (
                <div key={ph.id} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ph.url} alt="" className="size-16 rounded-lg object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhotoAction(ph.id)}
                    aria-label="Remove photo"
                    className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-ink text-xs text-paper"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <input
            type="file"
            name="photos"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="text-xs text-muted"
          />
          <span className="text-xs text-muted">Up to 6, JPEG/PNG/WebP, 6 MB each.</span>
        </div>
      )}

      <Field
        label="Name"
        name="name"
        required
        defaultValue={defaults?.name}
        errors={state?.fieldErrors?.name}
      />
      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Price"
          name="price"
          required
          inputMode="numeric"
          placeholder="1200"
          defaultValue={defaults?.price}
          errors={state?.fieldErrors?.price}
        />
        <Field
          label="Stock quantity"
          name="stockQty"
          required
          inputMode="numeric"
          placeholder="0"
          defaultValue={defaults?.stockQty != null ? String(defaults.stockQty) : "0"}
          errors={state?.fieldErrors?.stockQty}
        />
      </div>

      <button
        type="button"
        onClick={() => setShowMore((v) => !v)}
        className="self-start text-sm text-muted underline underline-offset-4"
      >
        {showMore ? "Hide details" : "More details"}
      </button>

      {showMore && (
        <div className="flex flex-col gap-4 rounded-lg border border-line p-3">
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-muted">
              Description
            </span>
            <textarea
              name="description"
              rows={3}
              defaultValue={defaults?.description ?? ""}
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-ink"
            />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Category"
              name="category"
              defaultValue={defaults?.category ?? ""}
              errors={state?.fieldErrors?.category}
            />
            <Field
              label="Low-stock threshold"
              name="lowStockThreshold"
              inputMode="numeric"
              defaultValue={
                defaults?.lowStockThreshold != null ? String(defaults.lowStockThreshold) : ""
              }
              errors={state?.fieldErrors?.lowStockThreshold}
            />
          </div>
          <Field
            label="SKU"
            name="sku"
            defaultValue={defaults?.sku ?? ""}
            errors={state?.fieldErrors?.sku}
          />
        </div>
      )}

      <label className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface px-3 py-3">
        <span className="text-sm">
          <span className="font-medium">Hide from storefront</span>
          <span className="block text-xs text-muted">
            Keeps it in your catalog and usable for DM orders, but customers
            won&apos;t see it on your share link.
          </span>
        </span>
        <input
          type="checkbox"
          name="storefrontHidden"
          defaultChecked={defaults?.storefrontHidden ?? false}
          className="size-5 accent-[var(--color-accent)]"
        />
      </label>

      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
