"use client";

import { useRef, useState, useTransition } from "react";
import { useActionState } from "react";
import {
  commitImportAction,
  previewImportAction,
  type CatalogState,
} from "@/app/actions/catalog";
import type { ImportPreview } from "@/lib/csv-import";
import { FormError, SubmitButton } from "@/components/form";

const TEMPLATE = "name,price,stock,category,sku\nRose bouquet,3500,12,Flowers,RB-01\nGift card,1000,0,,GC";

export function ImportForm() {
  const [csv, setCsv] = useState("");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [pending, startPreview] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const [commitState, commitAction] = useActionState<CatalogState, FormData>(
    commitImportAction,
    undefined,
  );

  function runPreview(text: string) {
    setCsv(text);
    setPreview(null);
    setPreviewError(null);
    if (!text.trim()) return;
    startPreview(async () => {
      const res = await previewImportAction(text);
      if (res.ok) setPreview(res.preview);
      else setPreviewError(res.error);
    });
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    runPreview(await file.text());
  }

  const canCommit = preview != null && preview.errorCount === 0 && preview.validCount > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={onFile} className="text-xs text-muted" />
        <span className="text-xs text-muted">
          Columns: name, price, stock (+ optional description, category, low stock
          threshold, sku). Or paste below.
        </span>
        <textarea
          value={csv}
          onChange={(e) => runPreview(e.target.value)}
          rows={5}
          placeholder={TEMPLATE}
          className="w-full rounded-lg border border-line bg-surface p-3 font-mono text-xs outline-none focus:border-ink"
        />
      </div>

      {pending && <p className="text-sm text-muted">Checking…</p>}
      {previewError && <FormError message={previewError} />}

      {preview && (
        <div className="flex flex-col gap-2">
          <p className="text-sm">
            {preview.validCount} ready
            {preview.errorCount > 0 && (
              <span className="text-danger"> · {preview.errorCount} with errors</span>
            )}
          </p>
          {preview.unmappedHeaders.length > 0 && (
            <p className="text-xs text-muted">
              Ignored columns: {preview.unmappedHeaders.join(", ")}
            </p>
          )}
          <div className="max-h-64 overflow-auto rounded-lg border border-line">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface text-muted">
                <tr>
                  <th className="px-2 py-1">Line</th>
                  <th className="px-2 py-1">Name</th>
                  <th className="px-2 py-1">Price</th>
                  <th className="px-2 py-1">Stock</th>
                  <th className="px-2 py-1">Status</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((r) => (
                  <tr key={r.line} className="border-t border-line">
                    <td className="px-2 py-1">{r.line}</td>
                    <td className="px-2 py-1">{r.data?.name ?? r.raw.name ?? "—"}</td>
                    <td className="px-2 py-1">{r.data?.price ?? r.raw.price ?? "—"}</td>
                    <td className="px-2 py-1">{r.data?.stockQty ?? "—"}</td>
                    <td className="px-2 py-1">
                      {r.errors.length === 0 ? (
                        <span className="text-muted">ok</span>
                      ) : (
                        <span className="text-danger">{r.errors.join("; ")}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {preview.errorCount > 0 && (
            <p className="text-xs text-muted">
              Fix every row before importing — it&apos;s all or nothing.
            </p>
          )}
        </div>
      )}

      <form action={commitAction}>
        <FormError message={commitState?.error} />
        <input type="hidden" name="csv" value={csv} />
        <div className={canCommit ? "" : "pointer-events-none opacity-40"}>
          <SubmitButton>Import {preview?.validCount ?? 0} products</SubmitButton>
        </div>
      </form>
    </div>
  );
}
