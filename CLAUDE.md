# Project Guidelines

## Package Manager
- Use **pnpm** (not npm/yarn)

## Monorepo
- This is a **pnpm workspaces** monorepo
- This monorepo uses Turborepo

## Styling
- Use **pure CSS** with **CSS Modules** (`.module.css`)
- Do **not** use Tailwind CSS, CSS-in-JS, or inline styles

### Global Design System (`design-system.css`)
`design-system.css` is the single source of truth for design tokens and base resets. It must define CSS custom properties on `:root` for:

- **Colors** — brand, text (primary, secondary, muted), backgrounds, borders, error/success/warning states
- **Spacing** — a consistent scale (e.g. `--space-xs`, `--space-sm`, `--space-md`, `--space-lg`, `--space-xl`)
- **Font sizes** — a type scale (e.g. `--font-xs`, `--font-sm`, `--font-base`, `--font-lg`, `--font-xl`, `--font-2xl`)
- **Font weights** — named weights (e.g. `--font-weight-normal`, `--font-weight-medium`, `--font-weight-semibold`, `--font-weight-bold`)
- **Border radii** — a small set of radius values (e.g. `--radius-sm`, `--radius-md`, `--radius-lg`)
- **Transitions** — default durations (e.g. `--transition-fast`, `--transition-normal`)
- **Breakpoints** — documented as comments (CSS custom properties can't be used in `@media` queries, but the values should be defined here as comments for reference)

`design-system.css` also contains:
- Box model reset (`box-sizing: border-box`, margin/padding reset)
- Base `body` styles (font family, background, text color — all referencing the variables above)
- Bare element resets (e.g. `a` color inheritance)

No component-specific styles should go in `design-system.css`.

### CSS Modules (`*.module.css`)
- Every component gets a colocated `.module.css` file with the same base name (e.g. `Cart.tsx` + `Cart.module.css`)
- **Always use CSS variables** from `design-system.css` for colors, spacing, font sizes, radii, and transitions — never hardcode raw values like `#cc0000`, `2rem`, or `0.9rem` in module files
- Class names use camelCase to match JS import access (e.g. `.orderButton`, `.itemName`)
- Keep selectors flat — avoid deep nesting. One class per element is the default; use compound selectors only when state-dependent (e.g. `.button:hover`, `.button:disabled`)
- Scope responsive overrides inside the same module file using `@media` queries at the bottom of the file

## Dev Server
- Use **turbopack** for Next.js dev (`next dev --turbopack`)

## Stack
- Next.js (App Router)
- TypeScript
- Effect library ecosystem (effect, @effect/schema, @effect/rpc, @effect/platform)
- XState Store (@xstate/store)

## Folder Structure

```
effect-poc/
├── apps/
│   └── web/                        # Next.js application
│       ├── public/                  # Static assets (SVGs, favicon)
│       ├── src/
│       │   ├── app/                 # Next.js App Router pages and API routes
│       │   │   ├── api/
│       │   │   │   ├── rpc/         # Effect RPC endpoint
│       │   │   │   └── [resource]/  # Resource-specific API routes (e.g. SSE)
│       │   │   ├── [route]/         # Feature page routes
│       │   │   ├── layout.tsx       # Root layout
│       │   │   ├── page.tsx         # Home page
│       │   │   └── design-system.css      # Global styles
│       │   ├── components/          # React components (see Component Design below)
│       │   ├── lib/
│       │   │   ├── domain/          # Effect Schema domain models
│       │   │   ├── hooks/           # Custom React hooks
│       │   │   ├── rpc/             # RPC client, handlers, and runtime
│       │   │   ├── services/        # Effect services with dependency injection
│       │   │   └── stores/          # XState stores (client-side ephemeral state)
│       │   └── instrumentation.ts   # Next.js instrumentation hook
│       ├── tests/                   # Playwright e2e tests
│       ├── vitest.config.ts         # Vitest config for unit tests
│       └── playwright.config.ts     # Playwright config for e2e tests
├── turbo.json                       # Turborepo pipeline config
├── pnpm-workspace.yaml              # pnpm workspaces definition
└── package.json                     # Root package (workspace scripts, turbo dev dep)
```

## Packages

### Root (`effect-poc`)
- Workspace orchestrator only — no application code
- Provides workspace-level scripts (`dev`, `build`, `typecheck`, `lint`, `test`, `test:unit`) that delegate to Turborepo

### `apps/web`
- The main (and currently only) application in the monorepo
- Next.js App Router app showcasing Effect-based architecture
- **Dependencies**: `effect`, `@effect/platform`, `@effect/rpc`, `@xstate/store`, `lokijs`, `next`, `react`
- **Dev dependencies**: `vitest` (unit tests), `@playwright/test` (e2e tests), `typescript`, `eslint`
- **Key architectural layers**:
  - `lib/domain/` — Effect Schema models defining the core domain
  - `lib/services/` — Effect services implementing business logic with dependency injection
  - `lib/rpc/` — Effect RPC contract, handlers, client, and runtime wiring
  - `lib/stores/` — XState stores for client-side ephemeral state
  - `lib/hooks/` — React hooks that bridge Effect/RPC with React components

## Component Design (Atomic Design)

Components follow the **Atomic Design** methodology and live in `apps/web/src/components/`. Each component has a colocated `.module.css` file for styling.

- **Atoms** — The smallest, indivisible UI elements. They have no dependencies on other components and represent a single UI concern (e.g. a button, input, label, badge). They receive all data via props and contain no business logic.

- **Molecules** — Small groups of atoms that work together as a unit. They combine a few atoms into a reusable piece with a single responsibility (e.g. a list section, a data card, a status display).

- **Organisms** — Complex, self-contained sections of a page composed of molecules (and possibly atoms). They may manage their own state, fetch data, and coordinate interactions between their children (e.g. a full page section that orchestrates multiple molecules together).

When creating new components, classify them into the appropriate level and keep these principles:
1. **Atoms** should be stateless and purely presentational
2. **Molecules** may have minimal local state but should receive data via props
3. **Organisms** own state management, data fetching, and coordinate child components
4. Components at any level must **not** skip levels when composing (organisms use molecules, molecules use atoms)

## Effect Layers

Layers are the primary mechanism for dependency injection and service composition. Follow these guidelines when creating and using them:

### When to create a new Layer
- **New service boundary**: any time you introduce a new `Context.Tag` (i.e. a new service interface), create a corresponding `*Live` Layer that provides its implementation
- **External dependency**: when code depends on an external resource (database, API client, cache, message broker), wrap it in a Layer so the resource can be initialized once and shared
- **Cross-service dependency**: when a service needs another service, use `Layer.effect` with `Effect.gen` to yield the dependency from context — never import live implementations directly

### Layer construction patterns
- **`Layer.sync(Tag, () => impl)`** — use for services with no dependencies and synchronous initialization (e.g. an in-memory repository seeded with static data)
- **`Layer.effect(Tag, Effect.gen(...))`** — use when the service needs to yield other services from context or perform effectful initialization
- **`Layer.scoped(Tag, Effect.gen(...))`** — use when the service acquires resources that must be released (connections, subscriptions, file handles)

### Composition
- Combine independent layers with `Layer.mergeAll(LayerA, LayerB, ...)`
- When Layer B depends on Layer A, pipe it: `LayerB.pipe(Layer.provide(LayerA))`
- Compose everything into a single `AppLayer` in `lib/rpc/runtime.ts` and create a `ManagedRuntime` from it — this is the only place where layers are assembled into a runtime
- Never call `ManagedRuntime.make` outside of `runtime.ts`

### Principles
1. **Services are interfaces** — define them as `Context.Tag` with an interface of `Effect.Effect` methods, never expose implementation details
2. **Layers are the only providers** — all service construction happens inside Layers; don't manually construct services in handlers or components
3. **Keep Layers focused** — one Layer provides one service. If a Layer is providing multiple unrelated capabilities, split it
4. **Test via Layer substitution** — in unit tests, create a `*Test` Layer that provides an alternative implementation of the same `Context.Tag`, and swap it into the runtime

## Effect Schema & Domain Modeling

All domain types live in `lib/domain/` and are defined using Effect Schema. Follow these conventions:

### Branded IDs
- Define entity IDs as branded strings: `Schema.String.pipe(Schema.brand("EntityId"))`
- Export both the schema and the type: `export type EntityId = typeof EntityId.Type`
- Use branded IDs in all service interfaces and domain classes — never pass raw `string` where an ID is expected

### Schema.Class
- Use `Schema.Class` for domain entities and value objects — it gives you a class constructor, runtime validation, and encode/decode for free
- Add field-level constraints via pipes: `Schema.nonEmptyString()`, `Schema.positive()`, `Schema.int()`
- Use `Schema.Literal(...)` for fixed union types (enums, statuses, categories)
- Use `Schema.DateFromString` for dates that must survive JSON serialization

### Schema.TaggedError
- Define domain errors as `Schema.TaggedError` — this gives each error a unique `_tag` discriminator for pattern matching and a built-in Schema for serialization
- Place errors alongside the entities they relate to in `lib/domain/`
- Prefer specific, narrow error types over generic ones (e.g. `OrderNotFoundError` over `NotFoundError`)

### Encode/Decode at boundaries
- **Decode** (`Schema.decodeUnknown`) incoming data at API route handlers and RPC handlers — this is where untrusted data enters the system
- **Encode** (`Schema.encode`) outgoing data before sending API responses — this ensures serialization matches the schema (e.g. `Date` becomes ISO string)
- **Never** decode/encode inside services — services operate on validated domain types

## Effect.gen (Generator-based composition)

`Effect.gen` is the primary way to write sequential Effect programs. Use it whenever you need to chain multiple effectful operations:

- Yield services from context: `const repo = yield* MyService`
- Yield effectful results: `const item = yield* repo.getById(id)`
- Yield Schema validation: `const input = yield* Schema.decodeUnknown(MySchema)(raw)`
- Yield error construction: `return yield* new MyTaggedError({ ... })`

Prefer `Effect.gen` over manual `.pipe(Effect.flatMap(...))` chains when there are more than two steps — generators are more readable for sequential logic. Use `.pipe()` for simple one- or two-step transformations.

## Effect Streams

Use `Stream` for ordered sequences of values produced over time. Streams appear in this project for SSE (Server-Sent Events) and reactive subscriptions.

### When to use Stream
- **Server-Sent Events**: build a `Stream<Event>` and convert it to a `ReadableStream` for the HTTP response
- **Reactive subscriptions**: use `Stream.fromQueue` to turn a `PubSub` subscription into a stream that consumers can filter and transform
- **Timed sequences**: combine `Stream.range`, `Effect.sleep`, and `Stream.mapEffect` to emit values on a schedule

### Stream composition
- `Stream.concat(a, b)` — append streams sequentially
- `Stream.flatMap` — for each element, produce a sub-stream
- `Stream.filter` / `Stream.takeUntil` — narrow down events
- `Stream.fromEffect` — lift a single Effect into a one-element stream
- `Stream.make(...)` — create a stream from literal values (useful for emitting an initial/catch-up event)

### Principles
1. Build streams by composing small phases — each phase is a `Stream` that handles one logical step
2. Keep side effects inside `Stream.mapEffect` or `Stream.fromEffect`, not in stream construction
3. Always close/clean up resources — use `Stream.runForEach` or scoped streams to ensure cleanup

## Bridging Effect with React & Next.js

### API Route Handlers (server)
- Route handlers in `app/api/` are standard Next.js functions (`GET`, `POST`) that bridge the HTTP boundary into Effect
- Use `AppRuntime.runPromise(effect)` to execute Effect programs — this provides all services from the composed `AppLayer`
- Wrap the top-level effect in `Effect.catchAll` to convert typed errors into structured JSON error responses
- For SSE routes, build a `Stream`, run it with `Stream.runForEach` piped into `Effect.runPromise`, and write each event to a `ReadableStream` controller

### RPC Client (browser)
- The RPC client in `lib/rpc/client.ts` uses `Effect.tryPromise` to wrap `fetch` calls, then pipes through `Schema.decodeUnknown` to validate responses
- Components run client effects via `Effect.runPromise` — this is the only place where `runPromise` should appear on the client side
- Define response schemas (e.g. `Schema.Struct({ data: Schema.Array(MyEntity) })`) at the client level to validate the server's envelope format

### React Hooks
- Hooks in `lib/hooks/` handle subscriptions and side effects that connect React to server-side streams (e.g. EventSource for SSE)
- Hooks should be thin wrappers — they manage connection lifecycle and push data into React state, but contain no business logic
- Hooks return plain objects/primitives, never Effect types — the Effect boundary stays inside the hook

## Effect Middleware in API Routes

Middleware in this context refers to reusable Effect functions that wrap around handler logic, adding cross-cutting behavior before and/or after the core handler runs. They are implemented as higher-order functions that take an Effect (the handler) and return a new Effect with the added behavior.

### What middleware is (in Effect terms)
A middleware is a function with this shape:
```ts
const withBehavior = <A, E, R>(handler: Effect.Effect<A, E, R>) =>
  Effect.gen(function* () {
    // before logic
    const result = yield* handler
    // after logic
    return result
  })
```
They compose via `.pipe()`:
```ts
handleRequest(body).pipe(withLogging, withErrorMapping, withTiming)
```

### When to create middleware

- **Logging/tracing**: when you need to log every request's entry, exit, duration, or error — wrap the handler in timing and structured logging logic. Create this when you have more than one route and want consistent observability without duplicating `console.log` calls in every handler.

- **Error mapping**: when you need to convert typed Effect errors (TaggedErrors) into standardized HTTP error responses. This is warranted when multiple routes share the same error-to-response logic — rather than repeating `Effect.catchAll` with the same mapping in every route file, extract it into a middleware.

- **Authentication/authorization**: when routes need to verify tokens, sessions, or permissions before the handler runs. Create this as soon as you have more than one protected route. The middleware should yield an auth context (e.g. user/session) that the handler can access, or fail with an `UnauthorizedError`.

- **Request validation**: when multiple routes share the same input parsing pattern (e.g. parsing JSON body + decoding via Schema). Extract this when the decode-and-fail-with-400 pattern repeats across three or more handlers.

- **Rate limiting / throttling**: when routes need to enforce usage limits. The middleware wraps the handler with a check against a rate-limiting service (which itself should be a Layer).

- **Idempotency**: when write endpoints must be safe to retry — the middleware checks an idempotency key against a store before running the handler, and caches the result.

### When NOT to create middleware
- **One-off behavior**: if only a single route needs the logic, inline it in the handler. Middleware exists to eliminate duplication.
- **Business logic**: middleware is for cross-cutting infrastructure concerns, not domain rules. If the logic depends on the specific entity or operation, it belongs in a service or handler.
- **Transforming the response shape**: if different routes need different response envelopes, that is handler logic, not middleware.

### Implementation guidelines
1. Middleware functions live in `lib/rpc/` (e.g. `lib/rpc/middleware.ts`)
2. Each middleware should be a single-purpose function — compose multiple middlewares rather than building one that does everything
3. Middleware should not depend on specific request shapes — it operates on the generic `Effect<A, E, R>` of the handler
4. Order matters — apply middleware from outermost (first to run) to innermost (closest to the handler): `handler.pipe(withAuth, withLogging, withErrorMapping)`
5. If a middleware needs a service (e.g. a rate limiter, an auth provider), it should yield it from context via `Effect.gen`, and the corresponding Layer must be included in `AppLayer`

## Purpose
- Template project showcasing architectural patterns using the Effect library
- Goal: familiarize developers with Effect's benefits and functional programming

