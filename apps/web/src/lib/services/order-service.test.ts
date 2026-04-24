import { describe, it, expect } from "vitest";
import { Cause, Effect, Exit, Layer, Option, PubSub, Ref } from "effect";
import {
  MenuItemId,
  OrderItem,
  OrderId,
  OrderNotFoundError,
  InvalidOrderError,
  OrderStatusTransitionError,
  ItemOutOfStockError,
  OrderEvent,
} from "@/lib/domain";
import { InventoryService } from "./inventory-service";
import { OrderEventService } from "./order-event-service";
import { OrderService, OrderServiceLive } from "./order-service";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const makeItem = (
  id: string,
  name: string,
  quantity: number,
  unitPrice: number
) =>
  new OrderItem({
    menuItemId: id as MenuItemId,
    name,
    quantity,
    unitPrice,
  });

// ---------------------------------------------------------------------------
// Test layers — swap real DB implementations for Ref-based in-memory versions
// ---------------------------------------------------------------------------

const InventoryServiceTest = Layer.effect(
  InventoryService,
  Effect.gen(function* () {
    const stock = yield* Ref.make<Record<string, number>>({
      "menu-001": 20,
      "menu-002": 10,
    });

    return {
      checkStock: (id: MenuItemId) =>
        Ref.get(stock).pipe(Effect.map((s) => s[id as string] ?? 0)),

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

const OrderEventServiceTest = Layer.effect(
  OrderEventService,
  Effect.gen(function* () {
    const events = yield* Ref.make<OrderEvent[]>([]);

    return {
      publish: (event: OrderEvent) =>
        Ref.update(events, (prev) => [...prev, event]),

      // subscribe is unused in order-service tests but required by the interface
      subscribe: Effect.gen(function* () {
        const pubsub = yield* PubSub.unbounded<OrderEvent>();
        const queue = yield* PubSub.subscribe(pubsub);
        return (yield* Effect.succeed(queue)).pipe(
          (q) => {
            const { Stream } = require("effect");
            return Stream.fromQueue(q);
          }
        );
      }),
    };
  })
);

const TestDeps = Layer.mergeAll(InventoryServiceTest, OrderEventServiceTest);
const TestLayer = OrderServiceLive.pipe(Layer.provide(TestDeps));

const run = <A, E>(effect: Effect.Effect<A, E, OrderService>) =>
  Effect.runPromise(Effect.provide(effect, TestLayer));

const runExit = <A, E>(effect: Effect.Effect<A, E, OrderService>) =>
  Effect.runPromiseExit(Effect.provide(effect, TestLayer));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("OrderService", () => {
  describe("place", () => {
    it("creates an order with correct totals and status", async () => {
      const order = await run(
        Effect.gen(function* () {
          const svc = yield* OrderService;
          return yield* svc.place([
            makeItem("menu-001", "Bruschetta", 2, 8.99),
            makeItem("menu-002", "Salmon", 1, 24.99),
          ]);
        })
      );

      expect(order.status).toBe("placed");
      expect(order.items).toHaveLength(2);
      expect(order.totalPrice).toBeCloseTo(42.97);
      expect(order.id).toBeTruthy();
    });

    it("fails with InvalidOrderError for empty items", async () => {
      const result = await runExit(
        Effect.gen(function* () {
          const svc = yield* OrderService;
          return yield* svc.place([]);
        })
      );

      expect(Exit.isFailure(result)).toBe(true);
      if (Exit.isFailure(result)) {
        const error = Option.getOrThrow(Cause.failureOption(result.cause));
        expect((error as any)._tag).toBe("InvalidOrderError");
      }
    });

    it("fails with ItemOutOfStockError when stock is insufficient", async () => {
      const result = await runExit(
        Effect.gen(function* () {
          const svc = yield* OrderService;
          return yield* svc.place([
            makeItem("menu-002", "Salmon", 999, 24.99),
          ]);
        })
      );

      expect(Exit.isFailure(result)).toBe(true);
      if (Exit.isFailure(result)) {
        const error = Option.getOrThrow(Cause.failureOption(result.cause));
        expect((error as any)._tag).toBe("ItemOutOfStockError");
      }
    });
  });

  describe("getById", () => {
    it("retrieves a placed order", async () => {
      const found = await run(
        Effect.gen(function* () {
          const svc = yield* OrderService;
          const order = yield* svc.place([
            makeItem("menu-001", "Bruschetta", 1, 8.99),
          ]);
          return yield* svc.getById(order.id);
        })
      );

      expect(found.status).toBe("placed");
      expect(found.items).toHaveLength(1);
    });

    it("fails with OrderNotFoundError for unknown id", async () => {
      const result = await runExit(
        Effect.gen(function* () {
          const svc = yield* OrderService;
          return yield* svc.getById("nonexistent" as OrderId);
        })
      );

      expect(Exit.isFailure(result)).toBe(true);
      if (Exit.isFailure(result)) {
        const error = Option.getOrThrow(Cause.failureOption(result.cause));
        expect((error as any)._tag).toBe("OrderNotFoundError");
      }
    });
  });

  describe("updateStatus", () => {
    it("transitions placed → confirmed", async () => {
      const updated = await run(
        Effect.gen(function* () {
          const svc = yield* OrderService;
          const order = yield* svc.place([
            makeItem("menu-001", "Bruschetta", 1, 8.99),
          ]);
          return yield* svc.updateStatus(order.id, "confirmed");
        })
      );

      expect(updated.status).toBe("confirmed");
    });

    it("fails with OrderStatusTransitionError for invalid transition", async () => {
      const result = await runExit(
        Effect.gen(function* () {
          const svc = yield* OrderService;
          const order = yield* svc.place([
            makeItem("menu-001", "Bruschetta", 1, 8.99),
          ]);
          // placed → delivered is not a valid transition
          return yield* svc.updateStatus(order.id, "delivered");
        })
      );

      expect(Exit.isFailure(result)).toBe(true);
      if (Exit.isFailure(result)) {
        const error = Option.getOrThrow(Cause.failureOption(result.cause));
        expect((error as any)._tag).toBe("OrderStatusTransitionError");
        expect((error as any).from).toBe("placed");
        expect((error as any).to).toBe("delivered");
      }
    });

    it("walks through the full lifecycle", async () => {
      const finalOrder = await run(
        Effect.gen(function* () {
          const svc = yield* OrderService;
          const order = yield* svc.place([
            makeItem("menu-001", "Bruschetta", 1, 8.99),
          ]);

          yield* svc.updateStatus(order.id, "confirmed");
          yield* svc.updateStatus(order.id, "preparing");
          yield* svc.updateStatus(order.id, "ready");
          yield* svc.updateStatus(order.id, "picked-up");
          return yield* svc.updateStatus(order.id, "delivered");
        })
      );

      expect(finalOrder.status).toBe("delivered");
    });

    it("cancelling an order releases inventory", async () => {
      // Use a fresh layer so stock is isolated
      const freshDeps = Layer.mergeAll(
        InventoryServiceTest,
        OrderEventServiceTest
      );
      const freshLayer = Layer.mergeAll(
        OrderServiceLive.pipe(Layer.provide(freshDeps)),
        freshDeps
      );

      const stockAfterCancel = await Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const orderSvc = yield* OrderService;
            const inventorySvc = yield* InventoryService;

            const order = yield* orderSvc.place([
              makeItem("menu-001", "Bruschetta", 5, 8.99),
            ]);

            const stockAfterOrder = yield* inventorySvc.checkStock(
              "menu-001" as MenuItemId
            );
            expect(stockAfterOrder).toBe(15);

            yield* orderSvc.updateStatus(order.id, "cancelled");

            return yield* inventorySvc.checkStock("menu-001" as MenuItemId);
          }),
          freshLayer
        )
      );

      expect(stockAfterCancel).toBe(20);
    });
  });

  describe("listByStatus", () => {
    it("filters orders by status", async () => {
      const placed = await run(
        Effect.gen(function* () {
          const svc = yield* OrderService;
          yield* svc.place([makeItem("menu-001", "Bruschetta", 1, 8.99)]);
          yield* svc.place([makeItem("menu-002", "Salmon", 1, 24.99)]);
          return yield* svc.listByStatus("placed");
        })
      );

      expect(placed).toHaveLength(2);
    });
  });

  describe("listAll", () => {
    it("returns all orders", async () => {
      const all = await run(
        Effect.gen(function* () {
          const svc = yield* OrderService;
          yield* svc.place([makeItem("menu-001", "Bruschetta", 1, 8.99)]);
          return yield* svc.listAll;
        })
      );

      expect(all.length).toBeGreaterThanOrEqual(1);
    });
  });
});
