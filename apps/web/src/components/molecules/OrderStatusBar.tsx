"use client";

import type { OrderStatus } from "@/lib/domain";
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
  currentIndex: number,
  isLastStep: boolean
): "completed" | "active" | "upcoming" {
  if (isLastStep && stepIndex === currentIndex) return "completed";
  if (stepIndex < currentIndex) return "completed";
  if (stepIndex === currentIndex) return "active";
  return "upcoming";
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M3 7.5L5.5 10L11 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function OrderStatusBar({ currentStatus }: OrderStatusBarProps) {
  if (currentStatus === "cancelled") {
    return (
      <div className={styles.cancelledContainer}>
        <Badge variant="status" color="var(--color-error)">
          Cancelled
        </Badge>
        <div className={styles.track}>
          {STEPS.map((step, i) => (
            <div key={step.status} className={styles.stepWrapper}>
              {i > 0 && <div className={`${styles.connector} ${styles.connectorCancelled}`} />}
              <div className={`${styles.circle} ${styles.circleCancelled}`}>
                {i + 1}
              </div>
              <span className={`${styles.label} ${styles.labelCancelled}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.status === currentStatus);

  return (
    <div className={styles.track}>
      {STEPS.map((step, i) => {
        const isLastStep = currentIndex === STEPS.length - 1;
        const state = getStepState(i, currentIndex, isLastStep);

        const circleClass =
          state === "completed"
            ? styles.circleCompleted
            : state === "active"
              ? styles.circleActive
              : styles.circleUpcoming;

        const labelClass =
          state === "completed"
            ? styles.labelCompleted
            : state === "active"
              ? styles.labelActive
              : styles.labelUpcoming;

        const connectorClass =
          state === "completed"
            ? styles.connectorCompleted
            : styles.connectorUpcoming;

        return (
          <div key={step.status} className={styles.stepWrapper}>
            {i > 0 && <div className={`${styles.connector} ${connectorClass}`} />}
            <div className={`${styles.circle} ${circleClass}`}>
              {state === "completed" ? <CheckIcon /> : i + 1}
            </div>
            <span className={`${styles.label} ${labelClass}`}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
