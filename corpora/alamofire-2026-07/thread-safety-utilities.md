# Thread Safety Utilities

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [Tests/ProtectedTests.swift](https://github.com/Alamofire/Alamofire/blob/main/Tests/ProtectedTests.swift)
- [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Protocols/AlamofireExtended.html](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Protocols/AlamofireExtended.html)
- [docs/Protocols/AlamofireExtended.html](https://github.com/Alamofire/Alamofire/blob/main/docs/Protocols/AlamofireExtended.html)
- [Source/Core/Protected.swift](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Protected.swift)
- [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions.html](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions.html)
- [Source/Core/Request.swift](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Request.swift)
- [Source/Features/ServerTrustEvaluation.swift](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/ServerTrustEvaluation.swift)
</details>

## Overview

Alamofire provides thread safety utilities centered around the `Protected` property wrapper and low-level synchronization primitives to ensure atomic state access across concurrent operations. By managing thread-safe reads and writes, these utilities prevent data races within core network requests and component lifecycles.

Sources: [Source/Core/Protected.swift:83-124](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Protected.swift#L83-L124)

## Protected Property Wrapper Architecture

### Protected Property Wrapper Architecture

### Overview

The `Protected<Value>` final class acts as a thread-safe container, wrapping state and coordinating atomic access through an internal synchronization lock. It provides targeted methods (`read`, `write`, and `write(_:)`) that safely expose the underlying value exclusively inside synchronized closures.

Sources: [Source/Core/Protected.swift:83-124](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Protected.swift#L83-L124)

### Lock Abstraction and Around Execution

The underlying synchronization mechanism is governed by the private `Lock` protocol, which requires conformance to `Sendable` and defines `lock()` and `unlock()` methods. An extension on `Lock` provides two overloaded `around` methods that execute closures safely using a `defer` block to guarantee that the lock is released even if the closure throws an error.

```swift
extension Lock {
    func around<T>(_ closure: () throws -> T) rethrows -> T {
        lock(); defer { unlock() }
        return try closure()
    }

    func around(_ closure: () throws -> Void) rethrows {
        lock(); defer { unlock() }
        try closure()
    }
}
```
Sources: [Source/Core/Protected.swift:27-50](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Protected.swift#L27-L50)

Platform compilation directives determine the concrete lock type stored within `Protected<Value>`. On Darwin platforms, it instantiates an `UnfairLock`, while non-Darwin platforms utilizing Foundation extend `NSLock` to conform to `Lock`.

```swift
final class Protected<Value> {
    #if canImport(Darwin)
    private let lock = UnfairLock()
    #elseif canImport(Foundation)
    private let lock = NSLock()
    #else
    #error("This platform needs a Lock-conforming type without Foundation.")
    #endif

    private nonisolated(unsafe) var value: Value

    init(_ value: Value) {
        self.value = value
    }
}
```
Sources: [Source/Core/Protected.swift:84-97](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Protected.swift#L84-L97)

### Atomic State Access and Mutating Operations

State inspection and modification flow through `read` and `write` methods on `Protected`. The `read` function accepts a closure taking an immutable reference to the value and returns the generated result, wrapping the execution in `lock.around`. Similarly, `write` accepts an inout closure for modifications or directly takes a new `Value` instance to overwrite the existing state.

```swift
    func read<U>(_ closure: (Value) throws -> U) rethrows -> U {
        try lock.around { try closure(self.value) }
    }

    @discardableResult
    func write<U>(_ closure: (inout Value) throws -> U) rethrows -> U {
        try lock.around { try closure(&self.value) }
    }

    func write(_ value: Value) {
        write { $0 = value }
    }
```
Sources: [Source/Core/Protected.swift:99-123](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Protected.swift#L99-L123)

> [!NOTE]
> The internal `value` property is declared with `private nonisolated(unsafe) var`, shifting safety enforcement entirely onto the synchronization wrapper methods rather than Swift's default actor isolation rules.

Sources: [Source/Core/Protected.swift:93](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Protected.swift#L93)

### Protocol Conformance Extensions

`Protected` extends its capabilities when the generic `Value` conforms to specific standard library protocols. It implements `Equatable` by concurrently reading both left and right protected instances, and `Hashable` by combining the protected value into a hasher inside a read lock.

```swift
extension Protected: Equatable where Value: Equatable {
    static func ==(lhs: Protected<Value>, rhs: Protected<Value>) -> Bool {
        lhs.read { left in rhs.read { right in left == right }}
    }
}

extension Protected: Hashable where Value: Hashable {
    func hash(into hasher: inout Hasher) {
        read { hasher.combine($0) }
    }
}
```
Sources: [Source/Core/Protected.swift:154-164](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Protected.swift#L154-L164)

## Concurrent Access and Lock Implementations

### Overview

Low-level lock primitives underpin atomic reads and writes in Alamofire's concurrency utilities, bridging platform-specific APIs into a unified `Lock` protocol interface. On Darwin platforms, `UnfairLock` wraps `os_unfair_lock`, managing heap allocation and initialization for low-overhead, non-reentrant mutual exclusion. On non-Darwin platforms possessing Foundation, `NSLock` is extended directly to conform to `Lock`.

Sources: [Source/Core/Protected.swift:27-30](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Protected.swift#L27-L30), [Source/Core/Protected.swift:52-81](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Protected.swift#L52-L81)

### UnfairLock Implementation Mechanics

The `UnfairLock` class is declared as a final, unchecked `Sendable` type that manages a raw pointer to an `os_unfair_lock` structure. During initialization, capacity for a single `os_unfair_lock` is allocated on the heap and initialized in place. Upon deinitialization, the underlying lock is deinitialized and its memory deallocated. 

```swift
final class UnfairLock: Lock, @unchecked Sendable {
    private let unfairLock: os_unfair_lock_t

    init() {
        unfairLock = .allocate(capacity: 1)
        unfairLock.initialize(to: os_unfair_lock())
    }

    deinit {
        unfairLock.deinitialize(count: 1)
        unfairLock.deallocate()
    }

    fileprivate func lock() {
        os_unfair_lock_lock(unfairLock)
    }

    fileprivate func unlock() {
        os_unfair_lock_unlock(unfairLock)
    }
}
```
Sources: [Source/Core/Protected.swift:55-75](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Protected.swift#L55-L75)

> [!WARNING]
> `os_unfair_lock` is not reentrant. Attempting to acquire an `UnfairLock` recursively from the same thread will result in an immediate deadlock.

Sources: [Source/Core/Protected.swift:55-75](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Protected.swift#L55-L75)

### Lock Primitives Reference

The following table summarizes the concrete lock implementations utilized across different compilation targets by the concurrency subsystem.

| Lock Type | Underlying API | Platform Target | Conformance Mechanism |
| :--- | :--- | :--- | :--- |
| `UnfairLock` | `os_unfair_lock` / `os_unfair_lock_t` | Darwin (`canImport(Darwin)`) | Explicit `Lock` conformance with manual memory allocation |
| `NSLock` | `Foundation.NSLock` | Non-Darwin with Foundation (`canImport(Foundation)`) | Protocol extension conformance (`extension NSLock: Lock {}`) |

Sources: [Source/Core/Protected.swift:52-81](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Protected.swift#L52-L81)

## Thread-Safe State Synchronization in Requests

### Overview

Alamofire integrates `Protected` synchronization directly into the `Request` execution lifecycle through the `MutableState` structure, ensuring thread-safe access to request properties, task lists, and lifecycle flags across concurrent dispatch queues. Rather than relying on actor isolation, `Request` encapsulates all mutable properties inside a single `Protected<MutableState>` instance, exposing fine-grained read and write accessors for status transitions, progress handling, and response serialization queues.

Sources: [Source/Core/Request.swift:93-144](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Request.swift#L93-L144)

### Request State Transitions and Protected Extensions

The `Protected` wrapper provides specialized extensions for `Request.MutableState`, allowing atomic state transitions guarded by lock acquisition. The `attemptToTransitionTo(_:)` method checks valid state pathways against the request state machine before modifying the internal state value.

```swift
extension Protected where Value == Request.MutableState {
    func attemptToTransitionTo(_ state: Request.State) -> Bool {
        lock.around {
            guard value.state.canTransitionTo(state) else { return false }
            value.state = state
            return true
        }
    }

    func withState(perform: (Request.State) -> Void) {
        lock.around { perform(value.state) }
    }
}
```
Sources: [Source/Core/Protected.swift:130-152](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Protected.swift#L130-L152)

> [!WARNING]
> Once a `Request` enters the `.cancelled` or `.finished` state, state transition guards prevent it from moving to any other state, ensuring terminal states cannot be overwritten by concurrent network callbacks.

Sources: [Source/Core/Request.swift:49-64](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Request.swift#L49-L64)

### Request Lifecycle State Machine

The `Request.State` enum defines the valid states and transition rules governing request execution. Each state dictates how underlying tasks and completion handlers behave.

| State | Value Meaning | Valid Subsequent States |
| :--- | :--- | :--- |
| `.initialized` | Initial state of the `Request` before task creation or resumption. | `.resumed`, `.suspended`, `.cancelled`, `.finished` |
| `.resumed` | Set when `resume()` is called; underlying tasks are resumed. | `.suspended`, `.cancelled`, `.finished` |
| `.suspended` | Set when `suspend()` is called; underlying tasks are suspended. | `.resumed`, `.cancelled`, `.finished` |
| `.cancelled` | Set when `cancel()` is called; terminal state preventing further transitions. | None |
| `.finished` | Set when response serialization completion closures have been cleared. | None |

Sources: [Source/Core/Request.swift:32-64](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Request.swift#L32-L64)

### Response Serialization and Completion Call-Chain

When a network task completes or response serializers are processed, Alamofire executes a precise synchronization sequence to handle serialization queues and cleanup handlers without causing re-entrancy deadlocks. 

The serialization call-chain proceeds as follows:
`processNextResponseSerializer()` evaluates `mutableState.write` to check `isResponseSerializerEnqueued` → if free, it extracts the next closure from `responseSerializers` at index `responseSerializerCompletions.count` → sets `isResponseSerializerEnqueued = true` and returns a closure dispatching to `serializationQueue.async` → if no serializers remain, it captures completion closures, clears `responseSerializers` and `responseSerializerCompletions` inside the lock before invocation, transitions state to `.finished`, and executes `cleanup()` outside the lock.

```swift
func processNextResponseSerializer() {
    let executeOutside: (() -> Void)? = mutableState.write { mutableState in
        guard !mutableState.isResponseSerializerEnqueued else { return nil }

        let responseSerializerIndex = mutableState.responseSerializerCompletions.count
        let isAvailableSerializer = responseSerializerIndex < mutableState.responseSerializers.count
        let responseSerializer = isAvailableSerializer ? mutableState.responseSerializers[responseSerializerIndex] : nil

        if let responseSerializer {
            mutableState.isResponseSerializerEnqueued = true
            return { self.serializationQueue.async { responseSerializer() } }
        } else {
            let completions = mutableState.responseSerializerCompletions
            mutableState.responseSerializers.removeAll()
            mutableState.responseSerializerCompletions.removeAll()

            if mutableState.state.canTransitionTo(.finished) {
                mutableState.state = .finished
            }

            mutableState.responseSerializerProcessingFinished = true
            mutableState.isFinishing = false

            return {
                completions.forEach { $0() }
                self.cleanup()
            }
        }
    }

    executeOutside?()
}
```
Sources: [Source/Core/Request.swift:613-650](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Request.swift#L613-L650)

> [!IMPORTANT]
> Response serializer completion closures are cleared from `mutableState` *prior* to invoking them outside the lock. This design prevents re-entrancy deadlocks and crashes in case a completion closure synchronously calls `cancel()` or triggers another request modification.

Sources: [Source/Core/Request.swift:625-632](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/Request.swift#L625-L632)

## AlamofireExtended Namespace Isolation

### Overview

Alamofire provides safe, isolated API surface access across types through the `AlamofireExtended` protocol and its associated generic namespace container structure. This design isolates custom properties and extension methods under a dedicated namespace property named `af`, preventing namespace pollution on standard system types and standard library classes while offering unified syntax for static and instance contexts.

Sources: [docs/Protocols/AlamofireExtended.html:573-582](https://github.com/Alamofire/Alamofire/blob/main/docs/Protocols/AlamofireExtended.html#L573-L582), [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Protocols/AlamofireExtended.html:573-582](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Protocols/AlamofireExtended.html#L573-L582)

### Protocol Architecture and Requirements

The `AlamofireExtended` protocol defines an associated type representing the receiver and requires both static and instance extension properties named `af` wrapped inside the `AlamofireExtension` generic container.

| Requirement | Type / Signature | Purpose |
| :--- | :--- | :--- |
| `ExtendedType` | `associatedtype` | Specifies the underlying type being extended by the namespace wrapper. |
| `af` (Static) | `static var af: AlamofireExtension<ExtendedType>.Type` | Provides static extension access on the extended type level. |
| `af` (Instance) | `var af: AlamofireExtension<ExtendedType>` | Provides instance-level extension access on individual objects. |

Sources: [docs/Protocols/AlamofireExtended.html:593-670](https://github.com/Alamofire/Alamofire/blob/main/docs/Protocols/AlamofireExtended.html#L593-L670), [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Protocols/AlamofireExtended.html:593-670](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Protocols/AlamofireExtended.html#L593-L670)

### Conforming System and Library Types

Alamofire extends several foundational system types and framework primitives to conform to `AlamofireExtended`, bringing isolated extension points to configuration objects, security tokens, and collection utilities.

- `Bundle`
- `SecTrust`
- `SecPolicy`
- `Array`
- `SecCertificate`
- `OSStatus`
- `SecTrustResultType`
- `URLSessionConfiguration`

Sources: [docs/Extensions.html:697-698](https://github.com/Alamofire/Alamofire/blob/main/docs/Extensions.html#L697-L698), [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions.html:934-1090](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions.html#L934-L1090)

> [!NOTE]
> Conforming types receive default protocol extensions providing public `af` static variables (`public static var af: AlamofireExtension<Self>.Type`) and instance properties (`public var af: AlamofireExtension<Self>`) automatically.

Sources: [docs/Protocols/AlamofireExtended.html:674-730](https://github.com/Alamofire/Alamofire/blob/main/docs/Protocols/AlamofireExtended.html#L674-L730), [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Protocols/AlamofireExtended.html:674-730](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Protocols/AlamofireExtended.html#L674-L730)

## Verification and High Contention Testing

### Overview

Concurrency validation and test coverage under high thread contention are verified in Alamofire through dedicated test suites that simulate concurrent readers and writers using `DispatchQueue.concurrentPerform` and concurrent asynchronous dispatch blocks. These tests ensure that `Protected<T>` instances maintain data integrity, avoid race conditions, and correctly synchronize state when heavily contested across multiple concurrent execution queues.

Sources: [Tests/ProtectedTests.swift:30-43](https://github.com/Alamofire/Alamofire/blob/main/Tests/ProtectedTests.swift#L30-L43), [Tests/ProtectedTests.swift:113-151](https://github.com/Alamofire/Alamofire/blob/main/Tests/ProtectedTests.swift#L113-L151)

### High Contention Test Suite Structure

The high contention test suite validates overlapping read and write transactions against shared `Protected` containers using specialized state containers and multiple background queues.

| Test Class / Component | Properties / States | Purpose |
| :--- | :--- | :--- |
| `ProtectedTests` | `protected: Protected<String>` | Exercises basic concurrent reads and writes over 10,000 iterations. |
| `ProtectedWrapperTests` | `value: Protected<String>` | Validates property-wrapper-backed state access safety under concurrent dispatch iterations. |
| `ProtectedHighContentionTests` | `stringContainer: Protected<StringContainer>` | Manages a shared array of test strings subject to simultaneous mutations and inspections. |
| `StringContainerWriteState` | `results: [Int]`, `completedWrites: Int`, `queue1Complete`, `queue2Complete` | Tracks completion metrics and operation results across parallel writer queues. |
| `StringContainerReadState` | `results1: [Int]`, `results2: [Int]`, `queue1Complete`, `queue2Complete` | Accumulates parallel reader outputs from separate reader dispatch queues. |

Sources: [Tests/ProtectedTests.swift:29-59](https://github.com/Alamofire/Alamofire/blob/main/Tests/ProtectedTests.swift#L29-L59), [Tests/ProtectedTests.swift:61-83](https://github.com/Alamofire/Alamofire/blob/main/Tests/ProtectedTests.swift#L61-L83), [Tests/ProtectedTests.swift:85-112](https://github.com/Alamofire/Alamofire/blob/main/Tests/ProtectedTests.swift#L85-L112)

> [!NOTE]
> `ProtectedHighContentionTests` runs 4,000 parallel writes across two distinct writer queues (`com.alamofire.testWriterQueue1` and `com.alamofire.testWriterQueue2`) while simultaneously executing 10,000 parallel reads across dual reader queues, validating thread-safe state synchronization under heavy system load.

Sources: [Tests/ProtectedTests.swift:113-141](https://github.com/Alamofire/Alamofire/blob/main/Tests/ProtectedTests.swift#L113-L141), [Tests/ProtectedTests.swift:153-156](https://github.com/Alamofire/Alamofire/blob/main/Tests/ProtectedTests.swift#L153-L156), [Tests/ProtectedTests.swift:211-212](https://github.com/Alamofire/Alamofire/blob/main/Tests/ProtectedTests.swift#L211-L212)

## Related

- [[Session Management]]
- [[Foundation Extensions]]

