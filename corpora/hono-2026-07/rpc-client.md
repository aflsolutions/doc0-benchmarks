# RPC Client

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [src/types.ts](https://github.com/honojs/hono/blob/main/src/types.ts)
- [src/client/client.ts](https://github.com/honojs/hono/blob/main/src/client/client.ts)
- [src/context.ts](https://github.com/honojs/hono/blob/main/src/context.ts)
- [src/validator/validator.ts](https://github.com/honojs/hono/blob/main/src/validator/validator.ts)
- [src/client/types.ts](https://github.com/honojs/hono/blob/main/src/client/types.ts)
- [src/adapter/cloudflare-pages/handler.ts](https://github.com/honojs/hono/blob/main/src/adapter/cloudflare-pages/handler.ts)
- [src/adapter/lambda-edge/handler.ts](https://github.com/honojs/hono/blob/main/src/adapter/lambda-edge/handler.ts)
- [src/client/fetch-result-please.ts](https://github.com/honojs/hono/blob/main/src/client/fetch-result-please.ts)
- [src/client/utils.ts](https://github.com/honojs/hono/blob/main/src/client/utils.ts)
- [perf-measures/type-check/client.ts](https://github.com/honojs/hono/blob/main/perf-measures/type-check/client.ts)
- [src/client/index.ts](https://github.com/honojs/hono/blob/main/src/client/index.ts)
- [src/hono-base.ts](https://github.com/honojs/hono/blob/main/src/hono-base.ts)
</details>

The RPC Client (`hc`) is a lightweight, type-safe HTTP client for Hono. Its primary purpose is to provide an ergonomic developer experience by allowing users to call their API endpoints using the same TypeScript definitions used to define the server. By consuming the app's type schema, it enables full autocompletion and type safety for inputs, outputs, query parameters, and path parameters, effectively acting as an "RPC-like" interface over standard HTTP.

Unlike traditional SDK generators, the Hono RPC Client operates via a `Proxy` that intercepts method calls and property accesses. This design decision ensures zero-runtime overhead for schema validation (since the schema is leveraged entirely at compile-time via TypeScript) while maintaining a dynamic API surface that updates automatically when the server-side code changes.

The client interacts with the server through a thin wrapper around the `fetch` API. It handles the mapping of fluent method chains (e.g., `client.users[":id"].$get()`) to actual HTTP requests, automatically serializing JSON bodies, form data, and query parameters based on the request definition. It is designed to work in any environment where `fetch` is available, making it compatible with browser, Node.js, and edge runtimes.

## Proxy-based API Surface

The RPC Client uses a `Proxy` object to map JavaScript property accesses and method calls to API paths and HTTP methods. When you access a property, the proxy tracks the path segment and returns a new proxy instance. When a method call is performed (e.g., using a `$`-prefixed method name like `$get` or `$post`), the proxy triggers a `callback` that executes the HTTP request.

```typescript
const createProxy = (callback: Callback, path: string[]) => {
  const proxy: unknown = new Proxy(() => {}, {
    get(_obj, key) {
      if (typeof key !== 'string' || key === 'then') {
        return undefined
      }
      return createProxy(callback, [...path, key])
    },
    apply(_1, _2, args) {
      return callback({
        path,
        args,
      })
    },
  })
  return proxy
}
```
Sources: [src/client/client.ts:15-31](https://github.com/honojs/hono/blob/main/src/client/client.ts#L15-L31)

> [!NOTE]
> The `$`-prefixed methods are reserved identifiers. The proxy recognizes these as the transition from path-building to the actual HTTP request execution.

## Data Flow: Request Execution

When an HTTP method is invoked via the proxy, it triggers the `ClientRequestImpl` logic. This class encapsulates the configuration for the specific request, including path parameter substitution, query parameter building, and body serialization.

### Verification of Call Chain: ParseResponse → DetailedError
1. `parseResponse` (src/client/utils.ts:91-113) receives the result from `fetchRP`.
2. `fetchRP` (src/client/fetch-result-please.ts:13-43) executes the fetch and checks `ok` status.
3. `DetailedError` (src/client/fetch-result-please.ts:45-74) is instantiated if the status is not successful.

Sources: [src/client/utils.ts:91-113](https://github.com/honojs/hono/blob/main/src/client/utils.ts#L91-L113), [src/client/fetch-result-please.ts:13-74](https://github.com/honojs/hono/blob/main/src/client/fetch-result-please.ts#L13-L74)

## Response Handling and Error Reporting

The client includes a smart parsing mechanism that interprets the `Content-Type` header to determine how to parse the body. This is crucial for maintaining type-safe response data.

| Error Class | Purpose | Key Attributes |
| :--- | :--- | :--- |
| `DetailedError` | Standard error for non-2xx responses | `statusCode`, `detail`, `code`, `log` |

Sources: [src/client/fetch-result-please.ts:46-74](https://github.com/honojs/hono/blob/main/src/client/fetch-result-please.ts#L46-L74)

## Worked Example

To use the RPC client, import `hc` from `hono/client` and pass the type of your Hono app as a generic.

```typescript
import { hc } from 'hono/client'
import type { AppType } from './server' // The type of your Hono app

const client = hc<AppType>('http://localhost:3000')

// Full type-safe call:
const response = await client.api.posts[':id'].$get({
  param: { id: '123' },
  query: { category: 'tech' }
})

if (response.ok) {
  const data = await response.json()
  console.log(data)
}
```
Sources: [src/client/client.ts:133-136](https://github.com/honojs/hono/blob/main/src/client/client.ts#L133-L136)

> [!WARNING]
> `init` options in `ClientRequestOptions` take highest priority and can overwrite headers or methods that Hono automatically generates. Use with care.

## Design Trade-offs

| Design Choice | Benefit | Cost |
| :--- | :--- | :--- |
| `Proxy` object | Allows for a clean, fluent API surface | Can be harder to debug with standard stack traces |
| Zero-runtime schema | Extremely high performance, no overhead | Relies entirely on correct TS definitions |
| `fetch` dependency | Works in all modern environments | Limited by the browser/runtime `fetch` implementation |

Sources: [src/client/client.ts:15-31](https://github.com/honojs/hono/blob/main/src/client/client.ts#L15-L31), [src/client/client.ts:123](https://github.com/honojs/hono/blob/main/src/client/client.ts#L123)

## WebSocket Support

The client also provides specialized handling for WebSocket upgrades via the `$ws` method. This replaces the standard `fetch` call with a WebSocket establishment logic.

```typescript
    if (method === 'ws') {
      const webSocketUrl = replaceUrlProtocol(
        opts.args[0] && opts.args[0].param ? replaceUrlParam(url, opts.args[0].param) : url,
        'ws'
      )
      // ... query param appending ...
      return establishWebSocket(targetUrl.toString())
    }
```
Sources: [src/client/client.ts:187-212](https://github.com/honojs/hono/blob/main/src/client/client.ts#L187-L212)

## Related

- [[Application Routing]]

