# Overview

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [README.md](https://github.com/Alamofire/Alamofire/blob/main/README.md)
- [docs/docsets/Alamofire.docset/Contents/Resources/Documents/index.html](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/index.html)
- [docs/index.html](https://github.com/Alamofire/Alamofire/blob/main/docs/index.html)
- [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Classes.html](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Classes.html)
</details>

## Overview

Alamofire is an HTTP networking library written in Swift, built on top of Apple's `URLSession` to provide a clean, elegant API for making requests, handling responses, and managing network lifecycles across multiple platforms.
Sources: [README.md:10](https://github.com/Alamofire/Alamofire/blob/main/README.md#L10)

Designed around a powerful yet compact syntax, the library enables developers to execute network tasks with automatic URL conversion, request interception, parameter encoding, response validation, and background decodable serialization using modern Swift concurrency or callback closures.
Sources: [README.md:38-46](https://github.com/Alamofire/Alamofire/blob/main/README.md#L38-L46)

This documentation site is organized to guide developers from initial onboarding and dependency integration through core architectural concepts, public API usage, advanced session management, and comprehensive reference documentation.
Sources: [README.md:12-29](https://github.com/Alamofire/Alamofire/blob/main/README.md#L12-L29)

## Core Architectural Components

Alamofire is architected around a set of primary classes and protocols that manage the entire lifecycle of an HTTP request, bridging raw `URLSession` primitives with high-level Swift abstractions. At the core of the framework is the `Session` class, which creates and manages `Request` instances during their lifetimes, providing common functionality for queuing, interception, trust management, redirect handling, and response cache handling.
Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Classes.html:792-807](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Classes.html#L792-L807)

The global variable `AF` serves as the default shared `Session` instance, enabling rapid request execution. Supporting the session layer, `SessionDelegate` implements the various `URLSessionDelegate` methods to connect background OS events with Alamofire's internal request tracking and monitoring machinery.
Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Classes.html:232-236](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Classes.html#L232-L236)

> [!NOTE]
> The global `AF` instance provides a pre-configured default `Session` for convenience, but complex applications can instantiate custom `Session` objects with dedicated configurations, evaluators, and interceptors.
Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Classes.html:792-807](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Classes.html#L792-L807)

The structural organization divides request types into specialized subclasses inheriting from the common `Request` superclass. `DataRequest` handles in-memory `Data` downloads via `URLSessionDataTask`, while `UploadRequest` extends `DataRequest` to manage data uploads from memory, files, or streams using `URLSessionUploadTask`. Similarly, `DownloadRequest` handles writing data directly to disk via `URLSessionDownloadTask`, and `DataStreamRequest` streams HTTP response data through handler closures.
Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Classes.html:584-607](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Classes.html#L584-L607)

Interception and monitoring are decoupled into modular classes such as `Interceptor`, `AuthenticationInterceptor`, `ClosureEventMonitor`, and `CompositeEventMonitor`, allowing custom handling of request adaptation, retrying, and event observation without cluttering core network logic.
Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Classes.html:66-76](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Classes.html#L66-L76)

## Public API Surface and Requests

### Overview

Alamofire's public API surface centers around fluent request generation, parameter encoding, and flexible response serialization. User-facing entry points allow developers to construct complex HTTP interactions in very few lines of code by chaining configuration modifiers, authentication handlers, response validation rules, and debugging utilities directly onto request builders.
Sources: [README.md:54-79](https://github.com/Alamofire/Alamofire/blob/main/README.md#L54-L79)

### Request Generation and Parameter Encoding

Requests are initialized through session entry points like the global `AF` variable or custom `Session` instances, yielding specialized request subclasses. Parameter encoding is handled by dedicated classes conforming to the `ParameterEncoder` protocol, such as `JSONParameterEncoder` and `URLEncodedFormParameterEncoder`.
Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Classes.html:232-236](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Classes.html#L232-L236)

| Encoder Class | Default Content-Type Header | Purpose & Behavior |
| --- | --- | --- |
| `JSONParameterEncoder` | `application/json` | Encodes types as JSON body data. |
| `URLEncodedFormParameterEncoder` | `application/x-www-form-urlencoded; charset=utf-8` | Encodes types as URL-encoded query strings set on the URL or body data based on destination. |
Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Classes.html:728-788](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Classes.html#L728-L788)

### Response Serializers

Once a request completes, data is processed using response serializers that perform response validation and decode raw bytes into structured model objects or native types. Alamofire provides built-in serializers for raw data, strings, JSON, and Swift `Decodable` types.
Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Classes.html:1174-1200](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Classes.html#L1174-L1200)

> [!WARNING]
> `JSONResponseSerializer` is deprecated and will be removed in Alamofire 6. Use concrete types conforming to `Decodable` with `DecodableResponseSerializer` instead.
Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Classes.html:1260-1293](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Classes.html#L1260-L1293)

> [!NOTE]
> `JSONDecoder` and `PropertyListDecoder` are not `Sendable` on Apple platforms prior to macOS 13+ or iOS 16+. Always create a new serializer instance for each request rather than sharing a single instance.
Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Classes.html:1310-1351](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Classes.html#L1310-L1351)

### Complete Request Lifecycle Example

The following worked example demonstrates a complete request chain using the global `AF` entry point, incorporating automatic retry policies, authentication, validation, cURL logging, and `Decodable` serialization with Swift concurrency:
Sources: [README.md:54-79](https://github.com/Alamofire/Alamofire/blob/main/README.md#L54-L79)

```swift
let response = await AF.request("https://httpbin.org/get", interceptor: .retryPolicy)
                       .authenticate(username: "user", password: "pass")
                       .cacheResponse(using: .cache)
                       .redirect(using: .follow)
                       .validate()
                       .cURLDescription { description in
                         print(description)
                       }
                       .serializingDecodable(DecodableType.self)
                       .response

debugPrint(response)
```
Sources: [README.md:58-79](https://github.com/Alamofire/Alamofire/blob/main/README.md#L58-L79)

## Documentation Structure and Resources

### Overview

Alamofire documentation is generated using Jazzy and organized into standard HTML indices, docsets, and symbol reference pages for integration into documentation browsers like Dash. The generated documentation bundle includes primary reference pages for classes, protocols, structures, enumerations, global variables, and type aliases.
Sources: [docs/index.html:1-562](https://github.com/Alamofire/Alamofire/blob/main/docs/index.html#L1-L562)

### DocSet Feed and Search Integration

The generated documentation package supports direct installation into Dash via dedicated feed links and provides fully indexed search capabilities using embedded JSON search indices, Lunr.js, and typeahead support.
Sources: [docs/index.html:28-47](https://github.com/Alamofire/Alamofire/blob/main/docs/index.html#L28-L47)

> [!NOTE]
> The documentation feed URL uses the custom protocol scheme `dash-feed://` to enable direct one-click installation into offline developer documentation viewers.
Sources: [docs/index.html:41-46](https://github.com/Alamofire/Alamofire/blob/main/docs/index.html#L41-L46)

### Symbol Groupings

API reference documentation is partitioned into distinct top-level navigation groups within the sidebar structure. The following table details the primary symbol groups and their corresponding navigation links:
Sources: [docs/index.html:54-562](https://github.com/Alamofire/Alamofire/blob/main/docs/index.html#L54-L562)

| Symbol Group | Navigation Link | Target Content Types |
| --- | --- | --- |
| Classes | `Classes.html` | Core object models, request handlers, interceptors, managers, and serializers |
| Global Variables | `Global Variables.html` | Global entry points such as `AF` (`Session`) |
| Enumerations | `Enums.html` | Error types, failure reasons, retry results, and info codes |
| Extensions | `Extensions.html` | Foundation and standard library type extensions |
| Protocols | `Protocols.html` | Behavioral interfaces for encoding, decoding, intercepting, and evaluation |
| Structures | `Structures.html` | Value types for configuration, headers, methods, publishers, and parameters |
| Type Aliases | `Typealiases.html` | Simplified closure and response type definitions |
Sources: [docs/index.html:54-562](https://github.com/Alamofire/Alamofire/blob/main/docs/index.html#L54-L562)

## Session Management and Control Flow

### Overview

Alamofire routes and manages network tasks through a cooperative lifecycle between the `Session` class, `SessionDelegate`, and the `Request` hierarchy. The `Session` class acts as the central orchestrator that creates and manages `Request` instances throughout their execution lifecycle, providing common functionality for queuing, authentication interception, server trust evaluation, redirect handling, and response caching.
Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Classes.html:792-804](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Classes.html#L792-L804)

### Session and Request Lifecycle Management

The underlying task execution relies on `SessionDelegate`, which implements various `URLSessionDelegate`, `URLSessionTaskDelegate`, `URLSessionDataDelegate`, `URLSessionWebSocketDelegate`, and `URLSessionDownloadDelegate` methods to connect native Foundation callbacks directly into Alamofire's feature set.
Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Classes.html:823-850](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Classes.html#L823-L850)

The base `Request` class serves as the common superclass for all specialized request implementations, managing shared state, delegates, and callback handling. Specific task types extend this model to handle different transport behaviors:
- `DataRequest`: Handles in-memory data downloads using `URLSessionDataTask`.
- `UploadRequest`: Handles data uploads from memory, files, or streams using `URLSessionUploadTask`.
- `DownloadRequest`: Downloads data directly to disk using `URLSessionDownloadTask`.
- `DataStreamRequest`: Streams HTTP response data through closure-based handlers.
Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Classes.html:87-608](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Classes.html#L87-L608)

> [!NOTE]
> The global `AF` variable exposes a pre-configured shared `Session` instance, enabling direct request generation and control flow orchestration across the application without manual session instantiation.
Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Classes.html:235-238](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Classes.html#L235-L238)

## Developer Onboarding and Getting Started

### Overview

Getting started with Alamofire involves integrating the library into your project through supported dependency managers and utilizing the global `AF` session singleton to execute network requests. New developers can leverage concise request syntax, automatic string-to-URL conversion, built-in parameter encoding, and seamless Swift concurrency support to implement robust networking logic with minimal boilerplate.
Sources: [README.md:60-76](https://github.com/Alamofire/Alamofire/blob/main/README.md#L60-L76)

### Installation Options

Alamofire supports multiple dependency managers across supported platforms. Depending on your project setup, you can integrate the library using one of the following methods:
Sources: [README.md:127-204](https://github.com/Alamofire/Alamofire/blob/main/README.md#L127-L204)

| Dependency Manager | Configuration Syntax / Command | Target / Integration Notes |
| :--- | :--- | :--- |
| Swift Package Manager | `.package(url: "https://github.com/Alamofire/Alamofire.git", .upToNextMajor(from: "5.11.0"))` | Depend on product `Alamofire` (or `AlamofireDynamic` for forced dynamic linking). |
| CocoaPods | `pod 'Alamofire'` | Specified in your project's `Podfile`. |
| Carthage | `github "Alamofire/Alamofire"` | Specified in your project's `Cartfile`. |
| Manual Integration | `git submodule add https://github.com/Alamofire/Alamofire.git` | Drag `Alamofire.xcodeproj` into Xcode and embed the appropriate framework. |
Sources: [README.md:127-204](https://github.com/Alamofire/Alamofire/blob/main/README.md#L127-L204)

### Quick-Start Example

The following complete worked example demonstrates how to write a network request using Alamofire's chainable API with Swift concurrency, automatic retry policies, HTTP basic authentication, response validation, and automatic `Decodable` model serialization:
Sources: [README.md:60-76](https://github.com/Alamofire/Alamofire/blob/main/README.md#L60-L76)

```swift
// Automatic String to URL conversion, Swift concurrency support, and automatic retry.
let response = await AF.request("https://httpbin.org/get", interceptor: .retryPolicy)
                       // Automatic HTTP Basic Auth.
                       .authenticate(username: "user", password: "pass")
                       // Caching customization.
                       .cacheResponse(using: .cache)
                       // Redirect customization.
                       .redirect(using: .follow)
                       // Validate response code and Content-Type.
                       .validate()
                       // Produce a cURL command for the request.
                       .cURLDescription { description in
                         print(description)
                       }
                       // Automatic Decodable support with background parsing.
                       .serializingDecodable(DecodableType.self)
                       // Await the full response with metrics and a parsed body.
                       .response
// Detailed response description for easy debugging.
debugPrint(response)
```
Sources: [README.md:59-78](https://github.com/Alamofire/Alamofire/blob/main/README.md#L59-L78)

> [!WARNING]
> While Alamofire builds successfully on Linux, Windows, and Android using Swift Package Manager, features like `ServerTrustManager` certificate pinning, HTTP Basic and Digest authentication challenges, and `URLSessionTaskMetrics` are unavailable or unstable due to limitations in `swift-corelibs-foundation`.
Sources: [README.md:97-106](https://github.com/Alamofire/Alamofire/blob/main/README.md#L97-L106)

## Related

- [[Quick Start]]
- [[Project Structure]]
- [[Session Management]]

