"use client";

import type { OrderStatus } from "@/lib/domain";
import { StatusDot } from "@/components/atoms/StatusDot";
import { Badge } from "@/components/atoms/Badge";
import styles from "./OrderStatusBar.module.css";

interface OrderStatusBarProps {
  currentStatus: OrderStatus;
}

const STEPS: { status: OrderStatus; label: string }[] = [
  { status: "placed", label: "Placed" },
  { status: "confirmed", label: "Confirmed" },
  { status: "preparing", label: "Preparing" },
  { status: "ready", label: "Ready" },
  { status: "picked-up", label: "Picked Up" },
  { status: "delivered", label: "Delivered" },
];

function getStepState(
  stepIndex: number,
  currentIndex: number
): "completed" | "active" | "upcoming" {
  if (stepIndex < currentIndex) return "completed";
  if (stepIndex === currentIndex) return "active";
  return "upcoming";
}

const STATE_TO_DOT_STATUS: Record<"completed" | "active" | "upcoming", OrderStatus> = {
  completed: "picked-up",
  active: "confirmed",
  upcoming: "placed",
};

export function OrderStatusBar({ currentStatus }: OrderStatusBarProps) {
  if (currentStatus === "cancelled") {
    return (
      <div className={styles.cancelledContainer}>
        <Badge variant="status" color="var(--color-error)">
          Cancelled
        </Badge>
        <div className={styles.cancelledSteps}>
          {STEPS.map((step, i) => (
            <div key={step.status} className={`${styles.step} ${styles.stepCancelled}`}>
              <StatusDot status="cancelled" />
              <span className={styles.stepLabel}>{step.label}</span>
              {i < STEPS.length - 1 && <div className={styles.connector} />}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.status === currentStatus);

  return (
    <div className={styles.container}>
      {STEPS.map((step, i) => {
        const state = getStepState(i, currentIndex);
        const stepClass =
          state === "completed"
            ? styles.stepCompleted
            : state === "active"
              ? styles.stepActive
              : styles.stepUpcoming;

        return (
          <div key={step.status}>
            <div className={`${styles.step} ${stepClass}`}>
              <StatusDot status={STATE_TO_DOT_STATUS[state]} />
              <span className={styles.stepLabel}>{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`${styles.connector}${
                  state === "completed" ? ` ${styles.connectorCompleted}` : ""
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
