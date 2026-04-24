"use client";

import React from "react";
import styles from "./Button.module.css";

interface ButtonProps {
  variant: "primary" | "secondary" | "danger";
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
}

export function Button({
  variant,
  loading = false,
  disabled = false,
  children,
  onClick,
  type = "button",
}: ButtonProps) {
  return (
    <button
      className={`${styles.button} ${styles[variant]}`}
      disabled={disabled || loading}
      onClick={onClick}
      type={type}
    >
      {loading ? "..." : children}
    </button>
  );
}
