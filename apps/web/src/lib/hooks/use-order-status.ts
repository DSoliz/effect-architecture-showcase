"use client";

import { useEffect, useRef, useState } from "react";
import { OrderId, OrderStatus } from "@/lib/domain";

const TERMINAL_STATUSES: ReadonlySet<OrderStatus> = new Set(["delivered", "cancelled"]);

export function useOrderStatus(orderId: OrderId, initialStatus?: OrderStatus | null) {
  const [status, setStatus] = useState<OrderStatus | null>(null);
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const resolved = initialStatus != null;
  const terminal = resolved && TERMINAL_STATUSES.has(initialStatus);

  useEffect(() => {
    if (!resolved || terminal) return;

    const es = new EventSource(`/api/orders/${orderId}/sse`);
    eventSourceRef.current = es;

    es.onopen = () => setConnected(true);

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const newStatus = data.status as OrderStatus;
        setStatus(newStatus);

        if (TERMINAL_STATUSES.has(newStatus)) {
          es.close();
          eventSourceRef.current = null;
          setConnected(false);
        }
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      setConnected(false);
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
      setConnected(false);
    };
  }, [orderId, resolved, terminal]);

  return { status, connected };
}
