import { Layer, ManagedRuntime } from "effect";
import { RpcSerialization } from "@effect/rpc";
import { Etag } from "@effect/platform";
import { NodeContext, NodeHttpPlatform } from "@effect/platform-node";
import {
  MenuServiceLive,
  InventoryServiceLive,
  OrderServiceLive,
  OrderEventServiceLive,
} from "@/lib/services";
import { AppRpcHandlers } from "./handlers";
import { LoggingMiddlewareLive } from "./middleware";

const ServiceLayer = Layer.mergeAll(
  MenuServiceLive,
  InventoryServiceLive,
  OrderEventServiceLive
);

const AppLayer = OrderServiceLive.pipe(
  Layer.provide(ServiceLayer),
  Layer.provideMerge(ServiceLayer)
);

const PlatformLayer = Layer.mergeAll(
  NodeHttpPlatform.layer,
  Etag.layerWeak,
  NodeContext.layer
);

// Use provideMerge so AppLayer's services pass through to the output
// This means the runtime has BOTH the RPC handlers AND the raw services
// from the same layer instances
const HandlerLayer = AppRpcHandlers.pipe(Layer.provideMerge(AppLayer));

export const FullLayer = Layer.mergeAll(
  HandlerLayer,
  LoggingMiddlewareLive,
  RpcSerialization.layerJson,
  PlatformLayer
);

export const AppRuntime = ManagedRuntime.make(FullLayer);
