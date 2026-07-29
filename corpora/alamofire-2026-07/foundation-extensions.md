# Foundation Extensions

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/OperationQueue.html](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/OperationQueue.html)
- [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions.html](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions.html)
- [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/URLSessionConfiguration.html](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/URLSessionConfiguration.html)
- [docs/Extensions/OperationQueue.html](https://github.com/Alamofire/Alamofire/blob/main/docs/Extensions/OperationQueue.html)
- [Source/Core/Protected.swift](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Protected.swift)
- [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/Result.html](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/Result.html)
- [docs/Extensions.html](https://github.com/Alamofire/Alamofire/blob/main/docs/Extensions.html)
</details>

## Overview

Alamofire leverages Swift and Foundation extensions throughout its core architecture to bridge native system types with high-level networking workflows. By extending classes such as `OperationQueue`, `URLSessionConfiguration`, and `Result`, the framework streamlines asynchronous task coordination, HTTP session setup, and response serialization [Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/OperationQueue.html:469-472](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/OperationQueue.html#L469-L472)], [Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/URLSessionConfiguration.html:577-580](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/URLSessionConfiguration.html#L577-L580)], [Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/Result.html:469-472](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/Result.html#L469-L472)]. Concurrently, thread safety is established via primitives like `Protected` and underlying locking mechanisms, ensuring safe concurrent state management across multi-threaded operations [Sources: [Source/Core/Protected.swift:83-97](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Protected.swift#L83-L97)].

## Foundation Extension Architecture Overview

Alamofire extends several Foundation and system types across the framework to streamline networking tasks, parameter conversion, and response decoding. The global extensions index catalogues core protocol conformances and system type augmentations available throughout the library [Sources: [docs/Extensions.html:282-342](https://github.com/Alamofire/Alamofire/blob/main/docs/Extensions.html#L282-L342)].

The framework provides direct protocol conformances and helper APIs on foundational types. For instance, `URLRequest` conforms to `URLRequestConvertible`, while `String`, `URL`, and `URLComponents` conform to `URLConvertible` [Sources: [docs/Extensions.html:642-643](https://github.com/Alamofire/Alamofire/blob/main/docs/Extensions.html#L642-L643)]. Additionally, `JSONDecoder` and `PropertyListDecoder` automatically conform to the `DataDecoder` protocol to unify decoding workflows [Sources: [docs/Extensions.html:849-849](https://github.com/Alamofire/Alamofire/blob/main/docs/Extensions.html#L849-L849)].

| Extended Type | Conformance / Purpose | Sources |
| --- | --- | --- |
| `URLRequest` | Conforms to `URLRequestConvertible` | Sources: [docs/Extensions.html:642-643](https://github.com/Alamofire/Alamofire/blob/main/docs/Extensions.html#L642-L643) |
| `URLSessionConfiguration` | Conforms to `AlamofireExtended` | Sources: [docs/Extensions.html:697-697](https://github.com/Alamofire/Alamofire/blob/main/docs/Extensions.html#L697-L697) |
| `String` | Conforms to `URLConvertible` | Sources: [docs/Extensions.html:755-755](https://github.com/Alamofire/Alamofire/blob/main/docs/Extensions.html#L755-L755) |
| `URL` | Conforms to `URLConvertible` | Sources: [docs/Extensions.html:782-782](https://github.com/Alamofire/Alamofire/blob/main/docs/Extensions.html#L782-L782) |
| `URLComponents` | Conforms to `URLConvertible` | Sources: [docs/Extensions.html:809-809](https://github.com/Alamofire/Alamofire/blob/main/docs/Extensions.html#L809-L809) |
| `JSONDecoder` | Conforms to `DataDecoder` | Sources: [docs/Extensions.html:849-849](https://github.com/Alamofire/Alamofire/blob/main/docs/Extensions.html#L849-L849) |
| `PropertyListDecoder` | Conforms to `DataDecoder` | Sources: [docs/Extensions.html:876-876](https://github.com/Alamofire/Alamofire/blob/main/docs/Extensions.html#L876-L876) |
| `Bundle` | Conforms to `AlamofireExtended` | Sources: [docs/Extensions.html:934-934](https://github.com/Alamofire/Alamofire/blob/main/docs/Extensions.html#L934-L934) |

Sources: [docs/Extensions.html:282-342](https://github.com/Alamofire/Alamofire/blob/main/docs/Extensions.html#L282-L342)

> [!NOTE]
> System types such as `SecTrust`, `SecPolicy`, `SecCertificate`, `OSStatus`, and `SecTrustResultType` are extended to support Alamofire's security and trust evaluation architecture via the `AlamofireExtended` protocol [Sources: [docs/Extensions.html:960-960](https://github.com/Alamofire/Alamofire/blob/main/docs/Extensions.html#L960-L960)].

Sources: [docs/Extensions.html:958-964](https://github.com/Alamofire/Alamofire/blob/main/docs/Extensions.html#L958-L964)

## URLSessionConfiguration Extensions and Defaults

Alamofire extends Foundation's `URLSessionConfiguration` to streamline session setup and bridge native properties with the framework's abstractions. By adopting the `AlamofireExtended` protocol, `URLSessionConfiguration` gains access to convenience properties and helper methods designed for robust HTTP networking configurations [Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/URLSessionConfiguration.html:577-578](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/URLSessionConfiguration.html#L577-L578)].

The extension introduces a computed `headers` property on `URLSessionConfiguration` that seamlessly wraps underlying dictionary types into structured types [Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/URLSessionConfiguration.html:603-603](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/URLSessionConfiguration.html#L603-L603)].

| Property | Type | Get / Set | Purpose | Sources |
| --- | --- | --- | --- | --- |
| `headers` | `HTTPHeaders` | Get, Set | Accesses and mutates `httpAdditionalHeaders` as strongly-typed `HTTPHeaders` | Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/URLSessionConfiguration.html:610-610](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/URLSessionConfiguration.html#L610-L610) |

Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/URLSessionConfiguration.html:593-616](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/URLSessionConfiguration.html#L593-L616)

> [!NOTE]
> Modifying the `headers` property directly updates the underlying `httpAdditionalHeaders` dictionary on the `URLSessionConfiguration` instance, ensuring compatibility with standard `URLSession` mechanics while presenting a clean Swift API [Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/URLSessionConfiguration.html:603-603](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/URLSessionConfiguration.html#L603-L603)].

Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/URLSessionConfiguration.html:603-615](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/URLSessionConfiguration.html#L603-L615)

## OperationQueue and DispatchQueue Helpers

Alamofire extends Foundation's `OperationQueue` to provide streamlined convenience initializers that configure concurrent task execution parameters in a single call. These helpers bridge native queue creation with standard defaults used throughout networking and asynchronous operations [Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/OperationQueue.html:494-496](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/OperationQueue.html#L494-L496)].

The extension on `OperationQueue` introduces a designated convenience initializer designed to customize quality of service, concurrency limits, backing dispatch queues, naming, and initial suspension state without requiring separate property assignments [Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/OperationQueue.html:501-505](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/OperationQueue.html#L501-L505)].

| Parameter | Type | Default Value | Purpose | Sources |
| --- | --- | --- | --- | --- |
| `qualityOfService` | `QualityOfService` | `.default` | Applies the specified QoS class to the operation queue | Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/OperationQueue.html:501-521](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/OperationQueue.html#L501-L521) |
| `maxConcurrentOperationCount` | `Int` | `OperationQueue.defaultMaxConcurrentOperationCount` | Sets the maximum number of queued operations that can execute concurrently | Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/OperationQueue.html:502-534](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/OperationQueue.html#L502-L534) |
| `underlyingQueue` | `DispatchQueue?` | `nil` | Assigns an underlying dispatch queue for scheduling operations | Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/OperationQueue.html:503-546](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/OperationQueue.html#L503-L546) |
| `name` | `String?` | `nil` | Assigns a identifying string name to the queue | Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/OperationQueue.html:504-558](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/OperationQueue.html#L504-L558) |
| `startSuspended` | `Bool` | `false` | Determines whether the queue begins in a suspended state | Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/OperationQueue.html:505-570](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/OperationQueue.html#L505-L570) |

Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/OperationQueue.html:501-576](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/OperationQueue.html#L501-L576)

> [!TIP]
> Initializing an `OperationQueue` with `startSuspended: true` allows you to enqueue a batch of dependent operations safely before letting the queue begin execution, avoiding race conditions where early operations finish before setup completes [Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/OperationQueue.html:505-570](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/OperationQueue.html#L505-L570)].

Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/OperationQueue.html:501-578](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/OperationQueue.html#L501-L578)

## Result Extension Utilities

Alamofire extends Swift's standard library `Result` type to simplify error handling and response serialization across networking pipelines. These extensions provide optional property accessors for success and failure cases, a convenient dual-parameter initializer, and functional transformation methods capable of handling throwing closures [Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/Result.html:494-496](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/Result.html#L494-L496)].

The `Result` extension introduces computed properties to inspect success and failure payloads without mandatory switch statements, along with a direct constructor taking a value and an optional error [Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/Result.html:494-501](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/Result.html#L494-L501)].

| Member | Signature / Type | Purpose / Behavior | Sources |
| --- | --- | --- | --- |
| `success` | `var success: Success? { get }` | Returns the associated success value if the result represents a success, or `nil` otherwise. | Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/Result.html:494-501](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/Result.html#L494-L501) |
| `failure` | `var failure: Failure? { get }` | Returns the associated error value if the result represents a failure, or `nil` otherwise. | Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/Result.html:521-528](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/Result.html#L521-L528) |
| `init(value:error:)` | `init(value: Success, error: Failure?)` | Initializes a `Result` instance, returning `.failure` if the provided error is non-nil, and `.success` otherwise. | Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/Result.html:547-555](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/Result.html#L547-L555) |

Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/Result.html:484-555](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/Result.html#L484-L555)

To support response serialization pipelines where decoding or validation operations may throw, `Result` provides `tryMap(_:)` and `tryMapError(_:)`. These methods evaluate throwing transforms on success values or failure errors respectively [Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/Result.html:606-612](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/Result.html#L606-L612)].

* `tryMap(_:)`: Evaluates a throwing transform closure on the unwrapped success value, returning a new `Result<NewSuccess, Error>` containing the transformed value or propagating any thrown error. If the instance is already a failure, it returns the existing failure unchanged [Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/Result.html:606-612](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/Result.html#L606-L612)].
* `tryMapError(_:)`: Evaluates a throwing transform closure on the unwrapped error value, returning a `Result<Success, Error>` with the transformed error. If the instance is a success, it returns the existing success unchanged [Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/Result.html:664-670](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/Result.html#L664-L670)].

Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/Result.html:596-708](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/Result.html#L596-L708)

> [!NOTE]
> When chaining `tryMap` during JSON response serialization, any thrown `DecodingError` or custom serialization failure captured inside the closure automatically converts the `Result` into a `.failure` wrapping that error [Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/Result.html:608-612](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/Result.html#L608-L612)].

Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/Result.html:606-614](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/Result.html#L606-L614)

## Thread Safety via Protected Extensions

Alamofire provides thread-safe state isolation through the `Protected<Value>` class wrapper and the underlying private `Lock` protocol. On Darwin platforms, locking utilizes an `UnfairLock` wrapping `os_unfair_lock` via allocated memory capacity, while other Foundation-supported platforms rely on `NSLock`. The `Lock` protocol defines `lock()` and `unlock()` methods alongside extension helpers `around(_:)` that use `defer` blocks to guarantee lock release during both throwing and non-throwing closures [Sources: [Source/Core/Protected.swift:27-50](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Protected.swift#L27-L50)].

The `Protected<Value>` class wraps a generic state variable using `nonisolated(unsafe)` annotation and shields access behind thread-safe methods: `read(_:)`, `write(_:)` (closure-based), and `write(_:)` (direct assignment). Specialized extensions also support `Request.MutableState` through `attemptToTransitionTo(_:)` and `withState(perform:)`, alongside conditional conformances to `Equatable` and `Hashable` [Sources: [Source/Core/Protected.swift:83-124](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Protected.swift#L83-L124)].

| Member / Extension | Signature | Purpose / Behavior | Sources |
| --- | --- | --- | --- |
| `read` | `func read<U>(_ closure: (Value) throws -> U) rethrows -> U` | Executes a closure while holding the lock, passing the protected value for read-only inspection. | Sources: [Source/Core/Protected.swift:104-106](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Protected.swift#L104-L106) |
| `write` (closure) | `func write<U>(_ closure: (inout Value) throws -> U) rethrows -> U` | Executes a closure while holding the lock, passing an in-out reference to mutate the protected value. | Sources: [Source/Core/Protected.swift:114-116](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Protected.swift#L114-L116) |
| `write` (value) | `func write(_ value: Value)` | Replaces the current protected value directly with a new instance. | Sources: [Source/Core/Protected.swift:121-123](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Protected.swift#L121-L123) |
| `attemptToTransitionTo` | `func attemptToTransitionTo(_ state: Request.State) -> Bool` | Checks if `Request.MutableState` can transition to the given state under lock, updates it if valid, and returns `true`. | Sources: [Source/Core/Protected.swift:136-144](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Protected.swift#L136-L144) |
| `withState` | `func withState(perform: (Request.State) -> Void)` | Executes a provided closure under lock passing the current request state. | Sources: [Source/Core/Protected.swift:149-151](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Protected.swift#L149-L151) |

Sources: [Source/Core/Protected.swift:83-164](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Protected.swift#L83-L164)

> [!WARNING]
> When implementing conditional conformances like `Equatable` for `Protected<Value>`, nested calls to `.read` across instances lock multiple protected wrappers sequentially, which requires careful ordering if multiple protected objects are involved to avoid deadlocks [Sources: [Source/Core/Protected.swift:154-158](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Protected.swift#L154-L158)].

Sources: [Source/Core/Protected.swift:154-164](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Protected.swift#L154-L164)

## Related

- [[Thread Safety Utilities]]
- [[HTTP Headers and Methods]]

