# Authentication Interceptor

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [Source/Features/AuthenticationInterceptor.swift](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/AuthenticationInterceptor.swift)
- [Tests/AuthenticationInterceptorTests.swift](https://github.com/Alamofire/Alamofire/blob/main/Tests/AuthenticationInterceptorTests.swift)
- [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Classes/AuthenticationInterceptor.html](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Classes/AuthenticationInterceptor.html)
- [docs/Classes/AuthenticationInterceptor.html](https://github.com/Alamofire/Alamofire/blob/main/docs/Classes/AuthenticationInterceptor.html)
</details>

## Overview

The `AuthenticationInterceptor` class manages the queuing and threading complexity of authenticating requests, relying on an `Authenticator` type to handle the actual `URLRequest` authentication and `Credential` refresh. Sources: [Source/Features/AuthenticationInterceptor.swift:158-159](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/AuthenticationInterceptor.swift#L158-L159), [docs/Classes/AuthenticationInterceptor.html:581-582](https://github.com/Alamofire/Alamofire/blob/main/docs/Classes/AuthenticationInterceptor.html#L581-L582)

## Public API and Initializers

### Public API and Initializers

The `AuthenticationInterceptor` class is a public, final generic class conforming to both `RequestInterceptor` and `Sendable` protocols. It is parameterized over an `AuthenticatorType` generic constraint conforming to the `Authenticator` protocol. Through its conformance to `RequestInterceptor`, it seamlessly integrates into Alamofire's request adaptation and retry pipelines.

Sources: [Source/Features/AuthenticationInterceptor.swift:160-160](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/AuthenticationInterceptor.swift#L160-L160), [docs/Classes/AuthenticationInterceptor.html:577-577](https://github.com/Alamofire/Alamofire/blob/main/docs/Classes/AuthenticationInterceptor.html#L577-L577)

```swift
public final class AuthenticationInterceptor<AuthenticatorType>: RequestInterceptor, Sendable where AuthenticatorType: Authenticator
```
Sources: [Source/Features/AuthenticationInterceptor.swift:160-160](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/AuthenticationInterceptor.swift#L160-L160), [docs/Classes/AuthenticationInterceptor.html:577-577](https://github.com/Alamofire/Alamofire/blob/main/docs/Classes/AuthenticationInterceptor.html#L577-L577)

### Typealiases and Helper Types

The interceptor exposes primary associated types and configuration structures to simplify setup and ensure type safety across authentication boundaries.

* **`Credential`**: A public typealias mapping directly to `AuthenticatorType.Credential`. Sources: [Source/Features/AuthenticationInterceptor.swift:164-164](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/AuthenticationInterceptor.swift#L164-L164), [docs/Classes/AuthenticationInterceptor.html:620-620](https://github.com/Alamofire/Alamofire/blob/main/docs/Classes/AuthenticationInterceptor.html#L620-L620)
* **`RefreshWindow`**: A nested public structure that defines a time window used to identify excessive refresh calls and prevent infinite refresh loops. Sources: [Source/Features/AuthenticationInterceptor.swift:172-172](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/AuthenticationInterceptor.swift#L172-L172), [docs/Classes/AuthenticationInterceptor.html:664-664](https://github.com/Alamofire/Alamofire/blob/main/docs/Classes/AuthenticationInterceptor.html#L664-L664)

```swift
public struct RefreshWindow {
    public let interval: TimeInterval
    public let maximumAttempts: Int

    public init(interval: TimeInterval = 30.0, maximumAttempts: Int = 5) {
        self.interval = interval
        self.maximumAttempts = maximumAttempts
    }
}
```
Sources: [Source/Features/AuthenticationInterceptor.swift:172-190](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/AuthenticationInterceptor.swift#L172-L190), [docs/Classes/AuthenticationInterceptor.html:664-664](https://github.com/Alamofire/Alamofire/blob/main/docs/Classes/AuthenticationInterceptor.html#L664-L664)

### Initialization Parameters

The designated initializer configures the interceptor with an authenticator instance, an optional initial credential, and an optional refresh window configuration.

| Parameter | Type | Default Value | Description |
| --- | --- | --- | --- |
| `authenticator` | `AuthenticatorType` | *None* | The underlying `Authenticator` type handling request signing and token refreshing. |
| `credential` | `Credential?` | `nil` | The initial authentication credential if already available. |
| `refreshWindow` | `RefreshWindow?` | `RefreshWindow()` | The sliding time window configuration used to detect excessive refresh cycles. |

Sources: [Source/Features/AuthenticationInterceptor.swift:258-263](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/AuthenticationInterceptor.swift#L258-L263), [docs/Classes/AuthenticationInterceptor.html:747-750](https://github.com/Alamofire/Alamofire/blob/main/docs/Classes/AuthenticationInterceptor.html#L747-L750)

```swift
public init(authenticator: AuthenticatorType,
            credential: Credential? = nil,
            refreshWindow: RefreshWindow? = RefreshWindow()) {
    self.authenticator = authenticator
    mutableState = Protected(MutableState(credential: credential, refreshWindow: refreshWindow))
}
```
Sources: [Source/Features/AuthenticationInterceptor.swift:258-263](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/AuthenticationInterceptor.swift#L258-L263), [docs/Classes/AuthenticationInterceptor.html:747-750](https://github.com/Alamofire/Alamofire/blob/main/docs/Classes/AuthenticationInterceptor.html#L747-L750)

> [!WARNING]
> Passing a `nil` `RefreshWindow` disables excessive refresh checking entirely. It is highly recommended to keep the default `RefreshWindow()` instance to guard against infinite token refresh loops caused by persistent server rejections.
Sources: [Source/Features/AuthenticationInterceptor.swift:251-252](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/AuthenticationInterceptor.swift#L251-L252), [docs/Classes/AuthenticationInterceptor.html:739-740](https://github.com/Alamofire/Alamofire/blob/main/docs/Classes/AuthenticationInterceptor.html#L739-L740)

## Credential Storage and State Management

### Overview

`AuthenticationInterceptor` uses an internal thread-safe container to manage credentials, queue pending adaptation/retry operations, and monitor token refresh attempts. Private state structures isolated by thread synchronizers maintain token freshness across concurrent network requests without race conditions.

Sources: [Source/Features/AuthenticationInterceptor.swift:211-246](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/AuthenticationInterceptor.swift#L211-L246)

### Thread-Safe State Encapsulation

Internal state management centers on `MutableState`, wrapped inside a `Protected` generic thread-synchronization container. The public `credential` property exposes safe thread accessors using read and write operations on `mutableState`. Updating a credential increments an internal version counter, resets the refresh state back to `.idle`, and invalidates prior stale refresh attempts.

Sources: [Source/Features/AuthenticationInterceptor.swift:211-240](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/AuthenticationInterceptor.swift#L211-L240), [Source/Features/AuthenticationInterceptor.swift:237-240](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/AuthenticationInterceptor.swift#L237-L240)

```swift
private struct MutableState {
    var credential: Credential?
    var credentialVersion = 0

    var refreshState: RefreshState = .idle
    var refreshTimestamps: [TimeInterval] = []
    var refreshWindow: RefreshWindow?

    var adaptOperations: [AdaptOperation] = []
    var requestsToRetry: [@Sendable (RetryResult) -> Void] = []

    var isRefreshing: Bool {
        if case .refreshing = refreshState { return true }
        return false
    }

    mutating func updateCredential(_ credential: Credential?) {
        self.credential = credential
        credentialVersion += 1
        refreshState = .idle
    }
}
```
Sources: [Source/Features/AuthenticationInterceptor.swift:211-235](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/AuthenticationInterceptor.swift#L211-L235)

> [!NOTE]
> Setting `credential` on `AuthenticationInterceptor` updates `credentialVersion` and sets `refreshState` back to `.idle`. This allows subsequent 401 response retries to initiate new refresh attempts under the updated credential context.
Sources: [Source/Features/AuthenticationInterceptor.swift:227-231](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/AuthenticationInterceptor.swift#L227-L231), [Source/Features/AuthenticationInterceptor.swift:237-240](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/AuthenticationInterceptor.swift#L237-L240)

### State Data Structures and Invariants

State progression during token renewal relies on the private `RefreshState` enum, queued requests, and timestamp trackers:

| Structure / Property | Real Type | Role and Behavior |
| --- | --- | --- |
| `refreshState` | `RefreshState` | State enumeration tracking whether token renewal is in-flight or failed. |
| `credentialVersion` | `Int` | Integer incremented on every credential modification. |
| `adaptOperations` | `[AdaptOperation]` | Array of pending operations queued waiting for proactive token refresh. |
| `requestsToRetry` | `[@Sendable (RetryResult) -> Void]` | Array of retrier completion closures suspended during reactive token refresh. |
| `refreshTimestamps` | `[TimeInterval]` | Array of timestamps evaluating refresh frequency against `RefreshWindow` rules. |

Sources: [Source/Features/AuthenticationInterceptor.swift:193-225](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/AuthenticationInterceptor.swift#L193-L225)

> [!TIP]
> Prior refresh failures stored in `refreshState` are automatically reset to `.idle` whenever a completely new request enters the adaptation pipeline, allowing new network calls to attempt re-authentication.
Sources: [Source/Features/AuthenticationInterceptor.swift:300-303](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/AuthenticationInterceptor.swift#L300-L303)

## Request Adaptation and Authentication

### Overview

The request adaptation control flow coordinates how outgoing `URLRequest` instances receive authorization headers and how proactive token refreshes are triggered prior to execution. When Alamofire processes an outgoing request through `AuthenticationInterceptor`, it evaluates the interceptor's thread-protected state to decide whether the request can be adapted immediately, deferred due to an active token refresh, or failed because of a missing credential.

Sources: [Source/Features/AuthenticationInterceptor.swift:267-321](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/AuthenticationInterceptor.swift#L267-L321)

### Adaptation Execution Walkthrough

The adaptation pipeline processes requests through a specific sequence of state evaluations inside `adapt(_:for:completion:)`:

1. **`mutableState.write` lock acquisition:** Enters a synchronized block evaluating `AdaptResult` based on `isRefreshing`, `adaptOperations.isEmpty`, `credential`, and `requiresRefresh`.
Sources: [Source/Features/AuthenticationInterceptor.swift:268-306](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/AuthenticationInterceptor.swift#L268-L306)
2. **Concurrency / Refresh Check:** If `isRefreshing` is true and `adaptOperations` is non-empty, the operation is wrapped in an `AdaptOperation` struct containing `urlRequest`, `session`, and `completion`, appended to `mutableState.adaptOperations`, and returns `.adaptDeferred`.
Sources: [Source/Features/AuthenticationInterceptor.swift:277-282](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/AuthenticationInterceptor.swift#L277-L282)
3. **Missing Credential Guard:** If `mutableState.credential` is `nil`, an `AuthenticationError.missingCredential` error is generated and returned as `.doNotAdapt(error)`.
Sources: [Source/Features/AuthenticationInterceptor.swift:284-288](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/AuthenticationInterceptor.swift#L284-L288)
4. **Proactive Refresh Trigger:** If `credential.requiresRefresh` is true and no refresh is active, the request is queued into `adaptOperations`, `refresh(_:for:insideLock:)` is invoked, and `.adaptDeferred` is returned.
Sources: [Source/Features/AuthenticationInterceptor.swift:292-297](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/AuthenticationInterceptor.swift#L292-L297)
5. **Stale Failure Cleanup:** If `refreshState` is in a `.failed` state, it is reset to `.idle` for the new request lifecycle.
Sources: [Source/Features/AuthenticationInterceptor.swift:300-303](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/AuthenticationInterceptor.swift#L300-L303)
6. **Direct Adaptation:** If none of the above conditions apply, it returns `.adapt(credential)`. Outside the lock, `authenticator.apply(credential, to: &authenticatedRequest)` is executed, followed by `completion(.success(authenticatedRequest))`.
Sources: [Source/Features/AuthenticationInterceptor.swift:305-313](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/AuthenticationInterceptor.swift#L305-L313)

> [!WARNING]
> When `adaptOperations` is empty and `isRefreshing` is true, the refresh was triggered by the retry path rather than a proactive adaptation check. In this scenario, adaptation is *not* deferred; it proceeds immediately using the current credential so that non-idempotent adapters earlier in the chain rerun from scratch.
Sources: [Source/Features/AuthenticationInterceptor.swift:269-276](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/AuthenticationInterceptor.swift#L269-L276)

### Adaptation Result States

The internal `AdaptResult` enumeration governs the control flow branch executed after inspecting thread-safe mutable state:

| Adaptation Result Case | Associated Value | Behavior and Outcome |
| --- | --- | --- |
| `.adapt` | `Credential` | Applies the credential directly to the request via `authenticator.apply(credential, to: &authenticatedRequest)` and completes with `.success`. |
| `.doNotAdapt` | `AuthenticationError` | Fails immediately by passing the error to `completion(.failure(adaptError))` (e.g., `AuthenticationError.missingCredential`). |
| `.adaptDeferred` | None | No-op in the outer switch; the operation has been captured inside `adaptOperations` awaiting completion of an in-flight token refresh. |

Sources: [Source/Features/AuthenticationInterceptor.swift:199-203](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/AuthenticationInterceptor.swift#L199-L203), [Source/Features/AuthenticationInterceptor.swift:308-320](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/AuthenticationInterceptor.swift#L308-L320)

## Token Renewal and Request Retrying

### Overview

When requests fail due to authentication errors such as HTTP `401 Unauthorized`, `AuthenticationInterceptor` acts as a request retrier via its `retry(_:for:dueTo:completion:)` method. It coordinates locking mechanisms, tracks credential versions, and queues concurrent failing requests to prevent redundant token renewal calls.
Sources: [Source/Features/AuthenticationInterceptor.swift:325-380](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/AuthenticationInterceptor.swift#L325-L380)

### Request Retry Call-Chain Execution

When a request encounters an error, the retry pipeline proceeds through a strict sequence of validations before evaluating whether to refresh the credential:

1. **Task & Response Guard:** `guard let urlRequest = request.request, let response = request.response else { completion(.doNotRetry); return }` ensures that only completed requests with an active server response can trigger a retry.
Sources: [Source/Features/AuthenticationInterceptor.swift:327-330](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/AuthenticationInterceptor.swift#L327-L330)
2. **Authenticator Verification Guard:** `guard authenticator.didRequest(urlRequest, with: response, failDueToAuthenticationError: error) else { completion(.doNotRetry); return }` delegates to the authenticator to confirm the failure stemmed specifically from an authentication violation.
Sources: [Source/Features/AuthenticationInterceptor.swift:333-336](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/AuthenticationInterceptor.swift#L333-L336)
3. **Credential Presence Guard:** Reads the current credential and its version within a protected block. If no credential exists, it completes with `.doNotRetryWithError(AuthenticationError.missingCredential)`.
Sources: [Source/Features/AuthenticationInterceptor.swift:338-349](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/AuthenticationInterceptor.swift#L338-L349)
4. **Credential Match Guard:** `guard authenticator.isRequest(urlRequest, authenticatedWith: credential) else { completion(.retry); return }` verifies whether the failing request was authenticated with an older credential. If the request used an outdated token while a refresh was already in flight, it immediately returns `.retry`.
Sources: [Source/Features/AuthenticationInterceptor.swift:352-355](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/AuthenticationInterceptor.swift#L352-L355)
5. **State-Machine Resolution:** Inside a `mutableState.write` block, version mismatches trigger an immediate `.retry`, stored `.failed` errors return `.doNotRetryWithError(refreshError)`, active `.refreshing` states append the completion closure to `requestsToRetry`, and `.idle` states append the completion closure and invoke `refresh(credential, for: session, insideLock: &mutableState)`.
Sources: [Source/Features/AuthenticationInterceptor.swift:359-377](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/AuthenticationInterceptor.swift#L359-L377)

> [!WARNING]
> To prevent deadlocks when custom authenticators execute completion closures synchronously on the calling thread, `refresh(_:for:insideLock:)` dispatches the execution of `authenticator.refresh` onto `queue.async` after recording the timestamp and setting `.refreshing` state, successfully dropping the mutable state lock before the asynchronous work runs.
Sources: [Source/Features/AuthenticationInterceptor.swift:384-406](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/AuthenticationInterceptor.swift#L384-L406)

### Token Renewal & Success/Failure Handling

The `RefreshWindow` and timestamp array guard prevent infinite retry loops by evaluating excessive renewal calls. Prior to refreshing, `isRefreshExcessive(insideLock:)` compares timestamps against `refreshWindow.interval` and `refreshWindow.maximumAttempts`.
Sources: [Source/Features/AuthenticationInterceptor.swift:172-191](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/AuthenticationInterceptor.swift#L172-L191), [Source/Features/AuthenticationInterceptor.swift:409-420](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/AuthenticationInterceptor.swift#L409-L420)

| Refresh Outcome Method | Trigger Condition | State Transition | Dispatched Resolution Action |
| --- | --- | --- | --- |
| `handleRefreshSuccess(_:insideLock:)` | `authenticator.refresh` returns `.success(credential)` | `credential` updated, version incremented, state reset to `.idle`, queues cleared | Replays all deferred `adaptOperations` and completes all `requestsToRetry` with `.retry`. |
| `handleRefreshFailure(_:insideLock:)` | `authenticator.refresh` returns `.failure(error)` or excessive refresh | State updated to `.failed(error)`, queues cleared | Fails all deferred `adaptOperations` with `.failure(error)` and all `requestsToRetry` with `.doNotRetryWithError(error)`. |

Sources: [Source/Features/AuthenticationInterceptor.swift:227-231](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/AuthenticationInterceptor.swift#L227-L231), [Source/Features/AuthenticationInterceptor.swift:422-452](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/AuthenticationInterceptor.swift#L422-L452)

> [!TIP]
> Setting `interceptor.credential` externally calls `updateCredential(_:)`, which increments `credentialVersion` and resets `refreshState` from `.failed` back to `.idle`, clearing cached failure states and restoring the ability to trigger subsequent refreshes.
Sources: [Source/Features/AuthenticationInterceptor.swift:227-231](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/AuthenticationInterceptor.swift#L227-L231)

## Testing and Mock Implementations

### Overview

Unit testing authentication flows requires custom test helpers that conform to Alamofire protocols while exposing fine-grained inspection counters. The test suite for `AuthenticationInterceptor` centers around `TestCredential`, `TestAuthenticator`, and `PathAdapter`. These implementations allow precise control over token expiration, success or failure results, thread scheduling, and path simulation during composite interception tests.
Sources: [Tests/AuthenticationInterceptorTests.swift:32-142](https://github.com/Alamofire/Alamofire/blob/main/Tests/AuthenticationInterceptorTests.swift#L32-L142)

### Mock Implementations and Helper Types

The mock types defined in the test suite record invocation counts for every method required by the `Authenticator` protocol and credential lifecycle. This permits assertions on call frequencies, such as verifying that an excessive refresh guard prevents redundant network calls.
Sources: [Tests/AuthenticationInterceptorTests.swift:32-123](https://github.com/Alamofire/Alamofire/blob/main/Tests/AuthenticationInterceptorTests.swift#L32-L123)

| Helper Type | Conformance / Purpose | Key Properties / Methods |
| --- | --- | --- |
| `TestCredential` | `AuthenticationCredential` | `accessToken`, `refreshToken`, `userID`, `expiration`, `requiresRefresh` |
| `TestAuthenticator` | `Authenticator` | `applyCount`, `refreshCount`, `didRequestFailDueToAuthErrorCount`, `refreshResult`, `refreshQueue` |
| `PathAdapter` | `RequestAdapter` | `paths: [String]`, dynamically rewrites request URL paths during composite interception. |

Sources: [Tests/AuthenticationInterceptorTests.swift:32-142](https://github.com/Alamofire/Alamofire/blob/main/Tests/AuthenticationInterceptorTests.swift#L32-L142)

### Test Strategies and Verification Patterns

Test cases validate specific behavioral invariants, such as preventing deadlocks when completion closures are called synchronously, rethrowing refresh errors to parallel requests, and handling excessive refresh windows.
Sources: [Tests/AuthenticationInterceptorTests.swift:542-584](https://github.com/Alamofire/Alamofire/blob/main/Tests/AuthenticationInterceptorTests.swift#L542-L584), [Tests/AuthenticationInterceptorTests.swift:702-741](https://github.com/Alamofire/Alamofire/blob/main/Tests/AuthenticationInterceptorTests.swift#L702-L741), [Tests/AuthenticationInterceptorTests.swift:887-926](https://github.com/Alamofire/Alamofire/blob/main/Tests/AuthenticationInterceptorTests.swift#L887-L926)

> [!NOTE]
> When testing synchronous completion handlers (`refreshQueue: nil`), `TestAuthenticator` omits the asynchronous dispatch delay, verifying that `AuthenticationInterceptor` safely releases its internal write lock prior to invoking the completion closure.
Sources: [Tests/AuthenticationInterceptorTests.swift:542-546](https://github.com/Alamofire/Alamofire/blob/main/Tests/AuthenticationInterceptorTests.swift#L542-L546), [Tests/AuthenticationInterceptorTests.swift:1231-1236](https://github.com/Alamofire/Alamofire/blob/main/Tests/AuthenticationInterceptorTests.swift#L1231-L1236)

Composite interceptors combine a `PathAdapter` and an `AuthenticationInterceptor` to simulate multi-step HTTP exchanges, such as intercepting an initial 401 Unauthorized response, triggering a token refresh, and successfully retrying the request with the updated credential.
Sources: [Tests/AuthenticationInterceptorTests.swift:587-620](https://github.com/Alamofire/Alamofire/blob/main/Tests/AuthenticationInterceptorTests.swift#L587-L620)

## Related

- [[Request Interceptors]]
- [[Retry Policies]]

