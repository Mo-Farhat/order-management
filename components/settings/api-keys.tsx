"use client";

import { useActionState, useState, useTransition } from "react";
import { createApiKeyAction, revokeApiKeyAction } from "@/app/actions/api-keys";
import { FormError } from "@/components/form";
import { Spinner } from "@/components/desk/ui";
import { SubmitBtn } from "@/components/desk/submit-btn";

type KeyRow = {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
};

export function ApiKeys({ keys }: { keys: KeyRow[] }) {
  const [state, action] = useActionState(createApiKeyAction, undefined);
  const [revoking, startRevoke] = useTransition();
  const [justCreated, setJustCreated] = useState<string | null>(null);

  // surface the one-time plaintext when the action returns it
  if (state?.plaintext && state.plaintext !== justCreated) setJustCreated(state.plaintext);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        A read-only key for an external website to pull this catalog from{" "}
        <code className="rounded bg-surface px-1 text-xs">/api/v1/products</code> and{" "}
        <code className="rounded bg-surface px-1 text-xs">/api/v1/catalog</code>. Use it
        server-side — anyone with the key can read your catalog.
      </p>

      {justCreated && (
        <div className="rounded-lg border border-accent/40 bg-accent-weak p-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">
            New key — copy it now
          </p>
          <code className="mt-1 block break-all text-sm">{justCreated}</code>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(justCreated).catch(() => {});
            }}
            className="mt-2 rounded border border-line px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest"
          >
            Copy
          </button>
        </div>
      )}

      {keys.length > 0 && (
        <ul className="flex flex-col divide-y divide-line rounded-lg border border-line">
          {keys.map((k) => (
            <li key={k.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {k.name}
                  {k.revokedAt && (
                    <span className="ml-2 font-mono text-[10px] uppercase text-danger">revoked</span>
                  )}
                </p>
                <p className="font-mono text-xs text-muted">
                  {k.keyPrefix}… ·{" "}
                  {k.lastUsedAt ? `last used ${new Date(k.lastUsedAt).toLocaleDateString()}` : "never used"}
                </p>
              </div>
              {!k.revokedAt && (
                <button
                  type="button"
                  disabled={revoking}
                  aria-busy={revoking || undefined}
                  onClick={() => startRevoke(() => revokeApiKeyAction(k.id).then(() => {}))}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded border border-danger/40 px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-danger disabled:opacity-40"
                >
                  {revoking && <Spinner />}
                  Revoke
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <form action={action} className="flex items-end gap-2">
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-muted">
            New key name
          </span>
          <input
            name="name"
            placeholder="e.g. Website (Forty Pixels)"
            maxLength={60}
            className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm outline-none focus:border-accent"
          />
        </label>
        <SubmitBtn pendingLabel="Creating…">Create</SubmitBtn>
      </form>
      <FormError message={state?.error} />
    </div>
  );
}
