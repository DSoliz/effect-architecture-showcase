import { Context, Effect, Layer } from "effect";
import Loki from "lokijs";
import crypto from "node:crypto";
import {
  MenuItemId,
  Order,
  OrderId,
  OrderItem,
  OrderStatus,
  OrderNotFoundError,
  InvalidOrderError,
  OrderStatusTransitionError,
  ItemOutOfStockError,
  OrderEvent,
} from "@/lib/domain";
import { InventoryService } from "./inventory-service";
import { OrderEventService } from "./order-event-service";

export class OrderService extends Context.Tag("OrderService")<
  OrderService,
  {
    readonly place: (
      items: OrderItem[]
    ) => Effect.Effect<Order, InvalidOrderError | ItemOutOfStockError>;
    readonly getById: (
      id: OrderId
    ) => Effect.Effect<Order, OrderNotFoundError>;
    readonly updateStatus: (
      id: OrderId,
      status: OrderStatus
    ) => Effect.Effect<
      Order,
      OrderNotFoundError | OrderStatusTransitionError
    >;
    readonly listByStatus: (status: OrderStatus) => Effect.Effect<Order[]>;
    readonly listAll: Effect.Effect<Order[]>;
  }
>() {}

const validTransitions: Record<OrderStatus, OrderStatus[]> = {
  placed: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["picked-up"],
  "picked-up": ["delivered"],
  delivered: [],
  cancelled: [],
};

interface OrderRecord {
  id: string;
  items: Array<{
    menuItemId: string;
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
  status: string;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
}

const toOrder = (doc: OrderRecord) =>
  new Order({
    id: doc.id as OrderId,
    items: doc.items.map(
      (i) =>
        new OrderItem({
          menuItemId: i.menuItemId as MenuItemId,
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })
    ) as unknown as readonly [OrderItem, ...OrderItem[]],
    status: doc.status as OrderStatus,
    totalPrice: doc.totalPrice,
    createdAt: new Date(doc.createdAt),
    updatedAt: new Date(doc.updatedAt),
  });

function initDb(): Promise<{ orders: Collection<OrderRecord> }> {
  return new Promise((resolve, reject) => {
    const db = new Loki("data/orders.db", {
      autoload: true,
      autosave: true,
      autosaveInterval: 2000,
      autoloadCallback: (err) => {
        if (err) {
          reject(err);
          return;
        }
        let orders = db.getCollection<OrderRecord>("orders");
        if (!orders) {
          orders = db.addCollection<OrderRecord>("orders", {
            unique: ["id"],
          });
        }
        resolve({ orders });
      },
    });
  });
}

export const OrderServiceLive = Layer.effect(
  OrderService,
  Effect.gen(function* () {
    const inventory = yield* InventoryService;
    const events = yield* OrderEventService;

    const { orders } = yield* Effect.tryPromise(() => initDb());

    return {
      place: (items: OrderItem[]) =>
        Effect.gen(function* () {
          if (items.length === 0) {
            return yield* new InvalidOrderError({
              reason: "Order must contain at least one item",
            });
          }

          for (const item of items) {
            yield* inventory.reserve(item.menuItemId, item.quantity);
          }

          const now = new Date();
          const totalPrice = items.reduce(
            (sum, item) => sum + item.unitPrice * item.quantity,
            0
          );

          const record: OrderRecord = {
            id: crypto.randomUUID(),
            items: items.map((i) => ({
              menuItemId: i.menuItemId as string,
              name: i.name,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
            })),
            status: "placed",
            totalPrice,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
          };

          orders.insert(record);

          const order = toOrder(record);

          yield* events.publish(
            new OrderEvent({
              orderId: order.id,
              status: "placed",
              timestamp: now,
            })
          );

          return order;
        }),

      getById: (id: OrderId) =>
        Effect.gen(function* () {
          const doc = orders.findOne({ id: id as string });
          if (!doc) {
            return yield* new OrderNotFoundError({ orderId: id });
          }
          return toOrder(doc);
        }),

      updateStatus: (id: OrderId, newStatus: OrderStatus) =>
        Effect.gen(function* () {
          const doc = orders.findOne({ id: id as string });
          if (!doc) {
            return yield* new OrderNotFoundError({ orderId: id });
          }

          const currentStatus = doc.status as OrderStatus;
          const allowed = validTransitions[currentStatus];

          if (!allowed.includes(newStatus)) {
            return yield* new OrderStatusTransitionError({
              orderId: id,
              from: currentStatus,
              to: newStatus,
            });
          }

          const now = new Date();
          doc.status = newStatus;
          doc.updatedAt = now.toISOString();
          orders.update(doc);

          if (newStatus === "cancelled") {
            for (const item of doc.items) {
              yield* inventory.release(
                item.menuItemId as MenuItemId,
                item.quantity
              );
            }
          }

          yield* events.publish(
            new OrderEvent({
              orderId: id,
              status: newStatus,
              timestamp: now,
            })
          );

          return toOrder(doc);
        }),

      listByStatus: (status: OrderStatus) =>
        Effect.sync(() =>
          orders
            .find({ status } as LokiQuery<OrderRecord>)
            .map(toOrder)
        ),

      listAll: Effect.sync(() => orders.find().map(toOrder)),
    };
  })
);
