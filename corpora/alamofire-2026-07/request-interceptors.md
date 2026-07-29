# Request Interceptors

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [Source/Features/RequestInterceptor.swift](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/RequestInterceptor.swift)
- [Tests/RequestInterceptorTests.swift](https://github.com/Alamofire/Alamofire/blob/main/Tests/RequestInterceptorTests.swift)
- [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Protocols/RequestInterceptor.html](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Protocols/RequestInterceptor.html)
- [Source/Core/Request.swift](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Request.swift)
- [docs/Protocols/RequestInterceptor.html](https://github.com/Alamofire/Alamofire/blob/main/docs/Protocols/RequestInterceptor.html)
</details>

## Overview

Request interceptors provide a unified mechanism for inspecting, modifying, and managing the lifecycle of outgoing network requests and handling execution failures within Alamofire sessions. By decoupling request adaptation and retry logic into modular protocols, the interception system enables clean separation of concerns for cross-cutting tasks such as authentication header injection, request body compression, and automated error recovery. The framework coordinates these behaviors seamlessly across individual requests and shared session configurations while maintaining thread safety and supporting asynchronous operations throughout the network pipeline.

Sources: [Source/Features/RequestInterceptor.swift:38-120](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/RequestInterceptor.swift#L38-L120)

## Protocol Architecture and Core Types

### Overview

Alamofire's interception mechanism is built upon three primary protocols that separate request modification from failure recovery and error handling. The foundational building blocks include `RequestAdapter`, `RequestRetrier`, and the composite `RequestInterceptor` protocol, which unifies both capabilities into a single type.

The `RequestAdapter` protocol defines methods for inspecting and modifying a `URLRequest` prior to network task dispatch. It provides two overloads for adaptation: one accepting a session directly, and another accepting a `RequestAdapterState` struct containing both the request identifier (`requestID`) and the associated `Session`. Default protocol extensions bridge these signatures so that conformances can seamlessly forward states.

```swift
public struct RequestAdapterState: Sendable {
    public let requestID: UUID
    public let session: Session
}

public protocol RequestAdapter: Sendable {
    func adapt(_ urlRequest: URLRequest, for session: Session, completion: @escaping @Sendable (_ result: Result<URLRequest, any Error>) -> Void)
    func adapt(_ urlRequest: URLRequest, using state: RequestAdapterState, completion: @escaping @Sendable (_ result: Result<URLRequest, any Error>) -> Void)
}
```
Sources: [Source/Features/RequestInterceptor.swift:27-55](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/RequestInterceptor.swift#L27-L55)

The `RequestRetrier` protocol evaluates failed requests and decides whether execution should be re-attempted. Its `retry` method receives the failed `Request`, the executing `Session`, the triggering error, and a completion closure expecting a `RetryResult` enumeration value.

```swift
public enum RetryResult: Sendable {
    case retry
    case retryWithDelay(TimeInterval)
    case doNotRetry
    case doNotRetryWithError(any Error)
}

public protocol RequestRetrier: Sendable {
    func retry(_ request: Request, for session: Session, dueTo error: any Error, completion: @escaping @Sendable (RetryResult) -> Void)
}
```
Sources: [Source/Features/RequestInterceptor.swift:66-114](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/RequestInterceptor.swift#L66-L114)

The `RequestInterceptor` protocol inherits from both `RequestAdapter` and `RequestRetrier`. Default implementations are provided via protocol extensions, where adaptation passes the request through unchanged via `.success(urlRequest)` and retries default to `.doNotRetry`.

```swift
public protocol RequestInterceptor: RequestAdapter, RequestRetrier {}

extension RequestInterceptor {
    @preconcurrency
    public func adapt(_ urlRequest: URLRequest, for session: Session, completion: @escaping @Sendable (Result<URLRequest, any Error>) -> Void) {
        completion(.success(urlRequest))
    }

    @preconcurrency
    public func retry(_ request: Request, for session: Session, dueTo error: any Error, completion: @escaping @Sendable (RetryResult) -> Void) {
        completion(.doNotRetry)
    }
}
```
Sources: [Source/Features/RequestInterceptor.swift:118-134](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/RequestInterceptor.swift#L118-L134)

### Structural Compositions and Core Types

To support functional and multi-component composition, the library provides concrete classes and closure-based type aliases that conform to the interception protocols. Closure aliases (`AdaptHandler` and `RetryHandler`) allow inline definitions without declaring dedicated types.

```swift
public typealias AdaptHandler = @Sendable (_ request: URLRequest, _ session: Session, _ completion: @escaping @Sendable (Result<URLRequest, any Error>) -> Void) -> Void

public typealias RetryHandler = @Sendable (_ request: Request, _ session: Session, _ error: any Error, _ completion: @escaping @Sendable (RetryResult) -> Void) -> Void
```
Sources: [Source/Features/RequestInterceptor.swift:136-146](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/RequestInterceptor.swift#L136-L146)

| Type / Protocol | Category | Primary Purpose |
| :--- | :--- | :--- |
| `RequestAdapter` | Protocol | Inspects and mutates a `URLRequest` prior to execution. |
| `RequestRetrier` | Protocol | Evaluates failed requests and dictates retry or abort behavior. |
| `RequestInterceptor` | Protocol | Composite protocol combining adaptation and retry behaviors. |
| `Adapter` | Class | Closure-based concrete implementation of `RequestAdapter`. |
| `Retrier` | Class | Closure-based concrete implementation of `RequestRetrier`. |
| `Interceptor` | Class | Composite coordinator holding arrays of multiple adapters and retriers. |

Sources: [Source/Features/RequestInterceptor.swift:38-221](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/RequestInterceptor.swift#L38-L221)

> [!NOTE]
> When implementing custom adapters or retriers, completion closures must always be invoked asynchronously on the appropriate execution queue to prevent deadlocks and ensure proper request clean up within the session pipeline.

Sources: [Source/Features/RequestInterceptor.swift:40-46](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/RequestInterceptor.swift#L40-L46), [Source/Features/RequestInterceptor.swift:103-107](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/RequestInterceptor.swift#L103-L107)

## Request Adaptation Lifecycle

### Overview

Prior to task creation and dispatch, initial `URLRequest` instances generated via `URLRequestConvertible` pass through the request adaptation lifecycle. This phase is governed by the `RequestAdapter` protocol, which inspects and modifies `URLRequest` instances before execution. The `RequestAdapterState` struct encapsulates contextual metadata associated with an adapting request, providing access to both the unique request identifier (`requestID`) and the executing `Session` (`session`).

```swift
public struct RequestAdapterState: Sendable {
    public let requestID: UUID
    public let session: Session
}
```
Sources: [Source/Features/RequestInterceptor.swift:27-34](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/RequestInterceptor.swift#L27-L34)

Adapters conform to the `RequestAdapter` protocol, implementing methods that accept either a `Session` directly or a `RequestAdapterState` instance alongside a completion closure returning a `Result<URLRequest, any Error>`. 

```swift
public protocol RequestAdapter: Sendable {
    func adapt(_ urlRequest: URLRequest, for session: Session, completion: @escaping @Sendable (_ result: Result<URLRequest, any Error>) -> Void)
    func adapt(_ urlRequest: URLRequest, using state: RequestAdapterState, completion: @escaping @Sendable (_ result: Result<URLRequest, any Error>) -> Void)
}
```
Sources: [Source/Features/RequestInterceptor.swift:38-55](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/RequestInterceptor.swift#L38-L55)

When a request enters the adaptation pipeline, internal event hooks on the `Request` superclass manage state recording and notifications across the `underlyingQueue`. 

### Adaptation Execution Walkthrough

The lifecycle operations follow a precise call chain during initial request creation and transformation:

1. `didCreateInitialURLRequest(_:)` — Appends the newly created initial request to `mutableState.requests` and triggers the `eventMonitor?.request(self, didCreateInitialURLRequest:)` event.
Sources: [Source/Core/Request.swift:300-306](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Request.swift#L300-L306)
2. `didAdaptInitialRequest(_:to:)` — Invoked when a `RequestAdapter` successfully finishes adapting the request; appends the adapted `URLRequest` to `mutableState.requests` and notifies the event monitor.
Sources: [Source/Core/Request.swift:330-336](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Request.swift#L330-L336)
3. `didFailToAdaptURLRequest(_:withError:)` — Invoked if an adapter returns a `.failure` result; updates `self.error`, calls the cURL handler if necessary, and triggers `retryOrFinish(error:)`.
Sources: [Source/Core/Request.swift:345-355](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Request.swift#L345-L355)

> [!IMPORTANT]
> All internal event API methods on `Request` enforce dispatch preconditions, requiring execution strictly on `underlyingQueue` to ensure thread safety across mutable state collections.
Sources: [Source/Core/Request.swift:301](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Request.swift#L301), [Source/Core/Request.swift:331](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Request.swift#L331), [Source/Core/Request.swift:346](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Request.swift#L346)

### Request Adaptation Methods and Handlers

| Method / Signature | Target Queue / Context | Purpose |
| :--- | :--- | :--- |
| `didCreateInitialURLRequest(_:)` | `underlyingQueue` | Records the initial unadapted request and fires event monitors. |
| `didAdaptInitialRequest(_:to:)` | `underlyingQueue` | Records the successfully adapted request in history. |
| `didFailToAdaptURLRequest(_:withError:)` | `underlyingQueue` | Captures adaptation failures, updates error state, and initiates retry or finish flow. |
| `didCreateURLRequest(_:)` | `underlyingQueue` | Dispatches final request handlers and triggers cURL generation if needed. |

Sources: [Source/Core/Request.swift:300-372](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Request.swift#L300-L372)

Sources: [Source/Features/RequestInterceptor.swift:27-62](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/RequestInterceptor.swift#L27-L62), [Source/Core/Request.swift:300-372](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Request.swift#L300-L372)

## Retry Evaluation and Execution

### Overview

When an HTTP request encounters a failure or a `RequestAdapter` throws an error during execution, Alamofire initiates a retry evaluation cycle via the `RequestRetrier` protocol and internal `Request` state machinery.

### Retry Decision-Making and Outcomes

The determination of whether a failed request should be retried is encapsulated by the `RetryResult` enumeration. Retriers inspect the failing `Request`, the executing `Session`, and the specific `Error` encountered to return one of four distinct decision cases through an asynchronous completion closure.

| RetryResult Case | Associated Value | Evaluation Meaning |
| :--- | :--- | :--- |
| `.retry` | None | Retry should be attempted immediately without delay. |
| `.retryWithDelay` | `TimeInterval` | Retry should be attempted after waiting for the specified time interval. |
| `.doNotRetry` | None | Do not retry the request; proceed to finalization. |
| `.doNotRetryWithError` | `any Error` | Do not retry, and fail the request with the associated error instead. |

Sources: [Source/Features/RequestInterceptor.swift:66-76](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/RequestInterceptor.swift#L66-L76)

Helper properties on `RetryResult` allow internal code to query these states safely: `retryRequired` returns `true` for `.retry` and `.retryWithDelay`, `delay` extracts the optional `TimeInterval`, and `error` retrieves the wrapped error from `.doNotRetryWithError`.
Sources: [Source/Features/RequestInterceptor.swift:78-97](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/RequestInterceptor.swift#L78-L97)

### Retry Execution Flow and Call Chain

The execution flow when a request fails or finishes with an error is coordinated between the `Request` class and its delegate. 

1. `didCompleteTask(_:with:)` or `didFailToAdaptURLRequest(_:withError:)` — Invoked when a task finishes with an error or adapter creation fails; updates the request error state and invokes `retryOrFinish(error:)`.
Sources: [Source/Core/Request.swift:345-355](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Request.swift#L345-L355), [Source/Core/Request.swift:515-526](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Request.swift#L515-L526)
2. `retryOrFinish(error:)` — Validates that the request is not cancelled and checks with `delegate.retryResult(for:dueTo:completion:)` to evaluate the error.
Sources: [Source/Core/Request.swift:543-558](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Request.swift#L543-L558)
3. `prepareForRetry()` — Called when the delegate decides to retry; increments `retryCount`, invokes `reset()`, and fires the `requestIsRetrying` event monitor callback.
Sources: [Source/Core/Request.swift:529-537](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Request.swift#L529-L537)
4. `reset()` — Clears intermediate execution state including task errors, finishing flags, response serializer completion queues, and resets upload and download progress unit counts back to zero.
Sources: [Source/Core/Request.swift:665-677](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Request.swift#L665-L677)

> [!WARNING]
> If a retrier returns `.doNotRetryWithError`, the request bypasses standard completion and finishes immediately with the wrapping error converted to an `AFError`, ignoring any previously accumulated task errors.
Sources: [Source/Core/Request.swift:551-553](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Request.swift#L551-L553)

> [!NOTE]
> During a request retry, `uploadProgress` and `downloadProgress` metrics are entirely reset to zero to accurately reflect the progress tracking lifecycle of the newly dispatched network task.
Sources: [Source/Core/Request.swift:164-167](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Request.swift#L164-L167), [Source/Core/Request.swift:665-670](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Request.swift#L665-L670)

Sources: [Source/Features/RequestInterceptor.swift:66-114](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/RequestInterceptor.swift#L66-L114), [Source/Core/Request.swift:515-677](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Request.swift#L515-L677)

## Composite Interceptor Execution Model

### Overview

When multiple adapters and retriers are combined under an `Interceptor` instance, Alamofire evaluates them sequentially rather than concurrently. The composite `Interceptor` stores public arrays of `adapters` and `retriers` containing any individually supplied adapters, retriers, or flattened sub-interceptors.
Sources: [Source/Features/RequestInterceptor.swift:221-258](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/RequestInterceptor.swift#L221-L258)

### Sequential Adapter Execution Walkthrough

The request adaptation pipeline processes an incoming `URLRequest` through every registered adapter one after another until an error occurs or all adapters have completed successfully. The execution path proceeds through the following internal and public methods:

1. `adapt(_:for:completion:)` (public entry point) — Invokes the private worker method `adapt(_:for:using:completion:)` passing `adapters`.
Sources: [Source/Features/RequestInterceptor.swift:261-263](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/RequestInterceptor.swift#L261-L263)
2. `adapt(_:for:using:adapters:completion:)` (private recursion) — Initializes a local mutable array copy `var pendingAdapters = adapters`. It inspects whether `pendingAdapters` is empty: if empty, it invokes `completion(.success(urlRequest))` and returns.
Sources: [Source/Features/RequestInterceptor.swift:265-272](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/RequestInterceptor.swift#L265-L272)
3. `pendingAdapters.removeFirst()` — Extracts the next adapter from the front of the pending array.
Sources: [Source/Features/RequestInterceptor.swift:273-273](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/RequestInterceptor.swift#L273-L273)
4. `adapter.adapt(_:for:completion:)` — Executes the individual adapter asynchronously. Upon completion, a `Result<URLRequest, any Error>` is evaluated:
   - On `.success(urlRequest)`, recursion continues by calling `adapt` again with the mutated `urlRequest` and the remaining `pendingAdapters`.
   - On `.failure`, adaptation halts immediately and propagates the failure result via `completion(result)`.
Sources: [Source/Features/RequestInterceptor.swift:275-282](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/RequestInterceptor.swift#L275-L282)

An identical overloaded pair of methods (`adapt(_:using:completion:)` and its private counterpart) handles requests using `RequestAdapterState` instead of a session reference directly.
Sources: [Source/Features/RequestInterceptor.swift:285-308](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/RequestInterceptor.swift#L285-L308)

> [!WARNING]
> Because adapters execute in strict sequence where each step feeds its output `URLRequest` into the next adapter, an early adapter failure terminates the entire chain instantly, bypassing all downstream adapters.
Sources: [Source/Features/RequestInterceptor.swift:275-282](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/RequestInterceptor.swift#L275-L282)

Sources: [Source/Features/RequestInterceptor.swift:261-308](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/RequestInterceptor.swift#L261-L308)

### Sequential Retrier Execution Walkthrough

Retriers are likewise evaluated one at a time, but with different branch semantics based on the returned `RetryResult`:

1. `retry(_:for:dueTo:completion:)` (public entry point) — Calls the private worker `retry(_:for:dueTo:using:completion:)` passing `retriers`.
Sources: [Source/Features/RequestInterceptor.swift:311-316](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/RequestInterceptor.swift#L311-L316)
2. `retry(_:for:dueTo:using:completion:)` (private recursion) — Copies `var pendingRetriers = retriers`. If `pendingRetriers` is empty, it invokes `completion(.doNotRetry)` and terminates.
Sources: [Source/Features/RequestInterceptor.swift:318-325](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/RequestInterceptor.swift#L318-L325)
3. `pendingRetriers.removeFirst()` — Pulls the next retrier from the queue and calls `retrier.retry(_:for:dueTo:completion:)`.
Sources: [Source/Features/RequestInterceptor.swift:327-329](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/RequestInterceptor.swift#L327-L329)
4. The completion closure inspects the received `RetryResult`:
   - Cases `.retry`, `.retryWithDelay`, and `.doNotRetryWithError` immediately break the chain by calling `completion(result)`.
   - Case `.doNotRetry` falls through to recursive execution, proceeding to the next retrier in `pendingRetriers`.
Sources: [Source/Features/RequestInterceptor.swift:330-337](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/RequestInterceptor.swift#L330-L337)

> [!NOTE]
> An individual retrier returning `.doNotRetry` allows evaluation to cascade to subsequent retriers in the composite array, whereas any positive decision (`.retry`, `.retryWithDelay`, or `.doNotRetryWithError`) halts further iteration.
Sources: [Source/Features/RequestInterceptor.swift:330-337](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/RequestInterceptor.swift#L330-L337)

Sources: [Source/Features/RequestInterceptor.swift:311-338](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/RequestInterceptor.swift#L311-L338)

## Session and Request Integration

### Overview

The `Request` class and `RequestInterceptor` types coordinate closely across the request lifecycle, managing request creation, adaptation failures, task completion errors, and retry resets. Interceptors attached via `Request.interceptor(_:)`, `Request.adapt(using:)`, or `Request.retry(using:)` are composed into `mutableState.interceptor`, which operates alongside session-level settings.
Sources: [Source/Core/Request.swift:993-1065](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Request.swift#L993-L1065)

### Call-Chain Execution Walkthrough: Error Handling and Retry-Or-Finish

When a request encounters an error during initial creation, adaptation, or task completion, the control flow follows a distinct sequence on the `underlyingQueue`:

1. `didFailToCreateURLRequest(with:)`, `didFailToAdaptURLRequest(_:withError:)`, or `didCompleteTask(_:with:)` executes on `underlyingQueue`, setting `self.error = error`.
Sources: [Source/Core/Request.swift:313-323](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Request.swift#L313-L323), [Source/Core/Request.swift:345-355](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Request.swift#L345-L355), [Source/Core/Request.swift:515-526](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Request.swift#L515-L526)
2. `retryOrFinish(error:)` is invoked. It guards against cancellation and validates that an error and `delegate` exist; if any condition fails, it triggers `finish()` and returns.
Sources: [Source/Core/Request.swift:543-547](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Request.swift#L543-L547)
3. `delegate.retryResult(for:dueTo:completion:)` is called asynchronously to evaluate whether the request should retry.
Sources: [Source/Core/Request.swift:548-548](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Request.swift#L548-L548)
4. The completion closure inspects the `RetryResult`:
   - `.doNotRetry` invokes `self.finish()`.
   - `.doNotRetryWithError(retryError)` converts the error to an `AFError` and invokes `self.finish(error:)`.
   - `.retry` or `.retryWithDelay` invokes `delegate.retryRequest(_:withDelay:)`.
Sources: [Source/Core/Request.swift:549-556](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Request.swift#L549-L556)
5. Upon triggering a retry, `prepareForRetry()` increments `retryCount`, executes `reset()`, and fires the event monitor.
Sources: [Source/Core/Request.swift:529-537](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Request.swift#L529-L537)

> [!CAUTION]
> If a request is cancelled (`isCancelled == true`), `retryOrFinish(error:)` bypasses delegate retry evaluation entirely and immediately proceeds to `finish()`, discarding any pending retry attempts.
Sources: [Source/Core/Request.swift:546-546](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Request.swift#L546-L546)

### Lifecycle State Reset and Cleanup

When `reset()` runs during a retry preparation, it resets progress units and clears transient mutable state variables.

| Property / Counter | Action on `reset()` | Source Reference |
| :--- | :--- | :--- |
| `uploadProgress` | `totalUnitCount = 0`, `completedUnitCount = 0` | [Source/Core/Request.swift:666-667](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Request.swift#L666-L667) |
| `downloadProgress` | `totalUnitCount = 0`, `completedUnitCount = 0` | [Source/Core/Request.swift:668-669](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Request.swift#L668-L669) |
| `mutableState.error` | Set to `nil` | [Source/Core/Request.swift:672-672](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Request.swift#L672-L672) |
| `mutableState.isFinishing` | Set to `false` | [Source/Core/Request.swift:673-673](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Request.swift#L673-L673) |
| `mutableState.responseSerializerCompletions` | Emptied (`[]`) | [Source/Core/Request.swift:674-674](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Request.swift#L674-L674) |
| `mutableState.isResponseSerializerEnqueued` | Set to `false` | [Source/Core/Request.swift:675-675](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Request.swift#L675-L675) |

Sources: [Source/Core/Request.swift:665-677](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Request.swift#L665-L677)

> [!NOTE]
> The `retryCount` counter is incremented inside `prepareForRetry()` prior to calling `reset()`, ensuring that attempt tracking persists across reset boundaries while operational error states and serializer queues are wiped clean.
Sources: [Source/Core/Request.swift:529-537](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Request.swift#L529-L537), [Source/Core/Request.swift:665-677](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Request.swift#L665-L677)

## Related

- [[Retry Policies]]
- [[Authentication Interceptor]]

