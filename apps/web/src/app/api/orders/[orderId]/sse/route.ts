import { Effect, Stream } from "effect";
import { NextRequest } from "next/server";
import { OrderId, OrderEvent } from "@/lib/domain";
import { OrderService, OrderEventService } from "@/lib/services";
import { AppRuntime } from "@/lib/rpc/runtime";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId: rawOrderId } = await params;
  const orderId = rawOrderId as OrderId;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: OrderEvent) => {
        const data = JSON.stringify({
          orderId: event.orderId,
          status: event.status,
          timestamp: event.timestamp.toISOString(),
        });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      const effect = Effect.gen(function* () {
        const orderService = yield* OrderService;
        const eventService = yield* OrderEventService;

        const currentOrder = yield* orderService.getById(orderId);

        const catchUpEvent = Stream.make(
          new OrderEvent({
            orderId: currentOrder.id,
            status: currentOrder.status,
            timestamp: currentOrder.updatedAt,
          })
        );

        const liveEvents = (yield* eventService.subscribe).pipe(
          Stream.filter((e) => e.orderId === orderId)
        );

        yield* Stream.concat(catchUpEvent, liveEvents).pipe(
          Stream.takeUntil(
            (e) => e.status === "delivered" || e.status === "cancelled"
          ),
          Stream.runForEach((event) => Effect.sync(() => send(event)))
        );
      }).pipe(
        Effect.tapErrorCause((cause) =>
          Effect.logError("SSE stream error").pipe(
            Effect.annotateLogs("orderId", orderId),
            Effect.annotateLogs("cause", cause.toString())
          )
        ),
        Effect.catchAll(() => Effect.void),
        Effect.ensuring(Effect.sync(() => controller.close())),
        Effect.scoped
      );

      AppRuntime.runPromise(effect);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
