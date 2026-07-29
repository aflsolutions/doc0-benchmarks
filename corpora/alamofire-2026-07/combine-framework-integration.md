# Combine Framework Integration

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [Source/Features/Combine.swift](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Combine.swift)
- [Tests/CombineTests.swift](https://github.com/Alamofire/Alamofire/blob/main/Tests/CombineTests.swift)
- [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Structs.html](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Structs.html)
- [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Structs/DataResponsePublisher.html](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Structs/DataResponsePublisher.html)
</details>

## Overview

Alamofire provides native integration with the Combine framework, enabling developers to harness reactive programming patterns for network requests and data streams. By wrapping standard network operations into lazy, demand-driven publishers such as `DataResponsePublisher`, `DownloadResponsePublisher`, and `DataStreamPublisher`, the integration bridges Alamofire's robust request lifecycle management with Combine's powerful operator ecosystem. These publishers handle automatic and manual request cancellation, thread dispatching across dispatch queues, and seamless response serialization—including JSON decoding, string parsing, and raw data handling—while maintaining memory safety and clean subscription lifecycles. Sources: [Source/Features/Combine.swift:33-121](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Combine.swift#L33-L121), [Source/Features/Combine.swift:258-343](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Combine.swift#L258-L343), [Source/Features/Combine.swift:401-490](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Combine.swift#L401-L490)

## Combine Integration Public API Surface

### Combine Integration Public API Surface

The public API surface for Alamofire's Combine integration is defined by a set of specialized `Publisher` structs and protocol extensions on Alamofire's core request types. These components are available when compiling for macOS 10.15, iOS 13, watchOS 6, tvOS 13, and higher, excluding non-supported target environments such as Windows, Linux, Android, or FreeBSD. Sources: [Source/Features/Combine.swift:25-34](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Combine.swift#L25-L34), [Source/Features/Combine.swift:257-258](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Combine.swift#L257-L258), [Source/Features/Combine.swift:401-402](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Combine.swift#L401-L402)

The primary structures exposed by the API include `DataResponsePublisher`, `DataStreamPublisher`, and `DownloadResponsePublisher`. Each publisher conforms to the Combine `Publisher` protocol, with a `Failure` type explicitly set to `Never` because all network errors are encapsulated within Alamofire's response result types (`DataResponse`, `DownloadResponse`, or `DataStreamRequest.Stream`). Sources: [Source/Features/Combine.swift:35-37](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Combine.swift#L35-L37), [Source/Features/Combine.swift:258-260](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Combine.swift#L258-L260), [Source/Features/Combine.swift:403-405](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Combine.swift#L403-L405)

| Publisher Struct | Associated Request Type | Output Type | Failure Type |
| :--- | :--- | :--- | :--- |
| `DataResponsePublisher` | `DataRequest`, `UploadRequest` | `DataResponse<Value, AFError>` | `Never` |
| `DataStreamPublisher` | `DataStreamRequest` | `DataStreamRequest.Stream<Value, AFError>` | `Never` |
| `DownloadResponsePublisher` | `DownloadRequest` | `DownloadResponse<Value, AFError>` | `Never` |

Sources: [Source/Features/Combine.swift:33-40](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Combine.swift#L33-L40), [Source/Features/Combine.swift:256-263](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Combine.swift#L256-L263), [Source/Features/Combine.swift:401-408](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Combine.swift#L401-L408)

> [!NOTE]
> Setting `Failure` to `Never` means operators like `catch` or `assertNoFailure` are unnecessary for handling transport or decoding errors. Downstream subscribers inspect the encapsulated `AFError` within the `Result` property of the `DataResponse`, `DownloadResponse`, or `Stream` event. Sources: [Source/Features/Combine.swift:35-37](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Combine.swift#L35-L37), [Source/Features/Combine.swift:258-260](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Combine.swift#L258-L260), [Source/Features/Combine.swift:403-405](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Combine.swift#L403-L405)

### Public API Design Trade-Offs

| Design Choice | Benefit | Cost |
| :--- | :--- | :--- |
| `Failure == Never` publisher typing | Simplifies operator chaining by preventing accidental type mismatches with upstream network failures. | Forces consumers to unwrap `Result` or use helper operators like `.value()` to extract errors. |
| Lazy subscription execution via `Inner` subscription | Requests are not dispatched onto the network until demand is requested by a downstream subscriber. | Requires careful management of demand (`assert(demand > 0)`) to trigger request resumption correctly. |
| Dedicated helper methods (`.result()`, `.value()`) | Provides immediate ergonomic shortcuts for mapping responses to raw results or throwing publishers. | Adds specialized extension methods that mirror standard Combine publisher mapping patterns. |

Sources: [Source/Features/Combine.swift:35-82](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Combine.swift#L35-L82), [Source/Features/Combine.swift:104-114](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Combine.swift#L104-L114), [Source/Features/Combine.swift:258-302](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Combine.swift#L258-302), [Source/Features/Combine.swift:403-451](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Combine.swift#L403-L451)

## DataResponsePublisher Design and Initialization

### Structure and Properties

`DataResponsePublisher` is a generic struct conforming to Combine's `Publisher` protocol, where the associated `Output` type is `DataResponse<Value, AFError>` and the `Failure` type is fixed to `Never`. The generic parameter `Value` must satisfy the `Sendable` protocol to ensure thread safety across dispatch queues. Internally, the structure retains a reference to a `DataRequest` and a private closure type alias named `Handler`, which wraps the execution of response serialization and completion handling. Sources: [Source/Features/Combine.swift:35-43](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Combine.swift#L35-L43)

```swift
public struct DataResponsePublisher<Value: Sendable>: Publisher {
    public typealias Output = DataResponse<Value, AFError>
    public typealias Failure = Never

    private typealias Handler = (@escaping @Sendable (_ response: DataResponse<Value, AFError>) -> Void) -> DataRequest

    private let request: DataRequest
    private let responseHandler: Handler
...
```
Sources: [Source/Features/Combine.swift:35-43](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Combine.swift#L35-L43)

### Initialization Logic

The publisher provides designated initializers depending on whether the response is processed via a conforming `ResponseSerializer`, a `DataResponseSerializerProtocol`, or left unserialized for optional raw `Data?` payloads. Each initializer configures the `responseHandler` closure by binding the provided `DispatchQueue` and serializer to the underlying `DataRequest`. Sources: [Source/Features/Combine.swift:50-68](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Combine.swift#L50-L68), [Source/Features/Combine.swift:124-131](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Combine.swift#L124-L131)

| Initializer Signature | Constraint / Requirements | Purpose |
| :--- | :--- | :--- |
| `init(_:queue:serializer:)` | `Serializer: ResponseSerializer`, `Value == Serializer.SerializedObject` | Serializes responses using generic types conforming to `ResponseSerializer`. |
| `init(_:queue:serializer:)` | `Serializer: DataResponseSerializerProtocol`, `Value == Serializer.SerializedObject` | Serializes responses using types conforming to `DataResponseSerializerProtocol`. |
| `init(_:queue:)` (Extension) | `Value == Data?` | Publishes raw `Data?` responses without performing any serialization. |

Sources: [Source/Features/Combine.swift:50-54](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Combine.swift#L50-L54), [Source/Features/Combine.swift:62-68](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Combine.swift#L62-L68), [Source/Features/Combine.swift:124-131](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Combine.swift#L124-L131)

### Subscription and Execution Flow

When a downstream subscriber attaches to the `DataResponsePublisher`, the `receive(subscriber:)` method instantiates and returns an `Inner` subscription object. Execution follows a strict call chain upon demand generation:

1. Downstream demand triggers `Inner.request(_:)`, asserting that `demand > 0`. Sources: [Source/Features/Combine.swift:104-105](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Combine.swift#L104-L105)
2. The `Protected<Downstream?>` wrapper reads and clears the downstream reference to enforce single-emission semantics. Sources: [Source/Features/Combine.swift:107-109](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Combine.swift#L107-L109)
3. The stored `responseHandler` executes on the designated `DispatchQueue`, invoking the network task via `.resume()`. Sources: [Source/Features/Combine.swift:110-113](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Combine.swift#L110-L113)
4. Upon completion, the response is delivered via `downstream.receive(response)`, immediately followed by `.finished`. Sources: [Source/Features/Combine.swift:111-112](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Combine.swift#L111-L112)

> [!WARNING]
> Cancelling the `Inner` subscription invokes `request.cancel()` directly on the underlying `DataRequest` and nullifies the downstream reference inside the thread-safe `Protected` wrapper, preventing any further events from being dispatched. Sources: [Source/Features/Combine.swift:116-119](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Combine.swift#L116-L119)

## DataStreamPublisher for Stream Handling

### Overview

The `DataStreamPublisher` structure implements the Combine `Publisher` protocol to deliver continuous streams of `DataStreamRequest.Stream<Value, AFError>` objects produced by a `DataStreamRequest`. The publisher declares `Output` as `DataStreamRequest.Stream<Value, AFError>` and fixes `Failure` to `Never`, shifting error handling and event management into the stream result type. Sources: [Source/Features/Combine.swift:256-260](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Combine.swift#L256-L260)

```swift
public struct DataStreamPublisher<Value: Sendable>: Publisher {
    public typealias Output = DataStreamRequest.Stream<Value, AFError>
    public typealias Failure = Never

    private typealias Handler = (@escaping DataStreamRequest.Handler<Value, AFError>) -> DataStreamRequest

    private let request: DataStreamRequest
    private let streamHandler: Handler
...
```
Sources: [Source/Features/Combine.swift:258-265](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Combine.swift#L258-L265)

### Initialization and Transformation Operators

Initializers bind a `DataStreamSerializer` to the request, configuring the underlying streaming handler with a target `DispatchQueue`. Additionally, `DataStreamPublisher` exposes helper operators to extract individual results or values from the stream sequence. Sources: [Source/Features/Combine.swift:267-302](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Combine.swift#L267-L302)

| Operator / Initializer | Signature / Requirement | Description |
| :--- | :--- | :--- |
| `init(_:queue:serializer:)` | `Serializer: DataStreamSerializer`, `Value == Serializer.SerializedObject` | Configures the publisher using a specific stream serializer and dispatch queue. |
| `result()` | `AnyPublisher<Result<Value, AFError>, Never>` | Compact maps stream events into `.stream(result)` values or converts completion errors into `.failure` results. |
| `value()` | `AnyPublisher<Value, AFError>` | Flattens the `result()` publisher into a sequence of successful `Value` items or fails with `AFError`. |

Sources: [Source/Features/Combine.swift:274-278](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Combine.swift#L274-L278), [Source/Features/Combine.swift:283-294](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Combine.swift#L283-L294), [Source/Features/Combine.swift:300-302](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Combine.swift#L300-L302)

### Subscription Life Cycle and Stream Execution

When a subscriber attaches to `DataStreamPublisher`, subscription handling is managed by a private final `Inner` class conforming to `Subscription`. The event delivery follows an explicit execution flow:

1. Downstream demand triggers `Inner.request(_:)`, asserting that `demand > 0`. Sources: [Source/Features/Combine.swift:324-325](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Combine.swift#L324-L325)
2. The `Protected<Downstream?>` wrapper reads the downstream subscriber and nullifies its stored reference to secure single-subscription access. Sources: [Source/Features/Combine.swift:327-329](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Combine.swift#L327-L329)
3. The `streamHandler` closure executes, passing a closure that forwards each received `stream` element to `downstream.receive(stream)`. Sources: [Source/Features/Combine.swift:330-331](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Combine.swift#L330-L331)
4. When `stream.event` matches a `.complete` case, `downstream.receive(completion: .finished)` is invoked to terminate the Combine subscription. Sources: [Source/Features/Combine.swift:332-334](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Combine.swift#L332-L334)
5. Finally, `.resume()` is called on the resulting `DataStreamRequest` to kick off network operations. Sources: [Source/Features/Combine.swift:335|335](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Combine.swift#L335-L335)

> [!WARNING]
> Unlike single-response publishers that complete after one emission, `DataStreamPublisher` remains active across multiple data chunks until a explicit `.complete` event triggers completion, at which point `.finished` is sent downstream. Sources: [Source/Features/Combine.swift:332-334](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Combine.swift#L332-L334)

## Request Extensions and Publisher Delivery

### Overview

Alamofire provides rich protocol extensions on `DataRequest`, `DownloadRequest`, and `DataStreamRequest` that simplify creating Combine publishers directly from active or unstarted requests. Sources: [Source/Features/Combine.swift:133-145](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Combine.swift#L133-L145)

### DataRequest Publisher Factories

Extensions on `DataRequest` generate `DataResponsePublisher` instances configured for in-memory payloads or custom serialization types. The default publishing queue is `.main` across all factory methods. Sources: [Source/Features/Combine.swift:133-254](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Combine.swift#L133-L254)

| Method Signature | Default Parameters | Serializer / Purpose |
| :--- | :--- | :--- |
| `publishResponse(using:on:)` | `queue: .main` | Generic `ResponseSerializer` mapping to `DataResponsePublisher<T>`. |
| `publishData(queue:preprocessor:emptyResponseCodes:emptyRequestMethods:)` | `queue: .main`, `preprocessor: DataResponseSerializer.defaultDataPreprocessor`, `emptyResponseCodes: [204, 205]`, `emptyRequestMethods: [.head]` | Uses `DataResponseSerializer` to publish raw `Data`. |
| `publishString(queue:preprocessor:encoding:emptyResponseCodes:emptyRequestMethods:)` | `queue: .main`, `preprocessor: StringResponseSerializer.defaultDataPreprocessor`, `encoding: nil`, `emptyResponseCodes: [204, 205]`, `emptyRequestMethods: [.head]` | Uses `StringResponseSerializer` to publish `String`. |
| `publishDecodable(type:queue:preprocessor:decoder:emptyResponseCodes:emptyRequestMethods:)` | `type: T.Type = T.self`, `queue: .main`, `preprocessor: DecodableResponseSerializer<T>.defaultDataPreprocessor`, `decoder: JSONDecoder()`, `emptyResponseCodes: [204, 205]`, `emptyRequestMethods: [.head]` | Uses `DecodableResponseSerializer` to decode `Decodable` models. |
| `publishUnserialized(queue:)` | `queue: .main` | Publishes raw `Data?` values without executing a response serializer. |

Sources: [Source/Features/Combine.swift:141-144](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Combine.swift#L141-L144), [Source/Features/Combine.swift:160-163](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Combine.swift#L160-L163), [Source/Features/Combine.swift:187-191](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Combine.swift#L187-L191), [Source/Features/Combine.swift:232-237](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Combine.swift#L232-L237), [Source/Features/Combine.swift:251-251](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Combine.swift#L251-L251)

### DownloadRequest and DataStreamRequest Extensions

`DownloadRequest` extensions produce `DownloadResponsePublisher` instances tailored for disk-backed file downloads, supporting `URLResponseSerializer`, `DataResponseSerializer`, `StringResponseSerializer`, `DecodableResponseSerializer`, and unserialized `URL?` publishing. Sources: [Source/Features/Combine.swift:492-650](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Combine.swift#L492-L650)

Similarly, `DataStreamRequest` extensions construct `DataStreamPublisher` instances via `publishStream(using:on:)`, `publishData(queue:)`, `publishString(queue:)`, and `publishDecodable(type:queue:decoder:preprocessor:)`. Sources: [Source/Features/Combine.swift:345-399](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Combine.swift#L345-L399)

> [!NOTE]
> Request extension methods do not start network execution immediately upon invocation; instead, they wrap the request into a lazy Combine publisher. Transmission begins only when demand is requested by an active downstream subscriber triggering the underlying subscription handler. Sources: [Source/Features/Combine.swift:104-113](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Combine.swift#L104-L113), [Source/Features/Combine.swift:324-335](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Combine.swift#L324-L335), [Source/Features/Combine.swift:473-482](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/Combine.swift#L473-L482)

## Publisher Test Coverage and Verification

### Overview

Alamofire's Combine integration is thoroughly validated through unit test suites covering `DataRequestCombineTests`, `DataStreamRequestCombineTests`, and `DownloadRequestCombineTests` inside `Tests/CombineTests.swift`. Sources: [Tests/CombineTests.swift:32-32](https://github.com/Alamofire/Alamofire/blob/main/Tests/CombineTests.swift#L32-L32), [Tests/CombineTests.swift:508-508](https://github.com/Alamofire/Alamofire/blob/main/Tests/CombineTests.swift#L508-L508), [Tests/CombineTests.swift:1034-1034](https://github.com/Alamofire/Alamofire/blob/main/Tests/CombineTests.swift#L1034-L1034)

### Lifecycle Cleanup Management

These tests subclass `CombineTestCase`, which manages lifecycle cleanup by maintaining a private `storage` set of `AnyCancellable` instances that are cleared out during `tearDown()`. Sources: [Tests/CombineTests.swift:1506-1513](https://github.com/Alamofire/Alamofire/blob/main/Tests/CombineTests.swift#L1506-L1513)

### Lifecycle and Subscription Verification

A key behavioral guarantee tested across request types is lazy execution: published requests remain in an `.initialized` state until a downstream subscriber attaches via `.sink()`. The test `testThatPublishedDataRequestIsNotResumedUnlessSubscribed` verifies this transition explicitly: Sources: [Tests/CombineTests.swift:256-282](https://github.com/Alamofire/Alamofire/blob/main/Tests/CombineTests.swift#L256-L282)

```swift
let request = session.request(.default)
let publisher = request.publishDecodable(type: TestResponse.self)

let stateAfterPublisher = request.state // .initialized

store {
    publisher.sink(receiveCompletion: { _ in completionReceived.fulfill() },
                   receiveValue: { response = $0; responseReceived.fulfill() })
}

let stateAfterSubscription = request.state // Not .initialized (resumed)
Sources: [Tests/CombineTests.swift:264-281](https://github.com/Alamofire/Alamofire/blob/main/Tests/CombineTests.swift#L264-L281)
```

> [!NOTE]
> `CombineTestCase` provides a helper method `store(_ toStore: () -> AnyCancellable)` that inserts the resulting subscription token into the test case's `storage` set, ensuring proper lifecycle retention for the duration of the asynchronous expectation wait. Sources: [Tests/CombineTests.swift:1515-1517](https://github.com/Alamofire/Alamofire/blob/main/Tests/CombineTests.swift#L1515-L1517)

### Queue Dispatch and Threading Tests

The test suite validates queue configuration by dispatching events across custom threads and serial queues. Sources: [Tests/CombineTests.swift:286-344](https://github.com/Alamofire/Alamofire/blob/main/Tests/CombineTests.swift#L286-L344)

Tests such as `testThatDataRequestCanSubscribedFromNonMainQueueButPublishedOnMainQueue` and `testThatDataRequestPublishedOnSeparateQueueIsReceivedOnThatQueue` confirm that dispatch preconditions and thread checks operate correctly under custom `DispatchQueue` instances. Sources: [Tests/CombineTests.swift:286-344](https://github.com/Alamofire/Alamofire/blob/main/Tests/CombineTests.swift#L286-L344)

| Test Method | Target Behavior | Verification Mechanism |
| :--- | :--- | :--- |
| `testThatDataRequestCanPublishValue` | Extracts successful `.value()` from decodable publisher. | `XCTAssertNotNil(value)` |
| `testThatDataRequestCanPublishValueWithFailure` | Captures timeout errors in publisher completion blocks. | `XCTAssertEqual((error?.underlyingError as? URLError)?.code, .timedOut)` |
| `testThatPublishedDataRequestCanBeCancelledManually` | Cancels underlying request mid-flight. | `XCTAssertTrue(response?.error?.isExplicitlyCancelledError == true)` |
| `testThatMultipleDataRequestPublishersCanBeCombined` | Merges two request publishers via `Publishers.CombineLatest`. | `XCTAssertTrue(firstResponse?.result.isSuccess == true)` |

Sources: [Tests/CombineTests.swift:201-221](https://github.com/Alamofire/Alamofire/blob/main/Tests/CombineTests.swift#L201-L221), [Tests/CombineTests.swift:225-252](https://github.com/Alamofire/Alamofire/blob/main/Tests/CombineTests.swift#L225-L252), [Tests/CombineTests.swift:410-434](https://github.com/Alamofire/Alamofire/blob/main/Tests/CombineTests.swift#L410-L434), [Tests/CombineTests.swift:438-466](https://github.com/Alamofire/Alamofire/blob/main/Tests/CombineTests.swift#L438-L466)

## Related

- [[Swift Concurrency Integration]]
- [[Response Serialization]]

