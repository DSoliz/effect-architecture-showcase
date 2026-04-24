import { Effect, Scope } from "effect";
import { HttpApp } from "@effect/platform";
import { RpcServer } from "@effect/rpc";
import { AppRpcGroup } from "./contract";
import { AppRuntime } from "./runtime";

const buildHandler = Effect.cached(
  Effect.gen(function* () {
    const scope = yield* Scope.make();
    const httpApp = yield* RpcServer.toHttpApp(AppRpcGroup).pipe(
      Scope.extend(scope)
    );
    return HttpApp.toWebHandler(httpApp);
  })
);

export async function rpcHandler(request: Request): Promise<Response> {
  const handler = await AppRuntime.runPromise(
    Effect.flatten(buildHandler)
  );
  return handler(request);
}
