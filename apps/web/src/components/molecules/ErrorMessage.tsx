"use client";

import styles from "./ErrorMessage.module.css";

interface TaggedError {
  _tag: string;
  [key: string]: unknown;
}

interface ErrorMessageProps {
  error: TaggedError | string | null;
}

function getMessage(error: TaggedError | string): string {
  if (typeof error === "string") {
    return error;
  }

  switch (error._tag) {
    case "MenuItemNotFoundError":
      return "The menu item could not be found.";
    case "ItemOutOfStockError":
      return "Sorry, this item is currently out of stock.";
    case "OrderNotFoundError":
      return "Order not found.";
    case "InvalidOrderError":
      return typeof error.reason === "string" ? error.reason : "Invalid order.";
    case "OrderStatusTransitionError":
      return "This status change is not allowed.";
    default:
      return "An unexpected error occurred.";
  }
}

export function ErrorMessage({ error }: ErrorMessageProps) {
  if (error === null) {
    return null;
  }

  return (
    <div className={styles.errorContainer} role="alert">
      <span className={styles.errorIcon}>!</span>
      <span className={styles.errorText}>{getMessage(error)}</span>
    </div>
  );
}
