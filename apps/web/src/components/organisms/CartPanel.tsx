"use client";

import { useCart } from "@/lib/hooks/use-cart";
import type { CartItem } from "@/lib/stores/cart";
import { Button } from "@/components/atoms";
import { PriceTag } from "@/components/atoms";
import { CartItemRow } from "@/components/molecules/CartItemRow";
import styles from "./CartPanel.module.css";

interface CartPanelProps {
  onPlaceOrder: (items: CartItem[]) => void;
}

export function CartPanel({ onPlaceOrder }: CartPanelProps) {
  const { items, totalPrice, updateQuantity, removeItem } = useCart();
  const isEmpty = items.length === 0;

  return (
    <section className={styles.panel}>
      <h2 className={styles.heading}>Your Cart</h2>

      {isEmpty && (
        <p className={styles.emptyMessage}>Your cart is empty.</p>
      )}

      {!isEmpty && (
        <>
          <div className={styles.itemList}>
            {items.map((item) => (
              <CartItemRow
                key={item.menuItem.id}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeItem}
              />
            ))}
          </div>

          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>Total</span>
            <PriceTag amount={totalPrice} className={styles.totalPrice} />
          </div>
        </>
      )}

      <div className={styles.actions}>
        <Button
          variant="primary"
          disabled={isEmpty}
          onClick={() => onPlaceOrder(items)}
        >
          Place Order
        </Button>
      </div>
    </section>
  );
}
