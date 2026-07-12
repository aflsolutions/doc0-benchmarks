# HTTP Utilities

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [src/middleware/secure-headers/secure-headers.ts](https://github.com/honojs/hono/blob/main/src/middleware/secure-headers/secure-headers.ts)
- [src/adapter/aws-lambda/handler.ts](https://github.com/honojs/hono/blob/main/src/adapter/aws-lambda/handler.ts)
- [src/context.ts](https://github.com/honojs/hono/blob/main/src/context.ts)
- [src/request.ts](https://github.com/honojs/hono/blob/main/src/request.ts)
- [src/middleware/language/language.ts](https://github.com/honojs/hono/blob/main/src/middleware/language/language.ts)
- [src/utils/cookie.ts](https://github.com/honojs/hono/blob/main/src/utils/cookie.ts)
- [src/types.ts](https://github.com/honojs/hono/blob/main/src/types.ts)
</details>

HTTP Utilities in Hono provide a structured, type-safe, and middleware-friendly layer for handling standard web traffic concerns. By abstracting the intricacies of diverse environments (like AWS Lambda or standard browser-like Request/Response APIs), these utilities ensure that developers can manage headers, cookies, content security, and language negotiation with predictable consistency across the application.

These utilities act as the connective tissue between the core Hono framework and the specific runtime or infrastructure layer. By normalizing platform-specific quirks—such as mapping multi-value headers from legacy load balancers or managing non-standard Request events in serverless environments—they shield business logic from infrastructure-specific boilerplate.

At their core, these utilities are built on the principles of composition and non-destructive modification. Middleware handlers for secure headers or language detection evaluate the `Context` at runtime, allowing developers to inject state (like generated nonces for Content Security Policy) and selectively influence the outbound `Response` headers without manually managing the lifecycle of the underlying HTTP connection.

## Request Lifecycle and Platform Adaptation
The Hono framework utilizes `EventProcessor` hierarchies to bridge the gap between specific platform events (like API Gateway Proxy Events) and the standard `Request` API. This mechanism abstracts platform-specific payload formats into a unified `HonoRequest` interface.

The `getProcessor` factory evaluates the incoming event structure to select the appropriate processor:
1. `ALBProcessor` for Application Load Balancers.
2. `EventV2Processor` for HTTP API or Function URLs.
3. `LatticeV2Processor` for AWS VPC Lattice.
4. `EventV1Processor` as the fallback for standard API Gateway REST events.

Sources: [src/adapter/aws-lambda/handler.ts:625-637](https://github.com/honojs/hono/blob/main/src/adapter/aws-lambda/handler.ts#L625-L637)

### AWS Lambda Event Processing Flow
When `handle` is called, it triggers the following control flow:
1. `getProcessor` identifies the event type.
2. `processor.createRequest` transforms the raw `LambdaEvent` into a native `Request`.
3. The `Hono` app processes the request via `app.fetch`.
4. `processor.createResult` converts the resulting `Response` into the platform-specific result structure (e.g., `APIGatewayProxyResult`).

Sources: [src/adapter/aws-lambda/handler.ts:253-274](https://github.com/honojs/hono/blob/main/src/adapter/aws-lambda/handler.ts#L253-L274)

> [!TIP]
> Use `isContentEncodingBinary` when debugging responses in custom handlers to ensure binary data is not incorrectly coerced into text by the platform's response handler.

## Secure Headers Middleware
The `secureHeaders` middleware manages standard security headers, such as `Content-Security-Policy` and `Permissions-Policy`. It implements a composition strategy for directives, particularly for dynamic values like nonces.

When evaluating headers, the middleware distinguishes between static values and dynamic callbacks. If a `Content-Security-Policy` directive includes a callback, it is evaluated during the request lifecycle, often calling `ctx.set()` to share state (like the `secureHeadersNonce`) between the middleware and the response generator.

Sources: [src/middleware/secure-headers/secure-headers.ts:215-223](https://github.com/honojs/hono/blob/main/src/middleware/secure-headers/secure-headers.ts#L215-L223)

| Header | Default | Purpose |
| :--- | :--- | :--- |
| `Cross-Origin-Opener-Policy` | `same-origin` | Isolation against cross-origin attacks |
| `X-Content-Type-Options` | `nosniff` | Disables MIME sniffing |
| `Strict-Transport-Security` | `max-age=15552000` | Enforces HTTPS usage |

Sources: [src/middleware/secure-headers/secure-headers.ts:94-107](https://github.com/honojs/hono/blob/main/src/middleware/secure-headers/secure-headers.ts#L94-L107)

## Language Detection and Normalization
Language detection follows a multi-strategy pattern where various "detectors" are evaluated in a configurable `order`. The system normalizes incoming language strings—typically from headers, cookies, or URL paths—using the `normalizeLanguage` function.

Normalization follows the RFC 4647 lookup mechanism: it splits strings by `-` and performs progressive truncation to match against `supportedLanguages`. This ensures that a request for `en-US` can gracefully fall back to `en` if `en-US` is not explicitly listed in the configuration.

Sources: [src/middleware/language/language.ts:110-117](https://github.com/honojs/hono/blob/main/src/middleware/language/language.ts#L110-L117)

## Cookie Serialization and Security
The cookie utility layer provides helpers for both standard and signed cookies. The `serializeSigned` function introduces a cryptographic layer:
1. `makeSignature` generates an HMAC-SHA256 signature.
2. The value is formatted as `value.signature`.
3. The signature is base64 encoded and attached to the cookie.

Sources: [src/utils/cookie.ts:264-274](https://github.com/honojs/hono/blob/main/src/utils/cookie.ts#L264-L274)

> [!WARNING]
> `__Host-` prefixed cookies require the `Secure` flag, a path of `/`, and no `Domain` attribute. Failure to meet these criteria throws an error during serialization to prevent misconfiguration.

Sources: [src/utils/cookie.ts:179-192](https://github.com/honojs/hono/blob/main/src/utils/cookie.ts#L179-L192)

## Request and Context API
The `Context` class centralizes response construction. Its `newResponse` method is the fundamental bridge, allowing standard headers, status codes, and bodies to be assembled.

```typescript
// Example of setting a header and returning a response
app.get('/api', (c) => {
  c.header('X-Custom-Header', 'Value')
  c.status(200)
  return c.json({ message: 'Success' })
})
```
Sources: [src/context.ts:604-639](https://github.com/honojs/hono/blob/main/src/context.ts#L604-L639)

The `HonoRequest` class provides cached accessors to the underlying body. By checking `bodyCache` before reading from `raw.body`, it avoids the `TypeError` associated with consuming a stream multiple times in environments where the underlying request is immutable.

Sources: [src/request.ts:220-239](https://github.com/honojs/hono/blob/main/src/request.ts#L220-L239)

## Related

- [[Request Lifecycle]]
