# Testing Utilities

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [src/context.ts](https://github.com/honojs/hono/blob/main/src/context.ts)
- [package.json](https://github.com/honojs/hono/blob/main/package.json)
- [src/client/client.ts](https://github.com/honojs/hono/blob/main/src/client/client.ts)
- [src/adapter/aws-lambda/handler.ts](https://github.com/honojs/hono/blob/main/src/adapter/aws-lambda/handler.ts)
- [src/middleware/method-override/index.ts](https://github.com/honojs/hono/blob/main/src/middleware/method-override/index.ts)
- [src/validator/validator.ts](https://github.com/honojs/hono/blob/main/src/validator/validator.ts)
- [src/adapter/cloudflare-pages/handler.ts](https://github.com/honojs/hono/blob/main/src/adapter/cloudflare-pages/handler.ts)
- [src/helper/proxy/index.ts](https://github.com/honojs/hono/blob/main/src/helper/proxy/index.ts)
- [src/adapter/lambda-edge/handler.ts](https://github.com/honojs/hono/blob/main/src/adapter/lambda-edge/handler.ts)
- [src/request.ts](https://github.com/honojs/hono/blob/main/src/request.ts)
- [jsr.json](https://github.com/honojs/hono/blob/main/jsr.json)
- [src/helper/testing/index.ts](https://github.com/honojs/hono/blob/main/src/helper/testing/index.ts)
- [src/hono-base.ts](https://github.com/honojs/hono/blob/main/src/hono-base.ts)
- [src/client/fetch-result-please.ts](https://github.com/honojs/hono/blob/main/src/client/fetch-result-please.ts)
- [src/client/utils.ts](https://github.com/honojs/hono/blob/main/src/client/utils.ts)
- [runtime-tests/lambda/mock.ts](https://github.com/honojs/hono/blob/main/runtime-tests/lambda/mock.ts)
- [src/helper/ssg/ssg.ts](https://github.com/honojs/hono/blob/main/src/helper/ssg/ssg.ts)
- [src/helper/adapter/index.ts](https://github.com/honojs/hono/blob/main/src/helper/adapter/index.ts)
- [runtime-tests/workerd/index.ts](https://github.com/honojs/hono/blob/main/runtime-tests/workerd/index.ts)
- [runtime-tests/lambda/stream-mock.ts](https://github.com/honojs/hono/blob/main/runtime-tests/lambda/stream-mock.ts)
- [src/adapter/netlify/handler.ts](https://github.com/honojs/hono/blob/main/src/adapter/netlify/handler.ts)
- [src/adapter/vercel/handler.ts](https://github.com/honojs/hono/blob/main/src/adapter/vercel/handler.ts)
- [src/client/types.ts](https://github.com/honojs/hono/blob/main/src/client/types.ts)
- [src/types.ts](https://github.com/honojs/hono/blob/main/src/types.ts)
</details>

Testing utilities in Hono are designed to bridge the gap between application logic and external runtime behavior. Because Hono is built on Web Standards rather than a specific Node.js-coupled implementation, "testing" often implies verifying how an application responds to standard `Request` objects and how it produces standard `Response` objects across different platforms (Cloudflare Workers, Deno, Bun, Node.js).

The primary mechanism for testing is the `testClient` helper. It leverages Hono's RPC-like client capabilities to allow developers to make type-safe, direct calls to their Hono application instance as if it were a remote API, while keeping the execution local. This solves the problem of needing to bootstrap a full HTTP server environment for unit or integration testing, significantly speeding up the testing loop.

By utilizing `testClient`, developers can inject specific environment bindings and execution contexts—vital for testing adapters like Cloudflare Workers or AWS Lambda. This design ensures that testing doesn't require mocking the entire network stack; instead, it allows for direct invocation of the application's `.fetch()` entry point, effectively simulating an HTTP request lifecycle without the overhead of actual network I/O.

## The Test Client API

The `testClient` function provides a standardized way to interact with a Hono app during testing. It initializes a client that routes all requests directly to the provided `Hono` instance's `request()` method.

The mechanism is straightforward: it creates a custom `fetch` function that invokes `app.request(input, init, Env, executionCtx)`. This ensures the full Hono middleware pipeline and routing logic are executed during the test.

```typescript
import { Hono } from 'hono'
import { testClient } from 'hono/testing'

const app = new Hono<{ Bindings: { API_KEY: string } }>()
app.get('/user', (c) => c.json({ name: 'Hono' }))

test('GET /user', async () => {
  const client = testClient(app, { API_KEY: 'secret' })
  const res = await client.user.$get()
  const data = await res.json()
  expect(data.name).toBe('Hono')
})
```
Sources: [src/helper/testing/index.ts:16-27](https://github.com/honojs/hono/blob/main/src/helper/testing/index.ts#L16-L27)

## Application Request Dispatching

At the core of the testing utilities is `Hono.prototype.request()`. This is not just a test helper but a fundamental part of the Hono application lifecycle that supports the test client.

When `request(input, requestInit)` is called, the system performs the following sequence:
1. Normalizes the input (URL or Request object).
2. For string URLs, it creates a new `Request` with `http://localhost` if the input is relative.
3. Passes the resulting `Request` object into the internal `#dispatch()` method.
4. `#dispatch()` executes the router's `match()` and composes handlers for the request.

This approach ensures the `testClient` provides full coverage of the app's routing and middleware, as it performs the exact same dispatching process that an incoming HTTP request would trigger.

Sources: [src/hono-base.ts:499-517](https://github.com/honojs/hono/blob/main/src/hono-base.ts#L499-L517), [src/hono-base.ts:406-466](https://github.com/honojs/hono/blob/main/src/hono-base.ts#L406-L466)

## Runtime Context Mocking

Testing adapters like AWS Lambda or Cloudflare Workers often requires mocking complex host-specific objects. Hono provides structural support for this in its core `Context`.

For instance, the `Context` class constructor accepts `ContextOptions`, which allows manual injection of `executionCtx`, `env`, and `notFoundHandler`. This allows tests to simulate runtime conditions without needing the physical infrastructure.

```typescript
// Example of manually constructing a context for testing
const c = new Context(new Request('http://localhost/'), {
  env: { MY_BINDING: 'test' },
  executionCtx: { waitUntil: vi.fn(), passThroughOnException: vi.fn() } as any
})
```
Sources: [src/context.ts:237-252](https://github.com/honojs/hono/blob/main/src/context.ts#L237-L252), [src/context.ts:352-361](https://github.com/honojs/hono/blob/main/src/context.ts#L352-L361)

## Adapter Simulation

The library includes specific runtime mocks to test adapter-specific features, such as stream response support for Lambda. These mocks implement the required interfaces to trick the Hono adapter into thinking it is running in a real AWS Lambda environment.

> [!TIP]
> Use `vi.stubGlobal` to mock environment-specific globals (like `awslambda` in Lambda tests) before your Hono adapter logic runs.

Sources: [runtime-tests/lambda/mock.ts:38-38](https://github.com/honojs/hono/blob/main/runtime-tests/lambda/mock.ts#L38-L38), [runtime-tests/lambda/stream-mock.ts:44-44](https://github.com/honojs/hono/blob/main/runtime-tests/lambda/stream-mock.ts#L44-L44)

## Request Cloning Mechanism

A common hurdle in testing and middleware development is the inability to read a `Request` body twice. Hono provides `cloneRawRequest` as a utility specifically to handle this during tests or complex middleware chains.

The mechanism follows these logical branches:
1. **Unconsumed Body:** If `raw.bodyUsed` is `false`, it returns `req.raw.clone()`.
2. **Cached Body:** If the body was already consumed via `HonoRequest` methods (like `.json()`), it uses the cached contents in `#bodyCache` to reconstruct a new `Request` object.
3. **Failure State:** If the body was consumed directly from `req.raw` without Hono's tracking, the function throws an `HTTPException`, preventing silent data loss.

Sources: [src/request.ts:476-505](https://github.com/honojs/hono/blob/main/src/request.ts#L476-L505)

## Design Trade-offs Table

| Design Choice | Benefit | Cost |
| :--- | :--- | :--- |
| `testClient` fetch proxy | Reuse of RPC client logic for tests | Adds dependency on client types |
| `Hono.request` entry point | Enables real request flow simulation | Requires complete Request object creation |
| Explicit `Context` injection | High test isolation for adapters | Verbose setup for manual context tests |
| `#bodyCache` tracking | Reconstructible requests for middleware | Slight memory overhead per request |

Sources: [src/helper/testing/index.ts:16-27](https://github.com/honojs/hono/blob/main/src/helper/testing/index.ts#L16-L27), [src/hono-base.ts:499-517](https://github.com/honojs/hono/blob/main/src/hono-base.ts#L499-L517), [src/request.ts:476-505](https://github.com/honojs/hono/blob/main/src/request.ts#L476-L505)

## Related

- [[Request Context]]

