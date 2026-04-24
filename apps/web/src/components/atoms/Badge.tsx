"use client";

import React from "react";
import styles from "./Badge.module.css";

interface BadgeProps {
  variant: "status" | "category";
  color?: string;
  children: React.ReactNode;
}

export function Badge({ variant, color, children }: BadgeProps) {
  return (
    <span className={styles.badge}>
      {variant === "status" && (
        <span
          className={styles.dot}
          style={{ backgroundColor: color ?? "currentColor" }}
        />
      )}
      {children}
    </span>
  );
}
