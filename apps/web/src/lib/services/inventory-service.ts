import { Context, Effect, Layer } from "effect";
import Loki from "lokijs";
import { MenuItemId, ItemOutOfStockError } from "@/lib/domain";

export class InventoryService extends Context.Tag("InventoryService")<
  InventoryService,
  {
    readonly checkStock: (id: MenuItemId) => Effect.Effect<number>;
    readonly reserve: (
      id: MenuItemId,
      quantity: number
    ) => Effect.Effect<void, ItemOutOfStockError>;
    readonly release: (id: MenuItemId, quantity: number) => Effect.Effect<void>;
  }
>() {}

interface StockRecord {
  menuItemId: string;
  quantity: number;
}

const seedStock: StockRecord[] = [
  { menuItemId: "menu-001", quantity: 20 },
  { menuItemId: "menu-002", quantity: 15 },
  { menuItemId: "menu-003", quantity: 10 },
  { menuItemId: "menu-004", quantity: 8 },
  { menuItemId: "menu-005", quantity: 12 },
  { menuItemId: "menu-006", quantity: 25 },
  { menuItemId: "menu-007", quantity: 30 },
  { menuItemId: "menu-008", quantity: 20 },
  { menuItemId: "menu-009", quantity: 50 },
  { menuItemId: "menu-010", quantity: 40 },
  { menuItemId: "menu-011", quantity: 60 },
  { menuItemId: "menu-012", quantity: 15 },
  { menuItemId: "menu-013", quantity: 15 },
];

export const InventoryServiceLive = Layer.sync(InventoryService, () => {
  const db = new Loki("inventory.db");
  const stock = db.addCollection<StockRecord>("stock");
  stock.insert(seedStock);

  return {
    checkStock: (id: MenuItemId) =>
      Effect.sync(() => {
        const record = stock.findOne({ menuItemId: id as string });
        return record?.quantity ?? 0;
      }),

    reserve: (id: MenuItemId, quantity: number) =>
      Effect.gen(function* () {
        const record = stock.findOne({ menuItemId: id as string });
        const available = record?.quantity ?? 0;

        if (available < quantity) {
          return yield* new ItemOutOfStockError({
            menuItemId: id,
            requested: quantity,
            available,
          });
        }

        if (record) {
          record.quantity -= quantity;
          stock.update(record);
        }
      }),

    release: (id: MenuItemId, quantity: number) =>
      Effect.sync(() => {
        const record = stock.findOne({ menuItemId: id as string });
        if (record) {
          record.quantity += quantity;
          stock.update(record);
        }
      }),
  };
});
