"use client";

import { useCart } from "@/lib/hooks/use-cart";
import styles from "./CartIndicator.module.css";

export function CartIndicator() {
  const { itemCount } = useCart();

  if (itemCount === 0) return null;

  return <span className={styles.badge}>{itemCount}</span>;
}
