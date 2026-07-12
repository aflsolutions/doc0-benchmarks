# Validation and Filtering

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [src/middleware/secure-headers/secure-headers.ts](https://github.com/honojs/hono/blob/main/src/middleware/secure-headers/secure-headers.ts)
- [src/adapter/aws-lambda/handler.ts](https://github.com/honojs/hono/blob/main/src/adapter/aws-lambda/handler.ts)
- [package.json](https://github.com/honojs/hono/blob/main/package.json)
- [src/types.ts](https://github.com/honojs/hono/blob/main/src/types.ts)
- [src/validator/validator.ts](https://github.com/honojs/hono/blob/main/src/validator/validator.ts)
- [src/request.ts](https://github.com/honojs/hono/blob/main/src/request.ts)
</details>

In Hono, "Validation and Filtering" encompasses two distinct mechanisms: the declarative `validator` middleware used to verify and parse incoming request data, and the `secureHeaders` middleware used to filter and sanitize outbound HTTP response headers. Together, these systems form a foundational layer for ensuring data integrity and application security.

The `validator` subsystem acts as a bridge between raw request data (JSON, FormData, Query, Params, etc.) and application logic. By intercepting the request pipeline, it enforces structural requirements and schema-like validation, ensuring that handlers only receive processed inputs. It handles complex body parsing (e.g., `multipart/form-data`) and populates a validated data store, preventing downstream handlers from having to re-parse or trust unverified input.

Conversely, the `secureHeaders` subsystem focuses on hardening the communication channel. It manages a set of standard security-related HTTP headers, providing an interface for configuring policies such as Content Security Policy (CSP), Referrer-Policy, and X-XSS-Protection. It operates by filtering a default configuration against custom overrides and generating necessary security tokens (such as nonces for CSP) dynamically during the request lifecycle.

## The Validator Middleware

The `validator` component is a flexible, target-based middleware designed to extract and validate specific portions of an incoming HTTP request. It works by mapping specific targets (e.g., `json`, `form`, `query`, `param`, `header`, `cookie`) to a user-provided validation function.

### Mechanism: Data Extraction and Validation
The `validator` middleware identifies the target type and performs the appropriate extraction before passing the result to the validator function.

1. **Target Identification:** Based on the `target` argument, the middleware fetches the corresponding data (e.g., `c.req.json()` for JSON, `getCookie(c)` for cookies).
2. **Body Parsing Guard:** For `json` and `form` targets, it verifies the `Content-Type` header against internal patterns. If the content type does not match or parsing fails, it throws an `HTTPException` (400), effectively stopping the request chain before the validator function is even executed.
3. **Execution:** The validation function is called with the extracted data and the Hono context.
4. **Result Storage:** If the validation succeeds and returns a non-Response value, the middleware calls `c.req.addValidatedData(target, res)`, which stores the validated output in an internal registry accessible by later handlers.

Sources: [src/validator/validator.ts:86-172](https://github.com/honojs/hono/blob/main/src/validator/validator.ts#L86-L172)

> [!NOTE]
> The `validator` ensures that only valid data reaches your business logic. If a `Response` object is returned by the validation function, the middleware assumes an error occurred and halts the chain by returning that response directly, skipping the next handlers.

## Secure Headers Middleware

The `secureHeaders` middleware ensures that appropriate security headers are applied to outbound responses. It maintains a dictionary of default values and uses a filtering mechanism to determine which headers should be applied to the response.

### Mechanism: Filter and Set Flow
The flow follows a strict sequence: initialization, callback preparation, and finally application during the request cycle.

1. **Filtering:** `getFilteredHeaders(options)` maps the default security configuration against provided `options`, removing headers explicitly disabled by the user and applying custom string values where provided.
2. **Dynamic Generation:** If CSP or other policy-based headers require dynamic content (like a nonce), the middleware stores callback functions.
3. **Execution:** Inside the actual middleware handler, `callbacks.reduce` processes these functions, injecting dynamic values (e.g., CSP nonces) into the header set.
4. **Finalization:** `await next()` is called, and `setHeaders` applies the finalized headers to the response object. Finally, `X-Powered-By` is explicitly deleted if `removePoweredBy` is enabled.

Sources: [src/middleware/secure-headers/secure-headers.ts:180-229](https://github.com/honojs/hono/blob/main/src/middleware/secure-headers/secure-headers.ts#L180-L229)

## Content-Security-Policy (CSP) Logic

The CSP implementation is the most complex part of `secureHeaders` due to the need to support dynamic directives, specifically for nonces.

### Mechanism: Directive Transformation
The `getCSPDirectives` function processes a `ContentSecurityPolicyOptions` object into a header string and a corresponding callback for runtime injection.

- **Normalization:** It converts camelCase keys into kebab-case strings for HTTP compliance (e.g., `scriptSrc` becomes `script-src`).
- **Callback Registration:** When a value in the options is a function (like the exported `NONCE` handler), it registers a callback that will be triggered during the request context. This callback is responsible for executing the user-supplied function, `ctx.set()` for nonces, and ensuring the injected value replaces the placeholder correctly.
- **Winner Selection:** The final header string is built by joining the directives with a semicolon separator, preserving the order defined in the object keys.

Sources: [src/middleware/secure-headers/secure-headers.ts:240-288](https://github.com/honojs/hono/blob/main/src/middleware/secure-headers/secure-headers.ts#L240-L288)

## Lambda Adapter Filtering

The AWS Lambda adapter (`handler.ts`) acts as an intermediary, filtering and transforming raw AWS event structures into Hono `Request` objects, and back into `APIGatewayProxyResult`.

### Mechanism: Request Normalization
The adapter uses internal class abstractions to handle diverse event formats (ALB, API Gateway v1/v2, Lattice).
- **Sanitization:** When mapping headers, `sanitizeHeaderValue` checks for non-ASCII characters and applies `encodeURIComponent` if necessary, ensuring header values remain within safe bounds for the underlying web server or proxy layer.
- **Cookie Extraction:** Different event sources store cookies in different fields. The processors implement a `getCookies` method to normalize these into a single `Cookie` header string before the Hono `Request` is initialized.

Sources: [src/adapter/aws-lambda/handler.ts:13-21](https://github.com/honojs/hono/blob/main/src/adapter/aws-lambda/handler.ts#L13-L21)

## Worked Example: Validating a JSON Body

This example demonstrates how to use the `validator` middleware to force structural validation on incoming JSON data.

```typescript
import { Hono } from 'hono'
import { validator } from 'hono/validator'

const app = new Hono()

app.post(
  '/user',
  validator('json', (value, c) => {
    const { name } = value
    if (typeof name !== 'string') {
      return c.json({ error: 'Name is required' }, 400)
    }
    return { name } // Validated object
  }),
  (c) => {
    const { name } = c.req.valid('json')
    return c.text(`Hello ${name}`)
  }
)
```

Sources: [src/validator/validator.ts:86-172](https://github.com/honojs/hono/blob/main/src/validator/validator.ts#L86-L172)

## Related

- [[Request Context]]

