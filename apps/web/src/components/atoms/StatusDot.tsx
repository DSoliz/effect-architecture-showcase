"use client";

import styles from "./StatusDot.module.css";

interface StatusDotProps {
  status: "placed" | "confirmed" | "preparing" | "ready" | "picked-up" | "delivered" | "cancelled";
}

const statusClassMap: Record<StatusDotProps["status"], string> = {
  placed: styles.placed,
  confirmed: styles.confirmed,
  preparing: styles.preparing,
  ready: styles.ready,
  "picked-up": styles.pickedUp,
  delivered: styles.delivered,
  cancelled: styles.cancelled,
};

export function StatusDot({ status }: StatusDotProps) {
  return (
    <span
      className={`${styles.dot} ${statusClassMap[status]}`}
      role="img"
      aria-label={`Status: ${status}`}
    />
  );
}
