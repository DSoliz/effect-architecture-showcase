import { Rpc, RpcGroup } from "@effect/rpc";
import { Schema } from "effect";
import {
  MenuItem,
  Category,
  OrderItem,
  Order,
  OrderId,
  OrderStatus,
  ItemOutOfStockError,
  OrderNotFoundError,
  InvalidOrderError,
  OrderStatusTransitionError,
} from "@/lib/domain";
import { LoggingMiddleware } from "./middleware";

export const GetMenu = Rpc.make("GetMenu", {
  success: Schema.Array(MenuItem),
});

export const GetMenuByCategory = Rpc.make("GetMenuByCategory", {
  payload: { category: Category },
  success: Schema.Array(MenuItem),
});

export const PlaceOrder = Rpc.make("PlaceOrder", {
  payload: { items: Schema.Array(OrderItem) },
  success: Order,
  error: Schema.Union(InvalidOrderError, ItemOutOfStockError),
});

export const GetOrder = Rpc.make("GetOrder", {
  payload: { orderId: OrderId },
  success: Order,
  error: OrderNotFoundError,
});

export const UpdateOrderStatus = Rpc.make("UpdateOrderStatus", {
  payload: { orderId: OrderId, status: OrderStatus },
  success: Order,
  error: Schema.Union(OrderNotFoundError, OrderStatusTransitionError),
});

export const ListOrdersByStatus = Rpc.make("ListOrdersByStatus", {
  payload: { status: OrderStatus },
  success: Schema.Array(Order),
});

export const ListAllOrders = Rpc.make("ListAllOrders", {
  success: Schema.Array(Order),
});

export const AppRpcGroup = RpcGroup.make(
  GetMenu,
  GetMenuByCategory,
  PlaceOrder,
  GetOrder,
  UpdateOrderStatus,
  ListOrdersByStatus,
  ListAllOrders
).middleware(LoggingMiddleware);
