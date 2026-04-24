import { describe, it, expect } from "vitest";
import { Cause, Effect, Exit, Layer, Option, Ref } from "effect";
import { MenuItemId, ItemOutOfStockError } from "@/lib/domain";
import { InventoryService } from "./inventory-service";

// ---------------------------------------------------------------------------
// Test layer — in-memory implementation using Ref
// ---------------------------------------------------------------------------

const makeInventoryServiceTest = (initialStock: Record<string, number> = { "item-1": 20, "item-2": 5 }) =>
  Layer.effect(
    InventoryService,
    Effect.gen(function* () {
      const stock = yield* Ref.make<Record<string, number>>({ ...initialStock });

      return {
        checkStock: (id: MenuItemId) =>
          Ref.get(stock).pipe(
            Effect.map((s) => s[id as string] ?? 0)
          ),

        reserve: (id: MenuItemId, quantity: number) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(stock);
            const available = s[id as string] ?? 0;
            if (available < quantity) {
              return yield* new ItemOutOfStockError({
                menuItemId: id,
                requested: quantity,
                available,
              });
            }
            yield* Ref.update(stock, (prev: Record<string, number>) => ({
              ...prev,
              [id as string]: prev[id as string]! - quantity,
            }));
          }),

        release: (id: MenuItemId, quantity: number) =>
          Ref.update(stock, (prev: Record<string, number>) => ({
            ...prev,
            [id as string]: (prev[id as string] ?? 0) + quantity,
          })),
      };
    })
  );

const TestLayer = makeInventoryServiceTest();

const run = <A, E>(effect: Effect.Effect<A, E, InventoryService>) =>
  Effect.runPromise(Effect.provide(effect, TestLayer));

const runExit = <A, E>(effect: Effect.Effect<A, E, InventoryService>) =>
  Effect.runPromiseExit(Effect.provide(effect, TestLayer));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("InventoryService", () => {
  describe("checkStock", () => {
    it("returns stock for a known item", async () => {
      const qty = await run(
        Effect.gen(function* () {
          const svc = yield* InventoryService;
          return yield* svc.checkStock("item-1" as MenuItemId);
        })
      );

      expect(qty).toBe(20);
    });

    it("returns 0 for an unknown item", async () => {
      const qty = await run(
        Effect.gen(function* () {
          const svc = yield* InventoryService;
          return yield* svc.checkStock("nonexistent" as MenuItemId);
        })
      );

      expect(qty).toBe(0);
    });
  });

  describe("reserve", () => {
    it("decrements stock on successful reservation", async () => {
      const remaining = await run(
        Effect.gen(function* () {
          const svc = yield* InventoryService;
          yield* svc.reserve("item-1" as MenuItemId, 3);
          return yield* svc.checkStock("item-1" as MenuItemId);
        })
      );

      expect(remaining).toBe(17);
    });

    it("fails with ItemOutOfStockError when requesting more than available", async () => {
      const result = await runExit(
        Effect.gen(function* () {
          const svc = yield* InventoryService;
          return yield* svc.reserve("item-1" as MenuItemId, 999);
        })
      );

      expect(Exit.isFailure(result)).toBe(true);
      if (Exit.isFailure(result)) {
        const error = Option.getOrThrow(Cause.failureOption(result.cause));
        expect((error as any)._tag).toBe("ItemOutOfStockError");
        expect((error as any).requested).toBe(999);
      }
    });
  });

  describe("release", () => {
    it("increments stock after release", async () => {
      const stock = await Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const svc = yield* InventoryService;
            yield* svc.reserve("item-1" as MenuItemId, 5);
            yield* svc.release("item-1" as MenuItemId, 5);
            return yield* svc.checkStock("item-1" as MenuItemId);
          }),
          makeInventoryServiceTest()
        )
      );

      expect(stock).toBe(20);
    });
  });
});
