"use client";

import { useState } from "react";
import type { Category } from "@/lib/domain";
import { useMenu } from "@/lib/hooks/use-menu";
import { useCart } from "@/lib/hooks/use-cart";
import { Spinner } from "@/components/atoms";
import { CategoryFilter } from "@/components/molecules/CategoryFilter";
import { MenuItemCard } from "@/components/molecules/MenuItemCard";
import { ErrorMessage } from "@/components/molecules/ErrorMessage";
import styles from "./MenuGrid.module.css";

export function MenuGrid() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const { items, loading, error } = useMenu(
    selectedCategory ?? undefined
  );
  const { addItem } = useCart();

  return (
    <section className={styles.container}>
      <CategoryFilter
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />

      {loading && (
        <div className={styles.centered}>
          <Spinner size="lg" />
        </div>
      )}

      {error && <ErrorMessage error={error} />}

      {!loading && !error && items.length === 0 && (
        <p className={styles.emptyMessage}>No menu items found.</p>
      )}

      {!loading && !error && items.length > 0 && (
        <div className={styles.grid}>
          {items.map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              onAddToCart={addItem}
            />
          ))}
        </div>
      )}
    </section>
  );
}
