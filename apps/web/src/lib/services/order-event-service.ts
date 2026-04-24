import { Context, Effect, Layer, PubSub, Scope, Stream } from "effect";
import { OrderEvent } from "@/lib/domain";

export class OrderEventService extends Context.Tag("OrderEventService")<
  OrderEventService,
  {
    readonly publish: (event: OrderEvent) => Effect.Effect<void>;
    readonly subscribe: Effect.Effect<Stream.Stream<OrderEvent>, never, Scope.Scope>;
  }
>() {}

export const OrderEventServiceLive = Layer.effect(
  OrderEventService,
  Effect.gen(function* () {
    const pubsub = yield* PubSub.unbounded<OrderEvent>();

    return {
      publish: (event: OrderEvent) =>
        Effect.asVoid(PubSub.publish(pubsub, event)),

      subscribe: Effect.gen(function* () {
        const queue = yield* PubSub.subscribe(pubsub);
        return Stream.fromQueue(queue);
      }),
    };
  })
);
