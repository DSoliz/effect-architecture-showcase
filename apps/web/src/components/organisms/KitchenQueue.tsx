"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Effect } from "effect";
import type { Order, OrderId, OrderStatus } from "@/lib/domain";
import { makeClient } from "@/lib/rpc/client";
import { Button, Spinner } from "@/components/atoms";
import { PriceTag } from "@/components/atoms";
import { ErrorMessage } from "@/components/molecules/ErrorMessage";
import styles from "./KitchenQueue.module.css";

const TRACKED_STATUSES: OrderStatus[] = [
  "placed",
  "confirmed",
  "preparing",
  "ready",
  "picked-up",
];

const NEXT_STATUS: Record<string, OrderStatus> = {
  placed: "confirmed",
  confirmed: "preparing",
  preparing: "ready",
  ready: "picked-up",
  "picked-up": "delivered",
};

const STATUS_LABELS: Record<string, string> = {
  placed: "Placed",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready",
  "picked-up": "Picked Up",
};

const ADVANCE_LABELS: Record<string, string> = {
  placed: "Confirm",
  confirmed: "Start Preparing",
  preparing: "Mark Ready",
  ready: "Mark Picked Up",
  "picked-up": "Mark Delivered",
};

const POLL_INTERVAL_MS = 5_000;

function makeFetchEffect(
  setOrdersByStatus: (grouped: Record<string, Order[]>) => void,
  setError: (error: string | null) => void,
  setLoading: (loading: boolean) => void
) {
  return Effect.gen(function* () {
    const client = yield* makeClient;
    const results = yield* Effect.all(
      TRACKED_STATUSES.map((status) =>
        client.ListOrdersByStatus({ status })
      ),
      { concurrency: "unbounded" }
    );
    const grouped: Record<string, Order[]> = {};
    TRACKED_STATUSES.forEach((status, index) => {
      grouped[status] = [...results[index]];
    });
    return grouped;
  }).pipe(
    Effect.tap((grouped) =>
      Effect.sync(() => {
        setOrdersByStatus(grouped);
        setError(null);
      })
    ),
    Effect.tapErrorCause(() =>
      Effect.sync(() => setError("Failed to load orders"))
    ),
    Effect.ensuring(Effect.sync(() => setLoading(false))),
    Effect.scoped,
    Effect.catchAll(() => Effect.void)
  );
}

export function KitchenQueue() {
  const [ordersByStatus, setOrdersByStatus] = useState<
    Record<string, Order[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState<string | null>(null);

  const fetchEffect = useRef(
    makeFetchEffect(setOrdersByStatus, setError, setLoading)
  );

  const fetchOrders = useCallback(() => {
    Effect.runPromise(fetchEffect.current);
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const advanceStatus = useCallback(
    (orderId: string, currentStatus: OrderStatus) => {
      const nextStatus = NEXT_STATUS[currentStatus];
      if (!nextStatus) return;

      setAdvancing(orderId);

      const effect = Effect.gen(function* () {
        const client = yield* makeClient;
        yield* client.UpdateOrderStatus({
          orderId: orderId as OrderId,
          status: nextStatus,
        });
      }).pipe(
        Effect.tap(() => Effect.sync(() => fetchOrders())),
        Effect.ensuring(Effect.sync(() => setAdvancing(null))),
        Effect.tapErrorCause(() =>
          Effect.sync(() => setError("Failed to update status"))
        ),
        Effect.scoped,
        Effect.catchAll(() => Effect.void)
      );

      Effect.runPromise(effect);
    },
    [fetchOrders]
  );

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

  return (
    <section className={styles.container}>
      <h2 className={styles.heading}>Kitchen Queue</h2>
      <div className={styles.columns}>
        {TRACKED_STATUSES.map((status) => {
          const orders = ordersByStatus[status] ?? [];
          return (
            <div key={status} className={styles.column}>
              <h3 className={styles.columnHeading}>
                {STATUS_LABELS[status]}
                <span className={styles.count}>{orders.length}</span>
              </h3>
              <div className={styles.cardList}>
                {orders.length === 0 && (
                  <p className={styles.emptyColumn}>No orders</p>
                )}
                {orders.map((order) => (
                  <div key={order.id} className={styles.orderCard}>
                    <div className={styles.cardHeader}>
                      <span className={styles.orderId}>#{order.id}</span>
                      <PriceTag amount={order.totalPrice} />
                    </div>
                    <ul className={styles.itemSummary}>
                      {order.items.map((item) => (
                        <li key={item.menuItemId} className={styles.summaryItem}>
                          {item.quantity}x {item.name}
                        </li>
                      ))}
                    </ul>
                    {NEXT_STATUS[status] && (
                      <Button
                        variant="primary"
                        loading={advancing === order.id}
                        disabled={advancing === order.id}
                        onClick={() => advanceStatus(order.id, status)}
                      >
                        {ADVANCE_LABELS[status]}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
