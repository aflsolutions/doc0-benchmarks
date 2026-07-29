# Overview

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [README.adoc](https://github.com/resilience4j/resilience4j/blob/main/README.adoc)
- [resilience4j-feign/README.adoc](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-feign/README.adoc)
- [RELEASENOTES.adoc](https://github.com/resilience4j/resilience4j/blob/main/RELEASENOTES.adoc)
- [resilience4j-all/src/main/java/io/github/resilience4j/decorators/Decorators.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-all/src/main/java/io/github/resilience4j/decorators/Decorators.java)
- [resilience4j-circuitbreaker/src/main/java/io/github/resilience4j/circuitbreaker/CircuitBreaker.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-circuitbreaker/src/main/java/io/github/resilience4j/circuitbreaker/CircuitBreaker.java)
- [resilience4j-vavr/src/main/java/io/github/resilience4j/decorators/VavrDecorators.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-vavr/src/main/java/io/github/resilience4j/decorators/VavrDecorators.java)
- [resilience4j-spring-boot3/README.adoc](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring-boot3/README.adoc)
- [resilience4j-spring-boot4/README.adoc](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring-boot4/README.adoc)
- [resilience4j-micrometer/README.adoc](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micrometer/README.adoc)
- [CONTRIBUTING.adoc](https://github.com/resilience4j/resilience4j/blob/main/CONTRIBUTING.adoc)
- [resilience4j-spring6/README.adoc](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring6/README.adoc)
</details>

## Overview

Resilience4j is a lightweight fault tolerance library engineered specifically for functional programming in Java. It provides higher-order functions and decorators to enhance lambda expressions, method references, and functional interfaces with robust resilience patterns like circuit breakers, rate limiters, retries, and bulkheads. By allowing developers to selectively stack only the required decorators, Resilience4j ensures a modular and unopinionated approach to service protection.

Sources: [README.adoc:30-36](https://github.com/resilience4j/resilience4j/blob/main/README.adoc#L30-L36)

## Functional Composition API

### Functional Composition API

### Overview

Resilience4j provides high-level functional composition APIs through `Decorators` and `VavrDecorators` to chain multiple fault tolerance mechanisms onto standard Java and Vavr functional interfaces in a clean, fluent builder pattern. Instead of manually nesting functional wrappers, developers can construct a stacked execution pipeline where each decorator wraps the previous one in the order of the builder chain. 

Sources: [resilience4j-all/src/main/java/io/github/resilience4j/decorators/Decorators.java:22-42](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-all/src/main/java/io/github/resilience4j/decorators/Decorators.java#L22-L42), [resilience4j-vavr/src/main/java/io/github/resilience4j/decorators/VavrDecorators.java:41-53](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-vavr/src/main/java/io/github/resilience4j/decorators/VavrDecorators.java#L41-L53)

### Standard Decorators API

The `Decorators` utility class in `resilience4j-all` exposes static factory methods to wrap standard Java functional types into dedicated builder classes. These builders support timers, circuit breakers, retries, rate limiters, caches, bulkheads, thread pool bulkheads, time limiters, and fallback handlers.

Sources: [resilience4j-all/src/main/java/io/github/resilience4j/decorators/Decorators.java:43-85](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-all/src/main/java/io/github/resilience4j/decorators/Decorators.java#L43-L85)

| Factory Method | Builder Class | Target Functional Interface |
| :--- | :--- | :--- |
| `ofSupplier(Supplier)` | `DecorateSupplier<T>` | `java.util.function.Supplier<T>` |
| `ofFunction(Function)` | `DecorateFunction<T, R>` | `java.util.function.Function<T, R>` |
| `ofRunnable(Runnable)` | `DecorateRunnable` | `java.lang.Runnable` |
| `ofCallable(Callable)` | `DecorateCallable<T>` | `java.util.concurrent.Callable<T>` |
| `ofCheckedSupplier(CheckedSupplier)` | `DecorateCheckedSupplier<T>` | `io.github.resilience4j.core.functions.CheckedSupplier<T>` |
| `ofCheckedFunction(CheckedFunction)` | `DecorateCheckedFunction<T, R>` | `io.github.resilience4j.core.functions.CheckedFunction<T, R>` |
| `ofCheckedRunnable(CheckedRunnable)` | `DecorateCheckedRunnable` | `io.github.resilience4j.core.functions.CheckedRunnable` |
| `ofCheckedConsumer(CheckedConsumer)` | `DecorateCheckedConsumer<T>` | `io.github.resilience4j.core.functions.CheckedConsumer<T>` |
| `ofCompletionStage(Supplier)` | `DecorateCompletionStage<T>` | `java.util.function.Supplier<CompletionStage<T>>` |
| `ofConsumer(Consumer)` | `DecorateConsumer<T>` | `java.util.function.Consumer<T>` |

Sources: [resilience4j-all/src/main/java/io/github/resilience4j/decorators/Decorators.java:45-84](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-all/src/main/java/io/github/resilience4j/decorators/Decorators.java#L45-L84)

> [!NOTE]
> When executing a builder chain such as `Decorators.ofSupplier(supplier).withCircuitBreaker(cb).withRetry(retry)`, the composition order executes from the innermost wrapper outward: the Supplier runs first, its execution is monitored by the CircuitBreaker, failures are handled by the Retry wrapper, and any terminal exceptions can be caught by fallback operators.

Sources: [resilience4j-all/src/main/java/io/github/resilience4j/decorators/Decorators.java:26-41](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-all/src/main/java/io/github/resilience4j/decorators/Decorators.java#L26-L41)

### Vavr Decorators API

For applications utilizing Vavr functional types, the `VavrDecorators` interface provides matching builder abstractions that operate directly on Vavr's checked functional interfaces and integrate with Vavr-specific resilience modules.

Sources: [resilience4j-vavr/src/main/java/io/github/resilience4j/decorators/VavrDecorators.java:41-53](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-vavr/src/main/java/io/github/resilience4j/decorators/VavrDecorators.java#L41-L53)

| Factory Method | Builder Class | Target Functional Interface |
| :--- | :--- | :--- |
| `ofCheckedSupplier(CheckedFunction0)` | `DecorateCheckedSupplier<T>` | `io.vavr.CheckedFunction0<T>` |
| `ofCheckedFunction(CheckedFunction1)` | `DecorateCheckedFunction<T, R>` | `io.vavr.CheckedFunction1<T, R>` |
| `ofCheckedRunnable(CheckedRunnable)` | `DecorateCheckedRunnable` | `io.vavr.CheckedRunnable` |

Sources: [resilience4j-vavr/src/main/java/io/github/resilience4j/decorators/VavrDecorators.java:42-52](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-vavr/src/main/java/io/github/resilience4j/decorators/VavrDecorators.java#L42-L52)

> [!TIP]
> `VavrDecorators.DecorateCheckedSupplier` supports fluent attachment of resilience components including `withCircuitBreaker(CircuitBreaker)`, `withRetry(Retry)`, `withRateLimiter(RateLimiter)`, `withCache(Cache)`, `withBulkhead(Bulkhead)`, and multiple overloaded `withFallback(...)` handlers using `CheckedFunction2` and exception type predicates.

Sources: [resilience4j-vavr/src/main/java/io/github/resilience4j/decorators/VavrDecorators.java:54-123](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-vavr/src/main/java/io/github/resilience4j/decorators/VavrDecorators.java#L54-L123)

## Circuit Breaker Core Architecture

### Overview

The `CircuitBreaker` interface defines the core fault-tolerance contract in Resilience4j, managing backend system availability through a finite state machine and execution wrappers. It provides mechanisms for permission acquisition, call duration measurement, outcome recording, and explicit state transitions.

Sources: [resilience4j-circuitbreaker/src/main/java/io/github/resilience4j/circuitbreaker/CircuitBreaker.java:37-55](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-circuitbreaker/src/main/java/io/github/resilience4j/circuitbreaker/CircuitBreaker.java#L37-L55)

### Execution Wrapper Patterns

Resilience4j provides static factory methods on the `CircuitBreaker` interface to decorate standard Java functional interfaces, wrapping execution calls with permission checks and outcome reporting.

| Decoration Method | Target Functional Interface | Interception Behavior |
| :--- | :--- | :--- |
| `decorateSupplier(CircuitBreaker, Supplier)` | `java.util.function.Supplier<T>` | Acquires permission, records execution duration, reports results via `onResult` or exceptions via `onError`. |
| `decorateCheckedSupplier(CircuitBreaker, CheckedSupplier)` | `io.github.resilience4j.core.functions.CheckedSupplier<T>` | Acquires permission, measures duration, reports checked exceptions and results. |
| `decorateRunnable(CircuitBreaker, Runnable)` | `java.lang.Runnable` | Acquires permission, executes run, records success or error. |
| `decorateCallable(CircuitBreaker, Callable)` | `java.util.concurrent.Callable<T>` | Acquires permission, executes call, records result or exception. |
| `decorateFunction(CircuitBreaker, Function)` | `java.util.function.Function<T, R>` | Applies function input, measures duration, records return value. |
| `decorateConsumer(CircuitBreaker, Consumer)` | `java.util.function.Consumer<T>` | Consumes input, records success or error. |
| `decorateCompletionStage(CircuitBreaker, Supplier)` | `java.util.function.Supplier<CompletionStage<T>>` | Asynchronously acquires permission, handles completion stages, completes exceptionally on errors or call rejections. |
| `decorateFuture(CircuitBreaker, Supplier)` | `java.util.function.Supplier<Future<T>>` | Wraps futures with `CircuitBreakerFuture`, recording completion or cancelling permissions upon cancellation. |

Sources: [resilience4j-circuitbreaker/src/main/java/io/github/resilience4j/circuitbreaker/CircuitBreaker.java:66-431](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-circuitbreaker/src/main/java/io/github/resilience4j/circuitbreaker/CircuitBreaker.java#L66-L431)

### Permission Acquisition and State Management

Before communicating with a backend, execution wrappers obtain permission via `tryAcquirePermission()` or `acquirePermission()`. The circuit breaker manages state transitions across five states: `CLOSED`, `OPEN`, `HALF_OPEN`, `DISABLED`, and `FORCED_OPEN`.

> [!WARNING]
> When using asynchronous execution wrappers such as `decorateCompletionStage` or `decorateFuture`, a call rejection immediately completes the promise exceptionally with a `CallNotPermittedException` created via `CallNotPermittedException.createCallNotPermittedException(circuitBreaker)`.

Sources: [resilience4j-circuitbreaker/src/main/java/io/github/resilience4j/circuitbreaker/CircuitBreaker.java:98-103](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-circuitbreaker/src/main/java/io/github/resilience4j/circuitbreaker/CircuitBreaker.java#L98-L103)

| State Enum Constant | Order | Allow Publish | Operational Meaning |
| :--- | :--- | :--- | :--- |
| `CLOSED` | 0 | `true` | Operating normally and allowing requests through. |
| `OPEN` | 1 | `true` | Tripped due to failure rate threshold, rejecting all access. |
| `HALF_OPEN` | 2 | `true` | Wait interval elapsed; allowing test calls to probe backend recovery. |
| `DISABLED` | 3 | `false` | Not operating (no state transitions or events); allows all requests. |
| `FORCED_OPEN` | 4 | `false` | Not operating (no state transitions or events); rejects all requests. |
| `METRICS_ONLY` | 5 | `true` | Capturing metrics and publishing events; allows all requests without state transitions. |

Sources: [resilience4j-circuitbreaker/src/main/java/io/github/resilience4j/circuitbreaker/CircuitBreaker.java:815-837](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-circuitbreaker/src/main/java/io/github/resilience4j/circuitbreaker/CircuitBreaker.java#L815-L837)

## Framework Integration Modules

### Overview

Resilience4j provides integration adapters and starters for Spring Framework 6.x, Spring Boot 3, Spring Boot 4, and OpenFeign. These modules enable declarative fault tolerance using annotations, external configuration properties, and Feign capabilities APIs.

Sources: [resilience4j-feign/README.adoc:3-6](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-feign/README.adoc#L3-L6), [resilience4j-spring-boot3/README.adoc:3-4](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring-boot3/README.adoc#L3-L4), [resilience4j-spring-boot4/README.adoc:3-4](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring-boot4/README.adoc#L3-L4), [resilience4j-spring6/README.adoc:3-4](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring6/README.adoc#L3-L4)

### Spring Framework and Spring Boot Configuration

The Spring 6, Spring Boot 3, and Spring Boot 4 integration modules support switching internal Resilience4j schedulers for components such as `CircuitBreaker` and `RateLimiter` to Java virtual threads from Project Loom.

| Configuration Property | Default Value | Purpose |
| :--- | :--- | :--- |
| `resilience4j.thread.type` | platform | Switches internal schedulers to `virtual` when set to `virtual`. |
| `resilience4j.thread.metrics.enabled` | `true` | Enables automatic Micrometer metric registration for virtual thread usage. |
| `resilience4j.circuitbreaker.circuitBreakerAspectOrder` | (framework default) | Configures the aspect priority order for the circuit breaker. |
| `resilience4j.retry.retryAspectOrder` | (framework default) | Configures the aspect priority order for retry executions. |

Sources: [resilience4j-spring-boot3/README.adoc:15-18](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring-boot3/README.adoc#L15-L18), [resilience4j-spring-boot3/README.adoc:51-54](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring-boot3/README.adoc#L51-L54), [resilience4j-spring-boot3/README.adoc:72-74](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring-boot3/README.adoc#L72-L74), [resilience4j-spring6/README.adoc:18-19](https://github.com/resilience4j/resilience6/blob/main/resilience4j-spring6/README.adoc#L18-L19)

> [!WARNING]
> In Spring Boot 3, the default aspect order may cause `@Retry` to run outside of `@CircuitBreaker`, recording single retried operations as multiple failures. To ensure the circuit breaker wraps the entire retry operation, explicitly set `resilience4j.circuitbreaker.circuitBreakerAspectOrder=1` and `resilience4j.retry.retryAspectOrder=2`.

Sources: [resilience4j-spring-boot3/README.adoc:63-75](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring-boot3/README.adoc#L63-L75)

### OpenFeign Decorators and Capabilities

The `resilience4j-feign` module binds Feign with Resilience4j using the capabilities API introduced in Feign 10.9 via `Resilience4jFeign.capability()`. Decorators are constructed using `FeignDecorators` and determine the exact interception ordering based on declaration sequence.

```java
CircuitBreaker circuitBreaker = CircuitBreaker.ofDefaults("backendName");
RateLimiter rateLimiter = RateLimiter.ofDefaults("backendName");
FeignDecorators decorators = FeignDecorators.builder()
                                 .withRateLimiter(rateLimiter)
                                 .withCircuitBreaker(circuitBreaker)
                                 .build();
MyService myService = Feign.builder()
                        .addCapability(Resilience4jFeign.capability(decorators))
                        .target(MyService.class, "http://localhost:8080/");
```

Sources: [resilience4j-feign/README.adoc:17-21](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-feign/README.adoc#L17-L21), [resilience4j-feign/README.adoc:33-41](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-feign/README.adoc#L33-L41)

## Metrics and Monitoring Integration

### Overview

The `resilience4j-micrometer` module integrates fault tolerance telemetry with http://micrometer.io/[Micrometer]. It provides metric instrumentation for four core resilience components: bulkhead, circuit breaker, rate limiter, and retry.

Sources: [resilience4j-micrometer/README.adoc:1-3](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micrometer/README.adoc#L1-L3)

## Navigation and Development Resources

### Overview

Navigating the Resilience4j project requires understanding its release milestones, contribution workflows, and documentation resources. Project setup and usage instructions are maintained in the https://resilience4j.readme.io/docs[User Guide], complemented by community-led translations including https://github.com/resilience4j-docs-ja/resilience4j-docs-ja[Japanese translation by volunteers (Unofficial)] and https://github.com/lmhmhl/Resilience4j-Guides-Chinese[Chinese documentation].

Sources: [README.adoc:93-100](https://github.com/resilience4j/resilience4j/blob/main/README.adoc#L93-L100)

### Contribution Workflows

Contributions to Resilience4j follow GitHub Flow. Bug reports require a clear title, expected versus actual behavior, proper log or configuration formatting, and ideally a minimal reproduction provided as a JUnit test. New features must first be proposed via GitHub Issues before opening a Pull Request.

Sources: [CONTRIBUTING.adoc:26-37](https://github.com/resilience4j/resilience4j/blob/main/CONTRIBUTING.adoc#L26-L37), [CONTRIBUTING.adoc:46-55](https://github.com/resilience4j/resilience4j/blob/main/CONTRIBUTING.adoc#L46-L55)

When submitting code changes, contributors must follow specific project guidelines:

| Rule / Convention | Description |
| :--- | :--- |
| **Branching** | Fork the repository and create your branch from `master`. |
| **Tests & Docs** | Add tests for new code; maintain backward compatibility and `Javadoc` for public methods. |
| **Code Style** | Apply the Twitter-based coding style via `.editorconfig` (IntelliJ IDEA) and Clean Code rules. |
| **Commit Messages** | Use the required format: `Issue #699: Fixed/Added bla bla`. |
| **Test Assertions** | Use AssertJ, BDDMockito static imports, and write test bodies in the *Arrange-Act-Assert* manner. |

Sources: [CONTRIBUTING.adoc:56-65](https://github.com/resilience4j/resilience4j/blob/main/CONTRIBUTING.adoc#L56-L65), [CONTRIBUTING.adoc:70-74](https://github.com/resilience4j/resilience4j/blob/main/CONTRIBUTING.adoc#L70-L74)

> [!CAUTION]
> Even if you would like to start with a Pull Request first, please submit an issue with a proposal for your work first to ensure the changes align with project goals.

Sources: [CONTRIBUTING.adoc:46-49](https://github.com/resilience4j/resilience4j/blob/main/CONTRIBUTING.adoc#L46-L49)

### Release History

Resilience4j has evolved across major architectural iterations, transitioning from early Javaslang-based roots to a modular fault tolerance library requiring Java 21 in recent major versions.

| Version | Key Release Milestones & Changes |
| :--- | :--- |
| **0.1.0 – 0.1.7** | Initial versions introducing ignored exceptions, execution metrics, static factory builders, automatic retry, and state transition listener mechanisms. |
| **0.7.0 – 0.9.0** | Shifted root package to `io.github.resilience4j` upon leaving Javaslang; introduced RxJava integration, modularization, Prometheus metrics, and Dropwizard reporting. |
| **1.0.0 – 1.7.1** | Replaced ring buffers with sliding windows (count-based and time-based), added Spring Cloud Config support, slow response time thresholds, Micrometer instrumentation, and Kotlin Flows. |
| **2.0.0 – 2.3.0** | Upgraded to Java 17 (and later Java 21 requirements in v3), removed Vavr dependencies, added Micronaut support, introduced lock-free sliding windows, and improved virtual thread handling. |

Sources: [README.adoc:38](https://github.com/resilience4j/resilience4j/blob/main/README.adoc#L38), [RELEASENOTES.adoc:3-27](https://github.com/resilience4j/resilience4j/blob/main/RELEASENOTES.adoc#L3-L27), [RELEASENOTES.adoc:58-94](https://github.com/resilience4j/resilience4j/blob/main/RELEASENOTES.adoc#L58-L94), [RELEASENOTES.adoc:246-258](https://github.com/resilience4j/resilience4j/blob/main/RELEASENOTES.adoc#L246-L258), [RELEASENOTES.adoc:387-471](https://github.com/resilience4j/resilience4j/blob/main/RELEASENOTES.adoc#L387-L471)

## Related

- [[Quick Start]]
- [[Project Structure]]

