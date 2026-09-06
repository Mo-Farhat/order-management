"use client";

import { createOrderAction } from "@/app/actions/orders";
import { OrderComposer, type ComposerInitial } from "@/components/orders/order-composer";

type Product = {
  id: string;
  name: string;
  price: string;
  stockQty: number;
  photoUrl: string | null;
};

export function NewOrderFlow({
  products,
  currency,
  deliveryFeeDefault,
  initial,
  stockTracking = true,
}: {
  products: Product[];
  currency: string;
  deliveryFeeDefault: string | null;
  initial?: ComposerInitial;
  stockTracking?: boolean;
}) {
  return (
    <OrderComposer
      mode="new"
      products={products}
      currency={currency}
      deliveryFeeDefault={deliveryFeeDefault}
      action={createOrderAction}
      initial={initial}
      stockTracking={stockTracking}
    />
  );
}
