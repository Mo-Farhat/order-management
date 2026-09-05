"use client";

import { OrderComposer, type ComposerInitial } from "@/components/orders/order-composer";
import type { OrderState } from "@/app/actions/orders";

type Product = {
  id: string;
  name: string;
  price: string;
  stockQty: number;
  photoUrl: string | null;
};

export function EditOrderFlow({
  products,
  currency,
  action,
  initial,
}: {
  orderId: string;
  products: Product[];
  currency: string;
  action: (prev: OrderState, fd: FormData) => Promise<OrderState>;
  initial: ComposerInitial;
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
      />
    </div>
  );
}
