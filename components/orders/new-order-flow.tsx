"use client";

import { createOrderAction } from "@/app/actions/orders";
import { OrderComposer, type ComposerInitial, type ComposerProduct } from "@/components/orders/order-composer";

type Product = ComposerProduct;

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
