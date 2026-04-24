"use client";

import type { Category } from "@/lib/domain";
import styles from "./CategoryFilter.module.css";

interface CategoryFilterProps {
  selected: Category | null;
  onSelect: (cat: Category | null) => void;
}

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "appetizer", label: "Appetizer" },
  { value: "main", label: "Main" },
  { value: "side", label: "Side" },
  { value: "drink", label: "Drink" },
  { value: "dessert", label: "Dessert" },
];

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  return (
    <div className={styles.filterRow}>
      <button
        type="button"
        className={`${styles.filterButton}${selected === null ? ` ${styles.filterButtonActive}` : ""}`}
        onClick={() => onSelect(null)}
      >
        All
      </button>
      {CATEGORIES.map((cat) => (
        <button
          key={cat.value}
          type="button"
          className={`${styles.filterButton}${selected === cat.value ? ` ${styles.filterButtonActive}` : ""}`}
          onClick={() => onSelect(cat.value)}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
