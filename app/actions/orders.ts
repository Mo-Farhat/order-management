"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ZodError } from "zod";

import { requireActive, requireCapability } from "@/lib/session";
import { ForbiddenError } from "@/lib/rbac";
import {
  OrderTransitionError,
  cancelOrder,
  createOrder,
  editOrder,
  getOrderDetail,
  returnOrder,
  searchCustomers,
  setCourier,
  setDeliveryStatus,
  setOrderStatus,
  updateOrderNote,
  updatePayment,
} from "@/lib/orders";
import {
  deliveryStatusUpdateSchema,
  orderDraftSchema,
  orderNoteSchema,
  orderStatusUpdateSchema,
  paymentUpdateSchema,
} from "@/lib/validation";
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

function parsePayload(formData: FormData) {
  const raw = formData.get("payload");
  if (typeof raw !== "string") return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function revalidateOrder(id: string) {
  revalidatePath("/desk");
  revalidatePath("/desk/orders");
  revalidatePath(`/desk/orders/${id}`);
}

export async function getOrderDetailAction(id: string) {
  const ctx = await requireActive();
  return getOrderDetail(ctx, id);
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
      /* non-fatal */
    }
  }

  revalidateOrder(result.id);
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

  revalidateOrder(orderId);
  redirect(`/desk/orders/${orderId}`);
}

async function run(orderId: string, fn: (id: string) => Promise<void>): Promise<OrderState> {
  try {
    await fn(orderId);
  } catch (err) {
    if (err instanceof OrderTransitionError || err instanceof ForbiddenError) {
      return { error: err.message };
    }
    throw err;
  }
  revalidateOrder(orderId);
  return { ok: "Updated." };
}

export async function setOrderStatusAction(orderId: string, status: string): Promise<OrderState> {
  const ctx = await requireCapability("order:advance");
  const parsed = orderStatusUpdateSchema.safeParse({ status });
  if (!parsed.success) return { error: "Invalid status." };
  return run(orderId, (id) => setOrderStatus(ctx, id, parsed.data.status));
}

export async function setDeliveryStatusAction(
  orderId: string,
  deliveryStatus: string,
): Promise<OrderState> {
  const ctx = await requireCapability("order:advance");
  const parsed = deliveryStatusUpdateSchema.safeParse({ deliveryStatus });
  if (!parsed.success) return { error: "Invalid delivery status." };
  return run(orderId, (id) => setDeliveryStatus(ctx, id, parsed.data.deliveryStatus));
}

export async function setCourierAction(
  orderId: string,
  _prev: OrderState,
  formData: FormData,
): Promise<OrderState> {
  const ctx = await requireCapability("order:advance");
  const courier = String(formData.get("courier") ?? "");
  await setCourier(ctx, orderId, courier);
  revalidateOrder(orderId);
  return { ok: "Saved." };
}

export async function updatePaymentAction(
  orderId: string,
  _prev: OrderState,
  formData: FormData,
): Promise<OrderState> {
  const ctx = await requireCapability("order:create");
  const parsed = paymentUpdateSchema.safeParse({
    paymentStatus: formData.get("paymentStatus"),
    amountPaid: formData.get("amountPaid") ?? "",
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  try {
    await updatePayment(ctx, orderId, parsed.data.paymentStatus, parsed.data.amountPaid ?? "");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Couldn't update payment." };
  }
  revalidateOrder(orderId);
  return { ok: "Payment updated." };
}

export async function cancelOrderAction(
  orderId: string,
  _prev: OrderState,
  formData: FormData,
): Promise<OrderState> {
  const ctx = await requireCapability("order:advance");
  const reason = String(formData.get("reason") ?? "");
  return run(orderId, (id) => cancelOrder(ctx, id, reason));
}

export async function returnOrderAction(
  orderId: string,
  _prev: OrderState,
  formData: FormData,
): Promise<OrderState> {
  const ctx = await requireCapability("order:advance");
  const reason = String(formData.get("reason") ?? "");
  return run(orderId, (id) => returnOrder(ctx, id, reason));
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
  revalidateOrder(orderId);
  return { ok: "Note saved." };
}
