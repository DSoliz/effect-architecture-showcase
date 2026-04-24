"use client";

import { use } from "react";
import { OrderTracker } from "@/components/organisms";
import { OrderId } from "@/lib/domain";

export default function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const orderId = id as OrderId;

  return (
    <div>
      <h1>Order Tracking</h1>
      <OrderTracker orderId={orderId} />
    </div>
  );
}
