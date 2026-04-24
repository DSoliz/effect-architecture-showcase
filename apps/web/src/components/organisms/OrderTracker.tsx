"use client";

import type { OrderId } from "@/lib/domain";
import { useOrder } from "@/lib/hooks/use-order";
import { useOrderStatus } from "@/lib/hooks/use-order-status";
import { Spinner, PriceTag } from "@/components/atoms";
import { OrderStatusBar } from "@/components/molecules/OrderStatusBar";
import { ErrorMessage } from "@/components/molecules/ErrorMessage";
import styles from "./OrderTracker.module.css";

interface OrderTrackerProps {
  orderId: OrderId;
}

export function OrderTracker({ orderId }: OrderTrackerProps) {
  const { order, loading, error } = useOrder(orderId);
  const { status: liveStatus } = useOrderStatus(orderId, order?.status);

  if (loading) {
    return (
      <div className={styles.centered}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage error={error} />;
  }

  if (!order) {
    return <ErrorMessage error="Order not found." />;
  }

  const displayStatus = liveStatus ?? order.status;

  return (
    <section className={styles.container}>
      <h2 className={styles.heading}>Order #{order.id}</h2>

      <OrderStatusBar currentStatus={displayStatus} />

      <div className={styles.summary}>
        <h3 className={styles.summaryHeading}>Order Summary</h3>
        <ul className={styles.itemList}>
          {order.items.map((item) => (
            <li key={item.menuItemId} className={styles.item}>
              <span className={styles.itemName}>
                {item.name} x{item.quantity}
              </span>
              <PriceTag amount={item.unitPrice * item.quantity} />
            </li>
          ))}
        </ul>
        <div className={styles.totalRow}>
          <span className={styles.totalLabel}>Total</span>
          <PriceTag amount={order.totalPrice} className={styles.totalPrice} />
        </div>
      </div>
    </section>
  );
}
