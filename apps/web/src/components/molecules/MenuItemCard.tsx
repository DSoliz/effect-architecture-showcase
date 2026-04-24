"use client";

import type { MenuItem } from "@/lib/domain";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { PriceTag } from "@/components/atoms/PriceTag";
import styles from "./MenuItemCard.module.css";

interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem) => void;
}

export function MenuItemCard({ item, onAddToCart }: MenuItemCardProps) {
  const disabled = !item.available;

  return (
    <div className={`${styles.card}${disabled ? ` ${styles.cardDisabled}` : ""}`}>
      <div className={styles.imagePlaceholder}>
        {item.name.charAt(0).toUpperCase()}
      </div>
      <div className={styles.content}>
        <div className={styles.header}>
          <span className={styles.name}>{item.name}</span>
          <Badge variant="category">{item.category}</Badge>
        </div>
        <p className={styles.description}>{item.description}</p>
        <div className={styles.footer}>
          <PriceTag amount={item.price} />
          <Button
            variant="primary"
            disabled={disabled}
            onClick={() => onAddToCart(item)}
          >
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  );
}
