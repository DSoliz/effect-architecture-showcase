"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Effect } from "effect";
import type { Order, OrderStatus } from "@/lib/domain";
import { makeClient } from "@/lib/rpc/client";
import { useOrderStatus } from "@/lib/hooks/use-order-status";
import { Spinner, PriceTag } from "@/components/atoms";
import { StatusDot } from "@/components/atoms/StatusDot";
import { Badge } from "@/components/atoms/Badge";
import { ErrorMessage } from "@/components/molecules";
import styles from "./page.module.css";

function LiveOrderCard({ order }: { order: Order }) {
  const { status: liveStatus } = useOrderStatus(order.id);
  const displayStatus = liveStatus ?? order.status;

  return (
    <Link href={`/orders/${order.id}`} className={styles.orderCard}>
      <div className={styles.cardHeader}>
        <span className={styles.orderId}>#{order.id.slice(0, 8)}</span>
        <span className={styles.statusBadge}>
          <StatusDot status={displayStatus} />
          {displayStatus}
        </span>
      </div>
      <div className={styles.cardBody}>
        <span className={styles.itemCount}>
          {order.items.length} item{order.items.length !== 1 && "s"}
        </span>
        <PriceTag amount={order.totalPrice} />
      </div>
    </Link>
  );
}

function PastOrderCard({ order }: { order: Order }) {
  return (
    <Link href={`/orders/${order.id}`} className={styles.orderCard}>
      <div className={styles.cardHeader}>
        <span className={styles.orderId}>#{order.id.slice(0, 8)}</span>
        <Badge variant="status">{order.status}</Badge>
      </div>
      <div className={styles.cardBody}>
        <span className={styles.itemCount}>
          {order.items.length} item{order.items.length !== 1 && "s"}
        </span>
        <PriceTag amount={order.totalPrice} />
      </div>
    </Link>
  );
}

const TERMINAL_STATUSES: OrderStatus[] = ["delivered", "cancelled"];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const effect = Effect.gen(function* () {
      const client = yield* makeClient;
      return yield* client.ListAllOrders();
    }).pipe(
      Effect.tap((result) => Effect.sync(() => setOrders([...result]))),
      Effect.tapErrorCause(() =>
        Effect.sync(() => setError("Failed to load orders"))
      ),
      Effect.ensuring(Effect.sync(() => setLoading(false))),
      Effect.scoped,
      Effect.catchAll(() => Effect.void)
    );

    Effect.runPromise(effect);
  }, []);

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

  const ongoing = orders.filter(
    (o) => !TERMINAL_STATUSES.includes(o.status)
  );
  const past = orders.filter((o) => TERMINAL_STATUSES.includes(o.status));

  return (
    <div>
      <h1>Orders</h1>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Ongoing ({ongoing.length})</h2>
        {ongoing.length === 0 && (
          <p className={styles.empty}>No ongoing orders.</p>
        )}
        <div className={styles.orderList}>
          {ongoing.map((order) => (
            <LiveOrderCard key={order.id} order={order} />
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Past ({past.length})</h2>
        {past.length === 0 && (
          <p className={styles.empty}>No past orders.</p>
        )}
        <div className={styles.orderList}>
          {past.map((order) => (
            <PastOrderCard key={order.id} order={order} />
          ))}
        </div>
      </section>
    </div>
  );
}
