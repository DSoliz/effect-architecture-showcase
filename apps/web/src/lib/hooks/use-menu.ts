"use client";

import { useEffect, useState } from "react";
import { Effect } from "effect";
import { MenuItem, Category } from "@/lib/domain";
import { makeClient } from "@/lib/rpc/client";

export function useMenu(category?: Category) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const effect = Effect.gen(function* () {
      const client = yield* makeClient;
      const result = category
        ? yield* client.GetMenuByCategory({ category })
        : yield* client.GetMenu();
      return [...result];
    }).pipe(
      Effect.tap((result) => Effect.sync(() => setItems(result))),
      Effect.tapErrorCause(() =>
        Effect.sync(() => setError("Failed to load menu"))
      ),
      Effect.ensuring(Effect.sync(() => setLoading(false))),
      Effect.scoped,
      Effect.catchAll(() => Effect.void)
    );

    Effect.runPromise(effect);
  }, [category]);

  return { items, loading, error };
}
