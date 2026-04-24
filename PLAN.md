# Effect Eats — Implementation Plan

A single-restaurant online ordering app built with Next.js + Effect to showcase the Effect library ecosystem.

---

## Phase 0: Project Scaffolding

- [ ] Initialize pnpm workspace (`pnpm-workspace.yaml`, root `package.json` with workspace scripts)
- [ ] Set up Turborepo (`turbo.json` with `dev`, `build`, `typecheck`, `lint`, `test`, `test:unit` pipelines)
- [ ] Scaffold `apps/web` with Next.js (App Router, TypeScript)
- [ ] Install core dependencies: `effect`, `@effect/platform`, `@effect/rpc`, `@effect/sql`, `@xstate/store`, `lokijs`, `react`, `next`, `react-hook-form`, `@hookform/resolvers`
- [ ] Install dev dependencies: `vitest`, `@playwright/test`, `typescript`, `eslint`
- [ ] Create `design-system.css` with CSS custom properties (colors, spacing, font sizes, weights, radii, transitions, breakpoints) and base resets
- [ ] Create `apps/web/src/instrumentation.ts` (Next.js instrumentation hook placeholder)
- [ ] Verify `pnpm dev` starts the app with Turbopack

---

## Phase 1: Domain Models (`lib/domain/`)

Define all domain types using Effect Schema. This phase has zero runtime behavior — just types, schemas, and errors.

### Branded IDs
- [ ] `MenuItemId` — branded string
- [ ] `OrderId` — branded string

### Form Schemas
- [ ] `CheckoutInfo` — `name: Schema.NonEmptyString`, `phone: Schema.String.pipe(Schema.pattern(...))`, `notes: Schema.optional(Schema.String)` — used as both domain validation and form validation via `effectTsResolver`

### Entities (Schema.Class)
- [ ] `MenuItem` — `id: MenuItemId`, `name: Schema.NonEmptyString`, `description: string`, `price: Schema.positive`, `category: Schema.Literal("appetizer", "main", "side", "drink", "dessert")`, `imageUrl: string`, `available: boolean`
- [ ] `OrderItem` — `menuItemId: MenuItemId`, `name: string`, `quantity: Schema.positive & Schema.int`, `unitPrice: Schema.positive`
- [ ] `Order` — `id: OrderId`, `items: Schema.NonEmptyArray<OrderItem>`, `status: OrderStatus`, `totalPrice: Schema.positive`, `createdAt: Schema.DateFromString`, `updatedAt: Schema.DateFromString`
- [ ] `OrderStatus` — `Schema.Literal("placed", "confirmed", "preparing", "ready", "picked-up", "cancelled")`

### Errors (Schema.TaggedError)
- [ ] `MenuItemNotFoundError` — `{ menuItemId: MenuItemId }`
- [ ] `ItemOutOfStockError` — `{ menuItemId: MenuItemId, requested: number, available: number }`
- [ ] `OrderNotFoundError` — `{ orderId: OrderId }`
- [ ] `InvalidOrderError` — `{ reason: string }`
- [ ] `OrderStatusTransitionError` — `{ orderId: OrderId, from: OrderStatus, to: OrderStatus }`

### Showcase value
- Branded IDs prevent mixing up `MenuItemId` and `OrderId` at compile time
- `Schema.Class` gives free constructors, validation, and encode/decode
- `TaggedError` gives typed, pattern-matchable, serializable errors

---

## Phase 2: Services (`lib/services/`)

Implement business logic as Effect services with `Context.Tag` + Layers.

### MenuService
- [ ] Define `MenuService` tag with interface:
  - `getAll: Effect<MenuItem[]>`
  - `getById: (id: MenuItemId) => Effect<MenuItem, MenuItemNotFoundError>`
  - `getByCategory: (cat: Category) => Effect<MenuItem[]>`
- [ ] Implement `MenuServiceLive` layer using LokiJS as in-memory DB
- [ ] Seed menu data on layer initialization (10–15 items across categories)

### InventoryService
- [ ] Define `InventoryService` tag with interface:
  - `checkStock: (id: MenuItemId) => Effect<number>`
  - `reserve: (id: MenuItemId, qty: number) => Effect<void, ItemOutOfStockError>`
  - `release: (id: MenuItemId, qty: number) => Effect<void>`
- [ ] Implement `InventoryServiceLive` layer (LokiJS-backed stock counts)
- [ ] Seed initial stock levels

### OrderService
- [ ] Define `OrderService` tag with interface:
  - `place: (items: OrderItem[]) => Effect<Order, InvalidOrderError | ItemOutOfStockError>`
  - `getById: (id: OrderId) => Effect<Order, OrderNotFoundError>`
  - `updateStatus: (id: OrderId, status: OrderStatus) => Effect<Order, OrderNotFoundError | OrderStatusTransitionError>`
  - `listByStatus: (status: OrderStatus) => Effect<Order[]>`
- [ ] Implement `OrderServiceLive` layer — depends on `InventoryService`
  - `place` pipeline: validate items -> check stock for each -> reserve stock -> create order -> publish event
  - Status transitions enforce valid state machine (placed -> confirmed -> preparing -> ready -> picked-up; any -> cancelled)

### OrderEventService (PubSub)
- [ ] Define `OrderEventService` tag with interface:
  - `publish: (event: OrderEvent) => Effect<void>`
  - `subscribe: Effect<Stream<OrderEvent>>`
- [ ] Define `OrderEvent` schema: `{ orderId: OrderId, status: OrderStatus, timestamp: DateFromString }`
- [ ] Implement `OrderEventServiceLive` using Effect `PubSub`

### Showcase value
- Services as `Context.Tag` interfaces — pure DI, no imports of implementations
- `Layer.effect` for cross-service dependencies (OrderService depends on InventoryService)
- `Effect.gen` pipelines for multi-step order placement
- PubSub for decoupled event publishing

---

## Phase 3: RPC Layer (`lib/rpc/`)

Wire services to HTTP using Effect RPC.

### RPC Contract
- [ ] Define RPC router with requests:
  - `GetMenu` — returns `MenuItem[]`
  - `GetMenuByCategory` — takes `{ category }`, returns `MenuItem[]`
  - `PlaceOrder` — takes `{ items: OrderItem[] }`, returns `Order`
  - `GetOrder` — takes `{ orderId: OrderId }`, returns `Order`
  - `UpdateOrderStatus` — takes `{ orderId, status }`, returns `Order`
  - `ListOrdersByStatus` — takes `{ status }`, returns `Order[]`

### RPC Handlers
- [ ] Implement handlers that delegate to services via `Effect.gen`
- [ ] Handlers decode input with Schema, call service, return result

### RPC Runtime
- [ ] Compose `AppLayer` from all `*Live` layers using `Layer.mergeAll` and `Layer.provide`
- [ ] Create `ManagedRuntime` from `AppLayer` — single source of truth

### RPC API Route
- [ ] `app/api/rpc/route.ts` — POST handler that runs RPC requests through the runtime

### RPC Client
- [ ] `lib/rpc/client.ts` — browser-side RPC client using `fetch` + Schema decode

### Middleware
- [ ] `withLogging` — logs request entry, exit, duration, errors
- [ ] `withErrorMapping` — converts TaggedErrors to structured JSON error responses

### Showcase value
- End-to-end type safety from client to server via RPC contract
- Schema validation at boundaries (decode on server, encode back)
- Middleware as composable Effect functions
- Single runtime assembly point

---

## Phase 4: Client-Side State (`lib/stores/`, `lib/hooks/`)

### XState Cart Store
- [ ] `lib/stores/cart.ts` — XState store managing cart state:
  - State: `{ items: CartItem[] }` where `CartItem = { menuItem: MenuItem, quantity: number }`
  - Events: `addItem`, `removeItem`, `updateQuantity`, `clearCart`
  - Derived: `totalPrice`, `itemCount`

### React Hooks
- [ ] `useMenu` — fetches menu via RPC client, returns `{ items, loading, error }`
- [ ] `useOrder` — fetches order by ID via RPC client
- [ ] `useOrderStatus` — connects to SSE endpoint for real-time order status updates, returns current status
- [ ] `useCart` — thin wrapper around XState cart store for React

### Showcase value
- XState for predictable client state (cart)
- Hooks as thin bridges — Effect stays inside, React gets plain data
- SSE hook demonstrates Stream consumption on the client

---

## Phase 5: SSE — Real-Time Order Tracking (`app/api/orders/[orderId]/sse/`)

- [ ] `route.ts` — GET handler that:
  1. Yields `OrderEventService` from context
  2. Subscribes to order events
  3. Filters stream to only events for the requested `orderId`
  4. Emits an initial "catch-up" event with current order status
  5. Converts Stream to ReadableStream for SSE response
- [ ] Set appropriate headers (`Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`)

### Showcase value
- `Stream.fromQueue` + `PubSub` subscription
- `Stream.make` for initial catch-up event + `Stream.concat`
- `Stream.filter` / `Stream.takeUntil` (close stream when order reaches terminal status)
- Bridging Effect Stream to Web ReadableStream

---

## Phase 6: UI Components (`components/`)

### Design System Foundation
- [ ] Finalize `design-system.css` with a warm restaurant-themed palette

### Atoms
- [ ] `Button` — primary, secondary, danger variants; loading state
- [ ] `Badge` — for order status, category labels
- [ ] `PriceTag` — formatted currency display
- [ ] `Input` — text input with label and error state
- [ ] `Spinner` — loading indicator
- [ ] `StatusDot` — colored dot for order status

### Molecules
- [ ] `MenuItemCard` — image, name, description, price, "Add to Cart" button
- [ ] `CartItem` — item name, quantity controls, price, remove button
- [ ] `OrderStatusBar` — horizontal progress tracker showing order stages
- [ ] `CategoryFilter` — row of category badges for filtering menu
- [ ] `ErrorMessage` — styled error display mapping TaggedError `_tag` to user-friendly messages

### Organisms
- [ ] `MenuGrid` — fetches menu, renders CategoryFilter + grid of MenuItemCards
- [ ] `CartPanel` — renders cart items, total, checkout button; manages cart store
- [ ] `OrderTracker` — connects to SSE, renders OrderStatusBar + order details
- [ ] `KitchenQueue` — lists orders by status, provides controls to advance status

### Showcase value
- Atomic Design hierarchy
- CSS Modules with design system tokens
- Error display leveraging TaggedError `_tag` for user-friendly messages

---

## Phase 7: Pages (App Router)

### `/` — Menu Page
- [ ] `app/page.tsx` — renders `MenuGrid` organism
- [ ] Floating cart indicator showing item count (links to `/cart`)

### `/cart` — Cart & Checkout
- [ ] `app/cart/page.tsx` — renders `CartPanel` organism
- [ ] Checkout form (name, phone, notes) powered by `react-hook-form` + `effectTsResolver` using a `CheckoutInfo` Schema from `lib/domain/`
- [ ] "Place Order" triggers RPC `PlaceOrder`, handles typed errors inline
- [ ] On success, redirect to `/orders/[id]`

### `/orders/[id]` — Order Tracking
- [ ] `app/orders/[id]/page.tsx` — renders `OrderTracker` organism
- [ ] Real-time status updates via SSE
- [ ] Shows order summary (items, total, timestamps)

### `/admin` — Kitchen Dashboard
- [ ] `app/admin/page.tsx` — renders `KitchenQueue` organism
- [ ] Staff can advance order status (confirm, prepare, ready, picked up)
- [ ] Auto-refreshes via polling or SSE

### Layout
- [ ] `app/layout.tsx` — nav bar with links to Menu, Cart, Admin
- [ ] Responsive layout using CSS custom properties

---

## Phase 8: Testing

### Unit Tests (Vitest)
- [ ] **Domain models** — test Schema encode/decode roundtrips, branded ID creation, error construction
- [ ] **Services** — test `OrderServiceLive` with `InventoryServiceTest` layer (in-memory, pre-seeded)
  - Demonstrates **Layer substitution** for testing
- [ ] **Cart store** — test XState store transitions
- [ ] **Middleware** — test `withLogging`, `withErrorMapping` in isolation

### E2E Tests (Playwright)
- [ ] Browse menu and add items to cart
- [ ] Place order and verify redirect to tracking page
- [ ] Admin advances order status, verify tracking page updates in real-time

### Showcase value
- Layer substitution as the primary testing strategy — swap `*Live` for `*Test` layers
- Schema roundtrip tests prove serialization correctness
- E2E tests validate the full SSE pipeline

---

## Phase 9: Documentation & Polish

- [ ] Update `README.md` with:
  - Project overview and motivation
  - Architecture diagram (ASCII or Mermaid)
  - "Effect patterns showcased" section mapping features to Effect concepts
  - Getting started instructions (`pnpm install`, `pnpm dev`)
- [ ] Add inline code comments at key integration points (Layer composition, RPC handler, SSE stream construction)
- [ ] Add a `/guide` page (or section in README) walking through each pattern with links to source

---

## Effect Patterns Checklist

| Pattern | Where |
|---|---|
| Schema.Class | `lib/domain/` — all entities |
| Branded IDs | `lib/domain/` — MenuItemId, OrderId |
| Schema.TaggedError | `lib/domain/` — all errors |
| Schema encode/decode at boundaries | RPC handlers (decode), API responses (encode) |
| Context.Tag services | `lib/services/` — all services |
| Layer.sync | MenuServiceLive, InventoryServiceLive (LokiJS init) |
| Layer.effect (cross-service DI) | OrderServiceLive (depends on InventoryService) |
| Layer composition (mergeAll, provide) | `lib/rpc/runtime.ts` — AppLayer |
| ManagedRuntime | `lib/rpc/runtime.ts` |
| Effect.gen | Service implementations, RPC handlers |
| Stream + PubSub | OrderEventService, SSE route |
| Stream.concat / filter / takeUntil | SSE route (catch-up + live events) |
| Effect middleware (higher-order functions) | `lib/rpc/middleware.ts` |
| Effect.retry with Schedule | Order placement retry (optional) |
| Layer substitution in tests | Unit tests with `*Test` layers |
| XState Store | `lib/stores/cart.ts` |
| React hooks bridging Effect | `lib/hooks/` |
| RPC (contract + client + handler) | `lib/rpc/` |
| Schema as form validation (react-hook-form) | `/cart` checkout form via `effectTsResolver` |
