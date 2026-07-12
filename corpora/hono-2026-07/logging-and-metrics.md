# Logging and Metrics

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [package.json](https://github.com/honojs/hono/blob/main/package.json)
- [src/adapter/aws-lambda/handler.ts](https://github.com/honojs/hono/blob/main/src/adapter/aws-lambda/handler.ts)
- [src/middleware/secure-headers/secure-headers.ts](https://github.com/honojs/hono/blob/main/src/middleware/secure-headers/secure-headers.ts)
- [jsr.json](https://github.com/honojs/hono/blob/main/jsr.json)
- [src/types.ts](https://github.com/honojs/hono/blob/main/src/types.ts)
- [src/middleware/timing/timing.ts](https://github.com/honojs/hono/blob/main/src/middleware/timing/timing.ts)
</details>

Observability in Hono, specifically through "Logging and Metrics," is achieved via modular middleware designed to track request lifecycle events and performance characteristics. These components exist to bridge the gap between abstract application logic and actionable infrastructure data, allowing developers to monitor execution duration, resource consumption, and security posture without polluting business logic.

The architecture emphasizes transparency and extensibility. Metrics, such as the `Timing` middleware, utilize the `Context` object as a central store for transient state during the request lifecycle. By integrating directly into the request flow, these components gain access to headers, environment variables, and execution context, enabling them to decorate responses with meaningful metadata before they reach the client or upstream proxy.

Design decisions prioritize standard web protocols and environment-agnostic implementations. For example, the `Timing` middleware adheres to the `Server-Timing` header specification, and security features implement standard CSP and Permissions-Policy directives. By design, these subsystems act as decorators that operate alongside standard application handlers, ensuring that logging and metrics remain non-intrusive yet highly configurable.

## Server-Timing Middleware

The `timing` middleware tracks the execution duration of specific code segments. It maintains an internal `Map` of active timers and a list of metrics strings, which are eventually serialized into a `Server-Timing` header.

### Mechanism

When the `timing` middleware is invoked, it initializes a state object containing a `timers` map and a `headers` array, and stores this in the Hono `Context` under the key `metric`.

1.  **Initialization**: Upon activation, the middleware checks if a `metric` state already exists in the `Context`. If it does, it skips initialization to prevent double-processing.
2.  **Instrumentation**: Developers use `startTime(c, name)` and `endTime(c, name)` to wrap logic. `startTime` records the current `performance.now()` timestamp in the `timers` map.
3.  **Finalization**: When `endTime` is called, it calculates the duration by subtracting the start time from the current time. It then calls `setMetric` to format the result into the standard `name;dur=value;desc="description"` string format and adds it to the `headers` list.
4.  **Header Generation**: After `next()` completes, the middleware reads the collected metrics and appends them to the response headers using `c.res.headers.append('Server-Timing', ...)`.

> [!TIP]
> The `wrapTime` utility function provides a concise way to time asynchronous operations: `await wrapTime(c, 'db', db.findMany())`. It ensures that `endTime` is always called in a `finally` block, preventing inaccurate metrics if the operation throws an error.

Sources: [src/middleware/timing/timing.ts:30-35](https://github.com/honojs/hono/blob/main/src/middleware/timing/timing.ts#L30-L35), [src/middleware/timing/timing.ts:85-126](https://github.com/honojs/hono/blob/main/src/middleware/timing/timing.ts#L85-L126), [src/middleware/timing/timing.ts:187-225](https://github.com/honojs/hono/blob/main/src/middleware/timing/timing.ts#L187-L225), [src/middleware/timing/timing.ts:244-257](https://github.com/honojs/hono/blob/main/src/middleware/timing/timing.ts#L244-L257)

## Secure Headers Middleware

The `secure-headers` middleware enhances application security by injecting standard HTTP security headers. It supports Content Security Policy (CSP), Permissions Policy, and various static security flags.

### Mechanism

This middleware operates by constructing a list of headers during initialization and then evaluating callbacks that dynamically set headers based on the request `Context`.

-   **Initialization**: It merges `DEFAULT_OPTIONS` with user-provided `customOptions`. It performs an initial scan to identify static headers and dynamic callbacks for CSP generation.
-   **Execution Flow**: The `secureHeaders` middleware function acts as a wrapper around the application.
-   **Evaluation**: Before `next()` is called, it runs callbacks to resolve dynamic headers like nonces. This is critical because certain security directives (such as CSP nonces) must be generated per-request and shared with the application logic via `ctx.set`.
-   **Post-processing**: After `next()` resolves, the computed headers are injected into the response.

Sources: [src/middleware/secure-headers/secure-headers.ts:179-229](https://github.com/honojs/hono/blob/main/src/middleware/secure-headers/secure-headers.ts#L179-L229), [src/middleware/secure-headers/secure-headers.ts:240-288](https://github.com/honojs/hono/blob/main/src/middleware/secure-headers/secure-headers.ts#L240-L288), [src/middleware/secure-headers/secure-headers.ts:330-334](https://github.com/honojs/hono/blob/main/src/middleware/secure-headers/secure-headers.ts#L330-L334)

## AWS Lambda Telemetry and Errors

In the AWS Lambda adapter, logging and metrics are implicitly handled through standard `console.error` calls during the request handling phase.

### Error Handling Flow

The `handle` and `streamHandle` functions encapsulate the application execution. If an exception occurs, they catch the error and perform basic status reporting:

1.  **Execution**: `app.fetch` executes within a `try` block.
2.  **Recovery**: If an error is thrown, the handler performs a `console.error`.
3.  **Response**:
    -   In `handle`: It determines the error type and generates a 400 or 500 status code, then creates a proxy result.
    -   In `streamHandle`: It writes an 'Internal Server Error' string to the `responseStream` and closes it via `finally`.

Sources: [src/adapter/aws-lambda/handler.ts:148-190](https://github.com/honojs/hono/blob/main/src/adapter/aws-lambda/handler.ts#L148-L190), [src/adapter/aws-lambda/handler.ts:256-274](https://github.com/honojs/hono/blob/main/src/adapter/aws-lambda/handler.ts#L256-L274)

## Design Trade-offs

| Design choice | Benefit | Cost |
| :--- | :--- | :--- |
| `Context`-based storage | Enables middleware to pass data to handlers seamlessly | Requires middleware to be added before handlers access state |
| `Server-Timing` strings | Leverages established HTTP standard for observability | Limits performance data to what fits in a single header line |
| Middleware-centric configuration | Keeps application code clean of instrumentation logic | Can lead to high middleware nesting if not managed |

## Example Usage

### Timing Middleware

```typescript
import { Hono } from 'hono'
import { timing, startTime, endTime } from 'hono/timing'

const app = new Hono()

app.use(timing())

app.get('/', async (c) => {
  startTime(c, 'work')
  // Do expensive work
  endTime(c, 'work')
  return c.text('Timed!')
})
```

Sources: [src/middleware/timing/timing.ts:76-126](https://github.com/honojs/hono/blob/main/src/middleware/timing/timing.ts#L76-L126)

### Secure Headers Middleware

```typescript
import { Hono } from 'hono'
import { secureHeaders, NONCE } from 'hono/secure-headers'

const app = new Hono()

app.use(
  secureHeaders({
    contentSecurityPolicy: {
      scriptSrc: [NONCE],
    },
  })
)
```

Sources: [src/middleware/secure-headers/secure-headers.ts:137-145](https://github.com/honojs/hono/blob/main/src/middleware/secure-headers/secure-headers.ts#L137-L145), [src/middleware/secure-headers/secure-headers.ts:179-229](https://github.com/honojs/hono/blob/main/src/middleware/secure-headers/secure-headers.ts#L179-L229)

## Related

- [[Traffic Control]]

