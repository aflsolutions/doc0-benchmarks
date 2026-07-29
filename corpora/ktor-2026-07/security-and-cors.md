# Security and CORS

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [ktor-client/ktor-client-core/common/src/io/ktor/client/plugins/cache/HttpCache.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/plugins/cache/HttpCache.kt)
- [ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORSConfig.kt](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORSConfig.kt)
- [ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORS.kt](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORS.kt)
- [ktor-http/common/src/io/ktor/http/HttpHeaders.kt](https://github.com/ktorio/ktor/blob/main/ktor-http/common/src/io/ktor/http/HttpHeaders.kt)
- [ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORSUtils.kt](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORSUtils.kt)
- [ktor-server/ktor-server-plugins/ktor-server-forwarded-header/common/src/io/ktor/server/plugins/forwardedheaders/XForwardedHeaders.kt](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-plugins/ktor-server-forwarded-header/common/src/io/ktor/server/plugins/forwardedheaders/XForwardedHeaders.kt)
- [ktor-server/ktor-server-plugins/ktor-server-csrf/common/src/io/ktor/server/plugins/csrf/CSRFConfig.kt](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-plugins/ktor-server-csrf/common/src/io/ktor/server/plugins/csrf/CSRFConfig.kt)
- [ktor-server/ktor-server-plugins/ktor-server-csrf/common/src/io/ktor/server/plugins/csrf/CSRF.kt](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-plugins/ktor-server-csrf/common/src/io/ktor/server/plugins/csrf/CSRF.kt)
- [ktor-server/ktor-server-plugins/ktor-server-hsts/common/src/io/ktor/server/plugins/hsts/HSTS.kt](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-plugins/ktor-server-hsts/common/src/io/ktor/server/plugins/hsts/HSTS.kt)
- [ktor-server/ktor-server-plugins/ktor-server-forwarded-header/common/src/io/ktor/server/plugins/forwardedheaders/ForwardedHeaders.kt](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-plugins/ktor-server-forwarded-header/common/src/io/ktor/server/plugins/forwardedheaders/ForwardedHeaders.kt)
- [ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/routing/CORS.kt](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/routing/CORS.kt)
- [ktor-server/ktor-server-core/common/src/io/ktor/server/plugins/OriginConnectionPoint.kt](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-core/common/src/io/ktor/server/plugins/OriginConnectionPoint.kt)
- [ktor-server/ktor-server-plugins/ktor-server-sessions/common/src/io/ktor/server/sessions/SameSite.kt](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-sessions/common/src/io/ktor/server/sessions/SameSite.kt)
- [ktor-server/ktor-server-test-suites/common/src/io/ktor/server/testing/suites/HttpServerCommonTestSuite.kt](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-test-suites/common/src/io/ktor/server/testing/suites/HttpServerCommonTestSuite.kt)
</details>

## Overview

Ktor security and cross-origin resource sharing (CORS) features protect web applications against unauthorized cross-site interactions, transport-layer downgrade attacks, and request forgery vulnerabilities. By intercepting HTTP traffic at the pipeline level, Ktor applies granular access controls, enforces transport encryption directives, mitigates CSRF vectors through origin validation and custom header checks, and accurately resolves original client connection points behind reverse proxies.

Sources: [ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORS.kt:82-170](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORS.kt#L82-L170), [ktor-server/ktor-server-plugins/ktor-server-csrf/common/src/io/ktor/server/plugins/csrf/CSRF.kt:57-99](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-plugins/ktor-server-csrf/common/src/io/ktor/server/plugins/csrf/CSRF.kt#L57-L99), [ktor-server/ktor-server-plugins/ktor-server-hsts/common/src/io/ktor/server/plugins/hsts/HSTS.kt:138-145](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-plugins/ktor-server-hsts/common/src/io/ktor/server/plugins/hsts/HSTS.kt#L138-L145), [ktor-server/ktor-server-plugins/ktor-server-forwarded-header/common/src/io/ktor/server/plugins/forwardedheaders/ForwardedHeaders.kt:199-204](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-plugins/ktor-server-forwarded-header/common/src/io/ktor/server/plugins/forwardedheaders/ForwardedHeaders.kt#L199-L204)

## CORS Configuration and Host Matching Rules

### Overview

The `CORSConfig` class provides a declarative Kotlin DSL for configuring cross-origin resource sharing rules within the Ktor routing-scoped `CORS` plugin. It manages allowed hosts, schemes, subdomains, HTTP methods, request/response headers, and preflight caching durations.

Sources: [ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORSConfig.kt:17-122](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORSConfig.kt#L17-L122), [ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/routing/CORS.kt:30-36](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/routing/CORS.kt#L30-L36)

### Host Matching and Wildcard Validation

When configuring hosts via `allowHost(host, schemes, subDomains)`, Ktor validates formatting requirements to prevent malformed pattern matching. The execution walk-through for host registration proceeds through the following call chain: `allowHost()` evaluates if the host equals `"*"` (invoking `anyHost()`) or contains `"://"` (throwing an exception). It then iterates through each scheme, calling `addHost("$schema://$host")`, which invokes `validateWildcardRequirements()`. For each subdomain, `validateWildcardRequirements()` is called again before invoking `addHost("$schema://$subDomain.$host")`.

Sources: [ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORSConfig.kt:195-217](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORSConfig.kt#L195-L217)

> [!WARNING]
> Wildcards cannot appear more than once in a host pattern, and a wildcard must always appear directly in front of the domain (e.g., `*.domain.com`), not embedded inside subdomains like `sub.*.domain.com`, nor trailing like `domain.*`.

Sources: [ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORSConfig.kt:182-186](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORSConfig.kt#L182-L186), [ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORSConfig.kt:219-227](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORSConfig.kt#L219-L227)

### Default Values and Constants

The `CORSConfig` companion object defines default fallback collections for simple request headers, simple response headers, content types, and default methods.

| Constant Name | Type | Default Value | Purpose |
| :--- | :--- | :--- | :--- |
| `CORS_DEFAULT_MAX_AGE` | `Long` | `86400L` (1 day) | Default CORS max age in seconds for preflight response caching. |
| `CorsDefaultMethods` | `Set<HttpMethod>` | `GET`, `POST`, `HEAD` | Default HTTP methods always allowed by CORS. |
| `CorsSimpleRequestHeaders` | `Set<String>` | `Accept`, `AcceptLanguage`, `ContentLanguage`, `ContentType` | Case-insensitive set of simple request headers. |
| `CorsSimpleResponseHeaders` | `Set<String>` | `CacheControl`, `ContentLanguage`, `ContentType`, `Expires`, `LastModified`, `Pragma` | Case-insensitive set of simple response headers. |
| `CorsSimpleContentTypes` | `Set<ContentType>` | `application/x-www-form-urlencoded`, `multipart/form-data`, `text/plain` | Content types allowed without preflight check. |

Sources: [ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORSConfig.kt:21-78](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORSConfig.kt#L21-L78)

> [!NOTE]
> Passing `HttpHeaders.ContentType` to `allowHeader(header)` automatically sets `allowNonSimpleContentTypes` to `true` rather than adding the header to the custom headers collection.

Sources: [ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORSConfig.kt:292-296](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORSConfig.kt#L292-L296)

### Configuration Example

The following example demonstrates setting up the `CORS` plugin using the configuration DSL to allow a specific host, custom headers, and explicit methods:

```kotlin
val plugin = install(CORS) {
    anyHost()
    allowMethod(HttpMethod.Put)
    allowMethod(HttpMethod.Delete)
    allowHeader(HttpHeaders.Authorization)
    exposeHeader("X-Custom-Header")
    maxAgeInSeconds = 3600
    allowCredentials = true
}
```

Sources: [ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORSConfig.kt:121](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORSConfig.kt#L121), [ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORSConfig.kt:141](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORSConfig.kt#L141), [ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORSConfig.kt:177-179](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORSConfig.kt#L177-L179), [ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORSConfig.kt:243-246](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORSConfig.kt#L243-L246), [ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORSConfig.kt:292-300](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORSConfig.kt#L292-L300), [ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORSConfig.kt:311-315](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORSConfig.kt#L311-L315), [ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/routing/CORS.kt:30-36](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/routing/CORS.kt#L30-L36)

## CORS Preflight Processing and Request Interception

### Overview

Runtime CORS interception executes inside the plugin's `onCall` interceptor. When an incoming request arrives, the plugin first checks if the response is already committed, returning immediately if so. It then ensures `Vary: Origin` headers are added unless wildcards are used without credentials.

Sources: [ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORS.kt:82-91](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORS.kt#L82-L91)

### Request Interception Call Chain

Incoming request processing proceeds through a strict sequence of checks:

1. `call.request.headers.getAll(HttpHeaders.Origin)?.singleOrNull()` evaluates the single `Origin` header. If missing, the handler skips further processing.
Sources: [ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORS.kt:93-98](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORS.kt#L93-L98)

2. `checkOrigin()` is invoked with the origin string, request, and configuration parameters, returning an `OriginCheckResult` (`OK`, `SkipCORS`, or `Failed`). If `Failed`, `call.respondCorsFailed()` responds with `HttpStatusCode.Forbidden`.
Sources: [ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORS.kt:100-121](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORS.kt#L100-L121), [ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORSUtils.kt:136-138](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORSUtils.kt#L136-L138)

3. If non-simple content types are disallowed, the request content type is parsed and checked against `CORSConfig.CorsSimpleContentTypes`.
Sources: [ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORS.kt:123-135](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORS.kt#L123-L135)

4. If the request HTTP method is `HttpMethod.Options` and contains an `AccessControl-Request-Method` header, `call.respondPreflight()` is executed. Otherwise, the current method is validated against allowed methods using `call.corsCheckCurrentMethod()`.
Sources: [ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORS.kt:137-160](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORS.kt#L137-L160)

5. Successful requests receive `Access-Control-Allow-Origin`, `Access-Control-Allow-Credentials`, and optional `Access-Control-Expose-Headers` response headers.
Sources: [ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORS.kt:164-170](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORS.kt#L164-L170)

> [!CAUTION]
> If a request contains multiple `Origin` headers, `singleOrNull()` returns `null`, causing the plugin to skip the CORS handler entirely.

Sources: [ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORS.kt:93-98](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORS.kt#L93-L98)

### Origin Matching and Validation

The `checkOrigin()` function evaluates incoming origins against several validation and matching rules:

- `isValidOrigin()` verifies that the origin is non-empty, equals `"null"`, or matches a valid protocol scheme followed by a host and optional explicit port digits without '%' characters.
Sources: [ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORSUtils.kt:161-185](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORSUtils.kt#L161-L185)

- `isSameOrigin()` compares normalized request connection points against the origin when `allowSameOrigin` is enabled.
Sources: [ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORSUtils.kt:42-45](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORSUtils.kt#L42-L45)

- `corsCheckOrigins()` evaluates normalized origins against normalized hosts, wildcard host pairs, and custom `originPredicates`.
Sources: [ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORSUtils.kt:47-101](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORSUtils.kt#L47-L101)

### Preflight Processing and Response Generation

When `respondPreflight()` executes, it parses `Access-Control-Request-Headers` and performs validation through `corsCheckRequestMethod()` and `corsCheckRequestHeaders()`. If validation fails, it responds with `HttpStatusCode.Forbidden`. If successful, it populates headers including `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`, and `Access-Control-Max-Age`, finishing with `HttpStatusCode.OK`.

Sources: [ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORS.kt:220-276](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORS.kt#L220-L276)

> [!NOTE]
> Origin normalization automatically appends default ports (`80` for `http`, `443` for `https`) if an explicit port is omitted from the origin string.

Sources: [ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORSUtils.kt:187-214](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-plugins/ktor-server-cors/common/src/io/ktor/server/plugins/cors/CORSUtils.kt#L187-L214)

## Cross-Site Request Forgery Mitigation Mechanism

### Overview

The `CSRF` plugin provides route-scoped protection against cross-site request forgery through origin verification, host header matching, referer normalization, and custom header validation. Configuration is managed via `CSRFConfig`, which exposes methods to define allowed origin URLs, enforce host matching, register custom header predicates, and customize failure handling.

Sources: [ktor-server/ktor-server-plugins/ktor-server-csrf/common/src/io/ktor/server/plugins/csrf/CSRFConfig.kt:17-82](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-plugins/ktor-server-csrf/common/src/io/ktor/server/plugins/csrf/CSRFConfig.kt#L17-L82), [ktor-server/ktor-server-plugins/ktor-server-csrf/common/src/io/ktor/server/plugins/csrf/CSRF.kt:38-99](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-plugins/ktor-server-csrf/common/src/io/ktor/server/plugins/csrf/CSRF.kt#L38-L99)

### Request Execution Walkthrough and Validation Logic

When an incoming application call reaches the plugin, validation proceeds through a

## Related

- [[Server Authentication]]

