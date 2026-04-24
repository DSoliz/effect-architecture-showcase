import { NextRequest, NextResponse } from "next/server";
import { Effect } from "effect";
import type { OrderStatus } from "@/lib/domain";
import { OrderService } from "@/lib/services";
import { AppRuntime } from "@/lib/rpc/runtime";

export const dynamic = "force-dynamic";

const nextStatusMap: Partial<Record<OrderStatus, OrderStatus>> = {
  placed: "confirmed",
  confirmed: "preparing",
  preparing: "ready",
  ready: "picked-up",
  "picked-up": "delivered",
};

const activeStatuses: OrderStatus[] = [
  "placed",
  "confirmed",
  "preparing",
  "ready",
  "picked-up",
];

const MIN_ELAPSED_MS = 4_000;

const processOrders = Effect.gen(function* () {
  const orderService = yield* OrderService;
  const results: Array<{ orderId: string; from: string; to: string }> = [];

  for (const status of activeStatuses) {
    const orders = yield* orderService.listByStatus(status);
    const target = nextStatusMap[status];
    if (!target) continue;

    for (const order of orders) {
      const elapsed = Date.now() - order.updatedAt.getTime();
      if (elapsed < MIN_ELAPSED_MS) continue;

      yield* orderService
        .updateStatus(order.id, target)
        .pipe(
          Effect.tap(() =>
            Effect.sync(() =>
              results.push({ orderId: order.id, from: status, to: target })
            )
          ),
          Effect.catchAll(() => Effect.void)
        );
    }
  }

  return results;
});

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await AppRuntime.runPromise(processOrders);

  return NextResponse.json({
    processed: results.length,
    transitions: results,
    timestamp: new Date().toISOString(),
  });
}
