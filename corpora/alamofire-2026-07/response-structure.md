# Response Structure

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [Source/Core/Response.swift](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Response.swift)
- [docs/Structs/DownloadResponse.html](https://github.com/Alamofire/Alamofire/blob/main/docs/Structs/DownloadResponse.html)
- [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Structs/DataResponse.html](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Structs/DataResponse.html)
- [docs/Structs/DataResponse.html](https://github.com/Alamofire/Alamofire/blob/main/docs/Structs/DataResponse.html)
</details>

## Overview

Alamofire’s response structures encapsulate the complete lifecycle outcome of network operations, bridging raw `URLSession` primitives with strongly-typed, memory-safe domain models. Designed with concurrency and thread safety in mind, these components store request metadata, server payloads, task metrics, and serialization results for both in-memory and disk-based workflows. By leveraging generic type parameters and functional transformation utilities, the response layer provides a unified interface for inspecting, adapting, and formatting HTTP transaction results across the entire public API.

Sources: [Source/Core/Response.swift:32-33](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Response.swift#L32-L33), [Source/Core/Response.swift:214-215](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Response.swift#L214-L215)

## DataResponse Encapsulation Structure

### Overview

The `DataResponse` structure is designed to store all values associated with a serialized response originating from a `DataRequest` or `UploadRequest`. Conforming to Swift's `Sendable` protocol, `DataResponse` ensures that response payloads can safely pass across concurrency boundaries. It accepts two generic type parameters: `Success` and `Failure`. The `Success` parameter represents the successfully deserialized model type, while `Failure` represents the error type, which must conform to the `Error` protocol. Both generic parameters are constrained by `Sendable` to guarantee thread safety during asynchronous processing and task propagation.

Sources: [Source/Core/Response.swift:33-33](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Response.swift#L33-L33)

### Stored Properties and Initialization

An instance of `DataResponse` encapsulates several core properties that record the state of the network transaction. The initializer accepts these parameters explicitly to construct the response container following completion of the response serialization pipeline.

| Property | Type | Purpose |
| :--- | :--- | :--- |
| `request` | `URLRequest?` | The original URL request sent to the server. |
| `response` | `HTTPURLResponse?` | The HTTP status code and headers returned by the server. |
| `data` | `Data?` | The raw bytes returned in the response body. |
| `metrics` | `URLSessionTaskMetrics?` | The final execution metrics collected for the session task. |
| `serializationDuration` | `TimeInterval` | The duration taken by the response serializer. |
| `result` | `Result<Success, Failure>` | The outcome of response serialization, wrapping either a `Success` value or a `Failure` error. |

Sources: [Source/Core/Response.swift:34-53](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Response.swift#L34-L53), [Source/Core/Response.swift:70-82](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Response.swift#L70-L82)

> [!NOTE]
> Collection of `URLSessionTaskMetrics` via the `metrics` property is currently disabled on watchOS due to system bug `FB7624529`, in which case the property evaluates to `nil`.
> 
> Sources: [Source/Core/Response.swift:44-47](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Response.swift#L44-L47)

### Computed Accessors and Result Mapping

To simplify access to inner result values, `DataResponse` provides computed convenience properties for extracting success values or errors directly without manually unwrapping the underlying `Result` enum. The `value` property returns `Success?` by referencing `result.success`, while the `error` property returns `Failure?` via `result.failure`. 

Sources: [Source/Core/Response.swift:55-60](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Response.swift#L55-L60)

## DownloadResponse File Destination Handling

### Overview

The `DownloadResponse` structure manages disk-based response data for `DownloadRequest` operations, bypassing the memory overhead of holding large files in RAM by writing incoming payloads directly to storage. Conforming to `Sendable`, `DownloadResponse` safely transfers disk-backed results across concurrency boundaries while maintaining generic `Success` and `Failure` types constrained to `Sendable` and `Error` respectively.

Sources: [Source/Core/Response.swift:214-215](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Response.swift#L214-L215)

### File Destination and Resume Data Management

Unlike `DataResponse`, which retains raw payloads in memory via a `Data?` property, `DownloadResponse` captures disk locations and resumable transfer states. Once the download finishes or terminates, the structure exposes specific properties tracking the file destination and cancellation state.

| Property | Type | Purpose |
| :--- | :--- | :--- |
| `request` | `URLRequest?` | The original URL request sent to the server. |
| `response` | `HTTPURLResponse?` | The HTTP status code and headers returned by the server. |
| `fileURL` | `URL?` | The final destination URL of the downloaded data after it is moved from its temporary location. |
| `resumeData` | `Data?` | The resumable download data generated if the request was cancelled mid-flight. |
| `metrics` | `URLSessionTaskMetrics?` | The final execution metrics collected for the download task. |
| `serializationDuration` | `TimeInterval` | The duration taken by response serialization. |
| `result` | `Result<Success, Failure>` | The outcome of response serialization, wrapping either a `Success` value or a `Failure` error. |

Sources: [Source/Core/Response.swift:216-238](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Response.swift#L216-L238)

> [!NOTE]
> The `fileURL` property points to the final location where the downloaded file resides after moving from the temporary directory. If the download fails or is interrupted before completion, `fileURL` may be `nil` while `resumeData` captures the byte offset and task state required to resume the download later.
>
> Sources: [Source/Core/Response.swift:222-226](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Response.swift#L222-L226)

### Initialization and Debug Representation

The `DownloadResponse` initializer accepts all state parameters explicitly, allowing serializers to construct the container upon completion of file movement and post-processing.

```swift
public init(request: URLRequest?,
            response: HTTPURLResponse?,
            fileURL: URL?,
            resumeData: Data?,
            metrics: URLSessionTaskMetrics?,
            serializationDuration: TimeInterval,
            result: Result<Success, Failure>) {
    self.request = request
    self.response = response
    self.fileURL = fileURL
    self.resumeData = resumeData
    self.metrics = metrics
    self.serializationDuration = serializationDuration
    self.result = result
}
```

Sources: [Source/Core/Response.swift:256-270](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Response.swift#L256-L270)

The structure implements `CustomDebugStringConvertible` to format its properties into a multi-line textual dump. The `debugDescription` property inspects the request, response status, destination path (`fileURL?.path`), presence of `resumeData`, network and serialization durations, and serialization result.

```swift
public var debugDescription: String {
    guard let urlRequest = request else { return "[Request]: None\n[Result]: \(result)" }

    let requestDescription = DebugDescription.description(of: urlRequest)
    let responseDescription = response.map(DebugDescription.description(of:)) ?? "[Response]: None"
    let networkDuration = metrics.map { "\($0.taskInterval.duration)s" } ?? "None"
    let resumeDataDescription = resumeData.map { "\($0)" } ?? "None"

    return """
    \(requestDescription)
    \(responseDescription)
    [File URL]: \(fileURL?.path ?? "None")
    [Resume Data]: \(resumeDataDescription)
    [Network Duration]: \(networkDuration)
    [Serialization Duration]: \(serializationDuration)s
    [Result]: \(result)
    """
}
```

Sources: [Source/Core/Response.swift:285-302](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Response.swift#L285-L302)

## Common Response Metadata and Metrics

### Overview

Both `DataResponse` and `DownloadResponse` share a consistent set of core metadata properties representing the lifecycle outcome of a network request. These properties provide access to the original request sent, the HTTP response metadata received from the server, execution metrics, serialization timings, and the final typed result container.

Sources: [Source/Core/Response.swift:33-54](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Response.swift#L33-L54), [Source/Core/Response.swift:215-238](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Response.swift#L215-L238)

### Shared Response Properties

The metadata properties common to both response types capture the complete contextual history of an executed network transaction. 

| Property | Type | Meaning |
| :--- | :--- | :--- |
| `request` | `URLRequest?` | The URL request sent to the server. |
| `response` | `HTTPURLResponse?` | The server's HTTP response containing status codes and headers. |
| `metrics` | `URLSessionTaskMetrics?` | The final execution metrics of the task. |
| `serializationDuration` | `TimeInterval` | The time taken to execute response serialization. |
| `result` | `Result<Success, Failure>` | The outcome of response serialization. |

Sources: [Source/Core/Response.swift:33-54](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Response.swift#L33-L54), [Source/Core/Response.swift:215-238](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Response.swift#L215-L238)

> [!NOTE]
> Collection of `URLSessionTaskMetrics` via the `metrics` property is subject to platform limitations. Specifically, due to bug `FB7624529`, task metrics collection on watchOS is currently disabled.
>
> Sources: [Source/Core/Response.swift:45-47](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Response.swift#L45-L47), [Source/Core/Response.swift:230-232](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Response.swift#L230-L232)

### Result Accessors and Computed Properties

To simplify checking success or failure conditions without explicitly unpacking the underlying `Result` enum, both response structures expose computed properties for the associated values and errors.

```swift
public var value: Success? { result.success }
public var error: Failure? { result.failure }
```

Sources: [Source/Core/Response.swift:56-59](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Response.swift#L56-L59), [Source/Core/Response.swift:241-244](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Response.swift#L241-L244)

## Result Transformation and Custom Description

### Overview

Alamofire response structures provide powerful transformation utilities and textual formatting capabilities through extensions on `DataResponse` and `DownloadResponse`. These methods enable non-destructive mapping of success values and error types, supporting both throwing and non-throwing closures while preserving underlying metadata such as requests, responses, metrics, and serialization durations. Additionally, both response types conform to `CustomStringConvertible` and `CustomDebugStringConvertible` to support structured logging and debugging output.

Sources: [Source/Core/Response.swift:87-210](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Response.swift#L87-L210), [Source/Core/Response.swift:275-395](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Response.swift#L275-L395)

### Result Transformation Methods

The transformation API mirrors Swift's standard `Result` methods, allowing developers to adapt parsed response data into domain models or map custom error types seamlessly. The transformation functions available on `DataResponse` and `DownloadResponse` include non-throwing and throwing variants for both success values and failure errors.

| Method Signature | Closure Type | Behavior |
| :--- | :--- | :--- |
| `map(_:)` | `(Success) -> NewSuccess` | Transforms the success value when present; passes failures through unchanged. |
| `tryMap(_:)` | `(Success) throws -> NewSuccess` | Transforms the success value with a throwing closure, widening the failure type to `any Error`. |
| `mapError(_:)` | `(Failure) -> NewFailure` | Transforms the failure error when present; passes successes through unchanged. |
| `tryMapError(_:)` | `(Failure) throws -> NewFailure` | Transforms the error with a throwing closure, widening the failure type to `any Error`. |

Sources: [Source/Core/Response.swift:139-209](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Response.swift#L139-L209), [Source/Core/Response.swift:320-394](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Response.swift#L320-L394)

> [!TIP]
> When chaining transformations like `tryMap` to decode or parse raw data payloads, the resulting response retains all original context including metrics and serialization duration, allowing downstream error handling to inspect the full network transaction history.
>
> Sources: [Source/Core/Response.swift:162-169](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Response.swift#L162-L169), [Source/Core/Response.swift:344-352](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Response.swift#L344-L352)

### Textual Description Formatting

Both `DataResponse` and `DownloadResponse` implement `CustomStringConvertible` and `CustomDebugStringConvertible`. The standard `description` property outputs a simple string representation of the underlying result, while `debugDescription` produces a detailed, multi-line diagnostic dump.

```swift
public var description: String {
    "\(result)"
}
```

Sources: [Source/Core/Response.swift:90-92](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Response.swift#L90-L92), [Source/Core/Response.swift:278-280](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Response.swift#L278-L280)

The `debugDescription` implementation evaluates the request and response objects, formatting HTTP methods, headers, status codes, and inspecting response bodies. Response bodies are included in debug output only if they are non-empty, adhere to printable content types (`json`, `xml`, `text`), and do not exceed a maximum length threshold of 100,000 bytes.

```swift
static func description(for data: Data?,
                        headers: HTTPHeaders,
                        allowingPrintableTypes printableTypes: [String] = ["json", "xml", "text"],
                        maximumLength: Int = 100_000) -> String {
    guard let data, !data.isEmpty else { return "[Body]: None" }

    guard
        data.count <= maximumLength,
        printableTypes.compactMap({ headers["Content-Type"]?.contains($0) }).contains(true)
    else { return "[Body]: \(data.count) bytes" }

    return """
    [Body]:
        \(String(decoding: data, as: UTF8.self)
        .trimmingCharacters(in: .whitespacesAndNewlines)
        .indentingNewlines())
    """
}
```

Sources: [Source/Core/Response.swift:428-445](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Response.swift#L428-L445)

## Type Aliases and Compatibility Structures

### Overview

Alamofire provides specialized type aliases and convenience structures across its public API to streamline common network response declarations. By default, standard data and download responses bind their failure type directly to `AFError`, reducing boilerplate when handling network, serialization, or validation errors.

Sources: [Source/Core/Response.swift:27-30](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Response.swift#L27-L30)

### Specialized Response Type Aliases

To avoid repeating generic failure type parameters across every request handler, Alamofire defines two core public type aliases that fix the `Failure` generic parameter to `AFError`.

| Type Alias | Underlying Definition | Target Request Type |
| :--- | :--- | :--- |
| `AFDataResponse<Success>` | `DataResponse<Success, AFError>` | `DataRequest`, `UploadRequest` |
| `AFDownloadResponse<Success>` | `DownloadResponse<Success, AFError>` | `DownloadRequest` |

Sources: [Source/Core/Response.swift:27-30](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Response.swift#L27-L30)

> [!NOTE]
> Using `AFDataResponse<T>` instead of `DataResponse<T, AFError>` ensures full compatibility with Alamofire's default response serialization handlers, which produce `AFError` instances upon failure.
>
> Sources: [Source/Core/Response.swift:27-28](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Response.swift#L27-L28)

### Response Struct Initialization and Structure

Both `DataResponse` and `DownloadResponse` are generic, `Sendable`-conforming structures designed to safely cross concurrency boundaries under Swift Concurrency. They encapsulate the entire transaction context, holding references to the originating `URLRequest`, the server `HTTPURLResponse`, performance metrics via `URLSessionTaskMetrics`, serialization timing, and the final `Result`.

```swift
public typealias AFDataResponse<Success> = DataResponse<Success, AFError>
public typealias AFDownloadResponse<Success> = DownloadResponse<Success, AFError>
```

Sources: [Source/Core/Response.swift:27-30](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Response.swift#L27-L30), [Source/Core/Response.swift:33-33](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Response.swift#L33-L33), [Source/Core/Response.swift:215-215](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Response.swift#L215-L215)

## Related

- [[Response Serialization]]
- [[Response Validation]]

