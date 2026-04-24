"use client";

import { useEffect, useRef, useState } from "react";
import { OrderId, OrderStatus } from "@/lib/domain";

export function useOrderStatus(orderId: OrderId) {
  const [status, setStatus] = useState<OrderStatus | null>(null);
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource(`/api/orders/${orderId}/sse`);
    eventSourceRef.current = es;

    es.onopen = () => setConnected(true);

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setStatus(data.status as OrderStatus);
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
  }, [orderId]);

  return { status, connected };
}
