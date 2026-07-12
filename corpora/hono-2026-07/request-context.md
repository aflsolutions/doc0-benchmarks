# Request Context

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [src/context.ts](https://github.com/honojs/hono/blob/main/src/context.ts)
- [src/adapter/aws-lambda/handler.ts](https://github.com/honojs/hono/blob/main/src/adapter/aws-lambda/handler.ts)
- [src/jsx/context.ts](https://github.com/honojs/hono/blob/main/src/jsx/context.ts)
- [src/client/client.ts](https://github.com/honojs/hono/blob/main/src/client/client.ts)
- [src/hono-base.ts](https://github.com/honojs/hono/blob/main/src/hono-base.ts)
- [src/request.ts](https://github.com/honojs/hono/blob/main/src/request.ts)
- [src/adapter/cloudflare-pages/handler.ts](https://github.com/honojs/hono/blob/main/src/adapter/cloudflare-pages/handler.ts)
- [src/helper/streaming/stream.ts](https://github.com/honojs/hono/blob/main/src/helper/streaming/stream.ts)
- [src/jsx/streaming.ts](https://github.com/honojs/hono/blob/main/src/jsx/streaming.ts)
- [src/adapter/lambda-edge/handler.ts](https://github.com/honojs/hono/blob/main/src/adapter/lambda-edge/handler.ts)
- [src/jsx/hooks/index.ts](https://github.com/honojs/hono/blob/main/src/jsx/hooks/index.ts)
- [src/helper/proxy/index.ts](https://github.com/honojs/hono/blob/main/src/helper/proxy/index.ts)
- [src/types.ts](https://github.com/honojs/hono/blob/main/src/types.ts)
</details>

Request Context is the central coordination object in Hono, acting as the interface between the incoming HTTP request and the outgoing response. It encapsulates environment bindings, request details, and helper methods, providing a unified API for handlers and middleware to interact with the runtime environment.

By centralizing access to the execution environment (such as KV namespaces, D1 databases, and secret variables in Cloudflare Workers) and the request state, the Request Context eliminates the need for global state or prop-drilling. It serves as a container for data that persists for the lifetime of a single request, ensuring that state is isolated per request, which is vital for concurrent execution in serverless runtimes.

The design emphasizes developer ergonomics while maintaining type safety. It provides specialized methods for common response types (`.text()`, `.json()`, `.html()`, `.redirect()`) and a key-value store for cross-middleware state passing (`.set()`, `.get()`, `.var`). By design, it provides a clear mechanism for handling errors through the `.error` property.

## Request Context Lifecycle and Initialization

The Request Context is instantiated inside the Hono application's dispatch cycle. When `app.fetch()` is called, it triggers `hono-base.ts`'s internal `#dispatch` method, which performs the routing lookup. The result of this lookup is passed alongside the raw `Request`, environment `Bindings`, and `ExecutionContext` to the `Context` constructor.

```typescript
// Initializing context within the dispatch cycle (src/hono-base.ts)
const c = new Context(request, {
  path,
  matchResult,
  env,
  executionCtx,
  notFoundHandler: this.#notFoundHandler,
})
```
Sources: [src/hono-base.ts:421-427](https://github.com/honojs/hono/blob/main/src/hono-base.ts#L421-L427)

The `Context` constructor stores the raw request and options, initializing internal state markers like `#var` (the variable map) and `#res` (the response object). The request instance used by handlers is lazily initialized via the `req` getter to ensure the `HonoRequest` object is only created if needed, wrapping the raw `Request` and route matching details.

Sources: [src/context.ts:352-361](https://github.com/honojs/hono/blob/main/src/context.ts#L352-L361), [src/context.ts:366-369](https://github.com/honojs/hono/blob/main/src/context.ts#L366-L369)

## ExecutionContext and Environment Access

The Request Context provides unified access to environment bindings and execution metadata. The `env` object holds platform-specific bindings passed during application instantiation. The `executionCtx` (or `event` in Workers-like environments) provides access to methods like `waitUntil()` and `passThroughOnException()`, enabling deferred operations or event delegation in serverless environments.

> [!CAUTION]
> Accessing `executionCtx` or `event` on a context object initialized in an environment without these capabilities will throw a runtime error. Ensure the platform adapter provides these properties before invocation.

Sources: [src/context.ts:377-383](https://github.com/honojs/hono/blob/main/src/context.ts#L377-L383), [src/context.ts:391-397](https://github.com/honojs/hono/blob/main/src/context.ts#L391-L397)

## Variable Management

The Request Context offers a `Map`-based storage for passing state between middleware and handlers. The `.set()` and `.get()` methods provide access to these typed variables. Access is also available via the read-only `.var` property, which converts the underlying `Map` into an object using `Object.fromEntries(this.#var)`.

Sources: [src/context.ts:546-556](https://github.com/honojs/hono/blob/main/src/context.ts#L546-L556), [src/context.ts:593-602](https://github.com/honojs/hono/blob/main/src/context.ts#L593-L602)

## Response Pipeline and Headers

The Response pipeline handles the orchestration of HTTP headers and response body generation. The `.header()` method modifies the `ResponseInit` object, while `.status()` sets the HTTP status code. If the response is already initialized, the context modifies the existing response, ensuring consistent behavior.

```typescript
// Header setting mechanism
header: SetHeaders = (name, value, options): void => {
  const headers = this.#res ? this.#res.headers : (this.#preparedHeaders ??= new Headers())
  if (value === undefined) {
    headers.delete(name)
  } else if (options?.append) {
    headers.append(name, value)
  } else {
    headers.set(name, value)
  }
}
```
Sources: [src/context.ts:515-527](https://github.com/honojs/hono/blob/main/src/context.ts#L515-L527)

## Call-Chain Walkthrough: Request to Response

Tracing the execution of a `c.text()` call demonstrates how the context flows through the response lifecycle:

1.  **Entry:** The handler calls `c.text('Hello World', 200)`.
2.  **Preparation:** `text()` calls `setDefaultContentType('text/plain; charset=UTF-8', headers)`.
3.  **Generation:** `text()` invokes `this.#newResponse(text, arg, headers)`, which collects existing response headers and merges in new headers.
4.  **Creation:** `this.#newResponse` calls `createResponseInstance(data, { status, headers: responseHeaders })`.
5.  **Return:** The final `Response` object is returned to the `Hono` handler chain.

Sources: [src/context.ts:682-694](https://github.com/honojs/hono/blob/main/src/context.ts#L682-L694), [src/context.ts:604-639](https://github.com/honojs/hono/blob/main/src/context.ts#L604-L639)

## Design Trade-offs

| Choice | Benefit | Cost |
| :--- | :--- | :--- |
| Lazy `req` initialization | Reduced memory allocation for routes that don't need parameters | Complexity in maintaining state between constructor and getter |
| Map-based variables | Flexible storage for dynamic middleware state | Slightly slower access than static object properties |

Sources: [src/context.ts:366-369](https://github.com/honojs/hono/blob/main/src/context.ts#L366-L369), [src/context.ts:554-555](https://github.com/honojs/hono/blob/main/src/context.ts#L554-L555)

## Usage Example

The following example demonstrates setting a variable in a middleware and reading it in a handler, as well as setting a custom header.

```typescript
import { Hono } from 'hono'

const app = new Hono()

app.use('*', async (c, next) => {
  // Set a variable for the request
  c.set('message', 'Hello, Hono!')
  await next()
})

app.get('/', (c) => {
  // Set a custom response header
  c.header('X-Custom-Header', 'Value')
  
  // Get the variable
  const msg = c.get('message')
  
  return c.text(`The message is: ${msg}`)
})
```
Sources: [src/context.ts:540-544](https://github.com/honojs/hono/blob/main/src/context.ts#L540-L544), [src/context.ts:506-512](https://github.com/honojs/hono/blob/main/src/context.ts#L506-L512)

## Related

- [[Application Routing]]
- [[Cookie Handling]]

