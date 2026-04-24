# Effect Architecture Showcase

A full-stack application demonstrating how [Effect](https://effect.website) streamlines TypeScript architecture. Built with Next.js (App Router), this project replaces ad-hoc patterns — manual validation, untyped errors, scattered dependency wiring, imperative stream handling — with a single, composable toolkit.

## Why Effect?

Most TypeScript projects accumulate layers of glue: Zod for validation, a DI container, custom error classes, hand-rolled retry logic, bespoke pub/sub wiring. Each solves one problem but introduces its own API surface, failure modes, and interop friction.

Effect replaces all of them with a unified model: **programs are values** that declare their requirements, errors, and results in the type signature. The runtime handles execution, dependency injection, concurrency, and resource cleanup.

The result is code that is easier to test, safer to refactor, and honest about what can go wrong.

---

## Feature Walkthrough

### 1. Schema — One Definition, Many Uses

Effect Schema defines domain types that serve as constructors, validators, and serializers simultaneously. A single `Schema.Class` declaration gives you runtime type checking, JSON encode/decode, branded types, and form validation — no separate Zod schemas, DTOs, or mapping layers.

**Domain models with branded IDs and constraints:**
- [`lib/domain/order.ts`](apps/web/src/lib/domain/order.ts) — `Order`, `OrderItem`, branded `OrderId`, literal `OrderStatus`, and `DateFromString` for safe serialization
- [`lib/domain/menu-item.ts`](apps/web/src/lib/domain/menu-item.ts) — `MenuItem` with `Schema.positive()` price constraints, branded `MenuItemId`, literal `Category` union
- [`lib/domain/checkout.ts`](apps/web/src/lib/domain/checkout.ts) — `CheckoutInfo` with `Schema.pattern` for phone validation, reused directly as a react-hook-form resolver

**Typed errors as schemas:**
- [`lib/domain/order.ts#L34-L55`](apps/web/src/lib/domain/order.ts#L34-L55) — `OrderNotFoundError`, `InvalidOrderError`, `OrderStatusTransitionError` via `Schema.TaggedError`
- [`lib/domain/inventory.ts`](apps/web/src/lib/domain/inventory.ts) — `ItemOutOfStockError` with typed `requested` and `available` fields

### 2. Services & Dependency Injection

Services are defined as interfaces using `Context.Tag` — a typed key that describes *what* a service provides without coupling to *how*. Layers wire implementations to tags. The runtime assembles everything. No decorators, no container config files, no `new` scattered across handlers.

**Service interfaces (pure contracts):**
- [`lib/services/order-service.ts#L19-L38`](apps/web/src/lib/services/order-service.ts#L19-L38) — `OrderService` with typed methods returning `Effect` values with explicit error channels
- [`lib/services/menu-service.ts#L10-L19`](apps/web/src/lib/services/menu-service.ts#L10-L19) — `MenuService`
- [`lib/services/inventory-service.ts#L5-L15`](apps/web/src/lib/services/inventory-service.ts#L5-L15) — `InventoryService`
- [`lib/services/order-event-service.ts#L4-L10`](apps/web/src/lib/services/order-event-service.ts#L4-L10) — `OrderEventService` with `publish` and `subscribe`

**Layer implementations:**
- [`lib/services/menu-service.ts#L162`](apps/web/src/lib/services/menu-service.ts#L162) — `Layer.sync` for synchronous, dependency-free initialization
- [`lib/services/order-service.ts#L105`](apps/web/src/lib/services/order-service.ts#L105) — `Layer.effect` when the service needs other services from context
- [`lib/services/order-event-service.ts#L12`](apps/web/src/lib/services/order-event-service.ts#L12) — `Layer.effect` with `PubSub` initialization

**Composition into a runtime:**
- [`lib/rpc/runtime.ts`](apps/web/src/lib/rpc/runtime.ts) — `Layer.mergeAll`, `Layer.provide`, `Layer.provideMerge`, and `ManagedRuntime.make` assemble the full dependency graph in one place

### 3. Typed Errors in the Type Signature

Every function declares what can go wrong. The compiler enforces exhaustive handling. No `catch (e: unknown)`, no `instanceof` chains, no errors slipping through unnoticed.

**Errors appear in the Effect's error channel:**
```ts
readonly place: (items: OrderItem[]) =>
  Effect.Effect<Order, InvalidOrderError | ItemOutOfStockError>
```
> [`lib/services/order-service.ts#L22-L24`](apps/web/src/lib/services/order-service.ts#L22-L24)

**Errors are yielded as values, not thrown:**
- [`lib/services/order-service.ts#L117-L119`](apps/web/src/lib/services/order-service.ts#L117-L119) — `yield* new InvalidOrderError(...)`
- [`lib/services/inventory-service.ts#L56-L60`](apps/web/src/lib/services/inventory-service.ts#L56-L60) — `yield* new ItemOutOfStockError(...)` with structured context

**RPC contracts propagate errors to the client:**
- [`lib/rpc/contract.ts#L26-L30`](apps/web/src/lib/rpc/contract.ts#L26-L30) — `PlaceOrder` declares `error: Schema.Union(InvalidOrderError, ItemOutOfStockError)`

### 4. Effect.gen — Async/Await That Composes

`Effect.gen` gives you the readability of async/await with full type tracking of errors and dependencies. Each `yield*` step is type-checked — the compiler knows what services are required and what errors are possible across the entire pipeline.

- [`lib/rpc/handlers.ts#L6-L19`](apps/web/src/lib/rpc/handlers.ts#L6-L19) — yield services from context, wire them to RPC methods
- [`lib/services/order-service.ts#L107-L111`](apps/web/src/lib/services/order-service.ts#L107-L111) — yield dependencies (`InventoryService`, `OrderEventService`) during layer construction
- [`app/api/orders/[orderId]/sse/route.ts#L29-L52`](apps/web/src/app/api/orders/[orderId]/sse/route.ts#L29-L52) — compose service lookups, stream construction, and error handling in a single generator

### 5. Streams & Server-Sent Events

`Stream` models ordered sequences of values over time. Combined with `PubSub`, it gives you reactive event broadcasting with backpressure, filtering, and automatic cleanup — no manual EventEmitter wiring or callback spaghetti.

**Event publishing with PubSub:**
- [`lib/services/order-event-service.ts#L14-L24`](apps/web/src/lib/services/order-event-service.ts#L14-L24) — `PubSub.unbounded` + `Stream.fromQueue` turns a pub/sub subscription into a composable stream

**SSE endpoint composing streams:**
- [`app/api/orders/[orderId]/sse/route.ts#L35-L52`](apps/web/src/app/api/orders/[orderId]/sse/route.ts#L35-L52) — `Stream.make` for catch-up event, `Stream.filter` for per-order isolation, `Stream.concat` to merge initial + live, `Stream.takeUntil` for terminal status, `Stream.runForEach` to drive the response

### 6. RPC — Type-Safe Client/Server Communication

Effect RPC defines a contract once and derives both server handlers and client calls from it. Schemas validate payloads and responses automatically. No manual fetch wrappers, no request/response type duplication, no runtime surprises.

**Contract definition:**
- [`lib/rpc/contract.ts`](apps/web/src/lib/rpc/contract.ts) — `Rpc.make` defines each endpoint with `payload`, `success`, and `error` schemas; `RpcGroup.make` groups them

**Server handlers:**
- [`lib/rpc/handlers.ts`](apps/web/src/lib/rpc/handlers.ts) — `AppRpcGroup.toLayer` maps each RPC to a service method
- [`lib/rpc/server.ts`](apps/web/src/lib/rpc/server.ts) — `RpcServer.toHttpApp` converts the group into an HTTP handler

**Client:**
- [`lib/rpc/client.ts`](apps/web/src/lib/rpc/client.ts) — `RpcClient.make` produces a typed client from the same contract

**Next.js route:**
- [`app/api/rpc/route.ts`](apps/web/src/app/api/rpc/route.ts) — three lines to expose the entire RPC surface

### 7. Middleware as Composable Functions

Middleware in Effect is a plain function that wraps an Effect — no framework-specific hooks, no decorator magic. It composes naturally and has full access to the Effect context.

- [`lib/rpc/middleware.ts`](apps/web/src/lib/rpc/middleware.ts) — `LoggingMiddleware` as an `RpcMiddleware.Tag`, timing requests with `Effect.log` and `Effect.annotateLogs`
- [`lib/rpc/contract.ts#L61`](apps/web/src/lib/rpc/contract.ts#L61) — `.middleware(LoggingMiddleware)` applies it to the entire RPC group

### 8. Resource Safety

Effect ensures resources are cleaned up even when errors or interruptions occur. `Effect.ensuring`, `Effect.scoped`, and `Scope` replace manual `try/finally` blocks.

- [`app/api/orders/[orderId]/sse/route.ts#L61-L62`](apps/web/src/app/api/orders/[orderId]/sse/route.ts#L61-L62) — `Effect.ensuring` guarantees the SSE controller is closed; `Effect.scoped` manages the PubSub subscription lifetime
- [`lib/rpc/server.ts#L7-L14`](apps/web/src/lib/rpc/server.ts#L7-L14) — `Scope.make` + `Scope.extend` + `Effect.cached` for one-time handler initialization with proper lifecycle

### 9. Testing — Swap Layers, Not Mocks

Effect's dependency injection makes the hardest testing problem trivial: **replacing real infrastructure with test doubles**. Because services are interfaces (`Context.Tag`) and implementations are Layers, you swap the Layer — not the import, not the constructor, not a mock library. The production code doesn't know or care.

This shines brightest in `OrderService`, which depends on both `InventoryService` and `OrderEventService`. In a traditional codebase you'd need to mock a database, stub an event bus, and wire them together manually. With Effect, you write a `Ref`-based test Layer for each dependency, compose them with `Layer.mergeAll`, and provide them to the real `OrderServiceLive`:

```ts
const TestDeps = Layer.mergeAll(InventoryServiceTest, OrderEventServiceTest);
const TestLayer = OrderServiceLive.pipe(Layer.provide(TestDeps));

const run = <A, E>(effect: Effect.Effect<A, E, OrderService>) =>
  Effect.runPromise(Effect.provide(effect, TestLayer));
```

The real `OrderServiceLive` runs with real logic — the only things replaced are the I/O boundaries. This catches bugs that mocks hide (like the inventory release on cancellation).

**Test files:**
- [`lib/services/order-service.test.ts`](apps/web/src/lib/services/order-service.test.ts) — 11 tests covering order placement, status transitions, lifecycle walkthrough, inventory release on cancellation, and error cases — all using the real `OrderServiceLive` with swapped dependency Layers
- [`lib/services/inventory-service.test.ts`](apps/web/src/lib/services/inventory-service.test.ts) — 5 tests for stock checks, reservations, and out-of-stock errors using a `Ref`-based test Layer
- [`lib/services/menu-service.test.ts`](apps/web/src/lib/services/menu-service.test.ts) — 5 tests for menu queries and not-found errors

**Key patterns demonstrated:**
- `Ref`-based test implementations that are pure and isolated per test run
- `Exit` + `Cause.failureOption` to assert on typed errors without `try/catch`
- Testing the real service layer with fake dependencies — no mocking library needed

---

## Architecture at a Glance

```
Browser                          Server
───────                          ──────
                                 ┌──────────────────────────────┐
React Hooks ──► RPC Client ────► │  RPC Route (/api/rpc)        │
                (typed)          │    ├─ Middleware (logging)    │
                                 │    └─ Handlers               │
                                 │         ├─ MenuService       │
                                 │         ├─ OrderService       │
                                 │         ├─ InventoryService   │
                                 │         └─ OrderEventService  │
                                 ├──────────────────────────────┤
SSE Hook ◄──── EventSource ◄─── │  SSE Route (/api/orders/sse) │
                                 │    └─ Stream + PubSub        │
                                 └──────────────────────────────┘
                                           ▲
                                 ManagedRuntime (AppLayer)
                                 Single composition point for
                                 all services, handlers, and
                                 platform dependencies
```

---

## Getting Started

```bash
pnpm install
pnpm dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

## Stack

- **Runtime:** [Effect](https://effect.website) + [@effect/rpc](https://effect.website/docs/rpc/overview/) + [@effect/platform](https://effect.website/docs/platform/introduction/)
- **Framework:** Next.js 15 (App Router, Turbopack)
- **State:** [XState Store](https://stately.ai/docs/xstate-store) (client-side ephemeral state)
- **Forms:** react-hook-form + Effect Schema resolver
- **Database:** LokiJS (in-memory, for demo purposes)
- **Tests:** Vitest (unit) + Playwright (e2e)
