import { Effect } from "effect";
import { AppRpcGroup } from "./contract";
import { MenuService, OrderService } from "@/lib/services";

export const AppRpcHandlers = AppRpcGroup.toLayer(
  Effect.gen(function* () {
    const menu = yield* MenuService;
    const order = yield* OrderService;

    return AppRpcGroup.of({
      GetMenu: () => menu.getAll,
      GetMenuByCategory: ({ category }) => menu.getByCategory(category),
      PlaceOrder: ({ items }) => order.place([...items]),
      GetOrder: ({ orderId }) => order.getById(orderId),
      UpdateOrderStatus: ({ orderId, status }) =>
        order.updateStatus(orderId, status),
      ListOrdersByStatus: ({ status }) => order.listByStatus(status),
      ListAllOrders: () => order.listAll,
    });
  })
);
