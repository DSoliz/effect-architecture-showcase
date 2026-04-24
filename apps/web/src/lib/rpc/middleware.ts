import { Effect, Layer } from "effect";
import { RpcMiddleware } from "@effect/rpc";

export class LoggingMiddleware extends RpcMiddleware.Tag<LoggingMiddleware>()(
  "LoggingMiddleware",
  { wrap: true }
) {}

const QUIET_METHODS = new Set(["ListOrdersByStatus", "UpdateOrderStatus"]);

export const LoggingMiddlewareLive = Layer.succeed(
  LoggingMiddleware,
  (options) =>
    Effect.gen(function* () {
      const tag = options.rpc._tag;
      const verbose = !QUIET_METHODS.has(tag);

      if (verbose) {
        yield* Effect.log(`→ ${tag}`).pipe(
          Effect.annotateLogs("payload", JSON.stringify(options.payload))
        );
      }

      const start = Date.now();
      const result = yield* options.next;

      if (verbose) {
        yield* Effect.log(`← ${tag}`).pipe(
          Effect.annotateLogs("duration_ms", Date.now() - start)
        );
      }

      return result;
    })
);
