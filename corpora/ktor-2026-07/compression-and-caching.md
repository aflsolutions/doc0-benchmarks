# Compression and Caching

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [ktor-client/ktor-client-core/common/src/io/ktor/client/plugins/cache/HttpCache.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/plugins/cache/HttpCache.kt)
- [ktor-client/ktor-client-plugins/ktor-client-encoding/common/src/ContentEncoding.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-plugins/ktor-client-encoding/common/src/ContentEncoding.kt)
- [ktor-server/ktor-server-plugins/ktor-server-compression/jvm/src/io/ktor/server/plugins/compression/Compression.kt](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-plugins/ktor-server-compression/jvm/src/io/ktor/server/plugins/compression/Compression.kt)
- [ktor-client/ktor-client-core/common/src/io/ktor/client/plugins/cache/HttpCacheLegacy.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/plugins/cache/HttpCacheLegacy.kt)
- [ktor-server/ktor-server-core/jvm/src/io/ktor/server/http/content/PreCompressed.kt](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-core/jvm/src/io/ktor/server/http/content/PreCompressed.kt)
- [ktor-server/ktor-server-plugins/ktor-server-conditional-headers/common/src/io/ktor/server/plugins/conditionalheaders/ConditionalHeaders.kt](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-plugins/ktor-server-conditional-headers/common/src/io/ktor/server/plugins/conditionalheaders/ConditionalHeaders.kt)
- [ktor-server/ktor-server-plugins/ktor-server-caching-headers/common/src/io/ktor/server/plugins/cachingheaders/CachingHeaders.kt](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-plugins/ktor-server-caching-headers/common/src/io/ktor/server/plugins/cachingheaders/CachingHeaders.kt)
- [ktor-client/ktor-client-core/common/src/io/ktor/client/plugins/cache/HttpCacheEntry.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/plugins/cache/HttpCacheEntry.kt)
- [ktor-server/ktor-server-test-suites/jvm/src/io/ktor/server/testing/suites/CompressionTestSuite.kt](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-test-suites/jvm/src/io/ktor/server/testing/suites/CompressionTestSuite.kt)
- [ktor-compiler-plugin/testData/openapi/Responses.expected.json](https://github.com/ktorio/ktor/blob/main/ktor-compiler-plugin/testData/openapi/Responses.expected.json)
- [ktor-client/ktor-client-core/common/src/io/ktor/client/plugins/cache/HttpCacheValidation.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/plugins/cache/HttpCacheValidation.kt)
- [ktor-client/ktor-client-core/common/src/io/ktor/client/utils/HeadersUtils.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/utils/HeadersUtils.kt)
- [ktor-http/common/src/io/ktor/http/content/CachingOptions.kt](https://github.com/ktorio/ktor/blob/main/ktor-http/common/src/io/ktor/http/content/CachingOptions.kt)
- [ktor-server/ktor-server-plugins/ktor-server-double-receive/common/src/io/ktor/server/plugins/doublereceive/DoubleReceive.kt](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-plugins/ktor-server-double-receive/common/src/io/ktor/server/plugins/doublereceive/DoubleReceive.kt)
</details>

## Overview

Ktor provides robust, extensible mechanisms for managing HTTP caching and payload compression across both client and server applications. These capabilities optimize network utilization, reduce latency, and minimize bandwidth consumption by storing reusable responses, evaluating conditional headers, and dynamically or statically encoding content streams. Sources: [ktor-client/ktor-client-core/common/src/io/ktor/client/plugins/cache/HttpCache.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/plugins/cache/HttpCache.kt#L37-L43), [ktor-client/ktor-client-plugins/ktor-client-encoding/common/src/ContentEncoding.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-plugins/ktor-client-encoding/common/src/ContentEncoding.kt#L97-L103), [ktor-server/ktor-server-plugins/ktor-server-compression/jvm/src/io/ktor/server/plugins/compression/Compression.kt](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-plugins/ktor-server-compression/jvm/src/io/ktor/server/plugins/compression/Compression.kt#L117-L125), [ktor-server/ktor-server-plugins/ktor-server-conditional-headers/common/src/io/ktor/server/plugins/conditionalheaders/ConditionalHeaders.kt](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-plugins/ktor-server-conditional-headers/common/src/io/ktor/server/plugins/conditionalheaders/ConditionalHeaders.kt#L59-L68)

## Client HTTP Cache Architecture

The `HttpCache` plugin manages client-side caching by intercepting outgoing requests and incoming responses within the Ktor client pipeline. It supports both modern `CacheStorage` backends and legacy `HttpCacheStorage` implementations. Sources: [ktor-client/ktor-client-core/common/src/io/ktor/client/plugins/cache/HttpCache.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/plugins/cache/HttpCache.kt#L46-L53), [ktor-client/ktor-client-core/common/src/io/ktor/client/plugins/cache/HttpCacheLegacy.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/plugins/cache/HttpCacheLegacy.kt#L21-L53)

During request processing, the send pipeline inserts a `Cache` phase after `HttpSendPipeline.State`. The plugin verifies that the method is `HttpMethod.Get` and that the protocol is either `http` or `https`. If `isSharedClient` is enabled and an `Authorization` header is present, the request bypasses the cache. Sources: [ktor-client/ktor-client-core/common/src/io/ktor/client/plugins/cache/HttpCache.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/plugins/cache/HttpCache.kt#L187-L203), [ktor-client/ktor-client-core/common/src/io/ktor/client/plugins/cache/HttpCache.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/plugins/cache/HttpCache.kt#L431-L431)

When executing `plugin.findResponse(context, content)`, the plugin queries both private and public modern storages for entries matching the request URL and verify-keys. Sources: [ktor-client/ktor-client-core/common/src/io/ktor/client/plugins/cache/HttpCache.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/plugins/cache/HttpCache.kt#L389-L402)

Once a cached response is located, `shouldValidate()` evaluates whether the entry can be served immediately or requires revalidation against the server. Sources: [ktor-client/ktor-client-core/common/src/io/ktor/client/plugins/cache/HttpCache.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/plugins/cache/HttpCache.kt#L214-L221), [ktor-client/ktor-client-core/common/src/io/ktor/client/plugins/cache/HttpCacheEntry.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/plugins/cache/HttpCacheEntry.kt#L105-L151)

| ValidateStatus | Condition Checked | Action Taken | Sources |
| :--- | :--- | :--- | :--- |
| `ShouldValidate` | Request `no-cache`, request `max-age=0`, response `no-cache`, `must-revalidate`, or expired cache without valid `max-stale`. | Appends `If-None-Match` (ETag) and `If-Modified-Since` headers to the outgoing request. | [ktor-client/ktor-client-core/common/src/io/ktor/client/plugins/cache/HttpCache.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/plugins/cache/HttpCache.kt#L228-L236), [ktor-client/ktor-client-core/common/src/io/ktor/client/plugins/cache/HttpCacheEntry.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/plugins/cache/HttpCacheEntry.kt#L114-L150) |
| `ShouldNotValidate` | Expiry timestamp is in the future relative to current time (`cacheExpires.timestamp - getTimeMillis() > 0`), and no explicit revalidation directives are violated. | Bypasses network request, constructs response via `cache.createResponse`, and raises `HttpResponseFromCache`. | [ktor-client/ktor-client-core/common/src/io/ktor/client/plugins/cache/HttpCache.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/plugins/cache/HttpCache.kt#L216-L221), [ktor-client/ktor-client-core/common/src/io/ktor/client/plugins/cache/HttpCacheEntry.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/plugins/cache/HttpCacheEntry.kt#L131-L135) |
| `ShouldWarn` | Cached response is stale but falls within the acceptable `max-stale` window specified by the request. | Proceeds with cached response while injecting a warning header (`Warning: 110`). | [ktor-client/ktor-client-core/common/src/io/ktor/client/plugins/cache/HttpCache.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/plugins/cache/HttpCache.kt#L223-L226), [ktor-client/ktor-client-core/common/src/io/ktor/client/plugins/cache/HttpCacheEntry.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/plugins/cache/HttpCacheEntry.kt#L141-L148) |

> [!WARNING]
> If a request specifies the `only-if-cached` Cache-Control directive and no matching cache entry is found, the plugin short-circuits the pipeline immediately, returning an `HttpStatusCode.GatewayTimeout` (504) response without contacting the network. Sources: [ktor-client/ktor-client-core/common/src/io/ktor/client/plugins/cache/HttpCache.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/plugins/cache/HttpCache.kt#L207-L212), [ktor-client/ktor-client-core/common/src/io/ktor/client/plugins/cache/HttpCache.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/plugins/cache/HttpCache.kt#L311-L326)

When a client configuration explicitly sets deprecated storage properties via `publicStorage` or `privateStorage`, `useOldStorage` evaluates to `true`. This triggers execution paths via `interceptSendLegacy` and `interceptReceiveLegacy` in `HttpCacheLegacy.kt`. Sources: [ktor-client/ktor-client-core/common/src/io/ktor/client/plugins/cache/HttpCache.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/plugins/cache/HttpCache.kt#L80-L109), [ktor-client/ktor-client-core/common/src/io/ktor/client/plugins/cache/HttpCache.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/plugins/cache/HttpCache.kt#L199-L202), [ktor-client/ktor-client-core/common/src/io/ktor/client/plugins/cache/HttpCacheLegacy.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/plugins/cache/HttpCacheLegacy.kt#L21-L76)

In legacy mode, storage selection utilizes `HttpCacheStorage` implementations and `HttpCacheEntry` wrappers rather than the modern `CacheStorage` and `CachedResponseData` classes. If a 304 `NotModified` response is received under legacy fallback, `refreshNotModifiedResponse` invokes `plugin::findAndRefresh`, merging new headers, updating expiration metadata, and producing responses via `HttpCacheEntry.produceResponse()`. Sources: [ktor-client/ktor-client-core/common/src/io/ktor/client/plugins/cache/HttpCacheLegacy.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/plugins/cache/HttpCacheLegacy.kt#L66-L75), [ktor-client/ktor-client-core/common/src/io/ktor/client/plugins/cache/HttpCacheLegacy.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/plugins/cache/HttpCacheLegacy.kt#L116-L133), [ktor-client/ktor-client-core/common/src/io/ktor/client/plugins/cache/HttpCacheEntry.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/plugins/cache/HttpCacheEntry.kt#L36-L50)

> [!NOTE]
> Global cache invalidation via `clearAllCaches()` is explicitly unsupported when `useOldStorage` is enabled, throwing an `IllegalStateException` to prompt migration to the modern `CacheStorage` API. Sources: [ktor-client/ktor-client-core/common/src/io/ktor/client/plugins/cache/HttpCache.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/plugins/cache/HttpCache.kt#L144-L148)

## Server Caching and Conditional Headers

Server-side HTTP caching and conditional request evaluation are handled through two route-scoped plugins: `CachingHeaders` and `ConditionalHeaders`. These plugins intercept outgoing responses during the `ResponseBodyReadyForSend` hook phase to inject freshness directives and evaluate version validators against incoming request headers. Sources: [ktor-server/ktor-server-plugins/ktor-server-conditional-headers/common/src/io/ktor/server/plugins/conditionalheaders/ConditionalHeaders.kt](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-plugins/ktor-server-conditional-headers/common/src/io/ktor/server/plugins/conditionalheaders/ConditionalHeaders.kt#L85-L124), [ktor-server/ktor-server-plugins/ktor-server-caching-headers/common/src/io/ktor/server/plugins/cachingheaders/CachingHeaders.kt](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-plugins/ktor-server-caching-headers/common/src/io/ktor/server/plugins/cachingheaders/CachingHeaders.kt#L59-L89)

The `CachingHeaders` plugin configures caching directives using `CachingOptions`, which encapsulates optional `CacheControl` and `Expires` parameters. By default, `CachingHeadersConfig` populates its `optionsProviders` list with two standard providers: `call.caching` retrieved from application call attributes, and `content.caching` retrieved from outgoing content properties. Custom providers can be registered via the `options` DSL method. Sources: [ktor-server/ktor-server-plugins/ktor-server-caching-headers/common/src/io/ktor/server/plugins/cachingheaders/CachingHeaders.kt](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-plugins/ktor-server-caching-headers/common/src/io/ktor/server/plugins/cachingheaders/CachingHeaders.kt#L19-L38), [ktor-http/common/src/io/ktor/http/content/CachingOptions.kt](https://github.com/ktorio/ktor/blob/main/ktor-http/common/src/io/ktor/http/content/CachingOptions.kt#L11-L36)

When an outgoing response reaches `ResponseBodyReadyForSend`, `optionsFor` iterates over all configured providers. Non-null caching options are collected, their cache control directives merged, and the `Cache-Control` header appended. If an `expires` date is present, it is formatted via `toHttpDate()` and written to the `Expires` response header. Sources: [ktor-server/ktor-server-plugins/ktor-server-caching-headers/common/src/io/ktor/server/plugins/cachingheaders/CachingHeaders.kt](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-plugins/ktor-server-caching-headers/common/src/io/ktor/server/plugins/cachingheaders/CachingHeaders.kt#L63-L88)

> [!NOTE]
> The `ApplicationCall.caching` and `OutgoingContent.caching` extension properties store `CachingOptions` instances inside `AttributeKey("Caching")` and `AttributeKey("Caching")` respectively, allowing dynamic cache control overrides per request or content instance. Sources: [ktor-server/ktor-server-plugins/ktor-server-caching-headers/common/src/io/ktor/server/plugins/cachingheaders/CachingHeaders.kt](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-plugins/ktor-server-caching-headers/common/src/io/ktor/server/plugins/cachingheaders/CachingHeaders.kt#L96-L101), [ktor-http/common/src/io/ktor/http/content/CachingOptions.kt](https://github.com/ktorio/ktor/blob/main/ktor-http/common/src/io/ktor/http/content/CachingOptions.kt#L21-L36)

The `ConditionalHeaders` plugin avoids transmitting unchanged response bodies by validating resource versions against client request headers. The configuration initializes `versionProviders` with two default sources: `content.versions` and a fallback that parses incoming headers via `content.headers.parseVersions()` or `call.response.headers.allValues().parseVersions()`. Custom version providers can be registered using the `version` configuration block. Sources: [ktor-server/ktor-server-plugins/ktor-server-conditional-headers/common/src/io/ktor/server/plugins/conditionalheaders/ConditionalHeaders.kt](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-plugins/ktor-server-conditional-headers/common/src/io/ktor/server/plugins/conditionalheaders/ConditionalHeaders.kt#L21-L44)

During `ResponseBodyReadyForSend`, the plugin executes the following sequence:
1. `call.versionsFor(content)` invokes all registered version providers, flattening the resulting lists. Sources: [ktor-server/ktor-server-plugins/ktor-server-conditional-headers/common/src/io/ktor/server/plugins/conditionalheaders/ConditionalHeaders.kt](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-plugins/ktor-server-conditional-headers/common/src/io/ktor/server/plugins/conditionalheaders/ConditionalHeaders.kt#L54-L57), [ktor-server/ktor-server-plugins/ktor-server-conditional-headers/common/src/io/ktor/server/plugins/conditionalheaders/ConditionalHeaders.kt#L103-L104)
2. If versions are found, `it.appendHeadersTo(this)` populates response headers such as `ETag` and `Last-Modified` if they are not already present. Sources: [ktor-server/ktor-server-plugins/ktor-server-conditional-headers/common/src/io/ktor/server/plugins/conditionalheaders/ConditionalHeaders.kt#L106-L117)
3. `checkVersions(call, versions)` iterates over each version, calling `version.check(call.request.headers)`. Sources: [ktor-server/ktor-server-plugins/ktor-server-conditional-headers/common/src/io/ktor/server/plugins/conditionalheaders/ConditionalHeaders.kt#L93-L101), [ktor-server/ktor-server-plugins/ktor-server-conditional-headers/common/src/io/ktor/server/plugins/conditionalheaders/ConditionalHeaders.kt#L119-L120)
4. If any check returns a non-OK status, `transformBodyTo(HttpStatusCodeContent(checkResult.statusCode))` replaces the response body with an empty conditional status response (such as `304 Not Modified`). Sources: [ktor-server/ktor-server-plugins/ktor-server-conditional-headers/common/src/io/ktor/server/plugins/conditionalheaders/ConditionalHeaders.kt#L96-L101), [ktor-server/ktor-server-plugins/ktor-server-conditional-headers/common/src/io/ktor/server/plugins/conditionalheaders/ConditionalHeaders.kt#L119-L123)

> [!WARNING]
> The `Headers.parseVersions()` function parses `Last-Modified` headers using `fromHttpToGmtDate()` and `ETag` headers into `EntityTagVersion` instances. If header dates fail HTTP format compliance, version parsing may yield empty lists, bypassing conditional checks. Sources: [ktor-server/ktor-server-plugins/ktor-server-conditional-headers/common/src/io/ktor/server/plugins/conditionalheaders/ConditionalHeaders.kt#L131-L142)

## Server Response Compression Engine

The Ktor server compression engine handles both dynamic response payload compression and pre-compressed static content serving algorithms. The core plugin logic resides in `Compression.kt` and `PreCompressed.kt`, coordinating encoder selection, quality weight evaluation from `Accept-Encoding` headers, and static file matching for pre-compressed assets. Sources: [ktor-server/ktor-server-plugins/ktor-server-compression/jvm/src/io/ktor/server/plugins/compression/Compression.kt](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-plugins/ktor-server-compression/jvm/src/io/ktor/server/plugins/compression/Compression.kt#L1-L295), [ktor-server/ktor-server-core/jvm/src/io/ktor/server/http/content/PreCompressed.kt](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-core/jvm/src/io/ktor/server/http/content/PreCompressed.kt#L1-L257)

When an outgoing response is processed by the `Compression` plugin, the `encode` function inspects the request's `Accept-Encoding` header and evaluates available encoder configurations. Each encoder's effective quality weight is derived from explicit naming or wildcard matches, sorting encoders by quality descending and priority descending. Sources: [ktor-server/ktor-server-plugins/ktor-server-compression/jvm/src/io/ktor/server/plugins/compression/Compression.kt](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-plugins/ktor-server-compression/jvm/src/io/ktor/server/plugins/compression/Compression.kt#L221-L250)

> [!NOTE]
> Server-sent events (SSE) responses are automatically excluded from compression via `isSSEResponse()`, checking for `ContentType.Text.EventStream` to prevent payload corruption on streaming endpoints. Sources: [ktor-server/ktor-server-plugins/ktor-server-compression/jvm/src/io/ktor/server/plugins/compression/Compression.kt#L221-L225), [ktor-server/ktor-server-plugins/ktor-server-compression/jvm/src/io/ktor/server/plugins/compression/Compression.kt#L291-L294)

The encoding execution path follows a strict verification and transformation sequence:
1. `call.request.acceptEncoding()` extracts the raw accept-encoding header values. Sources: [ktor-server/ktor-server-plugins/ktor-server-compression/jvm/src/io/ktor/server/plugins/compression/Compression.kt#L227-L231]
2. `parseHeaderValue()` parses weighting parameters, resolving explicit algorithm tokens and `*` wildcards. Sources: [ktor-server/ktor-server-plugins/ktor-server-compression/jvm/src/io/ktor/server/plugins/compression/Compression.kt#L240-L241]
3. `options.conditions` are evaluated against the call and message; if any condition fails, compression is skipped. Sources: [ktor-server/ktor-server-plugins/ktor-server-compression/jvm/src/io/ktor/server/plugins/compression/Compression.kt#L256-L260]
4. `encoders.firstOrNull { ... }` selects the first matching encoder whose specific conditions are fully satisfied. Sources: [ktor-server/ktor-server-plugins/ktor-server-compression/jvm/src/io/ktor/server/plugins/compression/Compression.kt#L268-L274]
5. `message.compressed(encoderOptions.encoder)` transforms the outgoing message payload into its compressed representation. Sources: [ktor-server/ktor-server-plugins/ktor-server-compression/jvm/src/io/ktor/server/plugins/compression/Compression.kt#L287-L288]

> [!WARNING]
> Compressing an `OutgoingContent.WriteChannelContent` triggers a warning log because streaming data must be fully buffered before transmission, defeating the primary advantage of streaming responses. Sources: [ktor-server/ktor-server-plugins/ktor-server-compression/jvm/src/io/ktor/server/plugins/compression/Compression.kt#L279-L285]

The static content module supports pre-compressed file variants via `CompressedFileType`, matching disk files against accepted client encodings without performing dynamic CPU-intensive compression at request time. Sources: [ktor-server/ktor-server-core/jvm/src/io/ktor/server/http/content/PreCompressed.kt](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-core/jvm/src/io/ktor/server/http/content/PreCompressed.kt#L28-L70)

| CompressedFileType | Extension | Encoding Name | Purpose | Sources |
| :--- | :--- | :--- | :--- | :--- |
| `BROTLI` | `br` | `br` | Brotli compression format mapping | [PreCompressed.kt:28-29](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-core/jvm/src/io/ktor/server/http/content/PreCompressed.kt#L28-L29) |
| `GZIP` | `gz` | `gzip` | Gzip compression format mapping | [PreCompressed.kt:28-30](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-core/jvm/src/io/ktor/server/http/content/PreCompressed.kt#L28-L30) |

Functions such as `respondStaticFile`, `respondStaticPath`, and `respondStaticResource` invoke `bestCompressionFit()` to locate pre-compressed variants (`.br` or `.gz`). When a matching pre-compressed asset is identified, dynamic compression is suppressed via `suppressCompression()`, a `Vary: Accept-Encoding` header is appended, and a `PreCompressedResponse` wraps the underlying file content. Sources: [ktor-server/ktor-server-core/jvm/src/io/ktor/server/http/content/PreCompressed.kt](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-core/jvm/src/io/ktor/server/http/content/PreCompressed.kt#L119-L193)

## Client Content Encoding and Decompression

The `ContentEncoding` client plugin automates payload negotiation and decompression in Ktor applications by injecting `Accept-Encoding` headers on outbound requests and executing decompression pipelines on inbound HTTP responses. Sources: [ktor-client/ktor-client-plugins/ktor-client-encoding/common/src/ContentEncoding.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-plugins/ktor-client-encoding/common/src/ContentEncoding.kt#L97-L101)

The plugin supports operation under three distinct modes defined by `ContentEncodingConfig.Mode`: `CompressRequest`, `DecompressResponse`, and `All`. Sources: [ktor-client/ktor-client-plugins/ktor-client-encoding/common/src/ContentEncoding.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-plugins/ktor-client-encoding/common/src/ContentEncoding.kt#L29-L33)

| Mode | Request Compression | Response Decompression | Sources |
| :--- | :--- | :--- | :--- |
| `CompressRequest` | `true` | `false` | [ContentEncoding.kt:29-30](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-plugins/ktor-client-encoding/common/src/ContentEncoding.kt#L29-L30) |
| `DecompressResponse` | `false` | `true` | [ContentEncoding.kt:29-31](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-plugins/ktor-client-encoding/common/src/ContentEncoding.kt#L29-L31) |
| `All` | `true` | `true` | [ContentEncoding.kt:29-32](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-plugins/ktor-client-encoding/common/src/ContentEncoding.kt#L29-L32) |

Built-in encoder registration methods on `ContentEncodingConfig` include `gzip()`, `deflate()`, and `identity()`, each accepting an optional quality weight parameter. Sources: [ktor-client/ktor-client-plugins/ktor-client-encoding/common/src/ContentEncoding.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-plugins/ktor-client-encoding/common/src/ContentEncoding.kt#L49-L74)

> [!NOTE]
> Quality values configured for encoders must fall inclusively between `0.0` and `1.0`, or an illegal state check throws an exception during header construction. Sources: [ktor-client/ktor-client-plugins/ktor-client-encoding/common/src/ContentEncoding.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-plugins/ktor-client-encoding/common/src/ContentEncoding.kt#L122-L123)

When an inbound response is received, the processing sequence proceeds through specific internal components:
1. `ReceiveStateHook` intercepts the response pipeline at `HttpReceivePipeline.State`. Sources: [ktor-client/ktor-client-plugins/ktor-client-encoding/common/src/ContentEncoding.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-plugins/ktor-client-encoding/common/src/ContentEncoding.kt#L197-L207), [ktor-client/ktor-client-plugins/ktor-client-encoding/common/src/ContentEncoding.kt#L230-L233)
2. `decode(response)` verifies whether decoding should occur via `shouldDecode(response)` and ensures content length and method checks pass. Sources: [ktor-client/ktor-client-plugins/ktor-client-encoding/common/src/ContentEncoding.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-plugins/ktor-client-encoding/common/src/ContentEncoding.kt#L140-L144), [ktor-client/ktor-client-plugins/ktor-client-encoding/common/src/ContentEncoding.kt#L200-L205)
3. `contentEncodingHeader` values are split, lowercased, and mapped in reverse order to `selectedEncoders`. Sources: [ktor-client/ktor-client-plugins/ktor-client-encoding/common/src/ContentEncoding.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-plugins/ktor-client-encoding/common/src/ContentEncoding.kt#L144-L148)
4. `decodeContent(selectedEncoders)` iterates through the encoders, successively transforming `rawContent` via `encoder.decode(current, coroutineContext)`. Sources: [ktor-client/ktor-client-plugins/ktor-client-encoding/common/src/ContentEncoding.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-plugins/ktor-client-encoding/common/src/ContentEncoding.kt#L130-L138)
5. `dropCompressionHeaders()` can be utilized by engines like JS and cURL that apply automated decompression without stripping compression headers, maintaining correct downstream content length and encoding checks. Sources: [ktor-client/ktor-client-core/common/src/io/ktor/client/utils/HeadersUtils.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/utils/HeadersUtils.kt#L13-L32)

Sources: [ktor-client/ktor-client-plugins/ktor-client-encoding/common/src/ContentEncoding.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-plugins/ktor-client-encoding/common/src/ContentEncoding.kt#L140-L169), [ktor-client/ktor-client-core/common/src/io/ktor/client/utils/HeadersUtils.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/utils/HeadersUtils.kt#L13-L32)

## Compression Integration Testing Suites

Ktor server compression behavior is validated across end-to-end test suites using the `CompressionTestSuite` base class, which exercises various response content types, stream configurations, partial content requests, and large payload thresholds. Sources: [ktor-server/ktor-server-test-suites/jvm/src/io/ktor/server/testing/suites/CompressionTestSuite.kt](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-test-suites/jvm/src/io/ktor/server/testing/suites/CompressionTestSuite.kt#L25-L27)

The test suite ensures that diverse payload structures correctly negotiate and apply gzip compression headers and stream encoding. The verification scenarios include local file responses, custom write channel streams, range requests bypassing compression, and large text payloads. Sources: [ktor-server/ktor-server-test-suites/jvm/src/io/ktor/server/testing/suites/CompressionTestSuite.kt](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-test-suites/jvm/src/io/ktor/server/testing/suites/CompressionTestSuite.kt#L31-L74), [ktor-server/ktor-server-test-suites/jvm/src/io/ktor/server/testing/suites/CompressionTestSuite.kt#L76-L106)

```kotlin
    @Test
    fun testCompressionWriteToLarge() = runTest {
        val count = 655350
        fun Appendable.produceText() {
            for (i in 1..count) {
                append("test $i\n".padStart(10, ' '))
            }
        }

        createAndStartServer {
            install(Compression)

            get("/") {
                call.respondTextWriter(contentType = ContentType.Text.Plain) {
                    produceText()
                }
            }
        }

        withUrl("/", { headers.append(HttpHeaders.AcceptEncoding, "gzip") }) {
            val expected = buildString {
                produceText()
            }
            assertTrue(HttpHeaders.ContentEncoding in headers)
            val array = body<ByteArray>()
            val text = GZIPInputStream(ByteArrayInputStream(array)).readBytes().toString(Charsets.UTF_8)
            assertEquals(expected, text)
        }
    }
```
Sources: [ktor-server/ktor-server-test-suites/jvm/src/io/ktor/server/testing/suites/CompressionTestSuite.kt](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-test-suites/jvm/src/io/ktor/server/testing/suites/CompressionTestSuite.kt#L109-L137)

> [!NOTE]
> When `PartialContent` and `Compression` plugins are installed together, requesting a byte range via `HttpHeaders.Range` bypasses compression to ensure correct offset and length mapping for partial content blocks.
> Sources: [ktor-server/ktor-server-test-suites/jvm/src/io/ktor/server/testing/suites/CompressionTestSuite.kt](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-test-suites/jvm/src/io/ktor/server/testing/suites/CompressionTestSuite.kt#L76-L106)

## Related

- [[Content Representation]]

