"use client";

import { useSyncExternalStore } from "react";
import {
  cartStore,
  CartItem,
  getCartTotalPrice,
  getCartItemCount,
} from "@/lib/stores/cart";
import { MenuItem } from "@/lib/domain";

const EMPTY_ITEMS: CartItem[] = [];

export function useCart() {
  const items = useSyncExternalStore(
    (cb) => {
      const sub = cartStore.subscribe(cb);
      return () => sub.unsubscribe();
    },
    () => cartStore.getSnapshot().context.items,
    () => EMPTY_ITEMS
  );

  return {
    items,
    totalPrice: getCartTotalPrice(items),
    itemCount: getCartItemCount(items),
    addItem: (menuItem: MenuItem) =>
      cartStore.send({ type: "addItem", menuItem }),
    removeItem: (menuItemId: string) =>
      cartStore.send({ type: "removeItem", menuItemId }),
    updateQuantity: (menuItemId: string, quantity: number) =>
      cartStore.send({ type: "updateQuantity", menuItemId, quantity }),
    clearCart: () => cartStore.send({ type: "clearCart" }),
  };
}
