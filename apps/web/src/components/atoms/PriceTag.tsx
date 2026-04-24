"use client";

import styles from "./PriceTag.module.css";

interface PriceTagProps {
  amount: number;
  className?: string;
}

const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function PriceTag({ amount, className }: PriceTagProps) {
  return (
    <span
      className={`${styles.priceTag}${className ? ` ${className}` : ""}`}
    >
      {formatter.format(amount)}
    </span>
  );
}
