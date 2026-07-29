# Retry Interval Functions

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [resilience4j-framework-common/src/main/java/io/github/resilience4j/common/retry/configuration/CommonRetryConfigurationProperties.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-framework-common/src/main/java/io/github/resilience4j/common/retry/configuration/CommonRetryConfigurationProperties.java)
- [resilience4j-retry/src/main/java/io/github/resilience4j/retry/Retry.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-retry/src/main/java/io/github/resilience4j/retry/Retry.java)
- [resilience4j-retry/src/main/java/io/github/resilience4j/retry/internal/RetryImpl.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-retry/src/main/java/io/github/resilience4j/retry/internal/RetryImpl.java)
- [resilience4j-framework-common/src/main/java/io/github/resilience4j/common/circuitbreaker/configuration/CommonCircuitBreakerConfigurationProperties.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-framework-common/src/main/java/io/github/resilience4j/common/circuitbreaker/configuration/CommonCircuitBreakerConfigurationProperties.java)
- [resilience4j-core/src/main/java/io/github/resilience4j/core/IntervalFunction.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-core/src/main/java/io/github/resilience4j/core/IntervalFunction.java)
- [resilience4j-spring6/src/main/java/io/github/resilience4j/spring6/retry/configure/RetryConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring6/src/main/java/io/github/resilience4j/spring6/retry/configure/RetryConfiguration.java)
- [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/retry/configure/CommonsConfigurationRetryConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/retry/configure/CommonsConfigurationRetryConfiguration.java)
- [resilience4j-retry/src/main/java/io/github/resilience4j/retry/RetryRegistry.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-retry/src/main/java/io/github/resilience4j/retry/RetryRegistry.java)
- [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/retry/RetryRegistryFactory.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/retry/RetryRegistryFactory.java)
- [resilience4j-retry/src/main/java/io/github/resilience4j/retry/RetryConfig.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-retry/src/main/java/io/github/resilience4j/retry/RetryConfig.java)
- [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/retry/RetryInterceptor.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/retry/RetryInterceptor.java)
- [resilience4j-spring6/src/main/java/io/github/resilience4j/spring6/retry/configure/RetryAspect.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring6/src/main/java/io/github/resilience4j/spring6/retry/configure/RetryAspect.java)
- [resilience4j-vavr/src/main/java/io/github/resilience4j/retry/VavrRetry.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-vavr/src/main/java/io/github/resilience4j/retry/VavrRetry.java)
- [resilience4j-retry/src/main/java/io/github/resilience4j/retry/internal/InMemoryRetryRegistry.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-retry/src/main/java/io/github/resilience4j/retry/internal/InMemoryRetryRegistry.java)
- [resilience4j-rxjava3/src/main/java/io/github/resilience4j/rxjava3/retry/transformer/RetryTransformer.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-rxjava3/src/main/java/io/github/resilience4j/rxjava3/retry/transformer/RetryTransformer.java)
- [resilience4j-rxjava2/src/main/java/io/github/resilience4j/retry/transformer/RetryTransformer.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-rxjava2/src/main/java/io/github/resilience4j/retry/transformer/RetryTransformer.java)
- [resilience4j-kotlin/src/main/kotlin/io/github/resilience4j/kotlin/retry/RetryConfig.kt](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-kotlin/src/main/kotlin/io/github/resilience4j/kotlin/retry/RetryConfig.kt)
- [resilience4j-retry/src/main/java/io/github/resilience4j/retry/IntervalFunction.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-retry/src/main/java/io/github/resilience4j/retry/IntervalFunction.java)
- [resilience4j-kotlin/src/main/kotlin/io/github/resilience4j/kotlin/retry/Retry.kt](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-kotlin/src/main/kotlin/io/github/resilience4j/kotlin/retry/Retry.kt)
- [resilience4j-core/src/main/java/io/github/resilience4j/core/IntervalBiFunction.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-core/src/main/java/io/github/resilience4j/core/IntervalBiFunction.java)
- [resilience4j-hedge/src/main/java/io/github/resilience4j/hedge/internal/HedgeDurationSupplier.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-hedge/src/main/java/io/github/resilience4j/hedge/internal/HedgeDurationSupplier.java)
- [resilience4j-kotlin/src/main/kotlin/io/github/resilience4j/kotlin/retry/FlowRetry.kt](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-kotlin/src/main/kotlin/io/github/resilience4j/kotlin/retry/FlowRetry.kt)
- [resilience4j-spring-boot4/src/main/java/io/github/resilience4j/springboot/retry/autoconfigure/RetryAutoConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring-boot4/src/main/java/io/github/resilience4j/springboot/retry/autoconfigure/RetryAutoConfiguration.java)
- [resilience4j-kotlin/src/main/kotlin/io/github/resilience4j/kotlin/retry/RetryRegistry.kt](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-kotlin/src/main/kotlin/io/github/resilience4j/kotlin/retry/RetryRegistry.kt)
- [resilience4j-core/src/main/java/io/github/resilience4j/core/CASBackoffUtil.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-core/src/main/java/io/github/resilience4j/core/CASBackoffUtil.java)
</details>

## Overview

Retry interval functions provide configurable mechanisms for calculating delay durations between successive execution attempts in fault-tolerance policies. By determining how long to wait after encountering transient failures or unsatisfied result predicates, these functions help prevent resource exhaustion and mitigate cascading system failures under load.
Sources: [resilience4j-core/src/main/java/io/github/resilience4j/core/IntervalFunction.java:10-14](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-core/src/main/java/io/github/resilience4j/core/IntervalFunction.java#L10-L14)

Core design decisions focus on flexibility, thread safety, and composability, allowing developers to choose between simple fixed wait intervals or sophisticated backoff strategies such as exponential growth and randomized jitter factors. These interval calculations integrate closely with retry configuration builders, execution contexts, and framework-level aspects to govern runtime behavior across synchronous, asynchronous, and reactive invocation pipelines.
Sources: [resilience4j-retry/src/main/java/io/github/resilience4j/retry/RetryConfig.java:128-137](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-retry/src/main/java/io/github/resilience4j/retry/RetryConfig.java#L128-L137)

## Core Interval Calculation Functional Interfaces

### Overview

The core interval calculation architecture relies on functional abstractions designed to compute wait durations in milliseconds for each retry attempt. The public API centers on `IntervalFunction`, which extends `Function<Integer, Long>`, taking the attempt number (starting at 1) and returning the computed delay in milliseconds. Accompanying it is `IntervalBiFunction<T>`, which extends `BiFunction<Integer, Either<Throwable, T>, Long>`, incorporating both the attempt count and the execution outcome represented as an `Either` containing either a `Throwable` or the result value.

Sources: [resilience4j-core/src/main/java/io/github/resilience4j/core/IntervalFunction.java:10-16](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-core/src/main/java/io/github/resilience4j/core/IntervalFunction.java#L10-L16), [resilience4j-core/src/main/java/io/github/resilience4j/core/IntervalBiFunction.java:7-13](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-core/src/main/java/io/github/resilience4j/core/IntervalBiFunction.java#L7-L13)

### Constants and Validation Helpers

`IntervalFunction` defines default parameters governing standard retry timing behavior. These constants provide fallback values when custom builders are invoked without explicit arguments.

| Constant Name | Value | Meaning |
|---|---|---|
| `DEFAULT_INITIAL_INTERVAL` | `500` | Default initial wait interval in milliseconds |
| `DEFAULT_MULTIPLIER` | `1.5` | Default exponential backoff growth multiplier |
| `DEFAULT_RANDOMIZATION_FACTOR` | `0.5` | Default jitter randomization factor applied to intervals |

Sources: [resilience4j-core/src/main/java/io/github/resilience4j/core/IntervalFunction.java:18-20](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-core/src/main/java/io/github/resilience4j/core/IntervalFunction.java#L18-L20)

Input validation is enforced by `IntervalFunctionCompanion` helper methods. Attempt counts and raw interval durations must be positive integers, while randomization factors must lie within specific boundaries.

> [!CAUTION]
> Attempt numbers passed to interval functions must start at 1 and increase with every further attempt. Passing an attempt value less than 1 triggers an `IllegalArgumentException` via `checkAttempt(attempt)`.

Sources: [resilience4j-core/src/main/java/io/github/resilience4j/core/IntervalFunction.java:262-266](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-core/src/main/java/io/github/resilience4j/core/IntervalFunction.java#L262-L266)

### Interval Calculation Factories

`IntervalFunction` provides static factory methods supporting fixed, randomized, exponential backoff, and combined exponential random strategies. Each factory accepts either `long` millisecond primitives or `Duration` instances.

- `ofDefaults()`: Returns a fixed interval function initialized to 500 milliseconds.
- `of(long intervalMillis)` / `of(Duration interval)`: Creates a fixed interval generator.
- `ofRandomized(...)`: Applies randomization jitter to a base interval using `IntervalFunctionCompanion.randomize()`.
- `ofExponentialBackoff(...)`: Computes geometric growth using a multiplier function.
- `ofExponentialRandomBackoff(...)`: Combines exponential backoff growth with jitter randomization, capped by an optional `maxIntervalMillis`.

Sources: [resilience4j-core/src/main/java/io/github/resilience4j/core/IntervalFunction.java:27-230](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-core/src/main/java/io/github/resilience4j/core/IntervalFunction.java#L27-L230)

### Design Trade-Offs in Interval Generation

| Design Choice | Benefit | Cost |
|---|---|---|
| `LongStream.iterate()` for backoff generation | Enables lazy, infinite sequence evaluation for arbitrary attempt depths | Allocation overhead during stream creation and skipping |
| Functional interface extension (`Function<Integer, Long>`) | Seamless interoperability with standard Java functional APIs and lambda expressions | Limited inspection of internal parameters without unwrapping |
| Static factory overloading (`long` vs `Duration`) | Direct ergonomic API usage for both primitive millisecond inputs and Java time types | High method count and signature duplication within the interface |

Sources: [resilience4j-core/src/main/java/io/github/resilience4j/core/IntervalFunction.java:31-43](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-core/src/main/java/io/github/resilience4j/core/IntervalFunction.java#L31-L43), [resilience4j-core/src/main/java/io/github/resilience4j/core/IntervalFunction.java:96-104](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-core/src/main/java/io/github/resilience4j/core/IntervalFunction.java#L96-L104)

## Retry Configuration and Interval Composition

### Overview

`RetryConfig` manages retry behavior parameters, including maximum attempts, exception predicates, and interval calculation strategies. It initializes defaults through constants such as `DEFAULT_MAX_ATTEMPTS` set to `3` and `DEFAULT_WAIT_DURATION` set to `500` milliseconds. Interval timing is governed by either an `IntervalFunction` or an `IntervalBiFunction`, where `DEFAULT_INTERVAL_FUNCTION` yields the fixed wait duration and `DEFAULT_INTERVAL_BI_FUNCTION` wraps it via `IntervalBiFunction.ofIntervalFunction(DEFAULT_INTERVAL_FUNCTION)`.

Sources: [resilience4j-retry/src/main/java/io/github/resilience4j/retry/RetryConfig.java:39-44](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-retry/src/main/java/io/github/resilience4j/retry/RetryConfig.java#L39-L44), [resilience4j-retry/src/main/java/io/github/resilience4j/retry/RetryConfig.java:67-68](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-retry/src/main/java/io/github/resilience4j/retry/RetryConfig.java#L67-L68)

### Builder Configuration and Interval Composition

The `RetryConfig.Builder<T>` class constructs `RetryConfig` instances using fluent configuration methods. When `waitDuration(Duration waitDuration)` is invoked, it validates that the duration is non-negative and delegates to `intervalBiFunction((attempt, either) -> waitDuration.toMillis())`. Users can configure interval strategies by supplying an `IntervalFunction` via `intervalFunction(IntervalFunction f)` or a context-aware interval generator via `intervalBiFunction(IntervalBiFunction<T> f)`. Calling either setter resets the opposing field to `null`.

```java
RetryConfig config = RetryConfig.custom()
    .maxAttempts(5)
    .waitDuration(Duration.ofMillis(1000))
    .retryOnResult(result -> "RETRY".equals(result))
    .build();
```

Sources: [resilience4j-retry/src/main/java/io/github/resilience4j/retry/RetryConfig.java:192-208](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-retry/src/main/java/io/github/resilience4j/retry/RetryConfig.java#L192-L208), [resilience4j-retry/src/main/java/io/github/resilience4j/retry/RetryConfig.java:246-254](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-retry/src/main/java/io/github/resilience4j/retry/RetryConfig.java#L246-L254), [resilience4j-retry/src/main/java/io/github/resilience4j/retry/RetryConfig.java:312-328](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-retry/src/main/java/io/github/resilience4j/retry/RetryConfig.java#L312-L328)

> [!CAUTION]
> Configuring both `intervalFunction` and `intervalBiFunction` on the same builder instance throws an `IllegalStateException("The intervalFunction was configured twice...")` during the `build()` phase.

Sources: [resilience4j-retry/src/main/java/io/github/resilience4j/retry/RetryConfig.java:394-397](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-retry/src/main/java/io/github/resilience4j/retry/RetryConfig.java#L394-L397)

During `build()`, if both interval fields are null, `createIntervalFunction()` defaults to `IntervalFunction.ofDefaults()`. If an `intervalBiFunction` was not explicitly supplied, `intervalBiFunction` is resolved using `IntervalBiFunction.ofIntervalFunction(config.intervalFunction)`.

Sources: [resilience4j-retry/src/main/java/io/github/resilience4j/retry/RetryConfig.java:408-412](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-retry/src/main/java/io/github/resilience4j/retry/RetryConfig.java#L408-L412), [resilience4j-retry/src/main/java/io/github/resilience4j/retry/RetryConfig.java:415-420](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-retry/src/main/java/io/github/resilience4j/retry/RetryConfig.java#L415-L420)

### Kotlin DSL Integration

The `resilience4j-kotlin` module provides inline reified builder functions that adapt `RetryConfig.Builder` into idiomatic Kotlin lambdas. Overloads support typed results and base configuration inheritance.

```kotlin
val retryConfig = RetryConfig<String> {
    maxAttempts = 4
    waitDuration(Duration.ofMillis(200))
    retryOnResult { result -> result == "ERROR" }
}
```

Sources: [resilience4j-kotlin/src/main/kotlin/io/github/resilience4j/kotlin/retry/RetryConfig.kt:36-40](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-kotlin/src/main/kotlin/io/github/resilience4j/kotlin/retry/RetryConfig.kt#L36-L40), [resilience4j-kotlin/src/main/kotlin/io/github/resilience4j/kotlin/retry/RetryConfig.kt:74-79](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-kotlin/src/main/kotlin/io/github/resilience4j/kotlin/retry/RetryConfig.kt#L74-L79)

## External Properties for Backoff Customization

### Overview

Declarative configuration properties allow externalizing retry backoff policies, randomized wait factors, and interval functions via property files or commons configuration bindings. The `CommonRetryConfigurationProperties` class and `CommonsConfigurationRetryConfiguration` map properties under instance and configuration prefixes, translating them into `RetryConfig` builders through specialized interval configuration methods.

Sources: [resilience4j-framework-common/src/main/java/io/github/resilience4j/common/retry/configuration/CommonRetryConfigurationProperties.java:38-51](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-framework-common/src/main/java/io/github/resilience4j/common/retry/configuration/CommonRetryConfigurationProperties.java#L38-L51), [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/retry/configure/CommonsConfigurationRetryConfiguration.java:34-70](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/retry/configure/CommonsConfigurationRetryConfiguration.java#L34-L70)

### Property Mappings and Validation Rules

The `InstanceProperties` nested class defines configuration fields that govern backoff timing, multiplier factors, exception predicates, and randomized wait behaviors. Each setter enforces validation rules, such as ensuring multipliers are positive and randomized wait factors fall strictly within a specific numeric range.

Sources: [resilience4j-framework-common/src/main/java/io/github/resilience4j/common/retry/configuration/CommonRetryConfigurationProperties.java:245-333](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-framework-common/src/main/java/io/github/resilience4j/common/retry/configuration/CommonRetryConfigurationProperties.java#L245-L333)

| Property Field | Target Type | Validation Rule / Constraint | Purpose |
| :--- | :--- | :--- | :--- |
| `waitDuration` | `Duration` | Must not be null or negative | Base delay duration between retry attempts |
| `enableExponentialBackoff` | `Boolean` | None | Flag to enable exponential backoff delay policy |
| `exponentialBackoffMultiplier` | `Double` | Must be greater than `0` | Multiplier applied to backoff intervals |
| `exponentialMaxWaitDuration` | `Duration` | Must not be negative | Maximum cap for exponential backoff wait duration |
| `enableRandomizedWait` | `Boolean` | None | Flag to enable randomized wait jitter |
| `randomizedWaitFactor` | `Double` | Must be in range `[0..1)` | Randomization factor applied to wait durations |
| `intervalBiFunction` | `Class<? extends IntervalBiFunction<Object>>` | None | Custom class for calculating dynamic intervals |

Sources: [resilience4j-framework-common/src/main/java/io/github/resilience4j/common/retry/configuration/CommonRetryConfigurationProperties.java:339-502](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-framework-common/src/main/java/io/github/resilience4j/common/retry/configuration/CommonRetryConfigurationProperties.java#L339-L502)

> [!WARNING]
> Setting `randomizedWaitFactor` to `1.0` or greater throws an `IllegalArgumentException("Illegal argument randomizedWaitFactor: ... is not in range [0..1)")`. The factor must strictly be less than `1`.

Sources: [resilience4j-framework-common/src/main/java/io/github/resilience4j/common/retry/configuration/CommonRetryConfigurationProperties.java:496-499](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-framework-common/src/main/java/io/github/resilience4j/common/retry/configuration/CommonRetryConfigurationProperties.java#L496-L499)

### Interval Function Resolution Flow

When `configureRetryIntervalFunction` processes an instance property set, it evaluates the backoff and randomization flags to determine the correct factory method on `IntervalFunction`.

Sources: [resilience4j-framework-common/src/main/java/io/github/resilience4j/common/retry/configuration/CommonRetryConfigurationProperties.java:175-190](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-framework-common/src/main/java/io/github/resilience4j/common/retry/configuration/CommonRetryConfigurationProperties.java#L175-L190)

The evaluation proceeds through the following call chain:
`configureRetryIntervalFunction()` checks `waitDuration` → branches on `enableExponentialBackoff` and `enableRandomizedWait` → dispatches to `configureExponentialBackoffAndRandomizedWait()`, `configureExponentialBackoff()`, `configureRandomizedWait()`, or sets fixed `waitDuration` → invokes `withIntervalBiFunction()` to wrap the resulting `IntervalFunction` into an `IntervalBiFunction`.

Sources: [resilience4j-framework-common/src/main/java/io/github/resilience4j/common/retry/configuration/CommonRetryConfigurationProperties.java:175-239](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-framework-common/src/main/java/io/github/resilience4j/common/retry/configuration/CommonRetryConfigurationProperties.java#L175-L239)

> [!TIP]
> Both exponential backoff and randomized wait can be combined simultaneously by setting both `enableExponentialBackoff` and `enableRandomizedWait` to true, which routes configuration to `IntervalFunction.ofExponentialRandomBackoff`.

Sources: [resilience4j-framework-common/src/main/java/io/github/resilience4j/common/retry/configuration/CommonRetryConfigurationProperties.java:179-182](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-framework-common/src/main/java/io/github/resilience4j/common/retry/configuration/CommonRetryConfigurationProperties.java#L179-L182), [resilience4j-framework-common/src/main/java/io/github/resilience4j/common/retry/configuration/CommonRetryConfigurationProperties.java:201-209](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-framework-common/src/main/java/io/github/resilience4j/common/retry/configuration/CommonRetryConfigurationProperties.java#L201-L209)

## Runtime Retry Execution and Interval Evaluation

### Overview

The runtime execution engine coordinates retry attempts, interval evaluation, and thread sleep cycles via synchronous and asynchronous contexts. When an invocation fails or matches a result predicate, the retry engine evaluates whether further attempts are permitted by checking the attempt count against `maxAttempts`. If permitted, it invokes the configured `intervalBiFunction` to compute the delay before the next attempt.

Sources: [resilience4j-retry/src/main/java/io/github/resilience4j/retry/internal/RetryImpl.java:187-200](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-retry/src/main/java/io/github/resilience4j/retry/internal/RetryImpl.java#L187-L200), [resilience4j-retry/src/main/java/io/github/resilience4j/retry/internal/RetryImpl.java:257-280](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-retry/src/main/java/io/github/resilience4j/retry/internal/RetryImpl.java#L257-L280)

### Synchronous Interval Evaluation and Sleep Execution

Within synchronous execution contexts (`ContextImpl`), error handling and result validation trigger delay calculation and thread pausing. The synchronous call chain follows a specific execution path when an exception or predicate-matching result occurs.

The synchronous evaluation and sleep call chain proceeds as follows:
`ContextImpl.onError()` or `ContextImpl.onResult()` → checks `exceptionPredicate` or `resultPredicate` → increments `numOfAttempts` → invokes `waitIntervalAfterException()` or `waitIntervalAfterRuntimeException()` → calls `intervalBiFunction.apply()` to compute the delay value → publishes a `RetryOnRetryEvent` or `RetryOnErrorEvent` → passes the resulting delay to `sleepFunction.accept(interval)`.

Sources: [resilience4j-retry/src/main/java/io/github/resilience4j/retry/internal/RetryImpl.java:187-216](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-retry/src/main/java/io/github/resilience4j/retry/internal/RetryImpl.java#L187-L216), [resilience4j-retry/src/main/java/io/github/resilience4j/retry/internal/RetryImpl.java:257-306](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-retry/src/main/java/io/github/resilience4j/retry/internal/RetryImpl.java#L257-L306)

> [!WARNING]
> If a thread is interrupted while blocked inside `sleepFunction.accept(interval)`, the synchronous context catches `InterruptedException`, restores the thread interruption flag via `Thread.currentThread().interrupt()`, and either rethrows the stored exception or wraps the interruption cause in a `CancellationException`.

Sources: [resilience4j-retry/src/main/java/io/github/resilience4j/retry/internal/RetryImpl.java:267-299](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-retry/src/main/java/io/github/resilience4j/retry/internal/RetryImpl.java#L267-L299)

### Asynchronous Scheduling and Delay Resolution

Asynchronous execution (`AsyncContextImpl` and `AsyncRetryBlock`) evaluates delay intervals without blocking carrier threads. Instead of executing a synchronous sleep, asynchronous execution computes the delay duration and schedules subsequent attempts through a `ScheduledExecutorService`.

Sources: [resilience4j-retry/src/main/java/io/github/resilience4j/retry/Retry.java:732-755](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-retry/src/main/java/io/github/resilience4j/retry/Retry.java#L732-L755), [resilience4j-retry/src/main/java/io/github/resilience4j/retry/internal/RetryImpl.java:346-406](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-retry/src/main/java/io/github/resilience4j/retry/internal/RetryImpl.java#L346-L406)

The asynchronous delay resolution sequence operates as follows:
`AsyncContextImpl.onError()` or `AsyncContextImpl.onResult()` → unwraps `CompletionException` or `ExecutionException` if present → tests `exceptionPredicate` → increments attempt counter → calls `intervalBiFunction.apply()` to obtain the delay in milliseconds → returns the numeric delay value to `AsyncRetryBlock` → schedules re-execution via `scheduler.schedule(this, delay, TimeUnit.MILLISECONDS)` if delay is non-negative.

Sources: [resilience4j-retry/src/main/java/io/github/resilience4j/retry/Retry.java:732-755](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-retry/src/main/java/io/github/resilience4j/retry/Retry.java#L732-L755), [resilience4j-retry/src/main/java/io/github/resilience4j/retry/internal/RetryImpl.java:346-406](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-retry/src/main/java/io/github/resilience4j/retry/internal/RetryImpl.java#L346-L406)

> [!NOTE]
> If `intervalBiFunction.apply()` returns a negative value (`< 0`), the asynchronous block bypasses scheduling, finalizes the execution, and completes the future exceptionally or with the terminal error state.

Sources: [resilience4j-retry/src/main/java/io/github/resilience4j/retry/Retry.java:735-737](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-retry/src/main/java/io/github/resilience4j/retry/Retry.java#L735-L737), [resilience4j-retry/src/main/java/io/github/resilience4j/retry/internal/RetryImpl.java:379-385](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-retry/src/main/java/io/github/resilience4j/retry/internal/RetryImpl.java#L379-L385)

## Framework Interception and Aspect Integrations

### Overview

Framework integrations for Spring 6, Spring Boot 4, and Micronaut bridge declarative annotations with registry-managed `Retry` instances. These aspects and interceptors resolve backend configurations dynamically, applying retry policies and interval evaluation to synchronous, asynchronous, and reactive method invocations.

Sources: [resilience4j-spring6/src/main/java/io/github/resilience4j/spring6/retry/configure/RetryAspect.java:44-63](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring6/src/main/java/io/github/resilience4j/spring6/retry/configure/RetryAspect.java#L44-L63), [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/retry/RetryInterceptor.java:41-43](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/retry/RetryInterceptor.java#L41-L43)

### Spring AOP Aspect Wiring

The Spring AOP integration centers around `RetryAspect`, which intercepts methods annotated with `@Retry`. The aspect

## Related

- [[Retry Mechanism]]

