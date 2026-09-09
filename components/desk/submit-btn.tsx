"use client";

import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { Btn } from "@/components/desk/ui";

/**
 * Drop-in submit button for any `<form action={…}>` — shows a spinner and
 * disables itself while the form's action is in flight (via `useFormStatus`).
 * `pendingLabel` optionally swaps the text while submitting.
 */
export function SubmitBtn({
  children,
  pendingLabel,
  ...rest
}: ComponentProps<typeof Btn> & { pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <Btn type="submit" loading={pending} {...rest}>
      {pending && pendingLabel ? pendingLabel : children}
    </Btn>
  );
}
