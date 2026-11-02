"use client";

import { OrderComposer, type ComposerInitial, type ComposerProduct } from "@/components/orders/order-composer";
import type { OrderState } from "@/app/actions/orders";

type Product = ComposerProduct;

export function EditOrderFlow({
  products,
  currency,
  action,
  initial,
  stockTracking = true,
}: {
  orderId: string;
  products: Product[];
  currency: string;
  action: (prev: OrderState, fd: FormData) => Promise<OrderState>;
  initial: ComposerInitial;
  stockTracking?: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        Editing order for <strong>{initial.customer.name}</strong> ({initial.customer.phone}).
        The customer can&apos;t be changed here.
      </p>
      <OrderComposer
        mode="edit"
        products={products}
        currency={currency}
        deliveryFeeDefault={null}
        action={action}
        initial={initial}
        stockTracking={stockTracking}
      />
    </div>
  );
}
