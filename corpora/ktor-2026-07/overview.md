# Overview

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [ktor-client/ktor-client-core/common/src/io/ktor/client/HttpClient.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/HttpClient.kt)
- [README.md](https://github.com/ktorio/ktor/blob/main/README.md)
- [AGENTS.md](https://github.com/ktorio/ktor/blob/main/AGENTS.md)
- [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt)
- [CONTRIBUTING.md](https://github.com/ktorio/ktor/blob/main/CONTRIBUTING.md)
- [ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/CIOEngine.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/CIOEngine.kt)
- [ktor-client/ktor-client-core/common/src/io/ktor/client/engine/HttpClientEngine.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/engine/HttpClientEngine.kt)
- [ktor-server/ktor-server-core/common/src/io/ktor/server/application/Application.kt](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-core/common/src/io/ktor/server/application/Application.kt)
- [THIRDPARTY.md](https://github.com/ktorio/ktor/blob/main/THIRDPARTY.md)
- [ktor-server/ktor-server-core/common/src/io/ktor/server/engine/ApplicationEngine.kt](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-core/common/src/io/ktor/server/engine/ApplicationEngine.kt)
- [gradle/artifacts/publishWindowsPublications.txt](https://github.com/ktorio/ktor/blob/main/gradle/artifacts/publishWindowsPublications.txt)
- [gradle/artifacts/publishJsPublications.txt](https://github.com/ktorio/ktor/blob/main/gradle/artifacts/publishJsPublications.txt)
- [gradle/artifacts/publishLinuxPublications.txt](https://github.com/ktorio/ktor/blob/main/gradle/artifacts/publishLinuxPublications.txt)
- [ktor-network/common/src/io/ktor/network/selector/SelectorManagerCommon.kt](https://github.com/ktorio/ktor/blob/main/ktor-network/common/src/io/ktor/network/selector/SelectorManagerCommon.kt)
- [ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/CIOCommon.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/CIOCommon.kt)
</details>

## Overview

Ktor is an asynchronous framework engineered from the ground up in Kotlin for building microservices, web applications, and network clients across multiple platforms. At its architectural core, Ktor leverages Kotlin coroutines to drive non-blocking I/O operations and unopinionated pipeline interceptors that process both client requests and server application calls.

Sources: [README.md:17-18](https://github.com/ktorio/ktor/blob/main/README.md#L17-L18), [README.md:83-85](https://github.com/ktorio/ktor/blob/main/README.md#L83-L85), [README.md:96-98](https://github.com/ktorio/ktor/blob/main/README.md#L96-L98)

## Multiplatform Target Hierarchy and Artifacts

### Multiplatform Target Hierarchy and Artifacts

Ktor implements a sophisticated Kotlin Multiplatform build infrastructure governed by `KtorTargets`, which automatically enables or disables targets based on project directory structures or explicit configuration properties prefixed with `target.` in `gradle.properties` [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:33-49](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L33-L49). Sub-targets like `browser` and `nodeJs` inherit state from their parent targets (`js` and `wasmJs`) while allowing granular overrides [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:51-57](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L51-L57).

Sources: [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:33-57](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L33-L57)

### Target Resolution and Hierarchy Template

The hierarchy template organizes targets into logical groups such as `posix`, `windows`, `nix`, `linux`, `darwin`, `androidNative`, `web`, `jvmAndPosix`, `desktop`, `nonJvm`, and `nonDarwinPosix` [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:170-226](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L170-L226). Target activation follows a strict evaluation sequence handled by `addTargets`:

1. `targets.finalize()` freezes the configuration filter to prevent subsequent modifications [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:240-241](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L240-L241).
2. `ensureTargetsNotEmpty()` evaluates `KtorTargets.resolveTargets("common")` to guarantee that at least one target remains active, falling back to `kotlin.jvm()` if all targets are disabled during a light sync [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:242-242](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L242-L242), [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:296-299](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L296-L299).
3. Platform hooks register individual extensions for JVM, Android library targets, JavaScript, Wasm, and Native tiers (Tier 1, Tier 2, and Tier 3) [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:244-289](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L244-L289).
4. `freezeSourceSets()` and `flattenSourceSetsStructure()` execute post-evaluation checks to rewrite platform source directories from default nested layouts into flat platform-centric structures [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:290-292](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L290-L292), [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:398-409](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L398-L409).

Sources: [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:240-299](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L240-L299), [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:398-409](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L398-L409)

> [!WARNING]
> Manual registration of extra source sets throws an `IllegalStateException` unless `ktorbuild.ignoreExtraSourceSets=true` is specified, because Ktor automatically discovers source sets based on active target directories.

Sources: [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:309-328](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L309-L328)

### Published Platform Artifacts

Ktor publishes comprehensive platform-specific binary bundles (`.klib`), metadata archives, sources, and Javadoc jars across Windows, JavaScript, Wasm, and Linux targets. 

| Target Group / Suffix | Sample Published Artifacts | Representative Interop Libraries |
| :--- | :--- | :--- |
| **MingwX64** (Windows) | `ktor-client-curl-mingwx64/.klib`, `ktor-server-core-mingwx64/.klib` | `cinterop-libcurl.klib`, `cinterop-winhttp.klib`, `cinterop-mutex.klib`, `cinterop-afunix.klib` [gradle/artifacts/publishWindowsPublications.txt:23-74](https://github.com/ktorio/ktor/blob/main/gradle/artifacts/publishWindowsPublications.txt#L23-L74) |
| **JS & Wasm-JS** (Web) | `ktor-client-core-js/.klib`, `ktor-client-core-wasm-js/.klib`, `ktor-server-core-js/.klib` | None ( pure web compilation targets ) [gradle/artifacts/publishJsPublications.txt:37-42](https://github.com/ktorio/ktor/blob/main/gradle/artifacts/publishJsPublications.txt#L37-L42), [gradle/artifacts/publishJsPublications.txt:253-258](https://github.com/ktorio/ktor/blob/main/gradle/artifacts/publishJsPublications.txt#L253-L258) |
| **LinuxX64 & LinuxArm64** | `ktor-client-cio-linuxx64/.klib`, `ktor-server-core-linuxarm64/.klib` | `cinterop-host_common.klib`, `cinterop-network.klib`, `cinterop-threadUtils.klib` [gradle/artifacts/publishLinuxPublications.txt:28-264](https://github.com/ktorio/ktor/blob/main/gradle/artifacts/publishLinuxPublications.txt#L28-L264) |

Sources: [gradle/artifacts/publishWindowsPublications.txt:1-224](https://github.com/ktorio/ktor/blob/main/gradle/artifacts/publishWindowsPublications.txt#L1-L224), [gradle/artifacts/publishJsPublications.txt:1-432](https://github.com/ktorio/ktor/blob/main/gradle/artifacts/publishJsPublications.txt#L1-L432), [gradle/artifacts/publishLinuxPublications.txt:1-443](https://github.com/ktorio/ktor/blob/main/gradle/artifacts/publishLinuxPublications.txt#L1-L443)

## Client Architecture and Engine Contracts

### Client Architecture and Engine Contracts

The Ktor client architecture centres around the `HttpClient` class, which implements `CoroutineScope` and `Closeable` to manage asynchronous network operations and lifecycle scopes [ktor-client/ktor-client-core/common/src/io/ktor/client/HttpClient.kt:1275-1279](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/HttpClient.kt#L1275-L1279). Initialization ties the client coroutine context to an underlying `HttpClientEngine` via a combined job hierarchy, assembling foundational pipelines for requests, responses, sending, and receiving [ktor-client/ktor-client-core/common/src/io/ktor/client/HttpClient.kt:1312-1342](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/HttpClient.kt#L1312-L1342).

Sources: [ktor-client/ktor-client-core/common/src/io/ktor/client/HttpClient.kt:1275-1342](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/HttpClient.kt#L1275-L1342)

The `HttpClientEngine` interface defines the network abstraction layer responsible for dispatching requests and receiving raw byte payloads [ktor-client/ktor-client-core/common/src/io/ktor/client/engine/HttpClientEngine.kt:23-36](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/engine/HttpClientEngine.kt#L23-L36). Engines expose an I/O `CoroutineDispatcher`, engine-specific configurations through `HttpClientEngineConfig`, and a capability registration set (`supportedCapabilities`) that controls advanced feature access [ktor-client/ktor-client-core/common/src/io/ktor/client/engine/HttpClientEngine.kt:51-105](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/engine/HttpClientEngine.kt#L51-L105).

Sources: [ktor-client/ktor-client-core/common/src/io/ktor/client/engine/HttpClientEngine.kt:23-105](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/engine/HttpClientEngine.kt#L23-L105)

When an HTTP call is executed, requests travel through a strict execution pipeline before reaching the network layer. The execution proceeds along the following call chain:
`HttpClient.execute()` → `requestPipeline.execute()` → `sendPipeline.intercept(Engine)` → `validateHeaders()` → `checkExtensions()` → `executeWithinCallContext()` → `HttpClientEngine.execute()` [ktor-client/ktor-client-core/common/src/io/ktor/client/HttpClient.kt:1417-1421](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/HttpClient.kt#L1417-L1421), [ktor-client/ktor-client-core/common/src/io/ktor/client/engine/HttpClientEngine.kt:139-185](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/engine/HttpClientEngine.kt#L139-L185).

Sources: [ktor-client/ktor-client-core/common/src/io/ktor/client/HttpClient.kt:1417-1421](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/HttpClient.kt#L1417-L1421), [ktor-client/ktor-client-core/common/src/io/ktor/client/engine/HttpClientEngine.kt:139-185](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/engine/HttpClientEngine.kt#L139-L185)

> [!WARNING]
> The validation step `validateHeaders()` checks request headers against `HttpHeaders.UnsafeHeadersList`. Supplying restricted headers directly throws an `UnsafeHeaderException` prior to entering call execution context.

Sources: [ktor-client/ktor-client-core/common/src/io/ktor/client/engine/HttpClientEngine.kt:151-151](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/engine/HttpClientEngine.kt#L151-L151), [ktor-client/ktor-client-core/common/src/io/ktor/client/engine/HttpClientEngine.kt:230-238](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/engine/HttpClientEngine.kt#L230-L238)

| Engine Property / Method | Signature | Purpose |
| :--- | :--- | :--- |
| `dispatcher` | `val dispatcher: CoroutineDispatcher` | Specifies the underlying `CoroutineDispatcher` optimized for network I/O operations. [ktor-client/ktor-client-core/common/src/io/ktor/client/engine/HttpClientEngine.kt:51-51](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/engine/HttpClientEngine.kt#L51-L51) |
| `config` | `val config: HttpClientEngineConfig` | Provides access to user-defined engine settings and parameters. [ktor-client/ktor-client-core/common/src/io/ktor/client/engine/HttpClientEngine.kt:67-67](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/engine/HttpClientEngine.kt#L67-L67) |
| `supportedCapabilities` | `val supportedCapabilities: Set<HttpClientEngineCapability<*>>` | Declares features supported by the engine, such as WebSockets or timeouts. [ktor-client/ktor-client-core/common/src/io/ktor/client/engine/HttpClientEngine.kt:104-104](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/engine/HttpClientEngine.kt#L104-L104) |
| `execute` | `suspend fun execute(data: HttpRequestData): HttpResponseData` | Executes the processed HTTP request data and returns raw response components. [ktor-client/ktor-client-core/common/src/io/ktor/client/engine/HttpClientEngine.kt:123-123](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/engine/HttpClientEngine.kt#L123-L123) |
| `install` | `fun install(client: HttpClient)` | Registers engine interceptors into the client's `sendPipeline`. [ktor-client/ktor-client-core/common/src/io/ktor/client/engine/HttpClientEngine.kt:138-138](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/engine/HttpClientEngine.kt#L138-L138) |

Sources: [ktor-client/ktor-client-core/common/src/io/ktor/client/engine/HttpClientEngine.kt:51-138](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/engine/HttpClientEngine.kt#L51-L138)

## Coroutines and Network Engine Infrastructure

### Coroutines and Network Engine Infrastructure

### Overview
The Coroutine I/O (CIO) engine implements asynchronous network communications built directly on kotlinx.coroutines and Ktor network selectors. The engine initializes through the `CIO` factory, which instantiates `CIOEngine` configured via `CIOEngineConfig` [ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/CIOEngine.kt:24-25](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/CIOEngine.kt#L24-L25), [ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/CIOCommon.kt:29-31](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/CIOCommon.kt#L29-L31).

Sources: [ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/CIOEngine.kt:24-25](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/CIOEngine.kt#L24-L25), [ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/CIOCommon.kt:29-31](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/CIOCommon.kt#L29-L31)

### Execution and Endpoint Selection
When an HTTP request is submitted, `CIOEngine.execute()` enters a loop managed by coroutine lifecycle checks, selecting or creating an appropriate endpoint and delegating execution [ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/CIOEngine.kt:82-98](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/CIOEngine.kt#L82-L98). 

The call-chain execution walkthrough for request routing proceeds as follows:
`CIOEngine.execute()` → `selectEndpoint()` → `url.rebuildIfNeeded()` → `endpoints.computeIfAbsent()` → `Endpoint(...)` → `endpoint.execute()` [ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/CIOEngine.kt:82-97](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/CIOEngine.kt#L82-L97), [ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/CIOEngine.kt:113-147](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/CIOEngine.kt#L113-L147).

Sources: [ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/CIOEngine.kt:82-97](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/CIOEngine.kt#L82-L97), [ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/CIOEngine.kt:113-147](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/CIOEngine.kt#L113-L147)

> [!WARNING]
> If a request throws a `ClosedSendChannelException` inside `endpoint.execute()`, the engine catches the exception and continues the loop to re-attempt execution on a fresh channel, unless the parent coroutine context is no longer active.

Sources: [ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/CIOEngine.kt:91-92](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/CIOEngine.kt#L91-L92)

### Capabilities and Selector Infrastructure
The CIO engine explicitly declares its supported capabilities, which govern timeout enforcement, secure communication protocols, proxy features, and low-level socket operations [ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/CIOEngine.kt:28-34](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/CIOEngine.kt#L28-L34). Network polling and socket selection depend on `SelectorManager`, which provides asynchronous suspension primitives for specific select interests [ktor-network/common/src/io/ktor/network/selector/SelectorManagerCommon.kt:25-45](https://github.com/ktorio/ktor/blob/main/ktor-network/common/src/io/ktor/network/selector/SelectorManagerCommon.kt#L25-L45).

| Capability / Interest | Type / Scope | Purpose / Behavior |
| :--- | :--- | :--- |
| `HttpTimeoutCapability` | `HttpClientEngineCapability` | Enables request, connect, and socket timeout configurations. [ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/CIOEngine.kt:29-29](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/CIOEngine.kt#L29-L29) |
| `WebSocketCapability` | `HttpClientEngineCapability` | Supports bi-directional WebSocket protocol upgrading and framing. [ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/CIOEngine.kt:30-30](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/CIOEngine.kt#L30-L30) |
| `SSECapability` | `HttpClientEngineCapability` | Enables Server-Sent Events streams. [ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/CIOEngine.kt:32-32](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/CIOEngine.kt#L32-L32) |
| `UnixSocketCapability` | `HttpClientEngineCapability` | Permits connection routing over Unix domain sockets. [ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/CIOEngine.kt:33-33](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/CIOEngine.kt#L33-L33) |
| `SelectInterest.READ` | `SelectInterest` | Suspends until data is available to be read from a selectable channel. [ktor-network/common/src/io/ktor/network/selector/SelectorManagerCommon.kt:44-55](https://github.com/ktorio/ktor/blob/main/ktor-network/common/src/io/ktor/network/selector/SelectorManagerCommon.kt#L44-L55) |
| `SelectInterest.WRITE` | `SelectInterest` | Suspends until the selectable channel is ready to accept outgoing writes. [ktor-network/common/src/io/ktor/network/selector/SelectorManagerCommon.kt:44-56](https://github.com/ktorio/ktor/blob/main/ktor-network/common/src/io/ktor/network/selector/SelectorManagerCommon.kt#L44-L56) |
| `SelectInterest.CONNECT` | `SelectInterest` | Suspends until a non-blocking socket connection sequence completes. [ktor-network/common/src/io/ktor/network/selector/SelectorManagerCommon.kt:44-58](https://github.com/ktorio/ktor/blob/main/ktor-network/common/src/io/ktor/network/selector/SelectorManagerCommon.kt#L44-L58) |

Sources: [ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/CIOEngine.kt:28-34](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-cio/common/src/io/ktor/client/engine/cio/CIOEngine.kt#L28-L34), [ktor-network/common/src/io/ktor/network/selector/SelectorManagerCommon.kt:44-58](https://github.com/ktorio/ktor/blob/main/ktor-network/common/src/io/ktor/network/selector/SelectorManagerCommon.kt#L44-L58)

> [!NOTE]
> Only one selection operation is permitted per `SelectInterest` on a given `Selectable` simultaneously. While you can wait for `READ` and `WRITE` concurrently, attempting duplicate read selections on the same selectable instance violates selection constraints.

Sources: [ktor-network/common/src/io/ktor/network/selector/SelectorManagerCommon.kt:37-41](https://github.com/ktorio/ktor/blob/main/ktor-network/common/src/io/ktor/network/selector/SelectorManagerCommon.kt#L37-L41)

## Server Architecture and Application Lifecycle

### Overview

The server-side infrastructure in Ktor centers around the `ApplicationEngine` interface, which manages the web server execution lifecycle, connectors, and underlying thread pools. Applications are configured via `ServerConfig` and instantiated through builder functions like `serverConfig`, combining environment settings, modules, and execution parameters.
Sources: [ktor-server/ktor-server-core/common/src/io/ktor/server/application/Application.kt:87-114](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-core/common/src/io/ktor/server/application/Application.kt#L87-L114), [ktor-server/ktor-server-core/common/src/io/ktor/server/engine/ApplicationEngine.kt:17-160](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-core/common/src/io/ktor/server/engine/ApplicationEngine.kt#L17-L160)

### Application Lifecycle and Coroutine Integration

An `Application` instance extends `ApplicationCallPipeline` and implements `CoroutineScope`. Its coroutine context combines the parent context with a `SupervisorJob` derived from the server configuration. Background coroutines launched within an application scope benefit from structured concurrency tied directly to the application's runtime.
Sources: [ktor-server/ktor-server-core/common/src/io/ktor/server/application/Application.kt:116-138](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-core/common/src/io/ktor/server/application/Application.kt#L116-L138)

Engine lifecycle methods control server startup and shutdown execution. Engines provide both blocking and suspending variants for start and stop operations, interacting with thread dispatchers to manage execution boundaries.
Sources: [ktor-server/ktor-server-core/common/src/io/ktor/server/engine/ApplicationEngine.kt:120-160](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-core/common/src/io/ktor/server/engine/ApplicationEngine.kt#L120-L160)

> [!WARNING]
> Running `start(wait = false)` from the main thread without blocking actions will cause the application to terminate immediately without handling incoming requests.
Sources: [ktor-server/ktor-server-core/common/src/io/ktor/server/engine/ApplicationEngine.kt:115-118](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-core/common/src/io/ktor/server/engine/ApplicationEngine.kt#L115-L118)

When an application is terminated, cleanup proceeds through `disposeAndJoin()`, which cancels the underlying supervisor job and uninstalls all registered plugins.
Sources: [ktor-server/ktor-server-core/common/src/io/ktor/server/application/Application.kt:155-165](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-core/common/src/io/ktor/server/application/Application.kt#L155-L165)

### Engine Configuration Parameters

| Configuration Property | Default Value Expression | Description |
| :--- | :--- | :--- |
| `parallelism` | `availableProcessorsBridge()` | Returns current system parallelism level. | [ktor-server/ktor-server-core/common/src/io/ktor/server/engine/ApplicationEngine.kt:33-34](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-core/common/src/io/ktor/server/engine/ApplicationEngine.kt#L33-L34) |
| `connectionGroupSize` | `parallelism / 2 + 1` | Threads used to accept new connections and start call processing. | [ktor-server/ktor-server-core/common/src/io/ktor/server/engine/ApplicationEngine.kt:39-41](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-core/common/src/io/ktor/server/engine/ApplicationEngine.kt#L39-L41) |
| `workerGroupSize` | `parallelism / 2 + 1` | Event group size for connection processing, parsing, and engine work. | [ktor-server/ktor-server-core/common/src/io/ktor/server/engine/ApplicationEngine.kt:45-48](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-core/common/src/io/ktor/server/engine/ApplicationEngine.kt#L45-L48) |
| `callGroupSize` | `parallelism` | Minimum size of the thread pool used to process application calls. | [ktor-server/ktor-server-core/common/src/io/ktor/server/engine/ApplicationEngine.kt:52-55](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-core/common/src/io/ktor/server/engine/ApplicationEngine.kt#L52-L55) |
| `shutdownGracePeriod` | `1000` | Maximum time in milliseconds for activity to cool down. | [ktor-server/ktor-server-core/common/src/io/ktor/server/engine/ApplicationEngine.kt:59-62](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-core/common/src/io/ktor/server/engine/ApplicationEngine.kt#L59-L62) |
| `shutdownTimeout` | `5000` | Maximum time in milliseconds to wait until the server stops gracefully. | [ktor-server/ktor-server-core/common/src/io/ktor/server/engine/ApplicationEngine.kt:66-69](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-engine/common/src/io/ktor/server/engine/ApplicationEngine.kt#L66-L69) |

Sources: [ktor-server/ktor-server-core/common/src/io/ktor/server/engine/ApplicationEngine.kt:27-76](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-core/common/src/io/ktor/server/engine/ApplicationEngine.kt#L27-L76)

## Repository Structure and Developer Roadmap

### Overview

Ktor uses a flattened Gradle project structure defined in `settings.gradle.kts`, where nested directory paths do not create nested Gradle project names (e.g., `ktor-client/ktor-client-curl` maps directly to `:ktor-client-curl`). The repository follows a platform-centric multiplatform source set layout (`common/src`, `jvm/src`, etc.) with strict build logic preventing custom source set registration. JDK 21 is required for building all targets across JVM, JS, and Native platforms.
Sources: [AGENTS.md:23-41](https://github.com/ktorio/ktor/blob/main/AGENTS.md#L23-L41), [CONTRIBUTING.md:36-37](https://github.com/ktorio/ktor/blob/main/CONTRIBUTING.md#L36-L37)

### Build and Validation Workflow

Contributors must prioritize module-specific Gradle tasks over project-wide commands to fail fast and optimize build times. Before returning control, developers must ensure compilation, tests, formatting, linting, and binary compatibility pass.
Sources: [AGENTS.md:5-15](https://github.com/ktorio/ktor/blob/main/AGENTS.md#L5-L15)

| Validation Step | Module-Specific Command | Purpose |
| :--- | :--- | :--- |
| Build | `./gradlew :module-name:assemble` | Compiles module targets and outputs build artifacts. | [AGENTS.md:50-50](https://github.com/ktorio/ktor/blob/main/AGENTS.md#L50-L50) |
| Test | `./gradlew :module-name:jvmTest` | Executes JVM test suite for the target module. | [AGENTS.md:55-55](https://github.com/ktorio/ktor/blob/main/AGENTS.md#L55-L55) |
| Format | `./gradlew :module-name:formatKotlin` | Automatically formats Kotlin source code per `.editorconfig`. | [AGENTS.md:63-63](https://github.com/ktorio/ktor/blob/main/AGENTS.md#L63-L63) |
| Lint | `./gradlew :module-name:lintKotlin` | Validates code style rules and style compliance. | [AGENTS.md:64-64](https://github.com/ktorio/ktor/blob/main/AGENTS.md#L64-L64) |
| ABI Check | `./gradlew :module-name:checkKotlinAbi` | Verifies binary compatibility against public API dumps. | [AGENTS.md:132-132](https://github.com/ktorio/ktor/blob/main/AGENTS.md#L132-L132) |
| ABI Update | `./gradlew :module-name:updateKotlinAbi` | Updates public signature dumps under `api/` after API changes. | [AGENTS.md:133-133](https://github.com/ktorio/ktor/blob/main/AGENTS.md#L133-L133) |

Sources: [AGENTS.md:50-134](https://github.com/ktorio/ktor/blob/main/AGENTS.md#L50-L134)

> [!WARNING]
> Binary compatibility is strictly enforced via Kotlin Gradle Plugin ABI validation. Any change to public or protected APIs requires running `./gradlew :module-name:updateKotlinAbi` to update module signature dumps in `/api/`.
Sources: [AGENTS.md:118-120](https://github.com/ktorio/ktor/blob/main/AGENTS.md#L118-L120)

### Branching and Contribution Roadmap

Ktor development splits across two primary maintenance models:
* **`main`**: Target branch for new features, major changes, and the next minor release.
* **`release/*`**: Patch release branches (e.g., `release/3.x`) dedicated exclusively to bug fixes without public API alterations.
Sources: [AGENTS.md:121-125](https://github.com/ktorio/ktor/blob/main/AGENTS.md#L121-L125), [CONTRIBUTING.md:155-159](https://github.com/ktorio/ktor/blob/main/CONTRIBUTING.md#L155-L159)

> [!TIP]
> Use the interactive helper script `./switch-base-branch.sh` with `--dry-run` to review git commands before switching your feature branch base between `main` and release tracks.
Sources: [AGENTS.md:127-128](https://github.com/ktorio/ktor/blob/main/AGENTS.md#L127-L128), [CONTRIBUTING.md:160-164](https://github.com/ktorio/ktor/blob/main/CONTRIBUTING.md#L160-L164)

## Related

- [[Quick Start]]
- [[Project Structure]]
- [[Application Pipeline]]

