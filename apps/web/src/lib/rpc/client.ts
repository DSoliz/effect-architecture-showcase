import { Effect, Layer } from "effect";
import { RpcClient, RpcSerialization } from "@effect/rpc";
import { FetchHttpClient } from "@effect/platform";
import { AppRpcGroup } from "./contract";

const ClientLayer = RpcClient.layerProtocolHttp({
  url: "/api/rpc",
}).pipe(
  Layer.provide(RpcSerialization.layerJson),
  Layer.provide(FetchHttpClient.layer)
);

const makeClient = Effect.gen(function* () {
  return yield* RpcClient.make(AppRpcGroup);
}).pipe(Effect.provide(ClientLayer));

export { makeClient };
