"use client";

import { useEffect, useState } from "react";
import { Effect } from "effect";
import { Order, OrderId } from "@/lib/domain";
import { makeClient } from "@/lib/rpc/client";

export function useOrder(orderId: OrderId) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const effect = Effect.gen(function* () {
      const client = yield* makeClient;
      return yield* client.GetOrder({ orderId });
    }).pipe(
      Effect.tap((result) => Effect.sync(() => setOrder(result))),
      Effect.tapErrorCause(() =>
        Effect.sync(() => setError("Failed to load order"))
      ),
      Effect.ensuring(Effect.sync(() => setLoading(false))),
      Effect.scoped,
      Effect.catchAll(() => Effect.void)
    );

    Effect.runPromise(effect);
  }, [orderId]);

  return { order, loading, error };
}
