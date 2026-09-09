"use client";

import { useState, useTransition } from "react";
import { archiveProductAction, deleteProductAction } from "@/app/actions/catalog";
import { Spinner } from "@/components/desk/ui";

export function ProductDangerZone({
  productId,
  archived,
  canDelete,
  canHardDelete,
}: {
  productId: string;
  archived: boolean;
  canDelete: boolean;
  canHardDelete: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line p-3">
      <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-muted">
        Danger zone
      </span>

      <button
        type="button"
        disabled={pending}
        aria-busy={pending || undefined}
        onClick={() => start(() => archiveProductAction(productId, !archived))}
        className="inline-flex items-center gap-1.5 self-start rounded-md border border-line px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-widest disabled:opacity-50"
      >
        {pending && <Spinner />}
        {archived ? "Unarchive" : "Archive"}
      </button>
      <p className="text-xs text-muted">
        Archived products leave your storefront and the new-order grid but stay on
        past orders.
      </p>

      {canDelete && (
        <>
          {confirming ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    const res = await deleteProductAction(productId);
                    if (res?.error) setError(res.error);
                  })
                }
                aria-busy={pending || undefined}
                className="inline-flex items-center gap-1.5 rounded-md bg-danger px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-widest text-white disabled:opacity-50"
              >
                {pending && <Spinner />}
                Delete for good
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="text-xs text-muted underline"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={!canHardDelete}
              onClick={() => setConfirming(true)}
              className="self-start rounded-md border border-danger/50 px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-widest text-danger disabled:cursor-not-allowed disabled:opacity-40"
            >
              Delete
            </button>
          )}
          {!canHardDelete && (
            <p className="text-xs text-muted">
              This product has order history, so it can&apos;t be deleted — archive
              it instead.
            </p>
          )}
        </>
      )}

      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
