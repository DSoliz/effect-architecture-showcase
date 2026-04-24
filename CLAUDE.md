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
- react-hook-form + @hookform/resolvers (form handling with Effect Schema validation via `effectTsResolver`)

## Functional Programming Principles

This project follows functional programming principles. All code — especially Effect pipelines, services, and domain logic — should adhere to these guidelines.

### Purity and Immutability
- **Pure functions by default** — functions should return the same output for the same input and produce no observable side effects. Side effects belong inside `Effect`, `Stream`, or other Effect types that make them explicit and composable.
- **Immutable data** — never mutate objects or arrays. Use spread syntax, `Array.map`, `Array.filter`, or Effect's `Ref` when mutable state is needed. Domain models (`Schema.Class`) are readonly by design — respect that.
- **No `let` in logic** — use `const` exclusively. If a value needs to change, model it as a pipeline transformation or use `Ref` / `Effect.gen` intermediate bindings.
- **No mutation of function arguments** — always return new values instead of modifying inputs.

### IO at the Edges
- **Push side effects to the boundary** — business logic and transformations should be pure. Side effects (database access, HTTP calls, logging, timestamps) should be wrapped in `Effect` and composed at the edges of the program.
- **Services encapsulate IO** — all IO lives inside Effect services. Consumers of a service see only a pure interface of `Effect`-returning methods.
- **React components are the outermost shell** — they call `Effect.runPromise` once at the boundary. Everything inside the Effect pipeline is declarative.

### Declarative Over Imperative
- **Describe what, not how** — prefer Effect combinators (`Effect.tap`, `Effect.map`, `Effect.catchTag`, `Stream.filter`, `Stream.takeUntil`) over imperative control flow (`if/else` with side effects, manual loops with mutation, `try/catch`).
- **Compose, don't orchestrate** — build complex behavior by composing small, focused functions rather than writing long procedural blocks. Prefer pipelines (`.pipe()`) over deeply nested logic.

### Composability Through Function Design
- **Data-last parameter order** — when writing utility functions that operate on a value, place the "data" argument last so the function works naturally with `.pipe()` and partial application.
- **Small, focused functions** — each function should do one thing. If a function has "and" in its description, split it.
- **Use pipelines for transformations** — chain operations with `.pipe()` rather than storing intermediate results in variables, when the chain reads clearly. Break into named steps when the pipeline exceeds ~5 stages or readability suffers.
- **Prefer expressions over statements** — use ternary expressions, `Effect.if`, and `Effect.match` over imperative `if/else` blocks when the result is a value.

### Type-Driven Design
- **Let types guide implementation** — define the types and interfaces first (schemas, service interfaces, error types), then implement. The type signatures document the contract.
- **Branded types prevent misuse** — use branded IDs and domain-specific types rather than primitive `string`/`number` to make illegal states unrepresentable.
- **Errors are values** — model failures as typed errors in the Effect error channel, not as thrown exceptions. This makes error handling explicit and exhaustive.

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
- **Dependencies**: `effect`, `@effect/platform`, `@effect/rpc`, `@xstate/store`, `lokijs`, `next`, `react`, `react-hook-form`, `@hookform/resolvers`
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

## Forms (react-hook-form + Effect Schema)

Use `react-hook-form` with the `effectTsResolver` from `@hookform/resolvers/effect-ts` to validate forms using the same Effect Schemas defined in `lib/domain/`. This keeps validation logic in one place — the Schema is the single source of truth for both client-side form validation and server-side request decoding.

### Guidelines
- Define form schemas in `lib/domain/` alongside related entities (e.g. `CheckoutInfo` next to `Order`)
- Use `effectTsResolver(MySchema)` as the `resolver` option in `useForm`
- Map Schema field constraints (e.g. `Schema.NonEmptyString`, `Schema.pattern`) to user-friendly error messages via react-hook-form's `errors` object
- Keep form components as molecules — they receive an `onSubmit` callback via props and do not call services directly

## Prefer Declarative Effect Patterns Over Imperative Code

When writing Effect code, favor Effect's built-in combinators and declarative patterns over imperative alternatives (try/catch, manual state, mutable variables, callbacks). The goal of this project is to showcase how Effect replaces imperative patterns with composable, type-safe alternatives.

### Guidelines
- **Error handling**: use `Effect.catchAll`, `Effect.catchTag`, or typed error channels — never `try/catch` around Effect code
- **Resource cleanup**: use `Effect.ensuring`, `Effect.acquireRelease`, or `Scope` — never manual `finally` blocks or cleanup flags
- **Sequential operations**: use `Effect.gen` or `.pipe()` — avoid chaining `.then()` on `runPromise` for logic that belongs inside the Effect
- **Stream composition**: use `Stream.concat`, `Stream.merge`, `Stream.flatMap` — avoid mixing imperative `send()` callbacks with Stream operations
- **Retries and scheduling**: use `Effect.retry`, `Schedule` — never manual `setTimeout`/`setInterval` loops inside Effect code
- **Concurrency**: use `Effect.all` with concurrency options, `Effect.fork`, `Fiber` — avoid spawning untracked promises
- **State**: use `Ref`, `PubSub`, `Queue` — avoid mutable variables shared across Effect boundaries
- **Logging**: use `Effect.log`, `Effect.logDebug` — avoid `console.log` inside Effect pipelines (OK outside, e.g. middleware boundaries)

When the boundary between Effect and non-Effect code is unavoidable (e.g. React hooks, Next.js route handlers), keep the imperative shell as thin as possible and push logic into the Effect pipeline.

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

