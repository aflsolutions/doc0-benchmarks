# CIO Client

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/Endpoint.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/Endpoint.kt)
- [ktor-server/ktor-server-cio/common/src/io/ktor/server/cio/backend/ServerPipeline.kt](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-cio/common/src/io/ktor/server/cio/backend/ServerPipeline.kt)
- [ktor-client/ktor-client-cio/jvm/src/io/ktor/client/engine/cio/ConnectionPipeline.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/jvm/src/io/ktor/client/engine/cio/ConnectionPipeline.kt)
- [ktor-server/ktor-server-cio/common/src/io/ktor/server/cio/CIOApplicationEngine.kt](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-cio/common/src/io/ktor/server/cio/CIOApplicationEngine.kt)
- [ktor-client/ktor-client-apache5/jvm/src/io/ktor/client/engine/apache5/Apache5Engine.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-apache5/jvm/src/io/ktor/client/engine/apache5/Apache5Engine.kt)
- [ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/CIOEngineConfig.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/CIOEngineConfig.kt)
- [ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/CIOEngine.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/CIOEngine.kt)
- [ktor-network/jvm/src/io/ktor/network/sockets/CIOReader.kt](https://github.com/ktorio/ktor/blob/main/ktor-network/jvm/src/io/ktor/network/sockets/CIOReader.kt)
- [ktor-client/ktor-client-okhttp/jvm/src/io/ktor/client/engine/okhttp/OkHttpEngine.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-okhttp/jvm/src/io/ktor/client/engine/okhttp/OkHttpEngine.kt)
- [ktor-client/ktor-client-apache/jvm/src/io/ktor/client/engine/apache/ApacheEngine.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-apache/jvm/src/io/ktor/client/engine/apache/ApacheEngine.kt)
- [ktor-client/ktor-client-core/common/src/io/ktor/client/HttpClient.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/HttpClient.kt)
- [ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/ConnectionFactory.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/ConnectionFactory.kt)
- [ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/EngineTasks.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/EngineTasks.kt)
- [ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/CIOCommon.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/CIOCommon.kt)
- [ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/ConnectionPipelineCommon.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/ConnectionPipelineCommon.kt)
- [ktor-server/ktor-server-cio/common/src/io/ktor/server/cio/CIOApplicationRequest.kt](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-cio/common/src/io/ktor/server/cio/CIOApplicationRequest.kt)
- [ktor-client/ktor-client-cio/nonJvm/src/io/ktor/client/engine/cio/ConnectionPipeline.nonJvm.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/nonJvm/src/io/ktor/client/engine/cio/ConnectionPipeline.nonJvm.kt)
- [ktor-client/ktor-client-core/jvm/src/io/ktor/client/utils/CIOJvm.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/jvm/src/io/ktor/client/utils/CIOJvm.kt)
</details>

## Overview

The CIO (Coroutine-based I/O) client engine is a fully asynchronous, multiplatform HTTP client engine implemented natively using coroutines across JVM, Android, and Kotlin/Native platforms. It bypasses heavy third-party runtime dependencies by leveraging `ktor-network` sockets and coroutine-driven dispatchers to perform non-blocking network operations, manage per-host endpoint connection pools, and handle advanced features such as request pipelining, WebSocket communication, Server-Sent Events (SSE), and custom proxy routing. Sources: [CIOEngine.kt:24-34](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/CIOEngine.kt#L24-L34), [CIOCommon.kt:10-12](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/CIOCommon.kt#L10-L12)

By managing connection pools per route, enforcing configurable limits on concurrent connections, and supporting sequential request pipelining alongside dedicated connections for upgrades and custom timeouts, the CIO client balances high-throughput request streaming with robust lifecycle and timeout error handling. Sources: [Endpoint.kt:38-79](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/Endpoint.kt#L38-L79), [EngineTasks.kt:21-26](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/EngineTasks.kt#L21-L26)

## Engine Lifecycle and Configuration

### Engine Initialization and Configuration

The CIO client engine is initialized via the `CIO` engine factory, which instantiates a `CIOEngine` configured through `CIOEngineConfig`. During initialization, `CIOEngine` sets up platform-specific components, establishes a `SelectorManager` tied to its dispatcher, and instantiates a `ConnectionFactory` configured with maximum total and per-route connection bounds. Sources: [CIOEngine.kt:38-44](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/CIOEngine.kt#L38-L44), [CIOCommon.kt:29-32](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/CIOCommon.kt#L29-L32)

```kotlin
val client = HttpClient(CIO) {
    engine {
        maxConnectionsCount = 1000
        requestTimeout = 15000
        endpoint {
            maxConnectionsPerRoute = 100
            connectTimeout = 5000
            keepAliveTime = 5000
            pipelineMaxSize = 20
        }
    }
}
```
Sources: [CIOEngineConfig.kt:36-114](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/CIOEngineConfig.kt#L36-L114), [CIOCommon.kt:12-22](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/CIOCommon.kt#L12-L22)

The engine supports several configuration properties governing connection limits, timeouts, proxy routing, and DNS resolution. These options are exposed directly on `CIOEngineConfig` and its nested `EndpointConfig`.

| Option | Type | Default Value | Purpose |
| :--- | :--- | :--- | :--- |
| `maxConnectionsCount` | `Int` | `1000` | Maximum number of total connections used across all routes. |
| `requestTimeout` | `Long` | `15000` | Time in milliseconds to process an HTTP call from request dispatch to response receipt (`0` disables). |
| `dnsResolver` | `(suspend (String) -> List<String>)?` | `null` | Custom coroutine-based DNS resolver mapping hostnames to IP address strings. |
| `endpoint.maxConnectionsPerRoute` | `Int` | `100` | Maximum number of concurrent connections permitted per unique route endpoint. |
| `endpoint.keepAliveTime` | `Long` | `5000` | Connection keep-alive duration in milliseconds. |
| `endpoint.pipelineMaxSize` | `Int` | `20` | Maximum number of pipelined requests sent over a single connection without waiting. |
| `endpoint.connectTimeout` | `Long` | `5000` | Connection establishment timeout in milliseconds. |
| `endpoint.socketTimeout` | `Long` | `Infinite` | Maximum inactivity period between data packets (`HttpTimeoutConfig.INFINITE_TIMEOUT_MS`). |
| `endpoint.connectAttempts` | `Int` | `1` | Maximum connection attempt retries for connection establishment. |
| `endpoint.allowHalfClose` | `Boolean` | `false` | Allows closing the output channel immediately upon write completion. |

Sources: [CIOEngineConfig.kt:36-143](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/CIOEngineConfig.kt#L36-L143)

### Coroutine Scope and Lifecycle Management

`CIOEngine` inherits from `HttpClientEngineBase` and establishes a hierarchical coroutine scope using a `SilentSupervisor` attached to the parent engine context with an atomic start. During execution, `execute` resolves target endpoints via `selectEndpoint` and processes requests within the active call context, retrying automatically upon receiving a `ClosedSendChannelException`. Sources: [CIOEngine.kt:24-98](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/CIOEngine.kt#L24-L98)

> [!WARNING]
> When executing requests against Unix domain sockets or proxied routes, custom `dnsResolver` settings are bypassed, while TLS SNI retains the original hostname to ensure certificate validation succeeds.
> Sources: [CIOEngineConfig.kt:53-54](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/CIOEngineConfig.kt#L53-L54)

Engine shutdown occurs via `close()`, which iterates through all active endpoint entries in the concurrent map, closes each endpoint explicitly, and completes the `requestsJob` completable job. Sources: [CIOEngine.kt:103-111](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/CIOEngine.kt#L103-L111)

## Endpoint Connection Pool Management

### Overview

The CIO client engine manages network endpoints and connection reuse through the `CIOEngine` and `Endpoint` classes. When an HTTP request is submitted, `CIOEngine.execute()` delegates execution to an `Endpoint` instance resolved via `selectEndpoint()`. Endpoints are uniquely keyed by a composite identifier string built from the target host, port, protocol, and Unix socket path. Each active `Endpoint` tracks connection state, idle timeouts, and concurrent route limits.

Sources: [CIOEngine.kt:82-147](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/CIOEngine.kt#L82-L147)

### Endpoint Resolution and Connection Lifecycle Walkthrough

The request lifecycle flows through endpoint selection, execution routing, and connection establishment:

1. `CIOEngine.selectEndpoint()` computes the endpoint key (`$host:$port:$protocol:${unixSocket?.path}`) and retrieves or creates the `Endpoint` via `endpoints.computeIfAbsent()`.
Sources: [CIOEngine.kt:113-147](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/CIOEngine.kt#L113-L147)

2. `Endpoint.execute()` updates `lastActivity.value` and evaluates whether the request requires a dedicated connection or supports pipelining (`!config.pipelining || request.requiresDedicatedConnection()`).
Sources: [Endpoint.kt:60-68](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/Endpoint.kt#L60-L68)

3. For pipelined requests, `Endpoint.makePipelineRequest()` attempts to deliver the task to the `deliveryPoint` channel; if delivery fails and active `connections` are below `maxConnectionsPerRoute`, it invokes `createPipeline()`.
Sources: [Endpoint.kt:81-95](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/Endpoint.kt#L81-L95)

4. Dedicated connections or new pipelines invoke `Endpoint.connect()`, which increments the `connections` counter, executes DNS resolution if configured, and attempts socket creation up to `connectAttempts` times.
Sources: [Endpoint.kt:198-286](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/Endpoint.kt#L198-L286)

5. Upon completion or failure of a connection, `releaseConnection()` decrements the `connections` counter and releases the socket address back to the `ConnectionFactory`.
Sources: [Endpoint.kt:314-317](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/Endpoint.kt#L314-L317)

> [!NOTE]
> Each `Endpoint` runs a background timeout coroutine (`cio-endpoint-timeout`) that monitors `lastActivity`. When the elapsed idle time exceeds `maxEndpointIdleTime` (calculated as `2 * config.endpoint.connectTimeout`), the endpoint closes its `deliveryPoint` channel and removes itself from the engine's active endpoints map via `onDone`.
> Sources: [Endpoint.kt:38-58](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/Endpoint.kt#L38-L58), [CIOEngine.kt:143](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/CIOEngine.kt#L143)

### Connection Enforcement and Limits

| Mechanism / Field | Type | Default / Rule | Purpose |
| :--- | :--- | :--- | :--- |
| `connections` | `AtomicInt` | Starts at `0` | Tracks active connections currently established on the endpoint. |
| `maxEndpointIdleTime` | `Long` | `2 * config.endpoint.connectTimeout` | Maximum inactivity duration before the endpoint shuts down and removes itself. |
| `deliveryPoint` | `Channel<RequestTask>` | Unbuffered `Channel()` | Task queue routing requests to active connection pipelines. |
| `timeoutFails` | `Int` | Compared against `connectAttempts` | Tracks failed socket connection attempts to determine if a `ConnectTimeoutException` or `FailToConnectException` is thrown. |

Sources: [Endpoint.kt:38-41](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/Endpoint.kt#L38-L41), [Endpoint.kt:203](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/Endpoint.kt#L203), [Endpoint.kt:291-298](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/Endpoint.kt#L291-L298)

## Socket Creation and Asynchronous IO

### Overview

TCP socket establishment and asynchronous byte channel reading are coordinated through `ConnectionFactory` and the reading loops in `CIOReader.kt`. `ConnectionFactory` manages concurrency limits at both the global and per-address levels using coroutine semaphores before delegating actual socket creation to Ktor's network API. Once a socket is established, `attachForReadingImpl` or `attachForReadingDirectImpl` processes incoming byte streams asynchronously, integrating NIO channels with Ktor's `ByteChannel` and selector loops.

Sources: [ConnectionFactory.kt:12-40](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/ConnectionFactory.kt#L12-L40), [CIOReader.kt:16-129](https://github.com/ktorio/ktor/blob/main/ktor-network/jvm/src/io/ktor/network/sockets/CIOReader.kt#L16-L129)

### Connection Factory Execution Walkthrough

The connection establishment and release sequence proceeds through specific synchronization steps:

1. `ConnectionFactory.connect()` acquires a permit from the global `limit` semaphore (`limit.acquire()`) to enforce total engine connection bounds.
Sources: [ConnectionFactory.kt:24](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/ConnectionFactory.kt#L24)

2. It retrieves or instantiates a per-address semaphore via `addressLimit.computeIfAbsent(address) { Semaphore(addressConnectionsLimit) }`.
Sources: [ConnectionFactory.kt:26](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/ConnectionFactory.kt#L26)

3. It acquires a permit from the `addressSemaphore` (`addressSemaphore.acquire()`).
Sources: [ConnectionFactory.kt:27](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/ConnectionFactory.kt#L27)

4. It calls `aSocket(selector).tcp().connect(address, configuration)` to establish the underlying TCP socket. If this throws an exception, the `addressSemaphore` permit is released in the catch block before rethrowing.
Sources: [ConnectionFactory.kt:29-35](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/ConnectionFactory.kt#L29-L35)

5. `ConnectionFactory.release()` releases the address-specific semaphore permit and the global limit permit when a connection closes.
Sources: [ConnectionFactory.kt:42-45](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/ConnectionFactory.kt#L42-L45)

> [!WARNING]
> If socket connection fails or is cancelled, both the address-specific semaphore and global limit semaphore ensure permits are released in nested `catch` blocks to prevent connection quota leaks.
> Sources: [ConnectionFactory.kt:31-39](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/ConnectionFactory.kt#L31-L39)

### Asynchronous Reading Implementation

`attachForReadingImpl` spawns a coroutine using `Dispatchers.IO` and `CoroutineName("cio-from-nio-reader")` that borrows a `ByteBuffer` from an object pool. Inside the read loop, if `nioChannel.read(buffer)` returns `0` (signaling non-blocking unavailability), the channel flushes, registers `SelectInterest.READ` interest on the selector, and suspends via `selector.select(selectable, SelectInterest.READ)`. When data arrives (`rc > 0`), the interest op is cleared, the buffer is flipped, written fully to the `ByteChannel`, and cleared for the next iteration. When `rc == -1`, the channel closes. In the `finally` block, the pooled byte buffer is recycled, and input shutdown is invoked on the underlying `SocketChannel` using Java 7 network APIs when available.

Sources: [CIOReader.kt:16-74](https://github.com/ktorio/ktor/blob/main/ktor-network/jvm/src/io/ktor/network/sockets/CIOReader.kt#L16-L74), [CIOJvm.kt:17](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/jvm/src/io/ktor/client/utils/CIOJvm.kt#L17)

| Function Name | Dispatcher / Coroutine Name | Timeout Handling | Shutdown Mechanism |
| :--- | :--- | :--- | :--- |
| `attachForReadingImpl` | `Dispatchers.IO + CoroutineName("cio-from-nio-reader")` | `socketTimeout` via `createTimeout("reading", ...)` closing with `SocketTimeoutException` | `nioChannel.shutdownInput()` (Java 7+) or `nioChannel.socket().shutdownInput()` |
| `attachForReadingDirectImpl` | `Dispatchers.IO + CoroutineName("cio-from-nio-reader")` | `socketTimeout` via `createTimeout("reading-direct", ...)` closing with `SocketTimeoutException` | `nioChannel.shutdownInput()` (Java 7+) or `nioChannel.socket().shutdownInput()` |

Sources: [CIOReader.kt:22-33](https://github.com/ktorio/ktor/blob/main/ktor-network/jvm/src/io/ktor/network/sockets/CIOReader.kt#L22-L33), [CIOReader.kt:64-68](https://github.com/ktorio/ktor/blob/main/ktor-network/jvm/src/io/ktor/network/sockets/CIOReader.kt#L64-L68), [CIOReader.kt:81-92](https://github.com/ktorio/ktor/blob/main/ktor-network/jvm/src/io/ktor/network/sockets/CIOReader.kt#L81-L92), [CIOReader.kt:120-124](https://github.com/ktorio/ktor/blob/main/ktor-network/jvm/src/io/ktor/network/sockets/CIOReader.kt#L120-L124)

## Request Pipelining and Response Streaming

### Overview

The `ConnectionPipeline` manages sequential request writing, concurrency limiting via semaphores, and response parsing over active socket connections. On non-JVM targets (Native, JS, Wasm), pipelining is unsupported and immediate initialization fails. On JVM targets, the pipeline operates via two core coroutines: `pipelineContext` for serializing and dispatching requests, and `responseHandler` for reading and parsing incoming HTTP responses.

Sources: [ConnectionPipeline.kt:26-67](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/jvm/src/io/ktor/client/engine/cio/ConnectionPipeline.kt#L26-L67), [ConnectionPipeline.kt:69-148](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/jvm/src/io/ktor/client/engine/cio/ConnectionPipeline.kt#L69-L148), [ConnectionPipeline.nonJvm.kt:12-28](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/nonJvm/src/io/ktor/client/engine/cio/ConnectionPipeline.nonJvm.kt#L12-L28)

### Request Serialization and Pipelining

The `pipelineContext` coroutine runs a loop awaiting tasks from the `tasks` channel up to a specified `keepAliveTime`. For each received task, it acquires a permit from `requestLimit` (initialized with `pipelineMaxSize`) and sends a `ConnectionResponseTask` containing the request timestamp to the `responseChannel`. It then invokes `writeRequest` to serialize the request headers and body to `networkOutput`, followed by a flush.

Sources: [ConnectionPipeline.kt:41-58](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/jvm/src/io/ktor/client/engine/cio/ConnectionPipeline.kt#L41-L58)

> [!NOTE]
> If acquiring a permit or sending to the `responseChannel` throws an exception, `task.response` is completed exceptionally before the exception is rethrown and caught by the outer loop handlers.
> Sources: [ConnectionPipeline.kt:48-54](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/jvm/src/io/ktor/client/engine/cio/ConnectionPipeline.kt#L48-L54)

### Response Parsing and Streaming

The `responseHandler` coroutine iterates over `responseChannel`, releasing `requestLimit` permits as each response task is processed. It parses raw HTTP responses from `networkInput`, extracts status codes, transfer encodings, content lengths, and connection options, and determines whether the response contains a body based on status, method, and headers.

Sources: [ConnectionPipeline.kt:69-105](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/jvm/src/io/ktor/client/engine/cio/ConnectionPipeline.kt#L69-L105)

| Property / Header Checked | Extraction Logic / Condition | Default Value |
| :--- | :--- | :--- |
| `Content-Length` | `rawResponse.headers[HttpHeaders.ContentLength]?.toString()?.toLongOrNull()` | `-1L` |
| `Transfer-Encoding` | `rawResponse.headers[HttpHeaders.TransferEncoding]` | `null` (checks if `"chunked"`) |
| `Connection` | `ConnectionOptions.parse(rawResponse.headers[HttpHeaders.Connection])` | `null` |
| `Version` | `HttpProtocolVersion.parse(rawResponse.version)` | Parsed from raw response |
| `hasBody` | `(contentLength > 0 \|\| chunked) && (method != HttpMethod.Head) && (status !in listOf(NotModified, NoContent)) && !status.isInformational()` | `false` |

Sources: [ConnectionPipeline.kt:85-104](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/jvm/src/io/ktor/client/engine/cio/ConnectionPipeline.kt#L85-L104)

### Call-Chain Execution Walkthrough

When an incoming response is processed by `responseHandler`, the execution flows through a precise sequence of steps:

1. `parseResponse(networkInput)` reads and parses the raw HTTP response headers from the network input stream, throwing a `ClosedReadChannelException` wrapping an `EOFException` if unexpected EOF is encountered.
Sources: [ConnectionPipeline.kt:75-78](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/jvm/src/io/ktor/client/engine/cio/ConnectionPipeline.kt#L75-L78)

2. Response attributes (status, headers, transfer encoding, connection options) are extracted and evaluated to determine `shouldClose` and `hasBody`.
Sources: [ConnectionPipeline.kt:83-105](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/jvm/src/io/ktor/client/engine/cio/ConnectionPipeline.kt#L83-L105)

3. If `hasBody` is true, `skipCancels(responseChannel, proxyChannel)` is launched to pipe data asynchronously via `HttpClientDefaultPool` buffers while handling cancellation.
Sources: [ConnectionPipeline.kt:106-115](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/jvm/src/io/ktor/client/engine/cio/ConnectionPipeline.kt#L106-L115), [ConnectionPipeline.kt:156-183](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/jvm/src/io/ktor/client/engine/cio/ConnectionPipeline.kt#L156-L183)

4. `task.response.complete(response)` delivers the `HttpResponseData` object containing the body channel to the client caller.
Sources: [ConnectionPipeline.kt:121-122](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/jvm/src/io/ktor/client/engine/cio/ConnectionPipeline.kt#L121-L122)

5. `parseHttpBody(...)` consumes the remaining body bytes from `networkInput` using the specified transfer encoding and connection options.
Sources: [ConnectionPipeline.kt:124-133](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/jvm/src/io/ktor/client/engine/cio/ConnectionPipeline.kt#L124-L133)

> [!CAUTION]
> If `shouldClose` evaluates to true (either via HTTP/1.0 connection options or explicit `Connection: close` headers), the response handler breaks out of its processing loop and terminates the underlying socket connection in its `finally` block.
> Sources: [ConnectionPipeline.kt:98-100](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/jvm/src/io/ktor/client/engine/cio/ConnectionPipeline.kt#L98-L100), [ConnectionPipeline.kt:142](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/jvm/src/io/ktor/client/engine/cio/ConnectionPipeline.kt#L142), [ConnectionPipeline.kt:144-147](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/jvm/src/io/ktor/client/engine/cio/ConnectionPipeline.kt#L144-L147)

## Timeout Enforcement and Task Routing

### Overview

The CIO client engine evaluates each request to determine whether it can share a pipelined connection or requires a dedicated connection. Requests requiring custom timeouts, connection close directives, upgrade headers, SSE, or methods other than `GET` and `HEAD` bypass pipelining and execute via `makeDedicatedRequest`.
Sources: [Endpoint.kt:66-68](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/Endpoint.kt#L66-L68), [EngineTasks.kt:21-27](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/EngineTasks.kt#L21-L27)

### Dedicated Connection Routing and Timeout Enforcement

When `requiresDedicatedConnection()` returns `true`, or when pipelining is disabled, `Endpoint.execute` delegates directly to `makeDedicatedRequest`. This method establishes a dedicated socket, manages half-closed sockets, and registers lifecycle completion callbacks to ensure proper cleanup and connection releasing.
Sources: [Endpoint.kt:66-68](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/Endpoint.kt#L66-L68), [Endpoint.kt:97-122](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/Endpoint.kt#L97-L122)

Request timeouts are calculated via `getRequestTimeout`, which checks capabilities, WebSockets, upgrade requests, and Server-Sent Events (SSE). If a valid timeout is configured, `setupTimeout` schedules a cancellation job in `GlobalScope` that cancels the `callContext` job with an `HttpRequestTimeoutException` when the timer expires.
Sources: [Endpoint.kt:124-125](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/Endpoint.kt#L124-L125), [Endpoint.kt:328-340](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/Endpoint.kt#L328-L340), [Endpoint.kt:347-364](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/Endpoint.kt#L347-L364)

| Condition Checked in `getRequestTimeout` | Return Value / Behavior |
| :--- | :--- |
| `request.getCapabilityOrNull(HttpTimeoutCapability) != null` | `HttpTimeoutConfig.INFINITE_TIMEOUT_MS` |
| `request.url.protocol.isWebsocket()` | `HttpTimeoutConfig.INFINITE_TIMEOUT_MS` |
| `request.isUpgradeRequest()` | `HttpTimeoutConfig.INFINITE_TIMEOUT_MS` |
| `request.isSseRequest()` | `HttpTimeoutConfig.INFINITE_TIMEOUT_MS` |
| Default (none of the above) | `engineConfig.requestTimeout` |

Sources: [Endpoint.kt:354-364](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/Endpoint.kt#L354-L364)

> [!WARNING]
> Request timeout enforcement is automatically disabled for WebSockets, upgrade requests, SSE tasks, and any request explicitly configuring the `HttpTimeout` plugin capability by returning infinite timeout limits within `getRequestTimeout`.
> Sources: [Endpoint.kt:347-364](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/Endpoint.kt#L347-L364)

### Dedicated Connection Decision Criteria

The `requiresDedicatedConnection()` extension function checks specific header fields, HTTP methods, and capabilities to determine connection dedication.

```kotlin
internal fun HttpRequestData.requiresDedicatedConnection(): Boolean =
    listOf(headers, body.headers).any { it[HttpHeaders.Connection] == "close" || it.contains(HttpHeaders.Upgrade) } ||
        method !in listOf(HttpMethod.Get, HttpMethod.Head) ||
        containsCustomTimeouts() ||
        isSseRequest()
```
Sources: [EngineTasks.kt:21-27](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/EngineTasks.kt#L21-L27)

## Related

- [[Client Core]]
- [[HTTP CIO Parser]]

