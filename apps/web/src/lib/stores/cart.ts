import { createStore } from "@xstate/store";
import { MenuItem } from "@/lib/domain";

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

const STORAGE_KEY = "effect-eats-cart";

function loadFromStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CartItem[];
  } catch {
    return [];
  }
}

function saveToStorage(items: CartItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore quota errors
  }
}

export const cartStore = createStore({
  context: {
    items: loadFromStorage(),
  },
  on: {
    addItem: (context, event: { menuItem: MenuItem }) => {
      const existing = context.items.find(
        (i) => i.menuItem.id === event.menuItem.id
      );
      let items: CartItem[];
      if (existing) {
        items = context.items.map((i) =>
          i.menuItem.id === event.menuItem.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      } else {
        items = [...context.items, { menuItem: event.menuItem, quantity: 1 }];
      }
      saveToStorage(items);
      return { items };
    },

    removeItem: (context, event: { menuItemId: string }) => {
      const items = context.items.filter(
        (i) => i.menuItem.id !== event.menuItemId
      );
      saveToStorage(items);
      return { items };
    },

    updateQuantity: (
      context,
      event: { menuItemId: string; quantity: number }
    ) => {
      let items: CartItem[];
      if (event.quantity <= 0) {
        items = context.items.filter(
          (i) => i.menuItem.id !== event.menuItemId
        );
      } else {
        items = context.items.map((i) =>
          i.menuItem.id === event.menuItemId
            ? { ...i, quantity: event.quantity }
            : i
        );
      }
      saveToStorage(items);
      return { items };
    },

    clearCart: () => {
      saveToStorage([]);
      return { items: [] as CartItem[] };
    },
  },
});

export function getCartTotalPrice(items: CartItem[]): number {
  return items.reduce(
    (sum, item) => sum + item.menuItem.price * item.quantity,
    0
  );
}

export function getCartItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}
