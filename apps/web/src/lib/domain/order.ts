import { Schema } from "effect";
import { MenuItemId } from "./menu-item";

export const OrderId = Schema.String.pipe(Schema.brand("OrderId"));
export type OrderId = typeof OrderId.Type;

export const OrderStatus = Schema.Literal(
  "placed",
  "confirmed",
  "preparing",
  "ready",
  "picked-up",
  "delivered",
  "cancelled"
);
export type OrderStatus = typeof OrderStatus.Type;

export class OrderItem extends Schema.Class<OrderItem>("OrderItem")({
  menuItemId: MenuItemId,
  name: Schema.NonEmptyString,
  quantity: Schema.Number.pipe(Schema.positive(), Schema.int()),
  unitPrice: Schema.Number.pipe(Schema.positive()),
}) {}

export class Order extends Schema.Class<Order>("Order")({
  id: OrderId,
  items: Schema.NonEmptyArray(OrderItem),
  status: OrderStatus,
  totalPrice: Schema.Number.pipe(Schema.positive()),
  createdAt: Schema.DateFromString,
  updatedAt: Schema.DateFromString,
}) {}

export class OrderNotFoundError extends Schema.TaggedError<OrderNotFoundError>()(
  "OrderNotFoundError",
  {
    orderId: OrderId,
  }
) {}

export class InvalidOrderError extends Schema.TaggedError<InvalidOrderError>()(
  "InvalidOrderError",
  {
    reason: Schema.String,
  }
) {}

export class OrderStatusTransitionError extends Schema.TaggedError<OrderStatusTransitionError>()(
  "OrderStatusTransitionError",
  {
    orderId: OrderId,
    from: OrderStatus,
    to: OrderStatus,
  }
) {}
