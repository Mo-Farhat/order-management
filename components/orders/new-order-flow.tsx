"use client";

import { createOrderAction } from "@/app/actions/orders";
import { OrderComposer } from "@/components/orders/order-composer";

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
}: {
  products: Product[];
  currency: string;
  deliveryFeeDefault: string | null;
}) {
  return (
    <OrderComposer
      mode="new"
      products={products}
      currency={currency}
      deliveryFeeDefault={deliveryFeeDefault}
      action={createOrderAction}
    />
  );
}
