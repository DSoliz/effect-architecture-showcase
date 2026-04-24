import { Context, Effect, Layer } from "effect";
import Loki from "lokijs";
import {
  MenuItem,
  MenuItemId,
  MenuItemNotFoundError,
  Category,
} from "@/lib/domain";

export class MenuService extends Context.Tag("MenuService")<
  MenuService,
  {
    readonly getAll: Effect.Effect<MenuItem[]>;
    readonly getById: (
      id: MenuItemId
    ) => Effect.Effect<MenuItem, MenuItemNotFoundError>;
    readonly getByCategory: (category: Category) => Effect.Effect<MenuItem[]>;
  }
>() {}

const seedMenuItems: Array<typeof MenuItem.Encoded> = [
  {
    id: "menu-001" as MenuItemId,
    name: "Bruschetta",
    description: "Toasted bread topped with fresh tomatoes, garlic, and basil",
    price: 8.99,
    category: "appetizer",
    imageUrl: "/images/bruschetta.jpg",
    available: true,
  },
  {
    id: "menu-002" as MenuItemId,
    name: "Calamari Fritti",
    description: "Crispy fried squid with marinara dipping sauce",
    price: 11.99,
    category: "appetizer",
    imageUrl: "/images/calamari.jpg",
    available: true,
  },
  {
    id: "menu-003" as MenuItemId,
    name: "Grilled Salmon",
    description: "Atlantic salmon with lemon herb butter and seasonal vegetables",
    price: 24.99,
    category: "main",
    imageUrl: "/images/salmon.jpg",
    available: true,
  },
  {
    id: "menu-004" as MenuItemId,
    name: "Ribeye Steak",
    description: "12oz prime ribeye with garlic mashed potatoes and asparagus",
    price: 34.99,
    category: "main",
    imageUrl: "/images/ribeye.jpg",
    available: true,
  },
  {
    id: "menu-005" as MenuItemId,
    name: "Mushroom Risotto",
    description: "Creamy arborio rice with wild mushrooms and parmesan",
    price: 18.99,
    category: "main",
    imageUrl: "/images/risotto.jpg",
    available: true,
  },
  {
    id: "menu-006" as MenuItemId,
    name: "Caesar Salad",
    description: "Romaine lettuce with caesar dressing, croutons, and parmesan",
    price: 10.99,
    category: "side",
    imageUrl: "/images/caesar.jpg",
    available: true,
  },
  {
    id: "menu-007" as MenuItemId,
    name: "Truffle Fries",
    description: "Crispy fries tossed with truffle oil and parmesan",
    price: 9.99,
    category: "side",
    imageUrl: "/images/fries.jpg",
    available: true,
  },
  {
    id: "menu-008" as MenuItemId,
    name: "Garlic Bread",
    description: "Warm ciabatta with roasted garlic butter",
    price: 6.99,
    category: "side",
    imageUrl: "/images/garlic-bread.jpg",
    available: true,
  },
  {
    id: "menu-009" as MenuItemId,
    name: "Sparkling Water",
    description: "San Pellegrino 500ml",
    price: 3.99,
    category: "drink",
    imageUrl: "/images/sparkling-water.jpg",
    available: true,
  },
  {
    id: "menu-010" as MenuItemId,
    name: "Fresh Lemonade",
    description: "House-made lemonade with mint",
    price: 4.99,
    category: "drink",
    imageUrl: "/images/lemonade.jpg",
    available: true,
  },
  {
    id: "menu-011" as MenuItemId,
    name: "Espresso",
    description: "Double shot of Italian espresso",
    price: 3.49,
    category: "drink",
    imageUrl: "/images/espresso.jpg",
    available: true,
  },
  {
    id: "menu-012" as MenuItemId,
    name: "Tiramisu",
    description: "Classic Italian dessert with mascarpone and espresso-soaked ladyfingers",
    price: 9.99,
    category: "dessert",
    imageUrl: "/images/tiramisu.jpg",
    available: true,
  },
  {
    id: "menu-013" as MenuItemId,
    name: "Panna Cotta",
    description: "Vanilla bean panna cotta with berry compote",
    price: 8.99,
    category: "dessert",
    imageUrl: "/images/panna-cotta.jpg",
    available: true,
  },
];

interface MenuItemRecord {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  available: boolean;
}

const toMenuItem = (doc: MenuItemRecord) =>
  new MenuItem({
    id: doc.id as MenuItemId,
    name: doc.name,
    description: doc.description,
    price: doc.price,
    category: doc.category as Category,
    imageUrl: doc.imageUrl,
    available: doc.available,
  });

export const MenuServiceLive = Layer.sync(MenuService, () => {
  const db = new Loki("menu.db");
  const items = db.addCollection<MenuItemRecord>("menu-items");
  items.insert(seedMenuItems as unknown as MenuItemRecord[]);

  return {
    getAll: Effect.sync(() => items.find().map(toMenuItem)),

    getById: (id: MenuItemId) =>
      Effect.gen(function* () {
        const doc = items.findOne({ id: id as string });
        if (!doc) {
          return yield* new MenuItemNotFoundError({ menuItemId: id });
        }
        return toMenuItem(doc);
      }),

    getByCategory: (category: Category) =>
      Effect.sync(() =>
        items.find({ category } as LokiQuery<MenuItemRecord>).map(toMenuItem)
      ),
  };
});
