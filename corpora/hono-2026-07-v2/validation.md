# Validation

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [src/utils/jwt/jwt.ts](https://github.com/honojs/hono/blob/main/src/utils/jwt/jwt.ts)
- [src/adapter/aws-lambda/handler.ts](https://github.com/honojs/hono/blob/main/src/adapter/aws-lambda/handler.ts)
- [src/types.ts](https://github.com/honojs/hono/blob/main/src/types.ts)
- [src/middleware/secure-headers/secure-headers.ts](https://github.com/honojs/hono/blob/main/src/middleware/secure-headers/secure-headers.ts)
- [src/request.ts](https://github.com/honojs/hono/blob/main/src/request.ts)
- [src/validator/validator.ts](https://github.com/honojs/hono/blob/main/src/validator/validator.ts)
- [src/context.ts](https://github.com/honojs/hono/blob/main/src/context.ts)
</details>

## The Validator Middleware Interface

The `validator` middleware acts as a higher-order function that registers a validation step for a specific request part. It identifies the `target` (where to extract data) and applies a `validationFunc` to inspect that data. If the validation function returns a `Response` object, the middleware immediately returns that response, effectively short-circuiting the request pipeline.

```typescript
// Example: Validating a JSON request body
app.post('/user', validator('json', (value, c) => {
  if (!value.name) {
    return c.json({ error: 'Name is required' }, 400)
  }
  return value
}), (c) => {
  const user = c.req.valid('json')
  return c.json({ user })
})
```
Sources: [src/validator/validator.ts:46-172](https://github.com/honojs/hono/blob/main/src/validator/validator.ts#L46-L172)

## Request Data Extraction Mechanism

The validator determines the extraction strategy based on the `target` argument. For `json`, it checks the `Content-Type` header against `application/json` before calling `c.req.json()`. For `form`, it parses `multipart/form-data` or `application/x-www-form-urlencoded` payloads using `bufferToFormData`.

> [!NOTE]
> The validator automatically caches `formData` in `c.req.bodyCache.formData` during the first pass to prevent redundant buffer parsing if subsequent middleware or handlers require the same data.

Sources: [src/validator/validator.ts:93-143](https://github.com/honojs/hono/blob/main/src/validator/validator.ts#L93-L143)

## Validated Data Storage

Once a validation function successfully returns a value (and not an instance of `Response`), the validator stores the result using `c.req.addValidatedData(target, res)`. This registry allows route handlers to retrieve the cleaned, validated payload later using the `c.req.valid(target)` method. This mechanism provides a strictly typed way to share data across the middleware chain.

Sources: [src/validator/validator.ts:168-170](https://github.com/honojs/hono/blob/main/src/validator/validator.ts#L168-L170)
Sources: [src/request.ts:339-354](https://github.com/honojs/hono/blob/main/src/request.ts#L339-L354)

## JWT Verification Architecture

The JWT validation system provides methods for both manual and JWKS-based verification. The `verify` function is the core primitive, performing structural checks on the token (split into three parts) and validating standard claims like `exp` (expiration), `nbf` (not before), and `iat` (issued at).

Sources: [src/utils/jwt/jwt.ts:96-188](https://github.com/honojs/hono/blob/main/src/utils/jwt/jwt.ts#L96-L188)

A critical security guard exists within `verifyWithJwks`: it explicitly rejects symmetric algorithms (HS256, HS384, HS512) when verifying against JWKS. This prevents algorithm confusion attacks where a malicious client might try to force a server to verify an asymmetric token using a known symmetric secret key.

```typescript
// Reject symmetric algorithms to prevent algorithm confusion
if (symmetricAlgorithms.includes(header.alg as SymmetricAlgorithm)) {
  throw new JwtSymmetricAlgorithmNotAllowed(header.alg)
}
```
Sources: [src/utils/jwt/jwt.ts:218-221](https://github.com/honojs/hono/blob/main/src/utils/jwt/jwt.ts#L218-L221)

Furthermore, the `verifyWithJwks` implementation handles the dynamic retrieval and lifecycle of signing keys, either by using a provided list of keys or by fetching them from an external `jwks_uri`. It mandates the inclusion of a Key ID (`kid`) in the header to ensure proper key selection during verification.

Sources: [src/utils/jwt/jwt.ts:197-262](https://github.com/honojs/hono/blob/main/src/utils/jwt/jwt.ts#L197-L262)

## Security Headers and Nonce Generation

The `secure-headers` middleware validates and enforces browser security policies. It supports CSP (Content Security Policy), Permissions Policy, and various protection headers. For CSP, it provides a `NONCE` generator that creates a cryptographically secure random value, stores it in the context via `ctx.set('secureHeadersNonce', nonce)`, and exposes it to templates.

Sources: [src/middleware/secure-headers/secure-headers.ts:131-145](https://github.com/honojs/hono/blob/main/src/middleware/secure-headers/secure-headers.ts#L131-L145)

## Adapter-Level Request Validation

When running on serverless environments like AWS Lambda, the system must validate the incoming event object to determine the appropriate processor. The `getProcessor` function acts as a dispatcher, identifying if the event belongs to ALB, V1 (API Gateway), V2 (HTTP API), or Lattice, ensuring that headers and path parameters are correctly normalized.

Sources: [src/adapter/aws-lambda/handler.ts:625-637](https://github.com/honojs/hono/blob/main/src/adapter/aws-lambda/handler.ts#L625-L637)

### Processor Selection Logic
| Condition | Event Processor |
| :--- | :--- |
| `event.requestContext` has `elb` | `ALBProcessor` |
| `event` has `rawPath` and `requestContext.http` | `EventV2Processor` |
| `event.requestContext` has `serviceArn` | `LatticeV2Processor` |
| Fallback | `EventV1Processor` |

Sources: [src/adapter/aws-lambda/handler.ts:639-658](https://github.com/honojs/hono/blob/main/src/adapter/aws-lambda/handler.ts#L639-L658)

## Related

- [[Request Lifecycle]]
