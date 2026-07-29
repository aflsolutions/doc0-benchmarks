# Quick Start

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [ktor-client/ktor-client-core/common/src/io/ktor/client/HttpClient.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/HttpClient.kt)
- [README.md](https://github.com/ktorio/ktor/blob/main/README.md)
- [ktor-compiler-plugin/testData/openapi/CallHandlerFunctions.kt](https://github.com/ktorio/ktor/blob/main/ktor-compiler-plugin/testData/openapi/CallHandlerFunctions.kt)
- [CONTRIBUTING.md](https://github.com/ktorio/ktor/blob/main/CONTRIBUTING.md)
- [ktor-compiler-plugin/testData/openapi/Resources.kt](https://github.com/ktorio/ktor/blob/main/ktor-compiler-plugin/testData/openapi/Resources.kt)
- [AGENTS.md](https://github.com/ktorio/ktor/blob/main/AGENTS.md)
- [ktor-server/ktor-server-test-suites/jvm/src/io/ktor/server/testing/suites/SustainabilityTestSuite.kt](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-test-suites/jvm/src/io/ktor/server/testing/suites/SustainabilityTestSuite.kt)
- [ktor-server/ktor-server-test-suites/jvm/src/io/ktor/server/testing/suites/ConnectionTestSuite.kt](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-test-suites/jvm/src/io/ktor/server/testing/suites/ConnectionTestSuite.kt)
- [ktor-server/ktor-server-cio/common/src/io/ktor/server/cio/EngineMain.kt](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-cio/common/src/io/ktor/server/cio/EngineMain.kt)
- [ktor-compiler-plugin/testData/openapi/MarkdownOptions.kt](https://github.com/ktorio/ktor/blob/main/ktor-compiler-plugin/testData/openapi/MarkdownOptions.kt)
- [ktor-compiler-plugin/testData/openapi/KDocOptions.kt](https://github.com/ktorio/ktor/blob/main/ktor-compiler-plugin/testData/openapi/KDocOptions.kt)
- [build-logic/src/main/kotlin/ktorbuild/targets/CommonConfig.kt](https://github.com/ktorbuild/targets/CommonConfig.kt)
- [ktor-server/ktor-server-test-suites/jvm/src/io/ktor/server/testing/suites/ClientCertTestSuite.kt](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-test-suites/jvm/src/io/ktor/server/testing/suites/ClientCertTestSuite.kt)
- [ktor-server/ktor-server-test-host/common/src/io/ktor/server/testing/TestApplication.kt](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-test-host/common/src/io/ktor/server/testing/TestApplication.kt)
- [ktor-client/ktor-client-core/posix/src/io/ktor/client/HttpClient.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/posix/src/io/ktor/client/HttpClient.kt)
- [ktor-client/ktor-client-core/jvm/src/io/ktor/client/HttpClientJvm.kt](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/jvm/src/io/ktor/client/HttpClientJvm.kt)
- [ktor-server/ktor-server-core/jvm/test-resources/resource.txt](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-core/jvm/test-resources/resource.txt)
</details>

## Overview

Getting started with Ktor involves setting up your project build scripts, bootstrapping server application engines, and configuring modular routing definitions. Ktor provides a multiplatform asynchronous framework designed around coroutines, enabling developers to build scalable microservices and web applications without restrictive architectural constraints. Core workflows span from initializing server entry points and defining HTTP endpoints to instantiating cross-platform HTTP clients and verifying end-to-end behavior in-memory with specialized test harnesses. Sources: [README.md:17-18](https://github.com/ktorio/ktor/blob/main/README.md#L17-L18)
Sources: [README.md:78-98](https://github.com/ktorio/ktor/blob/main/README.md#L78-L98)

## Gradle Project Configuration and Build Setup

### Overview

Configuring build scripts and Kotlin DSL targets for Ktor projects involves defining common dependencies and test sets through build-logic extensions. Sources: [build-logic/src/main/kotlin/ktorbuild/targets/CommonConfig.kt:12-14](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/CommonConfig.kt#L12-L14)

The `configureCommon` extension function applies configuration directly to the project's Kotlin extension block, targeting multiplatform source sets. Sources: [build-logic/src/main/kotlin/ktorbuild/targets/CommonConfig.kt:12-14](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/CommonConfig.kt#L12-L14)

Within the shared code architecture, `commonMain` manages production dependencies while `commonTest` configures testing frameworks for cross-platform validation. Sources: [build-logic/src/main/kotlin/ktorbuild/targets/CommonConfig.kt:15-22](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/CommonConfig.kt#L15-L22)

### Source Set Dependency Setup

The project configuration process sets up explicit dependency scopes for shared multiplatform source sets using Kotlin DSL extensions. Sources: [build-logic/src/main/kotlin/ktorbuild/targets/CommonConfig.kt:12-24](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/CommonConfig.kt#L12-L24)

The `configureCommon` function invokes the `kotlin` configuration block to access multiplatform source sets, registering `kotlinx-coroutines-core` as an API dependency for `commonMain` and `kotlin-test` as an implementation dependency for `commonTest`. Sources: [build-logic/src/main/kotlin/ktorbuild/targets/CommonConfig.kt:13-23](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/CommonConfig.kt#L13-L23)

```kotlin
internal fun Project.configureCommon() {
    kotlin {
        sourceSets {
            commonMain.dependencies {
                api(libs.kotlinx.coroutines.core)
            }

            commonTest.dependencies {
                implementation(libs.kotlin.test)
            }
        }
    }
}
```
Sources: [build-logic/src/main/kotlin/ktorbuild/targets/CommonConfig.kt:12-24](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/CommonConfig.kt#L12-L24)

> [!NOTE]
> The `configureCommon` function is internal and scoped directly to Gradle's `Project` type, utilizing version catalog references (`libs`) for coroutines and test libraries. Sources: [build-logic/src/main/kotlin/ktorbuild/targets/CommonConfig.kt:7-12](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/CommonConfig.kt#L7-L12)
Sources: [build-logic/src/main/kotlin/ktorbuild/targets/CommonConfig.kt:16-20](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/CommonConfig.kt#L16-L20)

## Server Engine Startup and Main Entry

### Overview

The CIO application engine provides a default executable entry point via `EngineMain` for launching HTTP servers directly from command-line arguments and configuration files. Sources: [ktor-server/ktor-server-cio/common/src/io/ktor/server/cio/EngineMain.kt:11-16](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-cio/common/src/io/ktor/server/cio/EngineMain.kt#L11-L16)

Bootstrapping the server relies on processing command-line flags through `CommandLineConfig`, instantiating an `EmbeddedServer` configured with the `CIO` engine provider, and loading application properties such as `connectionIdleTimeoutSeconds` from the deployment configuration block. Sources: [ktor-server/ktor-server-cio/common/src/io/ktor/server/cio/EngineMain.kt:36-44](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-cio/common/src/io/ktor/server/cio/EngineMain.kt#L36-L44)

### Call-Chain Execution Walkthrough

Executing the server startup sequence flows through explicit initialization steps from the static entry point to server execution: `main()` → `createServer()` → `CommandLineConfig()` → `EmbeddedServer()` → `server.start()`. Sources: [ktor-server/ktor-server-cio/common/src/io/ktor/server/cio/EngineMain.kt:22-26](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-cio/common/src/io/ktor/server/cio/EngineMain.kt#L22-L26)
Sources: [ktor-server/ktor-server-cio/common/src/io/ktor/server/cio/EngineMain.kt:36-44](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-cio/common/src/io/ktor/server/cio/EngineMain.kt#L36-L44)

1. `EngineMain.main(args)` receives command-line arguments and immediately invokes `createServer(args)`. Sources: [ktor-server/ktor-server-cio/common/src/io/ktor/server/cio/EngineMain.kt:22-25](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-cio/common/src/io/ktor/server/cio/EngineMain.kt#L22-L25)
2. `createServer(args)` initializes a `CommandLineConfig(args)` instance to parse environment and configuration parameters. Sources: [ktor-server/ktor-server-cio/common/src/io/ktor/server/cio/EngineMain.kt:36-39](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-cio/common/src/io/ktor/server/cio/EngineMain.kt#L36-L39)
3. It constructs and returns an `EmbeddedServer` bound to `config.rootConfig`, the `CIO` engine, and a configuration lambda that calls `takeFrom(config.engineConfig)` and `loadConfiguration(config.rootConfig.environment.config)`. Sources: [ktor-server/ktor-server-cio/common/src/io/ktor/server/cio/EngineMain.kt:40-43](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-cio/common/src/io/ktor/server/cio/EngineMain.kt#L40-L43)
4. Finally, `main()` calls `server.start(true)`, starting the server and blocking the main thread until shutdown. Sources: [ktor-server/ktor-server-cio/common/src/io/ktor/server/cio/EngineMain.kt:22-26](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-cio/common/src/io/ktor/server/cio/EngineMain.kt#L22-L26)

```kotlin
public object EngineMain {
    @JvmStatic
    public fun main(args: Array<String>) {
        val server = createServer(args)
        server.start(true)
    }

    public fun createServer(
        args: Array<String>
    ): EmbeddedServer<CIOApplicationEngine, CIOApplicationEngine.Configuration> {
        val config = CommandLineConfig(args)
        return EmbeddedServer(config.rootConfig, CIO) {
            takeFrom(config.engineConfig)
            loadConfiguration(config.rootConfig.environment.config)
        }
    }
}
```
Sources: [ktor-server/ktor-server-cio/common/src/io/ktor/server/cio/EngineMain.kt:16-44](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-cio/common/src/io/ktor/server/cio/EngineMain.kt#L16-L44)

> [!NOTE]
> The `server.start(true)` method accepts a boolean `wait` parameter where passing `true` blocks the main execution thread to prevent the application process from terminating immediately after startup. Sources: [ktor-server/ktor-server-cio/common/src/io/ktor/server/cio/EngineMain.kt:22-26](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-cio/common/src/io/ktor/server/cio/EngineMain.kt#L22-L26)

### Configuration Loading Reference

The `loadConfiguration` extension function extracts deployment properties from the application configuration hierarchy. Sources: [ktor-server/ktor-server-cio/common/src/io/ktor/server/cio/EngineMain.kt:46-52](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-cio/common/src/io/ktor/server/cio/EngineMain.kt#L46-L52)

It reads common deployment settings and selectively binds individual engine properties if specified in the configuration tree. Sources: [ktor-server/ktor-server-cio/common/src/io/ktor/server/cio/EngineMain.kt:47-52](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-cio/common/src/io/ktor/server/cio/EngineMain.kt#L47-L52)

| Configuration Property | Path | Type / Parsing | Purpose |
| :--- | :--- | :--- | :--- |
| `deploymentConfig` | `ktor.deployment` | `ApplicationConfig` | Base configuration node for server deployment settings. |
| `loadCommonConfiguration` | `ktor.deployment` | Function call | Loads shared deployment parameters such as host and port bindings. |
| `connectionIdleTimeoutSeconds` | `ktor.deployment.connectionIdleTimeoutSeconds` | `String` → `Int`? | Configures the maximum idle timeout for active connections before closure. |

Sources: [ktor-server/ktor-server-cio/common/src/io/ktor/server/cio/EngineMain.kt:46-52](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-cio/common/src/io/ktor/server/cio/EngineMain.kt#L46-L52)

## Routing Handlers and Endpoint Definition

### Overview

Server-side routing in Ktor is established within `routing` blocks where endpoint handlers process incoming requests using string paths or type-safe resource classes annotated with `@Resource`. Sources: [ktor-compiler-plugin/testData/openapi/CallHandlerFunctions.kt:17-44](https://github.com/ktorio/ktor/blob/main/ktor-compiler-plugin/testData/openapi/CallHandlerFunctions.kt#L17-L44)
Sources: [ktor-compiler-plugin/testData/openapi/Resources.kt:80-87](https://github.com/ktorio/ktor/blob/main/ktor-compiler-plugin/testData/openapi/Resources.kt#L80-L87)

Applications configure features such as `ContentNegotiation` with JSON serialization alongside `Resources` to map routes cleanly to object hierarchies and parameters. Sources: [ktor-compiler-plugin/testData/openapi/CallHandlerFunctions.kt:17-21](https://github.com/ktorio/ktor/blob/main/ktor-compiler-plugin/testData/openapi/CallHandlerFunctions.kt#L17-L21)
Sources: [ktor-compiler-plugin/testData/openapi/Resources.kt:16-30](https://github.com/ktorio/ktor/blob/main/ktor-compiler-plugin/testData/openapi/Resources.kt#L16-L30)
Sources: [ktor-compiler-plugin/testData/openapi/Resources.kt:81-86](https://github.com/ktorio/ktor/blob/main/ktor-compiler-plugin/testData/openapi/Resources.kt#L81-L86)

### Call-Chain Execution Walkthrough

Processing and responding to requests flows through structured routing blocks and extension functions: `get()` → `getRecipient()` → `call.response.includeRecipientAndRespond()` → `call.respondHello()`. Sources: [ktor-compiler-plugin/testData/openapi/CallHandlerFunctions.kt:30-33](https://github.com/ktorio/ktor/blob/main/ktor-compiler-plugin/testData/openapi/CallHandlerFunctions.kt#L30-L33)
Sources: [ktor-compiler-plugin/testData/openapi/CallHandlerFunctions.kt:61-67](https://github.com/ktorio/ktor/blob/main/ktor-compiler-plugin/testData/openapi/CallHandlerFunctions.kt#L61-L67)

1. `routing { get("/response-header") { ... } }` matches incoming GET requests at the `/response-header` path. Sources: [ktor-compiler-plugin/testData/openapi/CallHandlerFunctions.kt:22-25](https://github.com/ktorio/ktor/blob/main/ktor-compiler-plugin/testData/openapi/CallHandlerFunctions.kt#L22-L25)
Sources: [ktor-compiler-plugin/testData/openapi/CallHandlerFunctions.kt:30-33](https://github.com/ktorio/ktor/blob/main/ktor-compiler-plugin/testData/openapi/CallHandlerFunctions.kt#L30-L33)
2. `getRecipient(call.request)` inspects request query parameters to extract a recipient string or default to `"World"`. Sources: [ktor-compiler-plugin/testData/openapi/CallHandlerFunctions.kt:31](https://github.com/ktorio/ktor/blob/main/ktor-compiler-plugin/testData/openapi/CallHandlerFunctions.kt#L31)
Sources: [ktor-compiler-plugin/testData/openapi/CallHandlerFunctions.kt:61-62](https://github.com/ktorio/ktor/blob/main/ktor-compiler-plugin/testData/openapi/CallHandlerFunctions.kt#L61-L62)
3. `call.response.includeRecipientAndRespond(recipient)` appends an `"X-Recipient"` header to the outgoing response. Sources: [ktor-compiler-plugin/testData/openapi/CallHandlerFunctions.kt:32](https://github.com/ktorio/ktor/blob/main/ktor-compiler-plugin/testData/openapi/CallHandlerFunctions.kt#L32)
Sources: [ktor-compiler-plugin/testData/openapi/CallHandlerFunctions.kt:64-65](https://github.com/ktorio/ktor/blob/main/ktor-compiler-plugin/testData/openapi/CallHandlerFunctions.kt#L64-L65)
4. It then invokes `call.respondHello(ContentType.Text.Html, recipient)`, which executes a `when` branch matching `ContentType.Text.Html` and sends an HTML-formatted response string. Sources: [ktor-compiler-plugin/testData/openapi/CallHandlerFunctions.kt:51-58](https://github.com/ktorio/ktor/blob/main/ktor-compiler-plugin/testData/openapi/CallHandlerFunctions.kt#L51-L58)
Sources: [ktor-compiler-plugin/testData/openapi/CallHandlerFunctions.kt:66](https://github.com/ktorio/ktor/blob/main/ktor-compiler-plugin/testData/openapi/CallHandlerFunctions.kt#L66)

```kotlin
private suspend fun RoutingResponse.includeRecipientAndRespond(recipient: String) {
    headers.append("X-Recipient", recipient)
    call.respondHello(ContentType.Text.Html, recipient)
}
```
Sources: [ktor-compiler-plugin/testData/openapi/CallHandlerFunctions.kt:64-67](https://github.com/ktorio/ktor/blob/main/ktor-compiler-plugin/testData/openapi/CallHandlerFunctions.kt#L64-L67)

> [!NOTE]
> The `respondHello` extension function evaluates the supplied `ContentType` parameter against explicit branches for `ContentType.Text.Plain` and `ContentType.Text.Html`, rendering plain text or HTML markup respectively. Sources: [ktor-compiler-plugin/testData/openapi/CallHandlerFunctions.kt:47-58](https://github.com/ktorio/ktor/blob/main/ktor-compiler-plugin/testData/openapi/CallHandlerFunctions.kt#L47-L58)

### Type-Safe Resource Routing Reference

The `Resources` feature enables defining endpoints backed by nested serializable classes annotated with `@Resource`. Sources: [ktor-compiler-plugin/testData/openapi/Resources.kt:16-30](https://github.com/ktorio/ktor/blob/main/ktor-compiler-plugin/testData/openapi/Resources.kt#L16-L30)
Sources: [ktor-compiler-plugin/testData/openapi/Resources.kt:76-79](https://github.com/ktorio/ktor/blob/main/ktor-compiler-plugin/testData/openapi/Resources.kt#L76-L79)

Each class maps hierarchical paths, parameters, or request bodies to specific HTTP methods. Sources: [ktor-compiler-plugin/testData/openapi/Resources.kt:17-56](https://github.com/ktorio/ktor/blob/main/ktor-compiler-plugin/testData/openapi/Resources.kt#L17-L56)
Sources: [ktor-compiler-plugin/testData/openapi/Resources.kt:91-146](https://github.com/ktorio/ktor/blob/main/ktor-compiler-plugin/testData/openapi/Resources.kt#L91-L146)

| Resource Class | Path Mapping | HTTP Method | Purpose |
| :--- | :--- | :--- | :--- |
| `Articles` | `/articles` | `GET` | Retrieves a collection of article posts. |
| `Articles.Id` | `/{id}` (nested under `/articles`) | `GET` | Retrieves a single article by numeric ID. |
| `Articles.Id.Comments` | `/comments` (nested under `Articles.Id`) | `GET` | Retrieves comments associated with a specific article. |
| `Articles.Featured` | `/featured` (nested under `/articles`) | `GET` | Retrieves featured articles. |
| `Users.Search` | `/users/search` | `GET` | Searches users with query parameters (`query`, `limit`, `offset`). |
| `Posts` | `/posts` | `POST` | Creates or updates a post object received in the request body. |
| `Posts.Id` | `/{id}` (nested under `/posts`) | `PUT` | Updates an existing post by ID with new body content. |
| `Posts.Id.Comments` | `/comments` (nested under `Posts.Id`) | `POST` | Adds a new comment to a specified post ID. |

Sources: [ktor-compiler-plugin/testData/openapi/Resources.kt:17-56](https://github.com/ktorio/ktor/blob/main/ktor-compiler-plugin/testData/openapi/Resources.kt#L17-L56)
Sources: [ktor-compiler-plugin/testData/openapi/Resources.kt:91-146](https://github.com/ktorio/ktor/blob/main/ktor-compiler-plugin/testData/openapi/Resources.kt#L91-L146)

### Route Handler Implementation Example

The following block demonstrates how an application installs features and defines both string-based and type-safe resource endpoints, including body deserialization with `call.receive<T>()` and status code handling: Sources: [ktor-compiler-plugin/testData/openapi/Resources.kt:80-102](https://github.com/ktorio/ktor/blob/main/ktor-compiler-plugin/testData/openapi/Resources.kt#L80-L102)
Sources: [ktor-compiler-plugin/testData/openapi/Resources.kt:128-131](https://github.com/ktorio/ktor/blob/main/ktor-compiler-plugin/testData/openapi/Resources.kt#L128-L131)

```kotlin
fun Application.installResources() {
    install(ContentNegotiation) {
        json()
    }
    install(Resources)

    routing {
        get<Articles.Id> { article ->
            val post = posts.find { it.id == article.id }
                ?: return@get call.respondText("Article #${article.id} not found", status = HttpStatusCode.NotFound)
            call.respond(post)
        }
        post<Posts> {
            val post = call.receive<Post>()
            call.respondText("Created post: ${post.title}")
        }
    }
}
```
Sources: [ktor-compiler-plugin/testData/openapi/Resources.kt:80-102](https://github.com/ktorio/ktor/blob/main/ktor-compiler-plugin/testData/openapi/Resources.kt#L80-L102)
Sources: [ktor-compiler-plugin/testData/openapi/Resources.kt:128-131](https://github.com/ktorio/ktor/blob/main/ktor-compiler-plugin/testData/openapi/Resources.kt#L128-L131)

## HttpClient Instantiation and Engine Discovery

### Overview

Constructing an `HttpClient` instance initializes multiplatform asynchronous request pipelines, coroutine scopes, and engine configurations. Sources: [ktor-client/ktor-client-core/common/src/io/ktor/client/HttpClient.kt:25-28](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/HttpClient.kt#L25-L28)
Sources: [ktor-client/ktor-client-core/common/src/io/ktor/client/HttpClient.kt:1276-1279](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/HttpClient.kt#L1276-L1279)

Across JVM and Posix environments, clients can be built either by explicitly passing an `HttpClientEngineFactory` or `HttpClientEngine`, or by invoking the parameterless `HttpClient(block)` constructor which triggers platform-specific engine discovery. Sources: [ktor-client/ktor-client-core/common/src/io/ktor/client/HttpClient.kt:333-335](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/HttpClient.kt#L333-L335)
Sources: [ktor-client/ktor-client-core/common/src/io/ktor/client/HttpClient.kt:645-652](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/HttpClient.kt#L645-L652)
Sources: [ktor-client/ktor-client-core/common/src/io/ktor/client/HttpClient.kt:962-965](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/HttpClient.kt#L962-L965)

### Platform Engine Discovery Mechanisms

When `HttpClient()` is invoked without arguments, each target platform delegates to its respective implementation file to resolve a default `HttpClientEngineFactory` through compile-time collections or runtime loading. Sources: [ktor-client/ktor-client-core/jvm/src/io/ktor/client/HttpClientJvm.kt:23-26](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/jvm/src/io/ktor/client/HttpClientJvm.kt#L23-L26)
Sources: [ktor-client/ktor-client-core/posix/src/io/ktor/client/HttpClient.kt:18-20](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/posix/src/io/ktor/client/HttpClient.kt#L18-L20)

- **JVM Platform**: Resolves the engine via `loadServiceOrNull<HttpClientEngineContainer>()?.factory`. It scans classpaths using `ServiceLoader` to locate the first registered `HttpClientEngineContainer` service implementation supplying an engine factory. If no container is discovered, it throws an error prompting the addition of a client engine dependency. Sources: [ktor-client/ktor-client-core/jvm/src/io/ktor/client/HttpClientJvm.kt:12-26](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/jvm/src/io/ktor/client/HttpClientJvm.kt#L12-L26)
Sources: [ktor-client/ktor-client-core/jvm/src/io/ktor/client/HttpClientJvm.kt:42-46](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/jvm/src/io/ktor/client/HttpClientJvm.kt#L42-L46)
- **Posix Platform**: Resolves the engine via `engines.firstOrNull()`. It evaluates statically linked or available engine factories within the Posix target collection, throwing an explicit error if the collection is empty. Sources: [ktor-client/ktor-client-core/posix/src/io/ktor/client/HttpClient.kt:18-26](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/posix/src/io/ktor/client/HttpClient.kt#L18-L26)

> [!NOTE]
> On the JVM, relying on parameterless `HttpClient()` initialization introduces a performance overhead due to `ServiceLoader` inspection. For performance-critical initialization paths such as Android applications, explicitly pass an engine factory or engine instance (e.g., `HttpClient(Apache5)`) to bypass service loading. Sources: [ktor-client/ktor-client-core/common/src/io/ktor/client/HttpClient.kt:316-329](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/HttpClient.kt#L316-L329)

### Instantiation Call-Chain Walkthrough

The construction of an `HttpClient` flows through overloaded constructors that manage engine lifecycle flags and configuration application. Sources: [ktor-client/ktor-client-core/common/src/io/ktor/client/HttpClient.kt:645-652](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/HttpClient.kt#L645-L652)
Sources: [ktor-client/ktor-client-core/common/src/io/ktor/client/HttpClient.kt:1282-1308](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/HttpClient.kt#L1282-L1308)

The execution order proceeds as follows: Sources: [ktor-client/ktor-client-core/common/src/io/ktor/client/HttpClient.kt:645-652](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/HttpClient.kt#L645-L652)
Sources: [ktor-client/ktor-client-core/common/src/io/ktor/client/HttpClient.kt:1282-1308](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/HttpClient.kt#L1282-L1308)

1. `HttpClient(engineFactory, block)` instantiates `HttpClientConfig<T>` and applies the configuration lambda: `val config = HttpClientConfig<T>().apply(block)`. Sources: [ktor-client/ktor-client-core/common/src/io/ktor/client/HttpClient.kt:645-649](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/HttpClient.kt#L645-L649)
2. It invokes `engineFactory.create(config.engineConfig)` to build the concrete `HttpClientEngine`. Sources: [ktor-client/ktor-client-core/common/src/io/ktor/client/HttpClient.kt:650](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/HttpClient.kt#L650)
3. It delegates to the designated internal constructor: `HttpClient(engine, config, manageEngine = true)`. Sources: [ktor-client/ktor-client-core/common/src/io/ktor/client/HttpClient.kt:651](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/HttpClient.kt#L651)
4. The internal constructor assigns `manageEngine = true`, increments reference counts if the engine is an `HttpClientEngineBase`, and registers a completion callback on `coroutineContext[Job]` to automatically close or cancel the engine upon client termination. Sources: [ktor-client/ktor-client-core/common/src/io/ktor/client/HttpClient.kt:1282-1307](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/HttpClient.kt#L1282-L1307)

### HttpClient Overloads and Parameters

| Constructor Signature | Parameters | Engine Management (`manageEngine`) | Description |
| :--- | :--- | :--- | :--- |
| `HttpClient(block)` | `block: HttpClientConfig<*>.() -> Unit` | Managed (`true`) via platform default loader | Discovers and instantiates the default engine using service loading or static platform collections. |
| `HttpClient(engineFactory, block)` | `engineFactory: HttpClientEngineFactory<T>`, `block: HttpClientConfig<T>.() -> Unit` | Managed (`true`) | Creates an engine instance from the supplied factory and manages its lifecycle with the client. |
| `HttpClient(engine, block)` | `engine: HttpClientEngine`, `block: HttpClientConfig<*>.() -> Unit` | Unmanaged (`false`) | Accepts a pre-constructed engine instance; callers must manually close the engine when appropriate. |
| `HttpClient(engine, userConfig)` | `engine: HttpClientEngine`, `userConfig: HttpClientConfig<*>` | Controlled via internal constructor | Core primary constructor initializing pipelines, attributes, interceptors, and default plugins. |

Sources: [ktor-client/ktor-client-core/common/src/io/ktor/client/HttpClient.kt:333-335](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/HttpClient.kt#L333-L335)
Sources: [ktor-client/ktor-client-core/common/src/io/ktor/client/HttpClient.kt:645-652](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/HttpClient.kt#L645-L652)
Sources: [ktor-client/ktor-client-core/common/src/io/ktor/client/HttpClient.kt:962-965](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/HttpClient.kt#L962-L965)
Sources: [ktor-client/ktor-client-core/common/src/io/ktor/client/HttpClient.kt:1275-1287](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/HttpClient.kt#L1275-L1287)

> [!CAUTION]
> When instantiating `HttpClient` with an explicit `HttpClientEngine` instance via `HttpClient(engine) { ... }`, `manageEngine` is set to `false`. The client will not automatically close or cancel the engine upon termination, requiring explicit invocation of `engine.close()` alongside `client.close()` to prevent resource leaks. Sources: [ktor-client/ktor-client-core/common/src/io/ktor/client/HttpClient.kt:962-965](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/HttpClient.kt#L962-L965)
Sources: [ktor-client/ktor-client-core/common/src/io/ktor/client/HttpClient.kt:1465-1472](https://github.com/ktorio/ktor/blob/main/ktor-client/ktor-client-core/common/src/io/ktor/client/HttpClient.kt#L1465-L1472)

## Testing Ktor Applications with TestApplication

### Overview

Ktor provides the `TestApplication` and `testApplication` DSL to verify server and client behavior in-memory without binding to physical network ports or starting an external web server process. Sources: [README.md:103-107](https://github.com/ktorio/ktor/blob/main/README.md#L103-L107)
Sources: [ktor-server/ktor-server-test-host/common/src/io/ktor/server/testing/TestApplication.kt:430-436](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-test-host/common/src/io/ktor/server/testing/TestApplication.kt#L430-L436)

Tests run inside coroutine scopes using `DelegatingTestClientEngine` and `TestEngine`, executing requests directly against the configured application instance. Sources: [ktor-server/ktor-server-test-host/common/src/io/ktor/server/testing/TestApplication.kt:211-217](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-test-host/common/src/io/ktor/server/testing/TestApplication.kt#L211-L217)
Sources: [ktor-server/ktor-server-test-host/common/src/io/ktor/server/testing/TestApplication.kt:420-427](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-test-host/common/src/io/ktor/server/testing/TestApplication.kt#L420-L427)

### TestApplication Execution Walkthrough

When a test block executes via `testApplication`, the call chain flows through specific initialization and lifecycle steps: Sources: [ktor-server/ktor-server-test-host/common/src/io/ktor/server/testing/TestApplication.kt:460-523](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-test-host/common/src/io/ktor/server/testing/TestApplication.kt#L460-L523)

1. `testApplication(block)` calls `testApplication(EmptyCoroutineContext, block)` which invokes `runTestWithRealTime(parentCoroutineContext)` wrapping `runTestApplication`. Sources: [ktor-server/ktor-server-test-host/common/src/io/ktor/server/testing/TestApplication.kt:460-503](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-test-host/common/src/io/ktor/server/testing/TestApplication.kt#L460-L503)
2. `runTestApplication()` instantiates `ApplicationTestBuilder()`, applies the coroutine context, and executes the user's lambda `block()`. Sources: [ktor-server/ktor-server-test-host/common/src/io/ktor/server/testing/TestApplication.kt:507-519](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-test-host/common/src/io/ktor/server/testing/TestApplication.kt#L507-L519)
3. Accessing the `client` or calling `startApplication()` triggers `builder.testApplication` evaluation, creating the `TestApplication` instance which wraps `createServer = { embeddedServer }`. Sources: [ktor-server/ktor-server-test-host/common/src/io/ktor/server/testing/TestApplication.kt:378-384](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-test-host/common/src/io/ktor/server/testing/TestApplication.kt#L378-L384)
Sources: [ktor-server/ktor-server-test-host/common/src/io/ktor/server/testing/TestApplication.kt:389-395](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-test-host/common/src/io/ktor/server/testing/TestApplication.kt#L389-L395)
4. `TestApplication.start()` uses an atomic operation to transition state from `State.Created` to `State.Starting`, calls `server.startSuspend()`, starts any registered `externalApplications`, and completes the lifecycle by setting state to `State.Started`. Sources: [ktor-server/ktor-server-test-host/common/src/io/ktor/server/testing/TestApplication.kt:81-112](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-test-host/common/src/io/ktor/server/testing/TestApplication.kt#L81-L112)
5. Upon test completion, `TestApplication.stop()` transitions state to `State.Stopped`, invokes `server.stopSuspend()`, stops external applications, and closes the `HttpClient`. Sources: [ktor-server/ktor-server-test-host/common/src/io/ktor/server/testing/TestApplication.kt:114-124](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-test-host/common/src/io/ktor/server/testing/TestApplication.kt#L114-L124)

### Builder API Reference

| Component / Function | Signature / Type | Description |
| :--- | :--- | :--- |
| `testApplication` | `(CoroutineContext, suspend ApplicationTestBuilder.() -> Unit) -> TestResult` | Entry point for writing in-memory test blocks using coroutines and real-time dispatchers. |
| `ClientProvider.client` | `HttpClient` | Returns the default test client instance attached to the test application, initializing it on first access. |
| `ClientProvider.createClient` | `((HttpClientConfig<*>.() -> Unit)) -> HttpClient` | Creates a custom-configured `HttpClient` using `DelegatingTestClientEngine` tied to the test application. |
| `ExternalServicesBuilder.hosts` | `(vararg String, Application.() -> Unit) -> Unit` | Registers mock external service applications intercepted by authority URLs. |
| `TestApplicationBuilder.install` | `, B, F>(Plugin, B, F>, B.() -> Unit) -> Unit` | Installs a Ktor plugin into the test application pipeline prior to building. |
| `TestApplicationBuilder.routing` | `(Route.() -> Unit) -> Unit` | Configures routing endpoints inside the test application module. |

Sources: [ktor-server/ktor-server-test-host/common/src/io/ktor/server/testing/TestApplication.kt:31-59](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-test-host/common/src/io/ktor/server/testing/TestApplication.kt#L31-L59)
Sources: [ktor-server/ktor-server-test-host/common/src/io/ktor/server/testing/TestApplication.kt:161-173](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-test-host/common/src/io/ktor/server/testing/TestApplication.kt#L161-L173)
Sources: [ktor-server/ktor-server-test-host/common/src/io/ktor/server/testing/TestApplication.kt:311-317](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-test-host/common/src/io/ktor/server/testing/TestApplication.kt#L311-L317)
Sources: [ktor-server/ktor-server-test-host/common/src/io/ktor/server/testing/TestApplication.kt:324-327](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-test-host/common/src/io/ktor/server/testing/TestApplication.kt#L324-327)
Sources: [ktor-server/ktor-server-test-host/common/src/io/ktor/server/testing/TestApplication.kt:498-503](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-test-host/common/src/io/ktor/server/testing/TestApplication.kt#L498-L503)

### Design Trade-offs

| Design Choice | Benefit | Cost |
| :--- | :--- | :--- |
| In-memory `TestEngine` transport | Eliminates network socket binding overhead, port conflicts, and firewall prompts, yielding high test execution speed. | Does not validate lower-level TCP/IP socket behaviors, custom TLS handshakes, or physical network framing quirks. |
| Lazy server startup on first request | Automatically defers server initialization until the test client executes its first request or `startApplication()` is called. | Configuration modifications (such as calling `routing { }` or `install { }`) throw exceptions if attempted after the server properties have built. |
| Delegating test client engine | Shares application context directly with the test client without HTTP proxy serialization. | Restricts client testing scope strictly to the integrated `TestApplication` environment unless external services are explicitly registered. |

Sources: [ktor-server/ktor-server-test-host/common/src/io/ktor/server/testing/TestApplication.kt:361-366](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-test-host/common/src/io/ktor/server/testing/TestApplication.kt#L361-L366)
Sources: [ktor-server/ktor-server-test-host/common/src/io/ktor/server/testing/TestApplication.kt:398-417](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-test-host/common/src/io/ktor/server/testing/TestApplication.kt#L398-L417)
Sources: [ktor-server/ktor-server-test-host/common/src/io/ktor/server/testing/TestApplication.kt:420-427](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-test-host/common/src/io/ktor/server/testing/TestApplication.kt#L420-L427)

> [!WARNING]
> Calling configuration methods such as `install`, `routing`, `environment`, or `engine` after accessing the `client` property or making a request triggers `checkNotBuilt()`, resulting in an immediate `IllegalStateException` because the test application has already constructed its server properties. Sources: [ktor-server/ktor-server-test-host/common/src/io/ktor/server/testing/TestApplication.kt:361-366](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-test-host/common/src/io/ktor/server/testing/TestApplication.kt#L361-L366)

### Full Worked Example

```kotlin
@Test
fun testCustomClientAndRouting() = testApplication {
    val customClient = createClient {
        install(ContentNegotiation) {
            json()
        }
    }
    
    application {
        install(Compression)
    }

    routing {
        get("/json") {
            call.respond(mapOf("status" to "OK"))
        }
    }

    val response = customClient.get("/json")
    assertEquals(HttpStatusCode.OK, response.status)
}
```
Sources: [ktor-server/ktor-server-test-host/common/src/io/ktor/server/testing/TestApplication.kt:43-52](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-test-host/common/src/io/ktor/server/testing/TestApplication.kt#L43-L52)
Sources: [ktor-server/ktor-server-test-host/common/src/io/ktor/server/testing/TestApplication.kt:305-327](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-test-host/common/src/io/ktor/server/testing/TestApplication.kt#L305-327)
Sources: [ktor-server/ktor-server-test-host/common/src/io/ktor/server/testing/TestApplication.kt:460-462](https://github.com/ktorio/ktor/blob/main/ktor-server/ktor-server-test-host/common/src/io/ktor/server/testing/TestApplication.kt#L460-L462)

## Related

- [[Overview]]
- [[Project Structure]]
- [[Application Engine]]

