import { describe, it, expect } from "vitest";
import { Cause, Effect, Exit, Layer, Option, Ref } from "effect";
import {
  MenuItem,
  MenuItemId,
  MenuItemNotFoundError,
  Category,
} from "@/lib/domain";
import { MenuService } from "./menu-service";

// ---------------------------------------------------------------------------
// Test layer — in-memory implementation using Ref
// ---------------------------------------------------------------------------

const seedItems: MenuItem[] = [
  new MenuItem({
    id: "menu-001" as MenuItemId,
    name: "Bruschetta",
    description: "Toasted bread with tomatoes",
    price: 8.99,
    category: "appetizer",
    imageUrl: "/img/bruschetta.jpg",
    available: true,
  }),
  new MenuItem({
    id: "menu-002" as MenuItemId,
    name: "Grilled Salmon",
    description: "Atlantic salmon with herbs",
    price: 24.99,
    category: "main",
    imageUrl: "/img/salmon.jpg",
    available: true,
  }),
  new MenuItem({
    id: "menu-003" as MenuItemId,
    name: "Espresso",
    description: "Double shot",
    price: 3.49,
    category: "drink",
    imageUrl: "/img/espresso.jpg",
    available: false,
  }),
];

const MenuServiceTest = Layer.effect(
  MenuService,
  Effect.gen(function* () {
    const items = yield* Ref.make<MenuItem[]>([...seedItems]);

    return {
      getAll: Ref.get(items),

      getById: (id: MenuItemId) =>
        Effect.gen(function* () {
          const all = yield* Ref.get(items);
          const found = all.find((i) => i.id === id);
          if (!found) {
            return yield* new MenuItemNotFoundError({ menuItemId: id });
          }
          return found;
        }),

      getByCategory: (category: Category) =>
        Ref.get(items).pipe(
          Effect.map((all) => all.filter((i) => i.category === category))
        ),
    };
  })
);

const run = <A, E>(effect: Effect.Effect<A, E, MenuService>) =>
  Effect.runPromise(Effect.provide(effect, MenuServiceTest));

const runExit = <A, E>(effect: Effect.Effect<A, E, MenuService>) =>
  Effect.runPromiseExit(Effect.provide(effect, MenuServiceTest));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("MenuService", () => {
  describe("getAll", () => {
    it("returns all menu items", async () => {
      const items = await run(
        Effect.gen(function* () {
          const svc = yield* MenuService;
          return yield* svc.getAll;
        })
      );

      expect(items).toHaveLength(3);
      expect(items.map((i) => i.id)).toEqual([
        "menu-001",
        "menu-002",
        "menu-003",
      ]);
    });
  });

  describe("getById", () => {
    it("returns the item when it exists", async () => {
      const item = await run(
        Effect.gen(function* () {
          const svc = yield* MenuService;
          return yield* svc.getById("menu-001" as MenuItemId);
        })
      );

      expect(item.name).toBe("Bruschetta");
    });

    it("fails with MenuItemNotFoundError for unknown id", async () => {
      const result = await runExit(
        Effect.gen(function* () {
          const svc = yield* MenuService;
          return yield* svc.getById("nonexistent" as MenuItemId);
        })
      );

      expect(Exit.isFailure(result)).toBe(true);
      if (Exit.isFailure(result)) {
        const error = Option.getOrThrow(Cause.failureOption(result.cause));
        expect((error as any)._tag).toBe("MenuItemNotFoundError");
      }
    });
  });

  describe("getByCategory", () => {
    it("filters items by category", async () => {
      const items = await run(
        Effect.gen(function* () {
          const svc = yield* MenuService;
          return yield* svc.getByCategory("appetizer");
        })
      );

      expect(items).toHaveLength(1);
      expect(items[0].name).toBe("Bruschetta");
    });

    it("returns empty array for category with no items", async () => {
      const items = await run(
        Effect.gen(function* () {
          const svc = yield* MenuService;
          return yield* svc.getByCategory("dessert");
        })
      );

      expect(items).toHaveLength(0);
    });
  });
});
