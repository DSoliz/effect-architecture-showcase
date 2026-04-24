"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Effect } from "effect";
import { CartPanel } from "@/components/organisms";
import { ErrorMessage } from "@/components/molecules";
import { useCart } from "@/lib/hooks/use-cart";
import { makeClient } from "@/lib/rpc/client";
import { OrderItem } from "@/lib/domain";
import type { CartItem } from "@/lib/stores/cart";

export default function CartPage() {
  const router = useRouter();
  const { clearCart } = useCart();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handlePlaceOrder = (items: CartItem[]) => {
    setSubmitting(true);
    setError(null);

    const orderItems = items.map(
      (ci) =>
        new OrderItem({
          menuItemId: ci.menuItem.id,
          name: ci.menuItem.name,
          quantity: ci.quantity,
          unitPrice: ci.menuItem.price,
        })
    );

    const effect = Effect.gen(function* () {
      const client = yield* makeClient;
      return yield* client.PlaceOrder({ items: orderItems });
    }).pipe(
      Effect.tap((order) =>
        Effect.sync(() => {
          clearCart();
          router.push(`/orders/${order.id}`);
        })
      ),
      Effect.tapErrorCause(() =>
        Effect.sync(() => {
          setError("Failed to place order");
          setSubmitting(false);
        })
      ),
      Effect.scoped,
      Effect.catchAll(() => Effect.void)
    );

    Effect.runPromise(effect);
  };

  return (
    <div>
      <h1>Your Cart</h1>
      <ErrorMessage error={error} />
      <CartPanel onPlaceOrder={handlePlaceOrder} />
    </div>
  );
}
