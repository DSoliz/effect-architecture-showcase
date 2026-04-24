"use client";

import type { MenuItem } from "@/lib/domain";
import { Button } from "@/components/atoms/Button";
import { PriceTag } from "@/components/atoms/PriceTag";
import styles from "./CartItemRow.module.css";

interface CartItemRowProps {
  item: { menuItem: MenuItem; quantity: number };
  onRemove: (id: string) => void;
  onUpdateQuantity: (id: string, qty: number) => void;
}

export function CartItemRow({ item, onRemove, onUpdateQuantity }: CartItemRowProps) {
  const { menuItem, quantity } = item;
  const lineTotal = menuItem.price * quantity;

  return (
    <div className={styles.row}>
      <span className={styles.name}>{menuItem.name}</span>
      <div className={styles.quantityControls}>
        <button
          className={styles.quantityButton}
          disabled={quantity <= 1}
          onClick={() => onUpdateQuantity(menuItem.id, quantity - 1)}
          type="button"
        >
          -
        </button>
        <span className={styles.quantityValue}>{quantity}</span>
        <button
          className={styles.quantityButton}
          onClick={() => onUpdateQuantity(menuItem.id, quantity + 1)}
          type="button"
        >
          +
        </button>
      </div>
      <span className={styles.unitPrice}>
        <PriceTag amount={menuItem.price} /> each
      </span>
      <span className={styles.lineTotal}>
        <PriceTag amount={lineTotal} />
      </span>
      <Button variant="danger" onClick={() => onRemove(menuItem.id)}>
        Remove
      </Button>
    </div>
  );
}
