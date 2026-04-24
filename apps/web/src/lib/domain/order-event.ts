import { Schema } from "effect";
import { OrderId, OrderStatus } from "./order";

export class OrderEvent extends Schema.Class<OrderEvent>("OrderEvent")({
  orderId: OrderId,
  status: OrderStatus,
  timestamp: Schema.DateFromString,
}) {}
