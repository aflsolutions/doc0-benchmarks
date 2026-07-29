# Swift Concurrency Integration

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [Source/Features/Concurrency.swift](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift)
- [Tests/ConcurrencyTests.swift](https://github.com/Alamofire/Alamofire/blob/main/Tests/ConcurrencyTests.swift)
- [README.md](https://github.com/Alamofire/Alamofire/blob/main/README.md)
- [docs/docsets/Alamofire.docset/Contents/Resources/Documents/index.html](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/index.html)
- [docs/index.html](https://github.com/Alamofire/Alamofire/blob/main/docs/index.html)
- [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Structs.html](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Structs.html)
</details>

## Overview

Alamofire's Swift Concurrency integration bridges asynchronous networking with modern Swift features like `async`/`await` and `AsyncSequence`. It enables developers to execute requests and handle streaming data using native concurrency primitives while maintaining safety, automatic resource cleanup, and robust cancellation propagation across tasks and task groups.

Sources: [Source/Features/Concurrency.swift:31-32](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L31-L32), [Tests/ConcurrencyTests.swift:31-32](https://github.com/Alamofire/Alamofire/blob/main/Tests/ConcurrencyTests.swift#L31-L32)

## DataRequest Async Response Serialization

### DataRequest Async Response Serialization

Alamofire bridges standard `DataRequest` response handling to Swift's `async`/`await` concurrency model using the `DataTask<Value>` structure. Rather than using traditional completion handler closures, developers interact with `DataTask` properties such as `response`, `result`, and `value` to await request outcomes cleanly within asynchronous contexts.

Sources: [Source/Features/Concurrency.swift:113-141](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L113-L141), [Tests/ConcurrencyTests.swift:88-120](https://github.com/Alamofire/Alamofire/blob/main/Tests/ConcurrencyTests.swift#L88-L120)

### Call-Chain Execution Walkthrough

When an asynchronous serialization method is invoked on a `DataRequest`, execution flows through a precise sequence of bridge operations to convert completion-based requests into awaitable tasks:

1. `serializingDecodable(_:automaticallyCancelling:dataPreprocessor:decoder:emptyResponseCodes:emptyRequestMethods:)` (or equivalent methods like `serializingData` and `serializingString`) instantiates the target `DecodableResponseSerializer` with the provided configuration.
Sources: [Source/Features/Concurrency.swift:269-280](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L269-L280)
2. It calls `serializingResponse(using:automaticallyCancelling:)`, which invokes the internal helper `dataTask(automaticallyCancelling:forResponse:)`.
Sources: [Source/Features/Concurrency.swift:318-326](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L318-L326)
3. The `dataTask` method constructs a Swift `Task` wrapping `withTaskCancellationHandler` and `withCheckedContinuation`.
Sources: [Source/Features/Concurrency.swift:348-361](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L348-L361)
4. Inside the continuation boundary, the traditional `response(queue:responseSerializer:completionHandler:)` method is executed on `underlyingQueue`, passing the serialized `DataResponse<Value, AFError>` back through `continuation.resume(returning:)`.
Sources: [Source/Features/Concurrency.swift:321-325](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L321-L325), [Source/Features/Concurrency.swift:353-356](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L353-L356)
5. A `defer` block verifies whether `shouldAutomaticallyCancel` is enabled and `Task.isCancelled` is true, immediately invoking `task.cancel()` if needed before returning the `DataTask<Value>` instance.
Sources: [Source/Features/Concurrency.swift:363-365](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L363-L365)

Sources: [Source/Features/Concurrency.swift:269-366](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L269-L366)

> [!NOTE]
> Task cancellation propagation relies on `withTaskCancellationHandler`. When `shouldAutomaticallyCancel` is `true` (the default), cancelling the enclosing async task automatically triggers `cancel()` on the underlying `DataRequest` and task wrapper.
> 
> Sources: [Source/Features/Concurrency.swift:119-128](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L119-L128), [Source/Features/Concurrency.swift:352-360](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L352-L360)

### Serializer Methods Reference

`DataRequest` extensions expose several specialized serialization helper methods tailored for different payload types:

| Method Signature | Default Preprocessor / Decoder / Encoding | Default Empty Response Codes | Default Empty Request Methods | Serialized Output Type (`Value`) |
| ---------------- | ----------------------------------------- | ---------------------------- | ----------------------------- | -------------------------------- |
| `serializingData(automaticallyCancelling:dataPreprocessor:emptyResponseCodes:emptyRequestMethods:)` | `DataResponseSerializer.defaultDataPreprocessor` | `[204, 205]` | `[.head]` | `Data` |
| `serializingDecodable(_:automaticallyCancelling:dataPreprocessor:decoder:emptyResponseCodes:emptyRequestMethods:)` | `DecodableResponseSerializer<Value>.defaultDataPreprocessor` / `JSONDecoder()` | `[204, 205]` | `[.head]` | `Value` (`Decodable`) |
| `serializingString(automaticallyCancelling:dataPreprocessor:encoding:emptyResponseCodes:emptyRequestMethods:)` | `StringResponseSerializer.defaultDataPreprocessor` / `nil` | `[204, 205]` | `[.head]` | `String` |
| `serializingResponse(using:automaticallyCancelling:)` | N/A (Custom `ResponseSerializer` or `DataResponseSerializerProtocol`) | Defined by Serializer | Defined by Serializer | `Serializer.SerializedObject` |

Sources: [Source/Features/Concurrency.swift:245-346](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L245-L346)

### Design Trade-Offs in Async Bridging

| Design Choice | Benefit | Cost |
| -------------- | ------- | ---- |
| Wrapping `withCheckedContinuation` inside a dedicated `Task` | Preserves async syntax while seamlessly bridging closure-based `DataRequest` APIs. | Allocates an extra managed `Task` wrapper instance per awaited request. |
| Automatic cancellation binding (`shouldAutomaticallyCancel: true`) | Prevents leaked background requests when enclosing tasks or task groups are cancelled. | Requires explicit opt-out (`automaticallyCancelling: false`) if a request must persist past parent task cancellation. |
| Computed properties (`response`, `result`, `value`) on `DataTask` | Offers clean, idiomatic access to raw responses, result enums, or thrown values. | Each property getter evaluates or awaits task execution, requiring caution against redundant re-awaiting. |

Sources: [Source/Features/Concurrency.swift:117-141](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L117-L141), [Source/Features/Concurrency.swift:348-366](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L348-L366)

### Worked Example

The following example demonstrates issuing a network request with automatic decodable serialization and awaiting its parsed value inside an asynchronous function:

```swift
func fetchUserProfile() async throws -> TestResponse {
    let session = Session()
    
    // Create a DataTask parsing Decodable model TestResponse
    let task = session.request("https://httpbin.org/json")
        .serializingDecodable(TestResponse.self, automaticallyCancelling: true)
    
    // Await the parsed value, throwing any underlying AFError
    let value = try await task.value
    return value
}
```

Sources: [Source/Features/Concurrency.swift:136-141](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L136-L141), [Source/Features/Concurrency.swift:269-280](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L269-L280), [Tests/ConcurrencyTests.swift:88-94](https://github.com/Alamofire/Alamofire/blob/main/Tests/ConcurrencyTests.swift#L88-L94)

## DataStreamRequest AsyncSequence Streaming

### Overview

Alamofire integrates Swift's `AsyncSequence` protocol with `DataStreamRequest` through `DataStreamTask` and the `StreamOf` structure. This enables developers to consume streaming network payloads incrementally using modern `for await` loops without accumulating chunks into memory or disk.

Sources: [Source/Features/Concurrency.swift:583-656](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L583-L656), [Source/Features/Concurrency.swift:913-966](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L913-L966)

### DataStreamTask and Streaming Methods

`DataStreamTask` wraps a `DataStreamRequest` and exposes specialized factories to yield chunks as `Data`, UTF-8 strings, generic `Decodable` models, or custom serialized objects via `DataStreamSerializer`.

| Method Signature | Default Buffering Policy | Serialized Success Type (`Success`) | Failure Error Type (`Failure`) | Underlying Stream Handler |
| ---------------- | ------------------------ | ----------------------------------- | ------------------------------ | ------------------------- |
| `streamingData(automaticallyCancelling:bufferingPolicy:)` | `.unbounded` | `Data` | `Never` | `request.responseStream(on:stream:)` |
| `streamingStrings(automaticallyCancelling:bufferingPolicy:)` | `.unbounded` | `String` | `Never` | `request.responseStreamString(on:stream:)` |
| `streamingDecodables(_:automaticallyCancelling:bufferingPolicy:)` | `.unbounded` | `T` (`Decodable & Sendable`) | `AFError` | `streamingResponses(serializedUsing:)` with `DecodableStreamSerializer` |
| `streamingResponses(serializedUsing:automaticallyCancelling:bufferingPolicy:)` | `.unbounded` | `Serializer.SerializedObject` | `AFError` | `request.responseStream(using:on:stream:)` |

Sources: [Source/Features/Concurrency.swift:601-656](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L601-L656)

### Call-Chain Execution Walkthrough

When consuming a stream via `DataStreamTask`, execution proceeds through a distinct series of bridging steps:

1. **`streamTask()`**: Called on a `DataStreamRequest` to instantiate the helper structure: `DataStreamRequest.streamTask()` → initializes `DataStreamTask(request: self)`.
Sources: [Source/Features/Concurrency.swift:759-762](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L759-L762)
2. **Streaming Invocation**: Calling an operation such as `streamingData()` invokes `DataStreamTask.createStream(automaticallyCancelling:bufferingPolicy:forResponse:)`.
Sources: [Source/Features/Concurrency.swift:601-604](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L601-L604)
3. **StreamOf Initialization**: `createStream` constructs a `StreamOf<DataStreamRequest.Stream<Success, Failure>>`, supplying an `onTermination` cancellation closure and a `builder` closure.
Sources: [Source/Features/Concurrency.swift:658-675](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L658-L675)
4. **Queue Dispatch**: Inside the builder, `onResponse` registers with the underlying request on a dedicated stream completion queue: `DispatchQueue.streamCompletionQueue(forRequestID:)` targeting `DispatchQueue.singleEventQueue`.
Sources: [Source/Features/Concurrency.swift:667-673](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L667-L673), [Source/Features/Concurrency.swift:898-905](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L898-L905)
5. **Yielding and Completion**: As data chunks arrive, `continuation.yield(stream)` pushes items to the asynchronous sequence. If `case .complete = stream.event` is matched, `continuation.finish()` terminates the sequence.
Sources: [Source/Features/Concurrency.swift:668-673](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L668-L673)

Sources: [Source/Features/Concurrency.swift:601-675](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L601-L675), [Source/Features/Concurrency.swift:759-762](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L759-L762), [Source/Features/Concurrency.swift:898-905](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L898-L905)

### Design Trade-Offs in Streaming Concurrency

| Design Choice | Benefit | Cost |
| -------------- | ------- | ---- |
| Wrapping `AsyncStream` inside `StreamOf` | Conforms natively to `AsyncSequence` while managing token deinit and task termination hooks. | Adds an abstraction layer over standard library primitives. |
| Dedicated `streamCompletionQueue` per request ID | Isolates concurrent stream deliveries onto predictable target queues. | Creates dynamic dispatch queues for every active stream task. |
| Automatic cancellation on task exit (`shouldAutomaticallyCancel: true`) | Prevents orphaned streams from consuming bandwidth when iteration breaks or cancels. | Requires setting `automaticallyCancelling: false` if iteration needs to be paused and resumed across multiple loops. |

Sources: [Source/Features/Concurrency.swift:658-675](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L658-L675), [Source/Features/Concurrency.swift:898-905](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L898-L905), [Source/Features/Concurrency.swift:913-966](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L913-L966), [Tests/ConcurrencyTests.swift:669-697](https://github.com/Alamofire/Alamofire/blob/main/Tests/ConcurrencyTests.swift#L669-L697)

> [!WARNING]
> `StreamOf` (like standard `AsyncStream`) does not support multiple iteration. Attempting to iterate over the same `StreamOf` instance multiple times can lead to lost values or runtime misbehavior.

Sources: [Source/Features/Concurrency.swift:907-912](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L907-L912)

### Worked Example

The following example demonstrates streaming chunked data bytes from a `DataStreamRequest` using `DataStreamTask` and a `for await` loop:

```swift
func streamPayloads() async {
    let session = Session()
    
    // Create a DataStreamTask from a stream request
    let task = session.streamRequest(.payloads(5)).streamTask()
    
    // Iterate over incoming chunks as Data values
    for await data in task.streamingData().compactMap(\.value) {
        print("Received chunk of size: \(data.count)")
    }
}
```

Sources: [Source/Features/Concurrency.swift:601-605](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L601-L605), [Source/Features/Concurrency.swift:759-762](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L759-L762), [Tests/ConcurrencyTests.swift:463-477](https://github.com/Alamofire/Alamofire/blob/main/Tests/ConcurrencyTests.swift#L463-L477)

## DownloadRequest Async File Handling

### Overview

Alamofire's Swift Concurrency integration for file downloads bridges traditional `DownloadRequest` completion handlers with modern `async`/`await` primitives through the `DownloadTask<Value>` wrapper. This abstraction mirrors `DataTask` while accommodating disk-based operations, providing properties such as `response`, `result`, and `value`. Download requests offload incoming file data directly to disk storage rather than accumulating payloads in memory.

Sources: [Source/Features/Concurrency.swift:371-409](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L371-L409), [Source/Features/Concurrency.swift:479-490](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L479-L490)

### Download Task Serializers

`DownloadRequest` extends Swift Concurrency support by exposing several dedicated serialization functions that return a `DownloadTask`. Developers can await raw data, decodable models, strings, or the final disk file location `URL`.

| Method | Return Type | Description |
| ------ | ----------- | ----------- |
| `serializingData(...)` | `DownloadTask<Data>` | Serializes download output into an in-memory `Data` container using `DataResponseSerializer`. |
| `serializingDecodable(_:...)` | `DownloadTask<Value>` | Decodes a `Decodable` model from downloaded data using a `DataDecoder`. |
| `serializingDownloadedFileURL(...)` | `DownloadTask<URL>` | Awaits the file system `URL` of the downloaded file using `URLResponseSerializer`. |
| `serializingString(...)` | `DownloadTask<String>` | Serializes download output into a `String` using `StringResponseSerializer`. |
| `serializingDownload(using:...)` | `DownloadTask<Serializer.SerializedObject>` | Uses a custom `ResponseSerializer` or `DownloadResponseSerializerProtocol` instance. |

Sources: [Source/Features/Concurrency.swift:440-557](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L440-L557)

### Progress Streams and Cancellation Propagation

In addition to task-based serialization, active download operations support real-time progress observation through `StreamOfrogress>` asynchronous sequences. By calling `downloadProgress(bufferingPolicy:)` on any `Request` instance, consumers receive yielded `Progress` updates dispatched via the request's `underlyingQueue`. 

```swift
public func downloadProgress(bufferingPolicy: StreamOf<Progress>.BufferingPolicy = .unbounded) -> StreamOf<Progress> {
    stream(bufferingPolicy: bufferingPolicy) { [unowned self] continuation in
        downloadProgress(queue: underlyingQueue) { progress in
            continuation.yield(progress)
        }
    }
}
```

Sources: [Source/Features/Concurrency.swift:51-57](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L51-L57), [Source/Features/Concurrency.swift:98-108](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L98-L108)

> [!NOTE]
> When `automaticallyCancelling` is set to `true` (the default), `DownloadTask` automatically propagates cancellation signals from the enclosing Swift task context down to the underlying `DownloadRequest`.

Sources: [Source/Features/Concurrency.swift:377-386](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L377-L386), [Source/Features/Concurrency.swift:432-434](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L432-L434)

### Worked Example

The following example demonstrates initiating a file download task, serializing its result to a local file destination `URL`, and consuming progress updates concurrently:

```swift
func downloadFileExample() async throws {
    let session = Session()
    let request = session.download(.get)
    
    // Create an asynchronous download progress stream
    let progressStream = request.downloadProgress()
    
    // Create a DownloadTask awaiting the local disk file URL
    let downloadTask = request.serializingDownloadedFileURL()
    
    // Monitor progress updates in parallel
    let progressTask = Task {
        for await progress in progressStream {
            print("Download progress: \(progress.fractionCompleted * 100)%")
        }
    }
    
    // Await the final destination file URL
    let destinationURL = try await downloadTask.value
    print("File successfully downloaded to: \(destinationURL)")
    
    progressTask.cancel()
}
```

Sources: [Source/Features/Concurrency.swift:51-57](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L51-L57), [Source/Features/Concurrency.swift:395-399](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L395-L399), [Source/Features/Concurrency.swift:487-490](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L487-L490), [Tests/ConcurrencyTests.swift:311-319](https://github.com/Alamofire/Alamofire/blob/main/Tests/ConcurrencyTests.swift#L311-L319)

## WebSocket Task Streaming Integration

### Overview

Alamofire provides native Swift Concurrency integration for WebSocket requests via the `WebSocketTask` structure and `StreamOf` asynchronous sequences. Available exclusively on Apple platforms supporting `URLSessionWebSocketTask`, `WebSocketTask` exposes streaming methods for raw message events, extracted text or binary messages, and decodable model events. These methods bridge incoming WebSocket events to asynchronous sequences using dedicated request queues.

Sources: [Source/Features/Concurrency.swift:764-776](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L764-L776)

### Streaming Methods and Event Handling

The `WebSocketTask` type defines four primary streaming methods, each accepting an optional `automaticallyCancelling` boolean parameter and a `BufferingPolicy` (defaulting to `.unbounded`). Behind the scenes, these methods invoke `createStream`, transforming underlying `WebSocketRequest.Event` values into `StreamOf` sequences.

| Streaming Method | Return Type | Transformation Applied |
| ---------------- | ----------- | ---------------------- |
| `streamingMessageEvents(...)` | `EventStreamOf<URLSessionWebSocketTask.Message, Never>` | Yields full event payloads (`$0`). |
| `streamingMessages(...)` | `StreamOf<URLSessionWebSocketTask.Message>` | Extracts the underlying message property (`$0.message`). |
| `streamingDecodableEvents(...)` | `EventStreamOf<Value, any Error>` | Yields decoded event payloads using a `DataDecoder`. |
| `streamingDecodable(...)` | `StreamOf<Value>` | Extracts decoded values from decodable events (`$0.message`). |

Sources: [Source/Features/Concurrency.swift:777-829](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L777-L829)

### Call-Chain Execution Walkthrough

When a consumer iterates over an asynchronous sequence produced by a WebSocket task, execution follows a precise internal call chain:

1. **Task Initialization & Builder Hook:** Calling `streamingMessages()` or another streaming API invokes `WebSocketTask.createStream(automaticallyCancelling:bufferingPolicy:transform:forResponse:)`. This initializes a `StreamOf` instance with an underlying `AsyncStream` and sets up termination and builder closures.
Sources: [Source/Features/Concurrency.swift:788-797](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L788-L797), [Source/Features/Concurrency.swift:831-853](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L831-L853)
2. **Request Event Hook:** The builder closure registers a handler on the underlying request via `request.streamMessageEvents(on:handler:)`, targeting a dedicated request-specific queue (`DispatchQueue.streamCompletionQueue(forRequestID:)` with a target of `DispatchQueue.singleEventQueue`).
Sources: [Source/Features/Concurrency.swift:794-796](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L794-L796), [Source/Features/Concurrency.swift:898-905](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L898-L905)
3. **Event Yielding & Transformation:** As WebSocket messages arrive, `onResponse` receives each `WebSocketRequest.Event`. The closure passes the event through the supplied `transform` closure (e.g., extracting `.message`). If a value is returned, it is pushed into the stream via `continuation.yield(value)`.
Sources: [Source/Features/Concurrency.swift:843-846](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L843-L846)
4. **Completion Check:** The event's kind is inspected using `if case .completed = event.kind`. If matched, `continuation.finish()` is called to terminate the asynchronous sequence.
Sources: [Source/Features/Concurrency.swift:848-851](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L848-L851)

Sources: [Source/Features/Concurrency.swift:777-853](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L777-L853), [Source/Features/Concurrency.swift:898-905](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L898-L905)

> [!WARNING]
> WebSocket message streaming relies on `.streamCompletionQueue(forRequestID:)` tied to a concurrent single event queue. Terminating iteration or dropping the stream triggers automatic cancellation only when `automaticallyCancelling` is `true` and the request is in an active state (`.initialized`, `.resumed`, or `.suspended`).

Sources: [Source/Features/Concurrency.swift:784-786](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L784-L786), [Source/Features/Concurrency.swift:838-841](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L838-L841), [Source/Features/Concurrency.swift:898-905](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L898-L905)

### Sending Messages and Closing Connections

In addition to receiving asynchronous message streams, `WebSocketTask` supports asynchronous message transmission and connection termination via direct instance methods.

```swift
public func send(_ message: URLSessionWebSocketTask.Message) async throws {
    try await withCheckedThrowingContinuation { continuation in
        request.send(message, queue: .streamCompletionQueue(forRequestID: request.id)) { result in
            continuation.resume(with: result)
        }
    }
}

public func close(sending closeCode: URLSessionWebSocketTask.CloseCode, reason: Data? = nil) {
    request.close(sending: closeCode, reason: reason)
}
```

Sources: [Source/Features/Concurrency.swift:859-870](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L859-L870)

## Task Cancellation and Lifecycle Controls

### Overview

Alamofire's Swift concurrency integration bridges asynchronous tasks and reactive streams with the Swift concurrency runtime through explicit task cancellation controls and automatic cancellation propagation. When executing `DataTask`, `DownloadTask`, or `DataStreamTask`, tasks interact with the enclosing task context using Swift's `withTaskCancellationHandler` primitives. This ensures that cancelling a parent `Task` or exiting an active `async let` scope automatically propagates down to abort underlying Alamofire requests, preventing orphaned network operations.

Sources: [Source/Features/Concurrency.swift:119-124](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L119-L124), [Source/Features/Concurrency.swift:352-360](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L352-L360), [Source/Features/Concurrency.swift:563-571](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L563-L571)

### Explicit and Implicit Cancellation Propagation

Each concurrency task wrapper exposes an explicit `cancel()` method alongside automatic cancellation flags configured via the `automaticallyCancelling` parameter (set to `true` by default). For example, `serializingData`, `serializingDecodable`, `serializingString`, and custom response serializers on both `DataRequest` and `DownloadRequest` accept an `automaticallyCancelling` boolean flag that controls whether the underlying network request aborts when the enclosing async context is cancelled.

Sources: [Source/Features/Concurrency.swift:237-239](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L237-L239), [Source/Features/Concurrency.swift:270](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L270), [Source/Features/Concurrency.swift:285-287](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L285-L287), [Source/Features/Concurrency.swift:319](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L319), [Source/Features/Concurrency.swift:432-434](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L432-L434), [Source/Features/Concurrency.swift:456-458](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L456-L458), [Source/Features/Concurrency.swift:482-484](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L482-L484), [Source/Features/Concurrency.swift:495-497](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L495-L497), [Source/Features/Concurrency.swift:529](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L529), [Source/Features/Concurrency.swift:545-547](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L545-L547)

```swift
let task = Task {
    await request.serializingDecodable(TestResponse.self, automaticallyCancelling: true).result
}
task.cancel()
let result = await task.value
```

Sources: [Tests/ConcurrencyTests.swift:178-184](https://github.com/Alamofire/Alamofire/blob/main/Tests/ConcurrencyTests.swift#L178-L184)

> [!NOTE]
> If `automaticallyCancelling` is explicitly set to `false`, cancelling the enclosing `Task` or task group will cancel the Swift task container but will leave the underlying `DataRequest` or `DownloadRequest` running until completion.

Sources: [Source/Features/Concurrency.swift:237-239](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L237-L239), [Tests/ConcurrencyTests.swift:198-209](https://github.com/Alamofire/Alamofire/blob/main/Tests/ConcurrencyTests.swift#L198-L209)

### Automatic Stream Cancellation Controls

For streaming workloads like `DataStreamTask` and `WebSocketTask`, stream termination behavior is governed by the `shouldAutomaticallyCancel` parameter. When observation of the stream stops—either via explicit cancellation, breaking out of an `for await` loop, or cancelling the parent task—Alamofire checks request states before executing cleanup.

Sources: [Source/Features/Concurrency.swift:596-597](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L596-L597), [Source/Features/Concurrency.swift:663-666](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L663-L666), [Source/Features/Concurrency.swift:838-841](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L838-L841)

| Stream Lifecycle Check | Trigger Condition | Resulting Action |
| ---------------------- | ----------------- | ---------------- |
| `shouldAutomaticallyCancel` | Evaluated as `true` on stream termination | Verifies request state before aborting |
| `request.isInitialized` | Request has been created but not resumed | Triggers `cancel()` on the request |
| `request.isResumed` | Request is actively executing over the network | Triggers `cancel()` on the request |
| `request.isSuspended` | Request execution is temporarily suspended | Triggers `cancel()` on the request |

Sources: [Source/Features/Concurrency.swift:663-666](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L663-L666), [Source/Features/Concurrency.swift:838-841](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L838-L841)

> [!WARNING]
> Stream iteration cancellation relies on deinit tokens inside `StreamOf.Iterator`. Dropping the stream or breaking out of an active iteration loop immediately triggers the termination handler, which invokes `cancel()` unless automatic cancellation was disabled during stream creation.

Sources: [Source/Features/Concurrency.swift:662-666](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L662-L666), [Source/Features/Concurrency.swift:941-960](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Concurrency.swift#L941-L960)

```swift
let request = session.streamRequest(.payloads(10))
let task = request.streamTask()
var datas: [Data] = []

for await data in task.streamingData().compactMap(\.value) {
    datas.append(data)
    break // Triggers stream deinit cancellation, cancelling the underlying request.
}

XCTAssertTrue(request.isCancelled)
```

Sources: [Tests/ConcurrencyTests.swift:628-642](https://github.com/Alamofire/Alamofire/blob/main/Tests/ConcurrencyTests.swift#L628-L642)

## Related

- [[Session And Requests]]
- [[Combine Framework Integration]]

