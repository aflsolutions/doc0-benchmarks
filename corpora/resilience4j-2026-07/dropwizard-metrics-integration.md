# Dropwizard Metrics Integration

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/publisher/CircuitBreakerMetricsPublisher.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/publisher/CircuitBreakerMetricsPublisher.java)
- [resilience4j-core/src/main/java/io/github/resilience4j/core/metrics/MetricsPublisher.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-core/src/main/java/io/github/resilience4j/core/metrics/MetricsPublisher.java)
- [resilience4j-micrometer/src/main/java/io/github/resilience4j/micrometer/tagged/TaggedRetryMetrics.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micrometer/src/main/java/io/github/resilience4j/micrometer/tagged/TaggedRetryMetrics.java)
- [resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/publisher/RetryMetricsPublisher.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/publisher/RetryMetricsPublisher.java)
- [resilience4j-micrometer/src/main/java/io/github/resilience4j/micrometer/tagged/TaggedTimeLimiterMetrics.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micrometer/src/main/java/io/github/resilience4j/micrometer/tagged/TaggedTimeLimiterMetrics.java)
- [resilience4j-micrometer/src/main/java/io/github/resilience4j/micrometer/tagged/TaggedRateLimiterMetrics.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micrometer/src/main/java/io/github/resilience4j/micrometer/tagged/TaggedRateLimiterMetrics.java)
- [resilience4j-micrometer/src/main/java/io/github/resilience4j/micrometer/tagged/TaggedThreadPoolBulkheadMetrics.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micrometer/src/main/java/io/github/resilience4j/micrometer/tagged/TaggedThreadPoolBulkheadMetrics.java)
- [resilience4j-micrometer/src/main/java/io/github/resilience4j/micrometer/tagged/TaggedCircuitBreakerMetrics.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micrometer/src/main/java/io/github/resilience4j/micrometer/tagged/TaggedCircuitBreakerMetrics.java)
- [resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/publisher/BulkheadMetricsPublisher.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/publisher/BulkheadMetricsPublisher.java)
- [resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/publisher/ThreadPoolBulkheadMetricsPublisher.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/publisher/ThreadPoolBulkheadMetricsPublisher.java)
- [resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/publisher/TimeLimiterMetricsPublisher.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/publisher/TimeLimiterMetricsPublisher.java)
- [resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/CircuitBreakerMetrics.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/CircuitBreakerMetrics.java)
- [resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/TimeLimiterMetrics.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/TimeLimiterMetrics.java)
- [resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/RetryMetrics.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/RetryMetrics.java)
- [resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/RateLimiterMetrics.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/RateLimiterMetrics.java)
- [resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/publisher/RateLimiterMetricsPublisher.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/publisher/RateLimiterMetricsPublisher.java)
- [resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/BulkheadMetrics.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/BulkheadMetrics.java)
- [resilience4j-spring-boot3/src/main/java/io/github/resilience4j/springboot3/retry/autoconfigure/RetryMetricsAutoConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring-boot3/src/main/java/io/github/resilience4j/springboot3/retry/autoconfigure/RetryMetricsAutoConfiguration.java)
- [resilience4j-spring-boot4/src/main/java/io/github/resilience4j/springboot/retry/autoconfigure/RetryMetricsAutoConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring-boot4/src/main/java/io/github/resilience4j/springboot/retry/autoconfigure/RetryMetricsAutoConfiguration.java)
- [resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/ThreadPoolBulkheadMetrics.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/ThreadPoolBulkheadMetrics.java)
- [resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/publisher/AbstractMetricsPublisher.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/publisher/AbstractMetricsPublisher.java)
- [resilience4j-spring-boot4/src/main/java/io/github/resilience4j/springboot/circuitbreaker/autoconfigure/CircuitBreakerMetricsAutoConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-springboot/src/main/java/io/github/resilience4j/springboot/circuitbreaker/autoconfigure/CircuitBreakerMetricsAutoConfiguration.java)
- [resilience4j-spring-boot4/src/main/java/io/github/resilience4j/springboot/ratelimiter/autoconfigure/RateLimiterMetricsAutoConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-springboot/src/main/java/io/github/resilience4j/springboot/ratelimiter/autoconfigure/RateLimiterMetricsAutoConfiguration.java)
- [resilience4j-spring-boot3/src/main/java/io/github/resilience4j/springboot3/circuitbreaker/autoconfigure/CircuitBreakerMetricsAutoConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring-boot3/src/main/java/io/github/resilience4j/springboot3/circuitbreaker/autoconfigure/CircuitBreakerMetricsAutoConfiguration.java)
- [resilience4j-micrometer/src/main/java/io/github/resilience4j/micrometer/tagged/TaggedRetryMetricsPublisher.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micrometer/src/main/java/io/github/resilience4j/micrometer/tagged/TaggedRetryMetricsPublisher.java)
- [resilience4j-spring-boot3/src/main/java/io/github/resilience4j/springboot3/ratelimiter/autoconfigure/RateLimiterMetricsAutoConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring-boot3/src/main/java/io/github/resilience4j/springboot3/ratelimiter/autoconfigure/RateLimiterMetricsAutoConfiguration.java)
- [resilience4j-spring-boot4/src/main/java/io/github/resilience4j/springboot/bulkhead/autoconfigure/ThreadPoolBulkheadMetricsAutoConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-springboot/src/main/java/io/github/resilience4j/springboot/bulkhead/autoconfigure/ThreadPoolBulkheadMetricsAutoConfiguration.java)
- [resilience4j-spring-boot4/src/main/java/io/github/resilience4j/springboot/timelimiter/autoconfigure/TimeLimiterMetricsAutoConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-springboot/src/main/java/io/github/resilience4j/springboot/timelimiter/autoconfigure/TimeLimiterMetricsAutoConfiguration.java)
- [resilience4j-spring-boot4/src/main/java/io/github/resilience4j/springboot/bulkhead/autoconfigure/BulkheadMetricsAutoConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-springboot/src/main/java/io/github/resilience4j/springboot/bulkhead/autoconfigure/BulkheadMetricsAutoConfiguration.java)
- [resilience4j-spring-boot3/src/main/java/io/github/resilience4j/springboot3/timelimiter/autoconfigure/TimeLimiterMetricsAutoConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring-boot3/src/main/java/io/github/resilience4j/springboot3/timelimiter/autoconfigure/TimeLimiterMetricsAutoConfiguration.java)
</details>

## Overview

The Dropwizard Metrics Integration package provides robust instrumentation adapters and publishers to seamlessly export runtime statistics and operational events from Resilience4j fault tolerance components into Dropwizard Metric registries. By bridging core constructs such as circuit breakers, rate limiters, bulkheads, retries, and time limiters with standard metric abstractions, applications gain deep operational visibility into system resilience without tightly coupling business logic to monitoring backends. Sources: [resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/CircuitBreakerMetrics.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/CircuitBreakerMetrics.java#L35-L38)

Designed around modular metric contracts and event-driven registry consumers, the integration dynamically manages metric lifecycles as resilience components are added, removed, or replaced at runtime. This architecture ensures thread-safe tracking and cleanup of gauges and counters, supporting high-throughput environments and modern runtime constructs like virtual threads while maintaining compatibility with diverse monitoring pipelines and auto-configured application setups. Sources: [resilience4j-core/src/main/java/io/github/resilience4j/core/metrics/MetricsPublisher.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-core/src/main/java/io/github/resilience4j/core/metrics/MetricsPublisher.java#L24-L46)

## Core Metrics Publisher Contracts

The core architecture governing metrics publication relies on the `MetricsPublisher<E>` interface and its abstract base implementation `AbstractMetricsPublisher<E>`. `MetricsPublisher<E>` extends `RegistryEventConsumer<E>` to bridge resilience component lifecycle events directly into metric publishing operations. Sources: [resilience4j-core/src/main/java/io/github/resilience4j/core/metrics/MetricsPublisher.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-core/src/main/java/io/github/resilience4j/core/metrics/MetricsPublisher.java#L24-L24)

`MetricsPublisher<E>` defines two abstract lifecycle hooks: `publishMetrics(E entry)` and `removeMetrics(E entry)`. Through Java interface default methods, it intercepts registry events and translates them into metric updates. Sources: [resilience4j-core/src/main/java/io/github/resilience4j/core/metrics/MetricsPublisher.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-core/src/main/java/io/github/resilience4j/core/metrics/MetricsPublisher.java#L26-L29)

- `onEntryAddedEvent(EntryAddedEvent<E> entryAddedEvent)` invokes `publishMetrics(entryAddedEvent.getAddedEntry())`. Sources: [resilience4j-core/src/main/java/io/github/resilience4j/core/metrics/MetricsPublisher.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-core/src/main/java/io/github/resilience4j/core/metrics/MetricsPublisher.java#L30-L33)
- `onEntryRemovedEvent(EntryRemovedEvent<E> entryRemoveEvent)` invokes `removeMetrics(entryRemoveEvent.getRemovedEntry())`. Sources: [resilience4j-core/src/main/java/io/github/resilience4j/core/metrics/MetricsPublisher.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-core/src/main/java/io/github/resilience4j/core/metrics/MetricsPublisher.java#L35-L38)
- `onEntryReplacedEvent(EntryReplacedEvent<E> entryReplacedEvent)` executes a sequence removing the old entry via `removeMetrics(entryReplacedEvent.getOldEntry())` followed by publishing the new entry via `publishMetrics(entryReplacedEvent.getNewEntry())`. Sources: [resilience4j-core/src/main/java/io/github/resilience4j/core/metrics/MetricsPublisher.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-core/src/main/java/io/github/resilience4j/core/metrics/MetricsPublisher.java#L40-L44)

> [!NOTE]
> The `MetricsPublisher` default methods eliminate boilerplate event handling code across concrete metric publishers by standardizing how component registration translates into metric lifecycle actions. Sources: [resilience4j-core/src/main/java/io/github/resilience4j/core/metrics/MetricsPublisher.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-core/src/main/java/io/github/resilience4j/core/metrics/MetricsPublisher.java#L30-L45)

`AbstractMetricsPublisher<E>` implements both `MetricSet` and `MetricsPublisher<E>`, maintaining a Dropwizard `MetricRegistry` reference and a concurrent name-tracking structure. Sources: [resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/publisher/AbstractMetricsPublisher.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/publisher/AbstractMetricsPublisher.java#L31-L40)

```java
abstract class AbstractMetricsPublisher<E> implements MetricSet, MetricsPublisher<E> {

    protected final MetricRegistry metricRegistry;
    // Using ConcurrentHashMap for virtual thread optimization - simple metrics name tracking
    protected final ConcurrentMap<String, Set<String>> metricsNameMap = new ConcurrentHashMap<>();

    protected AbstractMetricsPublisher(MetricRegistry metricRegistry) {
        this.metricRegistry = requireNonNull(metricRegistry);
    }

    protected void removeMetrics(String name) {
        Set<String> nameSet = metricsNameMap.get(name);
        if (nameSet != null) {
            nameSet.forEach(metricRegistry::remove);
        }
        metricsNameMap.remove(name);
    }

    @Override
    public Map<String, Metric> getMetrics() {
        return metricRegistry.getMetrics();
    }

}
```
Sources: [resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/publisher/AbstractMetricsPublisher.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/publisher/AbstractMetricsPublisher.java#L31-L54)

The base class utilizes a `ConcurrentMap<String, Set<String>> metricsNameMap` optimized for virtual thread execution contexts to track metric identifiers associated with components. When `removeMetrics(String name)` is invoked, it retrieves the registered metric name set, purges each associated metric from the underlying `MetricRegistry`, and removes the mapping entry. Sources: [resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/publisher/AbstractMetricsPublisher.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/publisher/AbstractMetricsPublisher.java#L34-L47)

## Dropwizard MetricSet Component Statistics Adapters

Dropwizard MetricSet adapters expose metric gauges and counters directly from core resilience components. Resilience4j provides concrete adapter classes implementing Dropwizard's `MetricSet` interface for each fault-tolerance component. These adapters iterate over component instances or registries, registering live lambda-backed gauges or event-driven counters into a Dropwizard `MetricRegistry`. Sources: [resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/CircuitBreakerMetrics.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/CircuitBreakerMetrics.java#L38-L78)

Each adapter class offers static factory methods supporting single instances, `Iterable` collections, or registry-backed collections (with optional custom or default prefixes and `MetricRegistry` instances). Sources: [resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/CircuitBreakerMetrics.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/CircuitBreakerMetrics.java#L87-L159)

| Adapter Class | Source Component | Metric Type | Key Metrics Exported |
| --- | --- | --- | --- |
| `CircuitBreakerMetrics` | `CircuitBreaker` | Gauge (`Integer`, `Long`, `Float`) | state, successful, failed, not_permitted, buffered, failure_rate, slow, slow_success, slow_failed, slow_call_rate | Sources: [resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/CircuitBreakerMetrics.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/CircuitBreakerMetrics.java#L55-L75) |
| `TimeLimiterMetrics` | `TimeLimiter` | Counter | successful, failed, timeout | Sources: [resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/TimeLimiterMetrics.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/TimeLimiterMetrics.java#L54-L56) |
| `RetryMetrics` | `Retry` | Gauge (`Long`) | successful_calls_without_retry, successful_calls_with_retry, failed_calls_without_retry, failed_calls_with_retry | Sources: [resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/RetryMetrics.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/RetryMetrics.java#L35-L44) |
| `RateLimiterMetrics` | `RateLimiter` | Gauge (`Integer`) | waiting_threads, available_permissions | Sources: [resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/RateLimiterMetrics.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/RateLimiterMetrics.java#L57-L60) |
| `BulkheadMetrics` | `Bulkhead` | Gauge (`Integer`) | available_concurrent_calls, max_allowed_concurrent_calls | Sources: [resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/BulkheadMetrics.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/BulkheadMetrics.java#L52-L55) |
| `ThreadPoolBulkheadMetrics` | `ThreadPoolBulkhead` | Gauge (`Integer`) | current_thread_pool_size, available_queue_capacity | Sources: [resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/ThreadPoolBulkheadMetrics.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/ThreadPoolBulkheadMetrics.java#L54-L57) |

Each constructor validates its parameters using `requireNonNull` checks and iterates over the provided collection. For instance, `CircuitBreakerMetrics` registers gauges against names formulated with `MetricRegistry.name(prefix, name, metricSuffix)`: Sources: [resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/CircuitBreakerMetrics.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/CircuitBreakerMetrics.java#L46-L78)

```java
CircuitBreaker circuitBreaker = CircuitBreaker.ofDefaults("backendA");
CircuitBreakerMetrics metrics = CircuitBreakerMetrics.ofCircuitBreaker(circuitBreaker);

MetricRegistry registry = new MetricRegistry();
registry.registerAll(metrics);
```
Sources: [resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/CircuitBreakerMetrics.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/CircuitBreakerMetrics.java#L157-L159)

> [!NOTE]
> Unlike metric sets that pull state via lambda gauges on demand (such as `CircuitBreakerMetrics`, `RateLimiterMetrics`, and `BulkheadMetrics`), `TimeLimiterMetrics` binds directly to component event publishers (`onSuccess`, `onError`, `onTimeout`) to increment underlying Dropwizard `Counter` instances upon event emission. Sources: [resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/TimeLimiterMetrics.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/TimeLimiterMetrics.java#L52-L60)

All adapters implement `MetricSet` by delegating `getMetrics()` directly to the underlying `metricRegistry.getMetrics()` map. Sources: [resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/CircuitBreakerMetrics.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/CircuitBreakerMetrics.java#L161-L164), [resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/TimeLimiterMetrics.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/TimeLimiterMetrics.java#L145-L148), [resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/RetryMetrics.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/RetryMetrics.java#L78-L81), [resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/RateLimiterMetrics.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/RateLimiterMetrics.java#L146-L149), [resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/BulkheadMetrics.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/BulkheadMetrics.java#L139-L142), [resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/ThreadPoolBulkheadMetrics.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/ThreadPoolBulkheadMetrics.java#L143-L146)

## Event Driven Dropwizard Metrics Publishers

Dropwizard metrics publishers extend `AbstractMetricsPublisher` to dynamically bind resilience components to a `MetricRegistry` upon registry lifecycle events. Each publisher registers metrics under a designated prefix—using `DEFAULT_PREFIX` for standard components and `DEFAULT_PREFIX_THREAD_POOL` for thread pool bulkheads—while tracking registered names in `metricsNameMap` for subsequent cleanup via `removeMetrics`. Sources: [resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/publisher/CircuitBreakerMetricsPublisher.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/publisher/CircuitBreakerMetricsPublisher.java#L43-L88), [resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/publisher/ThreadPoolBulkheadMetricsPublisher.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/publisher/ThreadPoolBulkheadMetricsPublisher.java#L44-L63)

The publishers bind component-specific metrics to the registry using lambda-backed `Gauge` objects or event-driven `Counter` bindings. Sources: [resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/publisher/CircuitBreakerMetricsPublisher.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/publisher/CircuitBreakerMetricsPublisher.java#L64-L82)

| Publisher Class | Default Prefix Constant | Published Metric Names / Suffixes |
|-----------------|-------------------------|-----------------------------------|
| `CircuitBreakerMetricsPublisher` | `DEFAULT_PREFIX` (`resilience4j.circuitbreaker`) | `state`, `successful`, `failed`, `slow`, `slowSuccess`, `slowFailed`, `notPermitted`, `buffered`, `failureRate`, `slowCallRate` | Sources: [resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/publisher/CircuitBreakerMetricsPublisher.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/publisher/CircuitBreakerMetricsPublisher.java#L53-L62) |
| `RetryMetricsPublisher` | `DEFAULT_PREFIX` (`resilience4j.retry`) | `successfulCallsWithoutRetryAttempt`, `successfulCallsWithRetryAttempt`, `failedCallsWithoutRetryAttempt`, `failedCallsWithRetryAttempt` | Sources: [resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/publisher/RetryMetricsPublisher.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/publisher/RetryMetricsPublisher.java#L52-L55) |
| `BulkheadMetricsPublisher` | `DEFAULT_PREFIX` (`resilience4j.bulkhead`) | `availableConcurrentCalls`, `maxAllowedConcurrentCalls` | Sources: [resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/publisher/BulkheadMetricsPublisher.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/publisher/BulkheadMetricsPublisher.java#L53-L54) |
| `ThreadPoolBulkheadMetricsPublisher` | `DEFAULT_PREFIX_THREAD_POOL` (`resilience4j.threadpool.bulkhead`) | `threadPoolSize`, `remainingQueueCapacity` | Sources: [resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/publisher/ThreadPoolBulkheadMetricsPublisher.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/publisher/ThreadPoolBulkheadMetricsPublisher.java#L53-L54) |
| `RateLimiterMetricsPublisher` | `DEFAULT_PREFIX` (`resilience4j.ratelimiter`) | `waitingThreads`, `availablePermissions` | Sources: [resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/publisher/RateLimiterMetricsPublisher.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/publisher/RateLimiterMetricsPublisher.java#L52-L53) |
| `TimeLimiterMetricsPublisher` | `DEFAULT_PREFIX` (`resilience4j.timelimiter`) | `successful`, `failed`, `timeout` | Sources: [resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/publisher/TimeLimiterMetricsPublisher.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/publisher/TimeLimiterMetricsPublisher.java#L52-L54) |

> [!NOTE]
> Unlike metric set adapters that compute state dynamically via gauges, `TimeLimiterMetricsPublisher` obtains a Dropwizard `Counter` for each event type and binds directly to the component's event publisher: `timeLimiter.getEventPublisher().onSuccess(event -> successes.inc())`, `onError(event -> failures.inc())`, and `onTimeout(event -> timeouts.inc())`. Sources: [resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/publisher/TimeLimiterMetricsPublisher.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/publisher/TimeLimiterMetricsPublisher.java#L56-L62)

When a resilience component is registered or published, the publisher executes a precise initialization sequence:

1. `publishMetrics(Component)` extracts the component identifier via `component.getName()`. Sources: [resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/publisher/CircuitBreakerMetricsPublisher.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/publisher/CircuitBreakerMetricsPublisher.java#L49-L50)
2. Metric keys are constructed using `MetricRegistry.name(prefix, name, suffix)` combining the prefix, component name, and metric suffix. Sources: [resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/publisher/CircuitBreakerMetricsPublisher.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/publisher/CircuitBreakerMetricsPublisher.java#L53-L62)
3. Gauges or counters are registered against the `MetricRegistry`: for instance, `CircuitBreakerMetricsPublisher` registers state via `circuitBreaker.getState().getOrder()` and call counts via `circuitBreaker.getMetrics()`. Sources: [resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/publisher/CircuitBreakerMetricsPublisher.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/publisher/CircuitBreakerMetricsPublisher.java#L64-L82)
4. The generated metric names are collected into a `List`, wrapped in a `HashSet`, and stored in `metricsNameMap.put(name, new HashSet<>(metricNames))` to enable cleanup when `removeMetrics(Component)` invokes `removeMetrics(component.getName())`. Sources: [resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/publisher/CircuitBreakerMetricsPublisher.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-metrics/src/main/java/io/github/resilience4j/metrics/publisher/CircuitBreakerMetricsPublisher.java#L84-L93)

## Tagged Micrometer Metrics Integration Adapters

Resilience4j provides dimensional metrics integration through Micrometer binder adapters and metrics publishers, enabling components to export tagged telemetry data into any Micrometer-supported monitoring backend. The adapter hierarchy spans all core resilience primitives, offering both registry-level `MeterBinder` implementations and individual entry-level `MetricsPublisher` instances. Sources: [resilience4j-micrometer/src/main/java/io/github/resilience4j/micrometer/tagged/TaggedCircuitBreakerMetrics.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micrometer/src/main/java/io/github/resilience4j/micrometer/tagged/TaggedCircuitBreakerMetrics.java#L29-L30)

The registry-level binders (`TaggedCircuitBreakerMetrics`, `TaggedRateLimiterMetrics`, `TaggedRetryMetrics`, `TaggedThreadPoolBulkheadMetrics`, and `TaggedTimeLimiterMetrics`) implement Micrometer's `MeterBinder` interface. Each binder accepts a corresponding registry instance during construction—such as `CircuitBreakerRegistry`, `RateLimiterRegistry`, `RetryRegistry`, `ThreadPoolBulkheadRegistry`, or `TimeLimiterRegistry`—using `requireNonNull` to validate non-null references. Sources: [resilience4j-micrometer/src/main/java/io/github/resilience4j/micrometer/tagged/TaggedCircuitBreakerMetrics.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micrometer/src/main/java/io/github/resilience4j/micrometer/tagged/TaggedCircuitBreakerMetrics.java#L29-L38), [resilience4j-micrometer/src/main/java/io/github/resilience4j/micrometer/tagged/TaggedRateLimiterMetrics.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micrometer/src/main/java/io/github/resilience4j/micrometer/tagged/TaggedRateLimiterMetrics.java#L29-L36), [resilience4j-micrometer/src/main/java/io/github/resilience4j/micrometer/tagged/TaggedRetryMetrics.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micrometer/src/main/java/io/github/resilience4j/micrometer/tagged/TaggedRetryMetrics.java#L29-L36), [resilience4j-micrometer/src/main/java/io/github/resilience4j/micrometer/tagged/TaggedThreadPoolBulkheadMetrics.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micrometer/src/main/java/io/github/resilience4j/micrometer/tagged/TaggedThreadPoolBulkheadMetrics.java#L30-L39), [resilience4j-micrometer/src/main/java/io/github/resilience4j/micrometer/tagged/TaggedTimeLimiterMetrics.java](https://github.com/resilience4j/micrometer/tagged/TaggedTimeLimiterMetrics.java#L28-L35)

```java
public class TaggedCircuitBreakerMetrics extends AbstractCircuitBreakerMetrics implements MeterBinder {
    private final CircuitBreakerRegistry circuitBreakerRegistry;

    private TaggedCircuitBreakerMetrics(CircuitBreakerMetricNames names, CircuitBreakerRegistry circuitBreakerRegistry) {
        super(names);
        this.circuitBreakerRegistry = requireNonNull(circuitBreakerRegistry);
    }

    public static TaggedCircuitBreakerMetrics ofCircuitBreakerRegistry(CircuitBreakerRegistry circuitBreakerRegistry) {
        return new TaggedCircuitBreakerMetrics(CircuitBreakerMetricNames.ofDefaults(), circuitBreakerRegistry);
    }
}
```
Sources: [resilience4j-micrometer/src/main/java/io/github/resilience4j/micrometer/tagged/TaggedCircuitBreakerMetrics.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micrometer/src/main/java/io/github/resilience4j/micrometer/tagged/TaggedCircuitBreakerMetrics.java#L29-L49)

> [!NOTE]
> All binder factories provide two overloaded static creation methods: one accepting only the resilience registry using default metric names (`ofDefaults()`), and another accepting both custom `MetricNames` and the registry. Sources: [resilience4j-micrometer/src/main/java/io/github/resilience4j/micrometer/tagged/TaggedCircuitBreakerMetrics.java](https://github.com/resilience4j/micrometer/tagged/TaggedCircuitBreakerMetrics.java#L46-L61), [resilience4j-micrometer/src/main/java/io/github/resilience4j/micrometer/tagged/TaggedRateLimiterMetrics.java](https://github.com/resilience4j/micrometer/tagged/TaggedRateLimiterMetrics.java#L44-L59), [resilience4j-micrometer/src/main/java/io/github/resilience4j/micrometer/tagged/TaggedRetryMetrics.java](https://github.com/resilience4j/micrometer/tagged/TaggedRetryMetrics.java#L44-L58), [resilience4j-micrometer/src/main/java/io/github/resilience4j/micrometer/tagged/TaggedThreadPoolBulkheadMetrics.java](https://github.com/resilience4j/micrometer/tagged/TaggedThreadPoolBulkheadMetrics.java#L47-L63), [resilience4j-micrometer/src/main/java/io/github/resilience4j/micrometer/tagged/TaggedTimeLimiterMetrics.java](https://github.com/resilience4j/micrometer/tagged/TaggedTimeLimiterMetrics.java#L43-L58)

When `bindTo(MeterRegistry registry)` is invoked on any Micrometer registry binder, it executes a strict initialization and dynamic event-subscription sequence:

1. Iterates over all pre-existing entries in the registry via `getAllCircuitBreakers()` (or equivalent for rate limiters, retries, bulkheads, and time limiters) and registers their metrics using `addMetrics(registry, entry)`. Sources: [resilience4j-micrometer/src/main/java/io/github/resilience4j/micrometer/tagged/TaggedCircuitBreakerMetrics.java](https://github.com/resilience4j/micrometer/tagged/TaggedCircuitBreakerMetrics.java#L61-L67)
2. Obtains the registry event publisher (`registry.getEventPublisher()`) to listen for runtime topology changes. Sources: [resilience4j-micrometer/src/main/java/io/github/resilience4j/micrometer/tagged/TaggedCircuitBreakerMetrics.java](https://github.com/resilience4j/micrometer/tagged/TaggedCircuitBreakerMetrics.java#L68-L69)
3. Subscribes to `onEntryAdded(event -> addMetrics(registry, event.getAddedEntry()))` to automatically bind meters when a new resilience component is created dynamically. Sources: [resilience4j-micrometer/src/main/java/io/github/resilience4j/micrometer/tagged/TaggedCircuitBreakerMetrics.java](https://github.com/resilience4j/micrometer/tagged/TaggedCircuitBreakerMetrics.java#L68-L69)
4. Subscribes to `onEntryRemoved(event -> removeMetrics(registry, event.getRemovedEntry().getName()))` to tear down and unregister meters when a component is removed. Sources: [resilience4j-micrometer/src/main/java/io/github/resilience4j/micrometer/tagged/TaggedCircuitBreakerMetrics.java](https://github.com/resilience4j/micrometer/tagged/TaggedCircuitBreakerMetrics.java#L70-L71)
5. Subscribes to `onEntryReplaced(event -> { removeMetrics(registry, event.getOldEntry().getName()); addMetrics(registry, event.getNewEntry()); })` to handle component reconfiguration or replacement by atomically cleaning up old meters and binding new ones. Sources: [resilience4j-micrometer/src/main/java/io/github/resilience4j/micrometer/tagged/TaggedCircuitBreakerMetrics.java](https://github.com/resilience4j/micrometer/tagged/TaggedCircuitBreakerMetrics.java#L72-L75)

In addition to full-registry binders, individual component publishers such as `TaggedRetryMetricsPublisher` implement the `MetricsPublisher<Retry>` contract. These publishers wrap an `AbstractRetryMetrics` base class and bind directly to a target `MeterRegistry` instance, publishing or removing metrics for individual entries on demand. Sources: [resilience4j-micrometer/src/main/java/io/github/resilience4j/micrometer/tagged/TaggedRetryMetricsPublisher.java](https://github.com/resilience4j/micrometer/tagged/TaggedRetryMetricsPublisher.java#L25-L49)

```java
public class TaggedRetryMetricsPublisher extends AbstractRetryMetrics implements MetricsPublisher<Retry> {
    private final MeterRegistry meterRegistry;

    public TaggedRetryMetricsPublisher(MeterRegistry meterRegistry) {
        super(RetryMetricNames.ofDefaults());
        this.meterRegistry = requireNonNull(meterRegistry);
    }

    @Override
    public void publishMetrics(Retry entry) {
        addMetrics(meterRegistry, entry);
    }

    @Override
    public void removeMetrics(Retry entry) {
        removeMetrics(meterRegistry, entry.getName());
    }
}
```
Sources: [resilience4j-micrometer/src/main/java/io/github/resilience4j/micrometer/tagged/TaggedRetryMetricsPublisher.java](https://github.com/resilience4j/micrometer/tagged/TaggedRetryMetricsPublisher.java#L25-L49)

## Spring Boot Auto Configuration Setup

Spring Boot integration relies on dedicated auto-configuration classes across `resilience4j-spring-boot3` and `resilience4j-spring-boot4` packages. These classes dynamically inspect the application classpath and configuration properties to instantiate either legacy metric binders or event-driven publishers for circuit breakers, rate limiters, retries, bulkheads, thread-pool bulkheads, and time limiters. Sources: [resilience4j-spring-boot3/src/main/java/io/github/resilience4j/springboot3/circuitbreaker/autoconfigure/CircuitBreakerMetricsAutoConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring-boot3/src/main/java/io/github/resilience4j/springboot3/circuitbreaker/autoconfigure/CircuitBreakerMetricsAutoConfiguration.java#L35-L41)

Auto-configurations are guarded by conditional annotations ensuring that metrics export is only established when the required Micrometer registries, resilience modules, and publisher classes are present on the classpath. Furthermore, property flags control whether metrics are enabled globally per module and whether legacy or modern publisher mechanisms are activated. Sources: [resilience4j-spring-boot3/src/main/java/io/github/resilience4j/springboot3/circuitbreaker/autoconfigure/CircuitBreakerMetricsAutoConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring-boot3/src/main/java/io/github/resilience4j/springboot3/circuitbreaker/autoconfigure/CircuitBreakerMetricsAutoConfiguration.java#L35-L41)

| Auto-Configuration Class | Required Classes Condition | Enabling Property |
| :--- | :--- | :--- |
| `CircuitBreakerMetricsAutoConfiguration` | `MeterRegistry.class`, `CircuitBreaker.class`, `TaggedCircuitBreakerMetricsPublisher.class` | `resilience4j.circuitbreaker.metrics.enabled` | Sources: [resilience4j-spring-boot3/src/main/java/io/github/resilience4j/springboot3/circuitbreaker/autoconfigure/CircuitBreakerMetricsAutoConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring-boot3/src/main/java/io/github/resilience4j/springboot3/circuitbreaker/autoconfigure/CircuitBreakerMetricsAutoConfiguration.java#L36-L40) |
| `RateLimiterMetricsAutoConfiguration` | `MeterRegistry.class`, `RateLimiter.class`, `TaggedRateLimiterMetricsPublisher.class` | `resilience4j.ratelimiter.metrics.enabled` | Sources: [resilience4j-spring-boot3/src/main/java/io/github/resilience4j/springboot3/ratelimiter/autoconfigure/RateLimiterMetricsAutoConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring-boot3/src/main/java/io/github/resilience4j/springboot3/ratelimiter/autoconfigure/RateLimiterMetricsAutoConfiguration.java#L36-L40) |
| `RetryMetricsAutoConfiguration` | `MeterRegistry.class`, `Retry.class`, `TaggedRetryMetricsPublisher.class` | `resilience4j.retry.metrics.enabled` | Sources: [resilience4j-spring-boot3/src/main/java/io/github/resilience4j/springboot3/retry/autoconfigure/RetryMetricsAutoConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring-boot3/src/main/java/io/github/resilience4j/springboot3/retry/autoconfigure/RetryMetricsAutoConfiguration.java#L36-L39) |
| `BulkheadMetricsAutoConfiguration` | `MeterRegistry.class`, `Bulkhead.class`, `TaggedBulkheadMetricsPublisher.class` | `resilience4j.bulkhead.metrics.enabled` | Sources: [resilience4j-spring-boot4/src/main/java/io/github/resilience4j/springboot/bulkhead/autoconfigure/BulkheadMetricsAutoConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring-boot4/src/main/java/io/github/resilience4j/springboot/bulkhead/autoconfigure/BulkheadMetricsAutoConfiguration.java#L38-L39) |
| `ThreadPoolBulkheadMetricsAutoConfiguration` | `MeterRegistry.class`, `ThreadPoolBulkhead.class`, `TaggedThreadPoolBulkheadMetricsPublisher.class` | `resilience4j.thread-pool-bulkhead.metrics.enabled` | Sources: [resilience4j-spring-boot4/src/main/java/io/github/resilience4j/springboot/bulkhead/autoconfigure/ThreadPoolBulkheadMetricsAutoConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring-boot4/src/main/java/io/github/resilience4j/springboot/bulkhead/autoconfigure/ThreadPoolBulkheadMetricsAutoConfiguration.java#L33-L35) |
| `TimeLimiterMetricsAutoConfiguration` | `MeterRegistry.class`, `TimeLimiter.class`, `TaggedTimeLimiterMetricsPublisher.class` | `resilience4j.timelimiter.metrics.enabled` | Sources: [resilience4j-spring-boot3/src/main/java/io/github/resilience4j/springboot3/timelimiter/autoconfigure/TimeLimiterMetricsAutoConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring-boot3/src/main/java/io/github/resilience4j/springboot3/timelimiter/autoconfigure/TimeLimiterMetricsAutoConfiguration.java#L33-L36) |

Each auto-configuration class declares conditional bean creation methods that distinguish between legacy registry metrics registration and modern metrics publisher instantiation. For instance, in `RetryMetricsAutoConfiguration`, `registerRetryMetrics` requires `resilience4j.retry.metrics.legacy.enabled` to be explicitly set to `true`, whereas `taggedRetryMetricsPublisher` defaults to active when legacy mode is absent or `false`. Sources: [resilience4j-spring-boot3/src/main/java/io/github/resilience4j/springboot3/retry/autoconfigure/RetryMetricsAutoConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring-boot3/src/main/java/io/github/resilience4j/springboot3/retry/autoconfigure/RetryMetricsAutoConfiguration.java#L42-L55)

```java
@Bean
@ConditionalOnProperty(value = "resilience4j.retry.metrics.legacy.enabled", havingValue = "true")
@ConditionalOnMissingBean
public TaggedRetryMetrics registerRetryMetrics(RetryRegistry retryRegistry) {
    return TaggedRetryMetrics.ofRetryRegistry(retryRegistry);
}

@Bean
@ConditionalOnBean(MeterRegistry.class)
@ConditionalOnProperty(value = "resilience4j.retry.metrics.legacy.enabled", havingValue = "false", matchIfMissing = true)
@ConditionalOnMissingBean
public TaggedRetryMetricsPublisher taggedRetryMetricsPublisher(MeterRegistry meterRegistry) {
    return new TaggedRetryMetricsPublisher(meterRegistry);
}
```
Sources: [resilience4j-spring-boot3/src/main/java/io/github/resilience4j/springboot3/retry/autoconfigure/RetryMetricsAutoConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring-boot3/src/main/java/io/github/resilience4j/springboot3/retry/autoconfigure/RetryMetricsAutoConfiguration.java#L42-L55)

## Related

- [[Tagged Micrometer Metrics]]

