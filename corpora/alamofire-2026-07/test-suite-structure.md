# Test Suite Structure

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [README.md](https://github.com/Alamofire/Alamofire/blob/main/README.md)
- [Tests/URLProtocolTests.swift](https://github.com/Alamofire/Alamofire/blob/main/Tests/URLProtocolTests.swift)
- [Tests/CacheTests.swift](https://github.com/Alamofire/Alamofire/blob/main/Tests/CacheTests.swift)
- [Tests/TestHelpers.swift](https://github.com/Alamofire/Alamofire/blob/main/Tests/TestHelpers.swift)
- [Tests/SessionTests.swift](https://github.com/Alamofire/Alamofire/blob/main/Tests/SessionTests.swift)
- [Tests/BaseTestCase.swift](https://github.com/Alamofire/Alamofire/blob/main/Tests/BaseTestCase.swift)
- [docs/docsets/Alamofire.docset/Contents/Resources/Documents/index.html](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/index.html)
- [Tests/RedirectHandlerTests.swift](https://github.com/Alamofire/Alamofire/blob/main/Tests/RedirectHandlerTests.swift)
- [Tests/RequestTests.swift](https://github.com/Alamofire/Alamofire/blob/main/Tests/RequestTests.swift)
</details>

## Overview

The test suite provides a comprehensive verification infrastructure centered on the `BaseTestCase` foundation, managing setup, teardown, cookie clearing, and credential reset routines across tests. It incorporates custom `URLProtocol` subclasses to mock HTTP interactions and validate session headers, alongside robust session management tools for testing request lifecycles, mass actions, and task creation handlers. Specialized verification strategies cover response caching and HTTP redirect policies, supported by shared helper endpoints and URL conversion utilities. Sources: [Tests/URLProtocolTests.swift:29-172](https://github.com/Alamofire/Alamofire/blob/main/Tests/URLProtocolTests.swift#L29-L172), [Tests/CacheTests.swift:43-285](https://github.com/Alamofire/Alamofire/blob/main/Tests/CacheTests.swift#L43-L285), [Tests/TestHelpers.swift:37-354](https://github.com/Alamofire/Alamofire/blob/main/Tests/TestHelpers.swift#L37-L354), [Tests/SessionTests.swift:29-2025](https://github.com/Alamofire/Alamofire/blob/main/Tests/SessionTests.swift#L29-L2025), [Tests/BaseTestCase.swift:29-130](https://github.com/Alamofire/Alamofire/blob/main/Tests/BaseTestCase.swift#L29-L130), [Tests/RedirectHandlerTests.swift:29-249](https://github.com/Alamofire/Alamofire/blob/main/Tests/RedirectHandlerTests.swift#L29-L249).

## Base Test Suite Lifecycle and Setup

### Base Test Suite Lifecycle and Setup

Test suite execution relies on `BaseTestCase`, which subclasses `XCTestCase` to provide foundational environment configuration, temporary directory management, version-based conditional skipping, and state cleanup routines. Sources: [Tests/BaseTestCase.swift:29-30](https://github.com/Alamofire/Alamofire/blob/main/Tests/BaseTestCase.swift#L29-L30)

### Execution Lifecycle and Teardown Call Chain

During test execution, each test method is preceded by setup methods and followed by comprehensive teardown hooks. The teardown sequence guarantees isolation between test cases by resetting system stores. 

The teardown call sequence executes as follows: `tearDown()` → `session = nil` releases active session instances → `FileManager.removeAllItemsInsideDirectory(at: testDirectoryURL)` flushes temporary test artifacts → `clearCredentials()` removes stored authentication tokens from `URLCredentialStorage.shared` → `clearCookies()` flushes cookies from `HTTPCookieStorage.shared` → `super.tearDown()` completes base test case tearDown. Sources: [Tests/BaseTestCase.swift:83-90](https://github.com/Alamofire/Alamofire/blob/main/Tests/BaseTestCase.swift#L83-L90)

> [!WARNING]
> Failing to clear credentials and cookies in `tearDown()` can cause state leakage across separate test cases, leading to intermittent authentication failures or unintended cookie persistence. Sources: [Tests/BaseTestCase.swift:86-87](https://github.com/Alamofire/Alamofire/blob/main/Tests/BaseTestCase.swift#L86-L87)

### Configuration Properties and Skip Logic

`BaseTestCase` defines core configuration variables and utility methods that subclasses inherit for test isolation and execution control.

| Property / Method | Type | Default Value / Behavior | Purpose | Sources |
|-------------------|------|--------------------------|---------|---------|
| `timeout` | `TimeInterval` | `10` | Standard timeout duration used for asynchronous expectations and queue assertions. | [Tests/BaseTestCase.swift:57-57](https://github.com/Alamofire/Alamofire/blob/main/Tests/BaseTestCase.swift#L57-L57) |
| `skipVersion` | `SkipVersion` | `.none` | Version check configuration controlling whether tests skip on older operating system versions. | [Tests/BaseTestCase.swift:30-59](https://github.com/Alamofire/Alamofire/blob/main/Tests/BaseTestCase.swift#L30-L59) |
| `testDirectoryURL` | `URL` | `FileManager.temporaryDirectoryURL.appendingPathComponent("org.alamofire.tests")` | Dedicated temporary directory for file operations during tests. | [Tests/BaseTestCase.swift:61-63](https://github.com/Alamofire/Alamofire/blob/main/Tests/BaseTestCase.swift#L61-L63) |
| `temporaryFileURL` | `URL` | `testDirectoryURL.appendingPathComponent(UUID().uuidString)` | Generates a unique file URL within the test directory for upload/download tests. | [Tests/BaseTestCase.swift:65-67](https://github.com/Alamofire/Alamofire/blob/main/Tests/BaseTestCase.swift#L65-L67) |
| `stored(_:)` | Method | `Session` parameter | Tracks a test `Session` instance to ensure deallocation during `tearDown()`. | [Tests/BaseTestCase.swift:108-112](https://github.com/Alamofire/Alamofire/blob/main/Tests/BaseTestCase.swift#L108-L112) |
| `assert(on:assertions:)` | Method | `@MainActor` dispatch helper | Dispatches assertions to a specified `DispatchQueue` and waits for expectations to fulfill within `timeout`. | [Tests/BaseTestCase.swift:114-130](https://github.com/Alamofire/Alamofire/blob/main/Tests/BaseTestCase.swift#L114-L130) |

Sources: [Tests/BaseTestCase.swift:30-130](https://github.com/Alamofire/Alamofire/blob/main/Tests/BaseTestCase.swift#L30-L130)

### Concrete TestCase Implementation Example

Test classes inherit from `BaseTestCase` to utilize automated directory setup, credential clearing, and synchronous queue assertion helpers.

```swift
final class ExampleTestCase: BaseTestCase {
    override var skipVersion: SkipVersion {
        .none
    }

    func testFileOperationsAndQueueDispatch() {
        // testDirectoryURL is created automatically in setUp()
        let fileURL = temporaryFileURL
        let testData = "Alamofire".data(using: .utf8)!
        
        XCTAssertNoThrow(try testData.write(to: fileURL))
        XCTAssertTrue(FileManager.default.fileExists(atPath: fileURL.path))

        // Assert on a custom background queue using BaseTestCase helper
        let queue = DispatchQueue(label: "org.alamofire.test.queue")
        assert(on: queue) {
            XCTAssertTrue(Thread.isCurrentThread(queue: queue) || !Thread.isMainThread)
        }
    }
}
```

Sources: [Tests/BaseTestCase.swift:61-75](https://github.com/Alamofire/Alamofire/blob/main/Tests/BaseTestCase.swift#L61-L75), [Tests/BaseTestCase.swift:114-130](https://github.com/Alamofire/Alamofire/blob/main/Tests/BaseTestCase.swift#L114-L130)

## URLProtocol Subclassing and Mock Interactions

### Overview

Custom `URLProtocol` subclasses provide a mechanism for intercepting, mocking, and forwarding HTTP requests within Alamofire's test suite. By registering a subclass in a `URLSessionConfiguration`, tests can inspect headers, modify request properties, or route traffic through proxy layers without hitting external network endpoints. Sources: [Tests/URLProtocolTests.swift:29-142](https://github.com/Alamofire/Alamofire/blob/main/Tests/URLProtocolTests.swift#L29-L142)

### ProxyURLProtocol Mechanism and Call-Chain

`ProxyURLProtocol` inherits from `Foundation.URLProtocol` and implements request interception lifecycle methods alongside `URLSessionDataDelegate` callbacks. 

The request handling and forwarding lifecycle executes through the following call chain:
`canInit(with:)` → `canonicalRequest(for:)` → `startLoading()` → `URLSession.dataTask(with:)` → delegate callbacks (`urlSession(_:didReceive:)-` → `urlSession(_:didReceive:)` → `urlSession(_:task:didCompleteWithError:)`). Sources: [Tests/URLProtocolTests.swift:51-118](https://github.com/Alamofire/Alamofire/blob/main/Tests/URLProtocolTests.swift#L51-L118)

1. **`canInit(with:)`**: Evaluates whether the protocol should handle a given `URLRequest` or `URLSessionTask`. It checks for the presence of a custom property key (`HandledByProxyURLProtocol`); if present, it returns `false` to prevent infinite redirection loops when the protocol forwards the request via its internal session. Sources: [Tests/URLProtocolTests.swift:51-66](https://github.com/Alamofire/Alamofire/blob/main/Tests/URLProtocolTests.swift#L51-L66)
2. **`canonicalRequest(for:)`**: Returns a normalized version of the request. In `ProxyURLProtocol`, it attempts to encode headers using `URLEncoding.default`, falling back to the original request if encoding throws an error. Sources: [Tests/URLProtocolTests.swift:68-78](https://github.com/Alamofire/Alamofire/blob/main/Tests/URLProtocolTests.swift#L68-L78)
3. **`startLoading()`**: Copies the request into an `NSMutableURLRequest`, injects the bypass property marker via `URLProtocol.setProperty(_:forKey:in:)`, initializes an ephemeral session data task, and resumes it. Sources: [Tests/URLProtocolTests.swift:86-92](https://github.com/Alamofire/Alamofire/blob/main/Tests/URLProtocolTests.swift#L86-L92)
4. **`stopLoading()`**: Cancels the active `URLSessionTask` if loading is aborted. Sources: [Tests/URLProtocolTests.swift:94-96](https://github.com/Alamofire/Alamofire/blob/main/Tests/URLProtocolTests.swift#L94-L96)

> [!CAUTION]
> Failing to tag forwarded requests with a custom `URLProtocol` property (such as `HandledByProxyURLProtocol`) will cause `canInit(with:)` to endlessly re-intercept its own outgoing requests, resulting in infinite recursion and stack overflow crashes. Sources: [Tests/URLProtocolTests.swift:51-66](https://github.com/Alamofire/Alamofire/blob/main/Tests/URLProtocolTests.swift#L51-L66), [Tests/URLProtocolTests.swift:88-89](https://github.com/Alamofire/Alamofire/blob/main/Tests/URLProtocolTests.swift#L88-L89)

### URLProtocol Methods and Properties Reference

| Name | Type / Signature | Purpose | Sources |
|------|------------------|---------|---------|
| `HandledByProxyURLProtocol` | String Constant | Property key stored in request metadata to prevent recursive interception loops. | [Tests/URLProtocolTests.swift:32-34](https://github.com/Alamofire/Alamofire/blob/main/Tests/URLProtocolTests.swift#L32-L34) |
| `canInit(with:)` | Class Method (`URLRequest` / `URLSessionTask`) | Determines if the protocol should handle the request based on the presence of the recursion-guard property. | [Tests/URLProtocolTests.swift:51-66](https://github.com/Alamofire/Alamofire/blob/main/Tests/URLProtocolTests.swift#L51-L66) |
| `canonicalKey(for:)` | Class Method (`URLRequest`) | Normalizes request headers and parameters prior to loading. | [Tests/URLProtocolTests.swift:68-78](https://github.com/Alamofire/Alamofire/blob/main/Tests/URLProtocolTests.swift#L68-L78) |
| `requestIsCacheEquivalent(_:to:)` | Class Method (`URLRequest`, `URLRequest`) | Compares two requests for cache equivalence; returns `false` in `ProxyURLProtocol`. | [Tests/URLProtocolTests.swift:80-82](https://github.com/Alamofire/Alamofire/blob/main/Tests/URLProtocolTests.swift#L80-L82) |
| `startLoading()` | Instance Method | Marks the request, creates an ephemeral session data task, and starts execution. | [Tests/URLProtocolTests.swift:86-92](https://github.com/Alamofire/Alamofire/blob/main/Tests/URLProtocolTests.swift#L86-L92) |
| `stopLoading()` | Instance Method | Cancels the active session task upon cancellation or completion. | [Tests/URLProtocolTests.swift:94-96](https://github.com/Alamofire/Alamofire/blob/main/Tests/URLProtocolTests.swift#L94-L96) |

Sources: [Tests/URLProtocolTests.swift:29-97](https://github.com/Alamofire/Alamofire/blob/main/Tests/URLProtocolTests.swift#L29-L97)

### Test Suite Integration Pattern

`URLProtocolTestCase` subclasses `BaseTestCase` to verify that custom `URLProtocol` implementations successfully interact with Alamofire's `Session` configuration, passing request-level headers and session-level configuration headers through the proxy stack. Sources: [Tests/URLProtocolTests.swift:123-142](https://github.com/Alamofire/Alamofire/blob/main/Tests/URLProtocolTests.swift#L123-L142)

```swift
class URLProtocolTestCase: BaseTestCase {
    var manager: Session!

    override func setUp() {
        super.setUp()

        manager = {
            let configuration: URLSessionConfiguration = {
                let configuration = URLSessionConfiguration.default
                configuration.protocolClasses = [ProxyURLProtocol.self]
                configuration.headers["Session-Configuration-Header"] = "foo"

                return configuration
            }()

            return Session(configuration: configuration)
        }()
    }

    @MainActor
    func testThatURLProtocolReceivesRequestHeadersAndSessionConfigurationHeaders() {
        let endpoint = Endpoint.responseHeaders.modifying(\.headers, to: ["Request-Header": "foobar"])
        let expectation = expectation(description: "GET request should succeed")
        var response: DataResponse<Data?, AFError>?

        manager.request(endpoint)
            .response { resp in
                response = resp
                expectation.fulfill()
            }

        waitForExpectations(timeout: timeout)

        XCTAssertNotNil(response?.request)
        XCTAssertNotNil(response?.response)
        XCTAssertNotNil(response?.data)
        XCTAssertNil(response?.error)
        XCTAssertEqual(response?.response?.headers["Request-Header"], "foobar")
        XCTAssertEqual(response?.response?.headers["Session-Configuration-Header"], "foo")
    }
}
```

Sources: [Tests/URLProtocolTests.swift:123-172](https://github.com/Alamofire/Alamofire/blob/main/Tests/URLProtocolTests.swift#L123-L172)

## Session Management and Request Verification

### Overview

Alamofire's test suite verifies session-level mass actions, request lifetime states, and task creation handlers through dedicated test cases in `SessionTests.swift` and `RequestTests.swift`. These tests ensure that sessions correctly manage active requests, handle request retries and adaptations, and propagate state changes across both eager and lazy request setups. Sources: [Tests/SessionTests.swift:1702-2025](https://github.com/Alamofire/Alamofire/blob/main/Tests/SessionTests.swift#L1702-L2025), [Tests/RequestTests.swift:30-84](https://github.com/Alamofire/Alamofire/blob/main/Tests/RequestTests.swift#L30-L84)

### Session Mass Actions and Request Lifecycle Verification

The `SessionMassActionTestCase` suite validates that batch operations such as request suspension and cancellation execute correctly across large collections of active tasks. When multiple requests are spawned with eager task creation (`requestSetup: .eager`), event monitors capture task creation events before batch modifiers execute. Sources: [Tests/SessionTests.swift:1702-1726](https://github.com/Alamofire/Alamofire/blob/main/Tests/SessionTests.swift#L1702-L1726)

```swift
final class SessionMassActionTestCase: BaseTestCase {
    func testThatRequestsCanHaveMassActionsPerformed() {
        let count = 10
        let createdTasks = expectation(description: "all tasks created")
        createdTasks.expectedFulfillmentCount = count
        let massActions = expectation(description: "cancel all requests should be called")
        let monitor = ClosureEventMonitor()
        monitor.requestDidCreateTask = { _, _ in createdTasks.fulfill() }
        let session = Session(requestSetup: .eager, eventMonitors: [monitor])
        let request = Endpoint.delay(1)
        var requests: [DataRequest] = []

        requests = (0..<count).map { _ in session.request(request) }

        wait(for: [createdTasks], timeout: timeout)

        session.withAllRequests { $0.forEach { $0.suspend() }; massActions.fulfill() }

        wait(for: [massActions], timeout: timeout)

        XCTAssertTrue(requests.allSatisfy(\.isSuspended))
    }
}
```

Sources: [Tests/SessionTests.swift:1702-1726](https://github.com/Alamofire/Alamofire/blob/main/Tests/SessionTests.swift#L1702-L1726)

> [!NOTE]
> When testing mass cancellation via `session.cancelAllRequests`, the test checks that both `requestTaskMap` and `activeRequests` are completely emptied on the session's `rootQueue` once all underlying tasks finish and report metrics. Sources: [Tests/SessionTests.swift:1767-1773](https://github.com/Alamofire/Alamofire/blob/main/Tests/SessionTests.swift#L1767-L1773)

### Task Creation Handlers and Request States

Request state transitions are governed by session configuration flags like `startRequestsImmediately`. When set to `false`, tasks remain unresumed until explicitly called or configured via automatic resume flags. Sources: [Tests/SessionTests.swift:439-494](https://github.com/Alamofire/Alamofire/blob/main/Tests/SessionTests.swift#L439-L494)

| Test Method | Configuration | Behavior Verified | Sources |
|-------------|---------------|-------------------|---------|
| `testSetStartRequestsImmediatelyToFalseAndResumeRequest` | `startRequestsImmediately: false` | Explicit `.resume()` successfully fetches status code `200`. | [Tests/SessionTests.swift:439-464](https://github.com/Alamofire/Alamofire/blob/main/Tests/SessionTests.swift#L439-L464) |
| `testSetStartRequestsImmediatelyToFalseAndCancelledCallsResponseHandlers` | `startRequestsImmediately: false` | Immediate `.cancel()` on unstarted request triggers explicit cancellation error. | [Tests/SessionTests.swift:467-494](https://github.com/Alamofire/Alamofire/blob/main/Tests/SessionTests.swift#L467-L494) |
| `testThatDataRequestReceivesInitialResponse` | Default session | `.onHTTPResponse` closure intercepts `HTTPURLResponse` prior to completion. | [Tests/RequestTests.swift:56-84](https://github.com/Alamofire/Alamofire/blob/main/Tests/RequestTests.swift#L56-L84) |

Sources: [Tests/SessionTests.swift:439-494](https://github.com/Alamofire/Alamofire/blob/main/Tests/SessionTests.swift#L439-L494), [Tests/RequestTests.swift:56-84](https://github.com/Alamofire/Alamofire/blob/main/Tests/RequestTests.swift#L56-L84)

> [!WARNING]
> Cancelling a request inside an `onHTTPResponse` completion handler by calling `completionHandler(.cancel)` correctly sets `request.isCancelled` to `true` and propagates an explicitly cancelled error to the response handler. Sources: [Tests/RequestTests.swift:119-150](https://github.com/Alamofire/Alamofire/blob/main/Tests/RequestTests.swift#L119-L150)

## Cache and Redirect Handler Testing

### Overview

Testing cache behavior and redirect handling requires rigorous verification strategies that prime responses, control cache policies, and test redirection paths across requests and sessions. Alamofire's test suite achieves this through `CacheTestCase`, `RedirectHandlerTestCase`, and `StaticRedirectHandlerTests`, which validate compliance with HTTP cache directives and redirect policies.

Sources: [Tests/CacheTests.swift:29-43](https://github.com/Alamofire/Alamofire/blob/main/Tests/CacheTests.swift#L29-L43), [Tests/RedirectHandlerTests.swift:29-34](https://github.com/Alamofire/Alamofire/blob/main/Tests/RedirectHandlerTests.swift#L29-L34), [Tests/RedirectHandlerTests.swift:230-249](https://github.com/Alamofire/Alamofire/blob/main/Tests/RedirectHandlerTests.swift#L230-L249)

### Cache Testing & Response Priming

The `CacheTestCase` suite evaluates cache policies against various `Cache-Control` header values. It sets up an `URLCache` with a 50 MB memory and disk capacity (using a temporary directory path depending on the target platform), initializes an Alamofire `Session`, and primes cached responses before executing test verifications.

Sources: [Tests/CacheTests.swift:29-93](https://github.com/Alamofire/Alamofire/blob/main/Tests/CacheTests.swift#L29-L93)

The `CacheTestCase.CacheControl` enum defines the supported header variants tested:

| Case Identifier | Raw Header Value | Sources |
|-----------------|------------------|---------|
| `publicControl` | `public` | [Tests/CacheTests.swift:46-47](https://github.com/Alamofire/Alamofire/blob/main/Tests/CacheTests.swift#L46-L47) |
| `privateControl` | `private` | [Tests/CacheTests.swift:46-48](https://github.com/Alamofire/Alamofire/blob/main/Tests/CacheTests.swift#L46-L48) |
| `maxAgeNonExpired` | `max-age=3600` | [Tests/CacheTests.swift:46-49](https://github.com/Alamofire/Alamofire/blob/main/Tests/CacheTests.swift#L46-L49) |
| `maxAgeExpired` | `max-age=0` | [Tests/CacheTests.swift:46-50](https://github.com/Alamofire/Alamofire/blob/main/Tests/CacheTests.swift#L46-L50) |
| `noCache` | `no-cache` | [Tests/CacheTests.swift:46-51](https://github.com/Alamofire/Alamofire/blob/main/Tests/CacheTests.swift#L46-L51) |
| `noStore` | `no-store` | [Tests/CacheTests.swift:46-52](https://github.com/Alamofire/Alamofire/blob/main/Tests/CacheTests.swift#L46-L52) |

Sources: [Tests/CacheTests.swift:46-53](https://github.com/Alamofire/Alamofire/blob/main/Tests/CacheTests.swift#L46-L53)

Cache response priming execution follows a synchronized dispatch pattern:
1. `primeCachedResponses()` instantiates a `DispatchGroup` and a serial queue (`org.alamofire.cache-tests`).
2. Iterates over `CacheControl.allCases`, calling `dispatchGroup.enter()`.
3. Invokes `startRequest(cacheControl:queue:completion:)` which constructs the endpoint request and registers a response completion handler.
4. Captures the response `Date` header as the reference timestamp (`self.timestamps[cacheControl] = timestamp`) and calls `dispatchGroup.leave()`.
5. Waits on the dispatch group via `dispatchGroup.wait(timeout: .now() + timeout)` to guarantee all initial requests have populated the cache.

Sources: [Tests/CacheTests.swift:112-133](https://github.com/Alamofire/Alamofire/blob/main/Tests/CacheTests.swift#L112-L133)

> [!NOTE]
> Response cache validation relies on comparing the timestamp (`Date` header) of a subsequent request against the timestamp captured during initial cache priming. If a response is served from the cache, its timestamp matches the original; if fetched from the network, the timestamps differ. Sources: [Tests/CacheTests.swift:39-41](https://github.com/Alamofire/Alamofire/blob/main/Tests/CacheTests.swift#L39-L41), [Tests/CacheTests.swift:179-194](https://github.com/Alamofire/Alamofire/blob/main/Tests/CacheTests.swift#L179-L194)

### Redirect Handler Testing

The `RedirectHandlerTestCase` and `StaticRedirectHandlerTests` classes verify that redirect policies can be configured per request, per session, or created statically from protocols.

Sources: [Tests/RedirectHandlerTests.swift:29-34](https://github.com/Alamofire/Alamofire/blob/main/Tests/RedirectHandlerTests.swift#L29-L34), [Tests/RedirectHandlerTests.swift:118-123](https://github.com/Alamofire/Alamofire/blob/main/Tests/RedirectHandlerTests.swift#L118-L123), [Tests/RedirectHandlerTests.swift:230-249](https://github.com/Alamofire/Alamofire/blob/main/Tests/RedirectHandlerTests.swift#L230-L249)

| Test Case Method | Configuration / Approach | Verified Outcome | Sources |
|------------------|-------------------------|------------------|---------|
| `testThatRequestRedirectHandlerCanFollowRedirects` | Per-request `.redirect(using: Redirector.follow)` | Follows redirect to `/get`, returns status code `200`. | [Tests/RedirectHandlerTests.swift:37-61](https://github.com/Alamofire/Alamofire/blob/main/Tests/RedirectHandlerTests.swift#L37-L61) |
| `testThatRequestRedirectHandlerCanNotFollowRedirects` | Per-request `.redirect(using: Redirector.doNotFollow)` | Stops at redirect endpoint, returns status code `302` with nil data. | [Tests/RedirectHandlerTests.swift:63-87](https://github.com/Alamofire/Alamofire/blob/main/Tests/RedirectHandlerTests.swift#L63-L87) |
| `testThatRequestRedirectHandlerCanModifyRedirects` | Per-request custom `Redirector(behavior: .modify { ... })` | Redirects to a custom `.patch` endpoint, returning status code `200`. | [Tests/RedirectHandlerTests.swift:90-116](https://github.com/Alamofire/Alamofire/blob/main/Tests/RedirectHandlerTests.swift#L90-L116) |
| `testThatSessionRedirectHandlerCanFollowRedirects` | Session-level `Session(redirectHandler: Redirector.follow)` | Follows redirect globally across session requests. | [Tests/RedirectHandlerTests.swift:120-144](https://github.com/Alamofire/Alamofire/blob/main/Tests/RedirectHandlerTests.swift#L120-L144) |
| `testThatRequestRedirectHandlerIsPrioritizedOverSessionRedirectHandler` | Session configured with `.doNotFollow`, request overridden with `.follow` | Request-level redirect handler takes precedence over session-level settings. | [Tests/RedirectHandlerTests.swift:203-227](https://github.com/Alamofire/Alamofire/blob/main/Tests/RedirectHandlerTests.swift#L203-L227) |

Sources: [Tests/RedirectHandlerTests.swift:37-144](https://github.com/Alamofire/Alamofire/blob/main/Tests/RedirectHandlerTests.swift#L37-L144), [Tests/RedirectHandlerTests.swift:203-227](https://github.com/Alamofire/Alamofire/blob/main/Tests/RedirectHandlerTests.swift#L203-L227)

> [!WARNING]
> When testing custom redirect modification via `Redirector(behavior: .modify { _, _, _ in customRedirectEndpoint.urlRequest })`, returning a modified `URLRequest` redirects execution flow to the newly provided endpoint instead of the server-supplied location header. Sources: [Tests/RedirectHandlerTests.swift:90-116](https://github.com/Alamofire/Alamofire/blob/main/Tests/RedirectHandlerTests.swift#L90-L116), [Tests/RedirectHandlerTests.swift:173-199](https://github.com/Alamofire/Alamofire/blob/main/Tests/RedirectHandlerTests.swift#L173-L199)

## Test Utilities and Helper Infrastructure

### Overview

The Alamofire test suite relies on a comprehensive utility and helper infrastructure to construct test endpoints, model HTTP interactions, and convert testing representations into fully fledged requests. These utilities are defined in `Tests/TestHelpers.swift` and complemented by documentation metadata provided in `docs/docsets/Alamofire.docset/Contents/Resources/Documents/index.html`. 

Sources: [Tests/TestHelpers.swift:28-313](https://github.com/Alamofire/Alamofire/blob/main/Tests/TestHelpers.swift#L28-L313), [docs/docsets/Alamofire.docset/Contents/Resources/Documents/index.html:1-26](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/index.html#L1-L26)

### URL and Endpoint Conversion Infrastructure

The `Endpoint` structure models test server paths, parameters, query items, and authentication schemes, conforming directly to `URLConvertible` and `URLRequestConvertible`. 

Sources: [Tests/TestHelpers.swift:37-331](https://github.com/Alamofire/Alamofire/blob/main/Tests/TestHelpers.swift#L37-L331)

| Conversion Protocol | Conforming Type | Implementation Method | Purpose | Sources |
|---------------------|-----------------|-----------------------|---------|---------|
| `URLConvertible` | `Endpoint` | `asURL() throws -> URL` | Constructs `URLComponents` using scheme, port, host, path, and query items. | [Tests/TestHelpers.swift:315-331](https://github.com/Alamofire/Alamofire/blob/main/Tests/TestHelpers.swift#L315-L331) |
| `URLRequestConvertible` | `Endpoint` | `asURLRequest() throws -> URLRequest` | Instantiates a `URLRequest` via `asURL()` and assigns method, headers, timeout, and cache policy. | [Tests/TestHelpers.swift:301-313](https://github.com/Alamofire/Alamofire/blob/main/Tests/TestHelpers.swift#L301-L313) |
| `URLRequestConvertible` | `EndpointSequence` | `asURLRequest() throws -> URLRequest` | Thread-safely dequeues and returns the next `Endpoint` as a `URLRequest` from a protected array. | [Tests/TestHelpers.swift:333-347](https://github.com/Alamofire/Alamofire/blob/main/Tests/TestHelpers.swift#L333-L347) |

Sources: [Tests/TestHelpers.swift:301-347](https://github.com/Alamofire/Alamofire/blob/main/Tests/TestHelpers.swift#L301-L347)

### Endpoint Call-Chain Execution Walkthrough

When an `Endpoint` is passed directly into a `Session` request method, Alamofire executes a precise conversion and dispatch call chain:

1. The caller invokes a `Session` extension helper such as `Session.request(_ endpoint: Endpoint, interceptor: ...)`.
2. The method casts the `Endpoint` to `(any URLRequestConvertible)`.
3. The underlying `Session.request` calls `endpoint.asURLRequest()`, which invokes `endpoint.asURL()` to build the absolute `URL` via `URLComponents`.
4. The resulting `URLRequest` is passed to the core request dispatcher along with the configured `HTTPMethod`, `HTTPHeaders`, `timeoutInterval`, and `cachePolicy`.

Sources: [Tests/TestHelpers.swift:301-313](https://github.com/Alamofire/Alamofire/blob/main/Tests/TestHelpers.swift#L301-L313), [Tests/TestHelpers.swift:355-392](https://github.com/Alamofire/Alamofire/blob/main/Tests/TestHelpers.swift#L355-L392)

> [!NOTE]
> `EndpointSequence` uses a `Protected<[Endpoint]>` wrapper to manage sequential multi-request tests. Calling `asURLRequest()` removes and returns the first endpoint in the array thread-safely; attempting to draw from an exhausted sequence throws `EndpointSequence.Error.noRemainingEndpoints`. Sources: [Tests/TestHelpers.swift:333-347](https://github.com/Alamofire/Alamofire/blob/main/Tests/TestHelpers.swift#L333-L347)

### Docset Metadata Context

The Alamofire documentation package index defines navigation structures, classes, enumerations, extensions, and protocols exposed across the public API. It establishes the reference workspace version (`Alamofire 5.12.0 Docs`) and links external resources such as the GitHub repository and Dash feed.

Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/index.html:20-47](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/index.html#L20-L47)

## Related

- [[Session Management]]
- [[Request Lifecycle]]

