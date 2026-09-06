"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ZodError } from "zod";

import { requireCapability } from "@/lib/session";
import { ForbiddenError } from "@/lib/rbac";
import {
  OrderTransitionError,
  advanceOrder,
  cancelOrder,
  createOrder,
  editOrder,
  returnOrder,
  searchCustomers,
  updateOrderNote,
} from "@/lib/orders";
import { orderDraftSchema, orderNoteSchema } from "@/lib/validation";
import { markShareCartImported } from "@/lib/share";

export type OrderState =
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

// The new-order / edit forms submit a single JSON blob (built client-side).
function parsePayload(formData: FormData) {
  const raw = formData.get("payload");
  if (typeof raw !== "string") return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function searchCustomersAction(term: string) {
  const ctx = await requireCapability("order:create");
  const rows = await searchCustomers(ctx, term);
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    phone: r.phone,
    lastOrderAt: r.lastOrderAt ? new Date(r.lastOrderAt).toISOString() : null,
  }));
}

export async function createOrderAction(
  _prev: OrderState,
  formData: FormData,
): Promise<OrderState> {
  const ctx = await requireCapability("order:create");
  const parsed = orderDraftSchema.safeParse(parsePayload(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  let result;
  try {
    result = await createOrder(ctx, parsed.data);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Couldn't save the order." };
  }

  if (parsed.data.shareCode) {
    try {
      await markShareCartImported(ctx, parsed.data.shareCode, result.id);
    } catch {
      /* non-fatal: the order is saved; the handoff row just stays "pending" */
    }
  }

  revalidatePath("/desk");
  revalidatePath("/desk/orders");
  revalidatePath("/desk/share");
  redirect(`/desk/orders/${result.id}`);
}

export async function editOrderAction(
  orderId: string,
  _prev: OrderState,
  formData: FormData,
): Promise<OrderState> {
  const ctx = await requireCapability("order:create");
  const parsed = orderDraftSchema.safeParse(parsePayload(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  try {
    await editOrder(ctx, orderId, parsed.data);
  } catch (err) {
    if (err instanceof OrderTransitionError || err instanceof ForbiddenError) {
      return { error: err.message };
    }
    throw err;
  }

  revalidatePath(`/desk/orders/${orderId}`);
  redirect(`/desk/orders/${orderId}`);
}

async function runTransition(
  orderId: string,
  fn: (id: string) => Promise<void>,
): Promise<OrderState> {
  try {
    await fn(orderId);
  } catch (err) {
    if (err instanceof OrderTransitionError || err instanceof ForbiddenError) {
      return { error: err.message };
    }
    throw err;
  }
  revalidatePath("/desk");
  revalidatePath("/desk/orders");
  revalidatePath(`/desk/orders/${orderId}`);
  return { ok: "Updated." };
}

export async function advanceOrderAction(orderId: string): Promise<OrderState> {
  const ctx = await requireCapability("order:advance");
  return runTransition(orderId, (id) => advanceOrder(ctx, id));
}

export async function cancelOrderAction(
  orderId: string,
  _prev: OrderState,
  formData: FormData,
): Promise<OrderState> {
  const ctx = await requireCapability("order:advance");
  const reason = String(formData.get("reason") ?? "");
  return runTransition(orderId, (id) => cancelOrder(ctx, id, reason));
}

export async function returnOrderAction(
  orderId: string,
  _prev: OrderState,
  formData: FormData,
): Promise<OrderState> {
  const ctx = await requireCapability("order:advance");
  const reason = String(formData.get("reason") ?? "");
  return runTransition(orderId, (id) => returnOrder(ctx, id, reason));
}

export async function updateOrderNoteAction(
  orderId: string,
  _prev: OrderState,
  formData: FormData,
): Promise<OrderState> {
  const ctx = await requireCapability("order:create");
  const parsed = orderNoteSchema.safeParse({ note: formData.get("note") ?? "" });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  try {
    await updateOrderNote(ctx, orderId, parsed.data.note);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Couldn't save the note." };
  }
  revalidatePath(`/desk/orders/${orderId}`);
  return { ok: "Note saved." };
}
